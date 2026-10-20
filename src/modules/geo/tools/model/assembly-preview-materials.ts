// Confirmed from the live Blender material viewport colors, not inferred from screenshots.
const VIEWPORT_COLORS: Record<string, number[]> = {
  'Assembly Concrete': [0.59, 0.63, 0.69, 1],
  'Assembly Structure': [0.17, 0.36, 0.55, 1],
  'Assembly Glass': [0.2, 0.7, 0.81, 1],
  'Assembly Roof': [0.32, 0.38, 0.44, 1],
}

export function restoreAssemblyViewportColors(buffer: ArrayBuffer): ArrayBuffer {
  const view = new DataView(buffer)
  if (
    buffer.byteLength < 20 ||
    view.getUint32(0, true) !== 0x46546c67 ||
    view.getUint32(4, true) !== 2 ||
    view.getUint32(8, true) !== buffer.byteLength ||
    view.getUint32(16, true) !== 0x4e4f534a
  ) {
    throw new Error('预览资源不是有效 GLB。')
  }
  const oldLength = view.getUint32(12, true)
  if (20 + oldLength > buffer.byteLength) {
    throw new Error('预览 GLB 的 JSON 段不完整。')
  }
  const asset = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, oldLength))) as {
    materials?: {
      name?: string
      pbrMetallicRoughness?: { baseColorFactor?: number[] }
    }[]
  }
  for (const material of asset.materials ?? []) {
    const name = material.name ?? ''
    const color = Object.hasOwn(VIEWPORT_COLORS, name) ? VIEWPORT_COLORS[name] : undefined
    if (color) {
      material.pbrMetallicRoughness ??= {}
      material.pbrMetallicRoughness.baseColorFactor = [...color]
    }
  }
  const json = new TextEncoder().encode(JSON.stringify(asset))
  const length = Math.ceil(json.byteLength / 4) * 4
  const result = new ArrayBuffer(buffer.byteLength - oldLength + length)
  const output = new Uint8Array(result)
  output.set(new Uint8Array(buffer, 0, 20))
  const header = new DataView(result)
  header.setUint32(8, result.byteLength, true)
  header.setUint32(12, length, true)
  output.fill(0x20, 20, 20 + length)
  output.set(json, 20)
  output.set(new Uint8Array(buffer, 20 + oldLength), 20 + length)
  return result
}
