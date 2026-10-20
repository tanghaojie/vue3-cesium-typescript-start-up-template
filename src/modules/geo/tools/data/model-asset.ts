export interface GeoModelCoordinates {
  readonly longitude: number
  readonly latitude: number
  readonly height?: number
}

export type GeoModelCoordinateSource = 'model' | 'input' | 'cancel'

export interface PreparedGeoModelAsset {
  readonly url: string
  readonly coordinates?: GeoModelCoordinates
  readonly emissiveMaterials: number
  dispose(): void
}

type JsonObject = Record<string, unknown>

function object(value: unknown): JsonObject | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined
}

function coordinatesInExtras(value: unknown): GeoModelCoordinates | undefined {
  const extras = object(value)
  if (!extras) {
    return undefined
  }
  const longitude = extras.longitude_wgs84
  const latitude = extras.latitude_wgs84
  if (
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180 ||
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90
  ) {
    return undefined
  }
  // height_m is the building's size, not its ellipsoidal placement height.
  const height = extras.ellipsoid_height_m
  return {
    longitude,
    latitude,
    height: typeof height === 'number' && Number.isFinite(height) ? height : undefined,
  }
}

function modelCoordinates(gltf: JsonObject): GeoModelCoordinates | undefined {
  const global = coordinatesInExtras(gltf.extras)
  if (global) {
    return global
  }
  const scenes = Array.isArray(gltf.scenes) ? gltf.scenes : []
  const sceneIndex = typeof gltf.scene === 'number' ? gltf.scene : 0
  const scene = object(scenes[sceneIndex])
  const sceneCoordinates = coordinatesInExtras(scene?.extras)
  if (sceneCoordinates) {
    return sceneCoordinates
  }
  const nodes = Array.isArray(gltf.nodes) ? gltf.nodes : []
  const rootIndexes = Array.isArray(scene?.nodes) ? scene.nodes : []
  const candidates = rootIndexes.flatMap(function coordinatesForRoot(index): GeoModelCoordinates[] {
    const coordinates =
      typeof index === 'number' ? coordinatesInExtras(object(nodes[index])?.extras) : undefined
    return coordinates ? [coordinates] : []
  })
  const first = candidates[0]
  if (
    first &&
    candidates.every(
      (item) =>
        item.longitude === first.longitude &&
        item.latitude === first.latitude &&
        item.height === first.height,
    )
  ) {
    return first
  }
  if (candidates.length > 1) {
    throw new Error('模型的多个根节点包含不同坐标，无法确定统一定位点；请检查模型地理信息。')
  }
  return undefined
}

function adaptEmissiveStrength(gltf: JsonObject): number {
  const materials = Array.isArray(gltf.materials) ? gltf.materials : []
  let adapted = 0
  for (const entry of materials) {
    const material = object(entry)
    const extensions = object(material?.extensions)
    const extension = object(extensions?.KHR_materials_emissive_strength)
    if (!material || !extension) {
      continue
    }
    const strength = extension.emissiveStrength ?? 1
    if (typeof strength !== 'number' || !Number.isFinite(strength) || strength < 0) {
      throw new Error('模型包含无效的发光倍率。')
    }
    if (!extensions?.KHR_materials_unlit) {
      const factor = material.emissiveFactor ?? [0, 0, 0]
      if (
        !Array.isArray(factor) ||
        factor.length !== 3 ||
        factor.some(
          (value) =>
            typeof value !== 'number' ||
            !Number.isFinite(value) ||
            value < 0 ||
            !Number.isFinite(value * strength),
        )
      ) {
        throw new Error('模型包含无效的发光颜色。')
      }
      // This is an isolated runtime representation, never a rewritten source asset.
      material.emissiveFactor = factor.map((value) => value * strength)
      adapted += 1
    }
    delete extensions!.KHR_materials_emissive_strength
  }
  for (const key of ['extensionsUsed', 'extensionsRequired']) {
    if (Array.isArray(gltf[key])) {
      gltf[key] = gltf[key].filter((extension) => extension !== 'KHR_materials_emissive_strength')
    }
  }
  return adapted
}

function resolveExternalResources(gltf: JsonObject, originalUrl: URL): void {
  for (const key of ['buffers', 'images']) {
    const entries = Array.isArray(gltf[key]) ? gltf[key] : []
    for (const entry of entries) {
      const resource = object(entry)
      if (resource && typeof resource.uri === 'string') {
        if (/^[a-z][a-z\d+.-]*:/i.test(resource.uri)) {
          continue
        }
        resource.uri = new URL(resource.uri, originalUrl).href
      }
    }
  }
}

function jsonChunk(gltf: JsonObject): Uint8Array<ArrayBuffer> {
  const json = new TextEncoder().encode(JSON.stringify(gltf))
  const paddedLength = Math.ceil(json.byteLength / 4) * 4
  const chunk = new Uint8Array(paddedLength + 8)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, paddedLength, true)
  view.setUint32(4, 0x4e4f534a, true)
  chunk.fill(0x20, 8)
  chunk.set(json, 8)
  return chunk
}

export async function prepareGeoModelAsset(
  url: string,
  signal?: AbortSignal,
): Promise<PreparedGeoModelAsset> {
  const originalUrl = new URL(url, globalThis.location.href)
  const response = await fetch(originalUrl, { signal })
  if (!response.ok) {
    throw new Error(`模型下载失败（HTTP ${response.status}）`)
  }
  const buffer = await response.arrayBuffer()
  if (signal?.aborted) {
    throw new DOMException('模型加载已取消', 'AbortError')
  }
  const view = new DataView(buffer)
  const isGlb = buffer.byteLength >= 4 && view.getUint32(0, true) === 0x46546c67
  let gltf: JsonObject | undefined
  const binaryChunks: Uint8Array<ArrayBuffer>[] = []
  if (isGlb) {
    if (
      buffer.byteLength < 20 ||
      view.getUint32(4, true) !== 2 ||
      view.getUint32(8, true) !== buffer.byteLength
    ) {
      throw new Error('模型不是有效的 glTF 2.0 GLB 文件。')
    }
    let offset = 12
    while (offset < buffer.byteLength) {
      if (offset + 8 > buffer.byteLength) {
        throw new Error('GLB 数据段不完整。')
      }
      const length = view.getUint32(offset, true)
      const type = view.getUint32(offset + 4, true)
      if (offset + length + 8 > buffer.byteLength || length % 4 !== 0) {
        throw new Error('GLB 数据段长度无效。')
      }
      if (type === 0x4e4f534a) {
        if (gltf || offset !== 12) {
          throw new Error('GLB JSON 数据段顺序无效。')
        }
        gltf = object(
          JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, offset + 8, length))),
        )
      } else {
        binaryChunks.push(new Uint8Array(buffer, offset, length + 8))
      }
      offset += length + 8
    }
  } else {
    gltf = object(JSON.parse(new TextDecoder().decode(buffer)))
  }
  if (!gltf || object(gltf.asset)?.version !== '2.0') {
    throw new Error('模型缺少有效的 glTF 2.0 描述。')
  }
  const coordinates = modelCoordinates(gltf)
  const emissiveMaterials = adaptEmissiveStrength(gltf)
  resolveExternalResources(gltf, new URL(response.url || originalUrl.href))
  let blob: Blob
  if (isGlb) {
    const chunk = jsonChunk(gltf)
    const header = new Uint8Array(12)
    const headerView = new DataView(header.buffer)
    headerView.setUint32(0, 0x46546c67, true)
    headerView.setUint32(4, 2, true)
    headerView.setUint32(
      8,
      12 + chunk.byteLength + binaryChunks.reduce((sum, item) => sum + item.byteLength, 0),
      true,
    )
    blob = new Blob([header, chunk, ...binaryChunks], { type: 'model/gltf-binary' })
  } else {
    blob = new Blob([JSON.stringify(gltf)], { type: 'model/gltf+json' })
  }
  const objectUrl = URL.createObjectURL(blob)
  return {
    url: objectUrl,
    coordinates,
    emissiveMaterials,
    dispose() {
      URL.revokeObjectURL(objectUrl)
    },
  }
}
