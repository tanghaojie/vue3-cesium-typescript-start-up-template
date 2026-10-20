import {
  Cartesian3,
  Cartographic,
  Cesium3DTileset,
  CesiumTerrainProvider,
  createWorldTerrainAsync,
  EllipsoidTerrainProvider,
  GeoJsonDataSource,
  HeadingPitchRoll,
  Math as CesiumMath,
  Matrix4,
  Model,
  ShadowMode,
  sampleTerrain,
  sampleTerrainMostDetailed,
  Transforms,
  type Cesium3DTileset as Cesium3DTilesetType,
  type TerrainProvider,
  type Viewer,
} from 'cesium'
import {
  prepareGeoModelAsset,
  type GeoModelCoordinates,
  type GeoModelCoordinateSource,
  type PreparedGeoModelAsset,
} from './model-asset'
import { modelCameraOffset } from '../view/model-camera'
import {
  createModelAnimationPlayer,
  prepareAnimationCaptureNodes,
  readModelAnimationClips,
  type GeoModelAnimationClip,
  type GeoModelAnimationCommand,
  type GeoModelAnimationPlayer,
  type GeoModelAnimationSnapshot,
} from '../model/model-animation'
import type { GeoCaptureSubjects } from './capture-subject'
import {
  createCyberCityTilesetVisual,
  type GeoTilesetVisual,
  type GeoTilesetVisualStyle,
} from './tileset-visual-style'
import type {
  GeoModelRenderingManager,
  GeoModelRenderingRegistration,
} from '../scene/model-rendering'

export type { GeoTilesetVisualStyle } from './tileset-visual-style'

const ENVIRONMENT_MAP_UPDATE_SECONDS = 300

export type GeoDataResourceKind = 'geojson' | 'model' | '3d-tiles'
export type GeoTerrainResourceId = 'ellipsoid' | 'cesium-world-terrain' | 'custom'

export interface GeoModelTransform {
  readonly longitude: number
  readonly latitude: number
  readonly height: number
  readonly scale: number
  readonly heading: number
  readonly pitch: number
  readonly roll: number
}

export interface GeoDataResourceSnapshot {
  readonly id: string
  readonly label: string
  readonly kind: GeoDataResourceKind
  readonly url?: string
  readonly show: boolean
  readonly status: 'ready' | 'loading' | 'failed'
  readonly error?: string
  readonly modelRenderingNotice?: string
  readonly modelTransform?: GeoModelTransform
  readonly animation?: GeoModelAnimationSnapshot
  readonly visualStyle?: GeoTilesetVisualStyle
  readonly autoHidden?: boolean
  readonly maximumVisibleCameraHeight?: number
}

export interface GeoTerrainSnapshot {
  readonly id: GeoTerrainResourceId
  readonly label: string
  readonly status: 'ready' | 'loading' | 'failed'
  readonly error?: string
}

export interface LoadGeoJsonOptions {
  readonly id?: string
  readonly label?: string
  readonly url?: string
  readonly data?: string | object
  readonly clampToGround?: boolean
  readonly show?: boolean
}

export interface LoadModelOptions {
  readonly signal?: AbortSignal
  readonly id?: string
  readonly label?: string
  readonly url: string
  readonly modelMatrix?: Parameters<typeof Model.fromGltfAsync>[0]['modelMatrix']
  readonly transform?: GeoModelTransform
  readonly show?: boolean
  readonly minimumPixelSize?: number
  readonly shadows?: ShadowMode
  readonly chooseCoordinates?: (
    coordinates: GeoModelCoordinates,
  ) => Promise<GeoModelCoordinateSource>
}

export interface LoadTilesetOptions {
  readonly signal?: AbortSignal
  readonly id?: string
  readonly label?: string
  readonly url: string
  readonly show?: boolean
  readonly maximumScreenSpaceError?: number
  readonly shadows?: ShadowMode
  readonly visualStyle?: GeoTilesetVisualStyle
  readonly maximumVisibleCameraHeight?: number
  readonly dayNightPosition?: Cartesian3
}

interface ManagedResource {
  readonly snapshot: {
    id: string
    label: string
    kind: GeoDataResourceKind
    url?: string
    modelTransform?: GeoModelTransform
    modelRenderingNotice?: string
  }
  readonly resource: GeoJsonDataSource | Model | Cesium3DTilesetType
  readonly remove: () => boolean
  modelRenderingRegistration?: GeoModelRenderingRegistration
  environmentRegistration?: { dispose(): void }
  modelMaterialNotice?: string
  animation?: GeoModelAnimationPlayer
  tilesetError?: string
  requestedShow: boolean
  autoHidden: boolean
  maximumVisibleCameraHeight?: number
  visualStyle?: GeoTilesetVisualStyle
  tilesetVisual?: GeoTilesetVisual
}

export interface GeoDataBrowser {
  readonly captureSubjects: GeoCaptureSubjects
  list(): readonly GeoDataResourceSnapshot[]
  loadGeoJson(options: LoadGeoJsonOptions): Promise<GeoDataResourceSnapshot>
  loadModel(options: LoadModelOptions): Promise<GeoDataResourceSnapshot>
  loadTileset(options: LoadTilesetOptions): Promise<GeoDataResourceSnapshot>
  remove(id: string): boolean
  clear(): void
  setVisible(id: string, show: boolean): void
  setTilesetVisualStyle(id: string, style: GeoTilesetVisualStyle): void
  updateModelTransform(id: string, transform: GeoModelTransform): void
  controlModelAnimation(id: string, command: GeoModelAnimationCommand): void
  flyTo(id: string, duration?: number): Promise<boolean>
  setTerrain(id: GeoTerrainResourceId, url?: string): Promise<GeoTerrainSnapshot>
  getTerrain(): GeoTerrainSnapshot
  dispose(): void
}

export interface GeoDataBrowserOptions {
  readonly signal?: AbortSignal
  readonly onActiveTilesetChange?: (tileset: Cesium3DTilesetType | undefined) => void
  readonly onResourcesChange?: () => void
  readonly onModelAnimationChange?: () => void
  readonly onResourcesError?: (message: string) => void
  readonly modelRendering?: GeoModelRenderingManager
}

function normalizeId(kind: GeoDataResourceKind, requestedId?: string): string {
  return requestedId?.trim() || `${kind}-${Date.now().toString(36)}`
}

function modelMaterialNotice(gltf: unknown, hasModelRenderingManager: boolean): string | undefined {
  if (!gltf || typeof gltf !== 'object') {
    return undefined
  }
  const gltfObject = gltf as {
    materials?: unknown
    meshes?: unknown
  }
  const materials = gltfObject.materials
  const meshes = gltfObject.meshes
  if (!Array.isArray(materials) || !Array.isArray(meshes)) {
    return undefined
  }
  const referencedMaterialIndexes = new Set<number>()
  for (const mesh of meshes) {
    if (!mesh || typeof mesh !== 'object') {
      continue
    }
    const primitives = (mesh as { primitives?: unknown }).primitives
    if (!Array.isArray(primitives)) {
      continue
    }
    for (const primitive of primitives) {
      if (!primitive || typeof primitive !== 'object') {
        continue
      }
      const materialIndex = (primitive as { material?: unknown }).material
      if (typeof materialIndex === 'number' && Number.isInteger(materialIndex)) {
        referencedMaterialIndexes.add(materialIndex)
      }
    }
  }
  let hasEmissive = false
  let hasUnlit = false
  for (const materialIndex of referencedMaterialIndexes) {
    const material = materials[materialIndex]
    if (!material || typeof material !== 'object') {
      continue
    }
    const materialObject = material as {
      emissiveFactor?: unknown
      extensions?: {
        KHR_materials_unlit?: unknown
        KHR_materials_emissive_strength?: { emissiveStrength?: unknown }
      }
    }
    const isUnlit = materialObject.extensions?.KHR_materials_unlit !== undefined
    const emissiveStrength =
      materialObject.extensions?.KHR_materials_emissive_strength?.emissiveStrength
    const hasEmissiveStrength =
      emissiveStrength === undefined ||
      (typeof emissiveStrength === 'number' && Number.isFinite(emissiveStrength))
    if (
      !isUnlit &&
      Array.isArray(materialObject.emissiveFactor) &&
      hasEmissiveStrength &&
      (emissiveStrength === undefined || emissiveStrength !== 0) &&
      materialObject.emissiveFactor.some(
        (value) => typeof value === 'number' && Number.isFinite(value) && value > 0,
      )
    ) {
      hasEmissive = true
    }
    if (isUnlit) {
      hasUnlit = true
    }
  }
  if (hasEmissive && hasUnlit) {
    return hasModelRenderingManager
      ? '已识别发光与不受光照影响的材质；这部分不会随昼夜变暗。'
      : '含发光与不受光照影响的材质；保留模型原始渲染。'
  }
  if (hasEmissive) {
    return hasModelRenderingManager
      ? '已识别发光材质；夜景通道按统一标准处理。'
      : '含发光材质；保留模型原始渲染。'
  }
  if (hasUnlit) {
    return '含不受光照影响的材质，这部分不会随昼夜变暗。'
  }
  return '未检测到发光材质；模型仅随太阳光照变化。'
}

function modelMatrixFromTransform(transform: GeoModelTransform): Matrix4 {
  const values = [
    transform.longitude,
    transform.latitude,
    transform.height,
    transform.scale,
    transform.heading,
    transform.pitch,
    transform.roll,
  ]
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error('模型位置、缩放和旋转必须是有效数字')
  }
  if (transform.longitude < -180 || transform.longitude > 180) {
    throw new Error('模型经度必须在 -180 到 180 之间')
  }
  if (transform.latitude < -90 || transform.latitude > 90) {
    throw new Error('模型纬度必须在 -90 到 90 之间')
  }
  if (transform.scale <= 0) {
    throw new Error('模型缩放必须大于 0')
  }

  const origin = Cartesian3.fromDegrees(transform.longitude, transform.latitude, transform.height)
  const orientation = new HeadingPitchRoll(
    CesiumMath.toRadians(transform.heading),
    CesiumMath.toRadians(transform.pitch),
    CesiumMath.toRadians(transform.roll),
  )
  const modelMatrix = Transforms.headingPitchRollToFixedFrame(origin, orientation)
  return Matrix4.multiplyByUniformScale(modelMatrix, transform.scale, modelMatrix)
}

export function createGeoDataBrowser(
  viewer: Viewer,
  browserOptions: GeoDataBrowserOptions = {},
): GeoDataBrowser {
  const resources = new Map<string, ManagedResource>()
  let terrainSnapshot: GeoTerrainSnapshot = {
    id: 'ellipsoid',
    label: '椭球体地形',
    status: 'ready',
  }
  let disposed = false
  let terrainRequestVersion = 0
  let scanPhase = 0.34
  let previousTickTime = performance.now()
  const pendingModelWaits = new Set<() => void>()
  const pendingLoads = new Set<AbortController>()

  function loadScope(signal?: AbortSignal): { signal: AbortSignal; dispose(): void } {
    const controller = new AbortController()
    const signals = [browserOptions.signal, signal].filter(
      (value): value is AbortSignal => value !== undefined,
    )
    function abort(): void {
      controller.abort()
    }
    signals.forEach(function listen(source) {
      source.addEventListener('abort', abort, { once: true })
      if (source.aborted) {
        abort()
      }
    })
    pendingLoads.add(controller)
    return {
      signal: controller.signal,
      dispose() {
        signals.forEach((source) => source.removeEventListener('abort', abort))
        pendingLoads.delete(controller)
      },
    }
  }

  function checkLoad(signal: AbortSignal): void {
    assertActive()
    if (signal.aborted) {
      throw new DOMException('数据加载已取消', 'AbortError')
    }
  }

  function awaitLoad<T>(
    promise: Promise<T>,
    signal: AbortSignal,
    disposeLate?: (value: T) => void,
  ): Promise<T> {
    return new Promise(function waitForLoad(resolve, reject) {
      let settled = false
      function abort(): void {
        if (!settled) {
          settled = true
          signal.removeEventListener('abort', abort)
          reject(new DOMException('数据加载已取消', 'AbortError'))
        }
      }
      signal.addEventListener('abort', abort, { once: true })
      promise.then(
        function complete(value) {
          if (settled) {
            try {
              disposeLate?.(value)
            } catch {
              // An abandoned asynchronous resource must not interrupt the viewer.
            }
            return
          }
          settled = true
          signal.removeEventListener('abort', abort)
          resolve(value)
        },
        function fail(error) {
          if (!settled) {
            settled = true
            signal.removeEventListener('abort', abort)
            reject(error)
          }
        },
      )
      if (signal.aborted) {
        abort()
      }
    })
  }

  function requestRender(): void {
    if (!viewer.isDestroyed()) {
      viewer.scene.requestRender()
    }
  }

  function assertActive(): void {
    if (disposed) {
      throw new Error('Geo data browser has been disposed')
    }
    if (browserOptions.signal?.aborted) {
      throw new Error('Geo data loading was cancelled')
    }
    if (viewer.isDestroyed()) {
      throw new Error('Geo Viewer has been destroyed')
    }
  }

  function syncResourceVisibility(managed: ManagedResource): boolean {
    const previousAutoHidden = managed.autoHidden
    const previousShow = managed.resource.show
    const maximumHeight = managed.maximumVisibleCameraHeight
    managed.autoHidden =
      maximumHeight !== undefined && viewer.camera.positionCartographic.height > maximumHeight
    managed.resource.show = managed.requestedShow && !managed.autoHidden
    managed.animation?.setVisible(managed.resource.show)
    return previousAutoHidden !== managed.autoHidden || previousShow !== managed.resource.show
  }

  function syncHeightVisibility(): void {
    if (disposed || viewer.isDestroyed()) {
      return
    }
    let changed = false
    resources.forEach(function syncManagedResource(managed) {
      changed = syncResourceVisibility(managed) || changed
    })
    if (changed) {
      browserOptions.onResourcesChange?.()
    }
  }

  function updateScanPhase(): void {
    const now = performance.now()
    const elapsed = Math.min(Math.max(now - previousTickTime, 0), 250)
    previousTickTime = now
    if (!viewer.clock.shouldAnimate || elapsed === 0) {
      return
    }
    scanPhase = (scanPhase + elapsed / 8_000) % 1
    resources.forEach(function updateVisual(managed) {
      managed.tilesetVisual?.setScanPhase(scanPhase)
    })
  }

  function fallbackTilesetVisuals(): void {
    if (disposed || viewer.isDestroyed()) {
      return
    }
    const hasModelResource =
      pendingModelWaits.size > 0 ||
      [...resources.values()].some(function hasModel(managed) {
        return managed.snapshot.kind === 'model'
      })
    if (hasModelResource) {
      const notice = '场景渲染失败，无法确定资源；请移除最近添加的模型后重试'
      resources.forEach(function markModelFailure(managed) {
        if (managed.snapshot.kind === 'model') {
          managed.snapshot.modelRenderingNotice = notice
        }
      })
      browserOptions.onResourcesError?.(notice)
      browserOptions.onResourcesChange?.()
      return
    }
    let changed = false
    resources.forEach(function restoreOriginalMaterial(managed) {
      if (managed.visualStyle !== 'cyber-scan' || managed.snapshot.kind !== '3d-tiles') {
        return
      }
      ;(managed.resource as Cesium3DTilesetType).customShader = undefined
      managed.visualStyle = 'original'
      changed = true
    })
    if (!changed) {
      return
    }
    browserOptions.onResourcesError?.('科技扫描渲染失败，已恢复原始材质')
    browserOptions.onResourcesChange?.()
    requestRender()
  }

  const removePreRenderListener = viewer.scene.preRender.addEventListener(syncHeightVisibility)
  const removeClockTickListener = viewer.clock.onTick.addEventListener(updateScanPhase)
  const removeRenderErrorListener =
    viewer.scene.renderError.addEventListener(fallbackTilesetVisuals)

  function activeTileset(): Cesium3DTilesetType | undefined {
    const managed = [...resources.values()].reverse().find(function findTileset(item) {
      return item.snapshot.kind === '3d-tiles'
    })
    return managed?.resource as Cesium3DTilesetType | undefined
  }

  function notifyActiveTileset(): void {
    browserOptions.onActiveTilesetChange?.(activeTileset())
  }

  function waitForModelReady(
    model: Model,
    signal: AbortSignal = browserOptions.signal ?? new AbortController().signal,
  ): Promise<void> {
    if (model.ready) {
      return Promise.resolve()
    }
    return new Promise(function wait(resolve, reject) {
      let settled = false

      function cleanup(): void {
        model.readyEvent.removeEventListener(onReady)
        model.errorEvent.removeEventListener(onError)
        viewer.scene.renderError.removeEventListener(onRenderError)
        signal.removeEventListener('abort', onAbort)
        pendingModelWaits.delete(cancel)
      }

      function finish(error?: Error): void {
        if (settled) {
          return
        }
        settled = true
        cleanup()
        if (error) {
          reject(error)
          return
        }
        resolve()
      }

      function onReady(): void {
        finish()
      }

      function onError(error: unknown): void {
        if (error instanceof Error) {
          finish(error)
          return
        }
        const message =
          typeof error === 'object' && error !== null && 'message' in error
            ? String(error.message)
            : '模型渲染失败'
        finish(new Error(message))
      }

      function onAbort(): void {
        finish(new DOMException('数据加载已取消', 'AbortError'))
      }

      function onRenderError(): void {
        finish(new Error('场景渲染失败，模型尚未完成加载'))
      }

      function cancel(): void {
        finish(new Error('Geo data loading was cancelled'))
      }

      model.readyEvent.addEventListener(onReady)
      model.errorEvent.addEventListener(onError)
      viewer.scene.renderError.addEventListener(onRenderError)
      signal.addEventListener('abort', onAbort, { once: true })
      pendingModelWaits.add(cancel)
      if (signal.aborted) {
        onAbort()
        return
      }
      if (model.ready) {
        onReady()
        return
      }
      requestRender()
    })
  }

  function cleanupDataSource(resource: GeoJsonDataSource): void {
    if (!viewer.isDestroyed() && viewer.dataSources.contains(resource)) {
      viewer.dataSources.remove(resource, true)
      requestRender()
    }
  }

  function cleanupPrimitive(resource: Model | Cesium3DTilesetType): void {
    if (!resource.isDestroyed()) {
      resource.destroy()
    }
  }

  function snapshotFor(managed: ManagedResource): GeoDataResourceSnapshot {
    return {
      ...managed.snapshot,
      modelTransform: managed.snapshot.modelTransform
        ? { ...managed.snapshot.modelTransform }
        : undefined,
      animation: managed.animation?.snapshot(),
      show: managed.requestedShow,
      status: managed.tilesetError ? 'failed' : 'ready',
      error: managed.tilesetError,
      modelRenderingNotice: managed.snapshot.modelRenderingNotice,
      visualStyle: managed.visualStyle,
      autoHidden: managed.autoHidden,
      maximumVisibleCameraHeight: managed.maximumVisibleCameraHeight,
    }
  }

  function assertUnique(id: string): void {
    if (resources.has(id)) {
      throw new Error(`Geo data resource id already exists: ${id}`)
    }
  }

  function list(): readonly GeoDataResourceSnapshot[] {
    return [...resources.values()].map(snapshotFor)
  }

  async function loadGeoJson(options: LoadGeoJsonOptions): Promise<GeoDataResourceSnapshot> {
    assertActive()
    if (options.data === undefined && !options.url) {
      throw new Error('GeoJSON loading requires either data or url')
    }
    const id = normalizeId('geojson', options.id)
    assertUnique(id)
    const data = options.data ?? (options.url as string)
    let resource: GeoJsonDataSource | undefined
    let added = false
    try {
      resource = await GeoJsonDataSource.load(data, {
        clampToGround: options.clampToGround ?? true,
      })
      assertActive()
      resource.show = options.show ?? true
      const managed: ManagedResource = {
        snapshot: {
          id,
          label: options.label?.trim() || 'GeoJSON 数据',
          kind: 'geojson',
          url: options.url,
        },
        resource,
        requestedShow: options.show ?? true,
        autoHidden: false,
        remove: () => viewer.dataSources.remove(resource as GeoJsonDataSource, true),
      }
      syncResourceVisibility(managed)
      viewer.dataSources.add(resource)
      added = true
      resources.set(id, managed)
      requestRender()
      return snapshotFor(managed)
    } catch (error) {
      if (resource) {
        if (added) {
          cleanupDataSource(resource)
        }
      }
      throw error
    }
  }

  async function loadModel(options: LoadModelOptions): Promise<GeoDataResourceSnapshot> {
    assertActive()
    const id = normalizeId('model', options.id)
    assertUnique(id)
    const load = loadScope(options.signal)
    let resource: Model | undefined
    let modelRenderingRegistration: GeoModelRenderingRegistration | undefined
    let modelRenderingNotice: string | undefined
    let animationClips: readonly GeoModelAnimationClip[] = []
    let captureNodes: ReturnType<typeof prepareAnimationCaptureNodes> = {
      names: [],
      trsOnly: false,
    }
    let animation: GeoModelAnimationPlayer | undefined
    let added = false
    let prepared: PreparedGeoModelAsset | undefined
    let transform = options.transform ? { ...options.transform } : undefined
    try {
      checkLoad(load.signal)
      prepared = await prepareGeoModelAsset(options.url, load.signal)
      checkLoad(load.signal)
      if (prepared.coordinates && options.chooseCoordinates) {
        const source = await awaitLoad(options.chooseCoordinates(prepared.coordinates), load.signal)
        checkLoad(load.signal)
        if (source === 'cancel') {
          throw new DOMException('模型加载已取消', 'AbortError')
        }
        if (source === 'model') {
          const coordinates = prepared.coordinates
          let height = coordinates.height
          if (height === undefined) {
            const provider = viewer.terrainProvider
            if (provider instanceof EllipsoidTerrainProvider) {
              height = 0
            } else {
              const positions = [
                Cartographic.fromDegrees(coordinates.longitude, coordinates.latitude),
              ]
              const sampled = await awaitLoad(
                provider.availability
                  ? sampleTerrainMostDetailed(provider, positions, true)
                  : sampleTerrain(provider, 12, positions, true),
                load.signal,
              )
              checkLoad(load.signal)
              if (viewer.terrainProvider !== provider) {
                throw new Error('地形已变化，请重新加载模型以确定定位高度。')
              }
              height = sampled[0]?.height
              if (height === undefined || !Number.isFinite(height)) {
                throw new Error('无法获取模型位置的地形高度；请使用输入坐标并设置定位高度。')
              }
            }
          }
          transform = {
            scale: 1,
            heading: 0,
            pitch: 0,
            roll: 0,
            ...transform,
            longitude: coordinates.longitude,
            latitude: coordinates.latitude,
            height,
          }
        }
      }
      resource = await awaitLoad(
        Model.fromGltfAsync({
          incrementallyLoadTextures: false,
          url: prepared.url,
          modelMatrix: transform ? modelMatrixFromTransform(transform) : options.modelMatrix,
          show: options.show ?? true,
          minimumPixelSize: options.minimumPixelSize,
          shadows: options.shadows,
          environmentMapOptions: {
            maximumSecondsDifference: ENVIRONMENT_MAP_UPDATE_SECONDS,
          },
          gltfCallback(gltf: unknown) {
            modelRenderingNotice = modelMaterialNotice(gltf, Boolean(browserOptions.modelRendering))
            animationClips = readModelAnimationClips(gltf)
            captureNodes = prepareAnimationCaptureNodes(gltf)
          },
        }),
        load.signal,
        cleanupPrimitive,
      )
      checkLoad(load.signal)
      if (!modelRenderingNotice) {
        modelRenderingNotice = browserOptions.modelRendering
          ? '材质信息未能确认；已按统一模型渲染兼容路径处理。'
          : '材质兼容性未知；已保留模型原始渲染。'
      }
      if (prepared.emissiveMaterials > 0) {
        modelRenderingNotice += ` 已适配 ${prepared.emissiveMaterials} 组发光倍率。`
      }
      const initialModelMaterialNotice = modelRenderingNotice
      viewer.scene.primitives.add(resource)
      added = true
      requestRender()
      await waitForModelReady(resource, load.signal)
      checkLoad(load.signal)
      if (animationClips.length) {
        animation = createModelAnimationPlayer(
          resource,
          viewer,
          animationClips,
          function changed() {
            browserOptions.onModelAnimationChange?.()
          },
          captureNodes,
        )
      }
      if (browserOptions.modelRendering) {
        try {
          modelRenderingRegistration = browserOptions.modelRendering.register(resource)
        } catch (error) {
          modelRenderingNotice =
            error instanceof Error
              ? `统一模型渲染不可用，已保留模型原始渲染：${error.message}`
              : '统一模型渲染不可用，已保留模型原始渲染'
        }
      }
      let managed: ManagedResource
      managed = {
        snapshot: {
          id,
          label: options.label?.trim() || '3D 模型',
          kind: 'model',
          url: options.url,
          modelTransform: transform,
          modelRenderingNotice,
        },
        resource,
        modelMaterialNotice: initialModelMaterialNotice,
        animation,
        modelRenderingRegistration,
        requestedShow: options.show ?? true,
        autoHidden: false,
        remove: () => {
          try {
            managed.animation?.dispose()
            managed.modelRenderingRegistration?.dispose()
            managed.modelRenderingRegistration = undefined
            const removed = viewer.isDestroyed()
              ? false
              : viewer.scene.primitives.remove(resource as Model)
            cleanupPrimitive(resource as Model)
            return removed
          } finally {
            prepared?.dispose()
          }
        },
      }
      syncResourceVisibility(managed)
      resources.set(id, managed)
      requestRender()
      return snapshotFor(managed)
    } catch (error) {
      try {
        animation?.dispose()
        if (resource) {
          modelRenderingRegistration?.dispose()
          if (added && !viewer.isDestroyed()) {
            viewer.scene.primitives.remove(resource)
          }
          cleanupPrimitive(resource)
        }
      } finally {
        prepared?.dispose()
      }
      throw error
    } finally {
      load.dispose()
    }
  }

  async function loadTileset(options: LoadTilesetOptions): Promise<GeoDataResourceSnapshot> {
    assertActive()
    const id = normalizeId('3d-tiles', options.id)
    assertUnique(id)
    const load = loadScope(options.signal)
    let resource: Cesium3DTilesetType | undefined
    let visual: GeoTilesetVisual | undefined
    let environmentRegistration: { dispose(): void } | undefined
    let renderingRegistration: GeoModelRenderingRegistration | undefined
    let removeTileFailureListener: (() => void) | undefined
    let added = false
    try {
      checkLoad(load.signal)
      if (options.dayNightPosition && options.visualStyle === 'cyber-scan') {
        throw new Error('街区昼夜材质不能与科技扫描样式同时启用。')
      }
      visual = options.visualStyle ? createCyberCityTilesetVisual() : undefined
      visual?.setScanPhase(scanPhase)
      resource = await awaitLoad(
        Cesium3DTileset.fromUrl(options.url, {
          show: options.show ?? true,
          maximumScreenSpaceError: options.maximumScreenSpaceError ?? 16,
          shadows: options.shadows,
          environmentMapOptions: {
            maximumSecondsDifference: ENVIRONMENT_MAP_UPDATE_SECONDS,
          },
        }),
        load.signal,
        cleanupPrimitive,
      )
      checkLoad(load.signal)
      resource.customShader = options.visualStyle === 'cyber-scan' ? visual?.shader : undefined
      if (options.dayNightPosition) {
        if (!browserOptions.modelRendering) {
          throw new Error('当前场景缺少街区昼夜渲染能力。')
        }
        renderingRegistration = browserOptions.modelRendering.registerTileset(
          resource,
          options.dayNightPosition,
        )
      } else {
        environmentRegistration = browserOptions.modelRendering?.registerEnvironment(resource)
      }
      viewer.scene.primitives.add(resource)
      added = true
      const managed: ManagedResource = {
        snapshot: {
          id,
          label: options.label?.trim() || '3D Tiles',
          kind: '3d-tiles',
          url: options.url,
        },
        resource,
        environmentRegistration,
        modelRenderingRegistration: renderingRegistration,
        requestedShow: options.show ?? true,
        autoHidden: false,
        maximumVisibleCameraHeight: options.maximumVisibleCameraHeight,
        visualStyle: options.visualStyle,
        tilesetVisual: visual,
        remove: () => {
          removeTileFailureListener?.()
          renderingRegistration?.dispose()
          environmentRegistration?.dispose()
          if (resource && resource.customShader === visual?.shader) {
            resource.customShader = undefined
          }
          const removed = viewer.isDestroyed()
            ? false
            : viewer.scene.primitives.remove(resource as Cesium3DTilesetType)
          cleanupPrimitive(resource as Cesium3DTilesetType)
          visual?.dispose()
          return removed
        },
      }
      syncResourceVisibility(managed)
      resources.set(id, managed)
      if (options.dayNightPosition) {
        removeTileFailureListener = resource.tileFailed.addEventListener(function tileFailed() {
          if (!disposed && resources.has(id)) {
            managed.tilesetError = '周边瓦片加载失败，请检查资源地址并重试。'
            browserOptions.onResourcesError?.(managed.tilesetError)
            browserOptions.onResourcesChange?.()
          }
        })
      }
      notifyActiveTileset()
      requestRender()
      return snapshotFor(managed)
    } catch (error) {
      removeTileFailureListener?.()
      renderingRegistration?.dispose()
      environmentRegistration?.dispose()
      if (resource) {
        if (added && !viewer.isDestroyed()) {
          viewer.scene.primitives.remove(resource)
        }
        cleanupPrimitive(resource)
      }
      visual?.dispose()
      throw error
    } finally {
      load.dispose()
    }
  }

  function remove(id: string): boolean {
    assertActive()
    const managed = resources.get(id)
    if (!managed) {
      return false
    }
    resources.delete(id)
    const removed = managed.remove()
    if (managed.snapshot.kind === '3d-tiles') {
      notifyActiveTileset()
    }
    requestRender()
    return removed
  }

  function controlModelAnimation(id: string, command: GeoModelAnimationCommand): void {
    assertActive()
    const managed = resources.get(id)
    if (!managed?.animation) {
      throw new Error('该资源没有可控制的模型动画。')
    }
    managed.animation.control(command)
  }

  function clear(): void {
    ;[...resources.keys()].forEach(remove)
  }

  function setVisible(id: string, show: boolean): void {
    assertActive()
    const managed = resources.get(id)
    if (!managed) {
      throw new Error(`Geo data resource not found: ${id}`)
    }
    managed.requestedShow = show
    syncResourceVisibility(managed)
    requestRender()
  }

  function setTilesetVisualStyle(id: string, style: GeoTilesetVisualStyle): void {
    assertActive()
    const managed = resources.get(id)
    if (!managed || managed.snapshot.kind !== '3d-tiles' || !managed.tilesetVisual) {
      throw new Error(`Geo styled 3D Tiles resource not found: ${id}`)
    }
    const tileset = managed.resource as Cesium3DTilesetType
    managed.visualStyle = style
    tileset.customShader = style === 'cyber-scan' ? managed.tilesetVisual.shader : undefined
    requestRender()
  }

  function updateModelTransform(id: string, transform: GeoModelTransform): void {
    assertActive()
    const managed = resources.get(id)
    if (!managed || managed.snapshot.kind !== 'model') {
      throw new Error(`Geo model resource not found: ${id}`)
    }
    const model = managed.resource as Model
    model.modelMatrix = modelMatrixFromTransform(transform)
    managed.snapshot.modelTransform = { ...transform }
    if (managed.modelRenderingRegistration) {
      managed.modelRenderingRegistration.update()
    } else if (browserOptions.modelRendering) {
      try {
        managed.modelRenderingRegistration = browserOptions.modelRendering.register(model)
        managed.snapshot.modelRenderingNotice = managed.modelMaterialNotice
      } catch (error) {
        managed.snapshot.modelRenderingNotice =
          error instanceof Error
            ? `统一模型渲染不可用，已保留模型原始渲染：${error.message}`
            : '统一模型渲染不可用，已保留模型原始渲染'
      }
    }
    requestRender()
  }

  async function flyTo(id: string, duration = 1.4): Promise<boolean> {
    assertActive()
    const managed = resources.get(id)
    if (!managed) {
      return false
    }
    if (managed.snapshot.kind === 'model') {
      const model = managed.resource as Model
      await waitForModelReady(model)
      assertActive()
      return new Promise(function flyToModel(resolve) {
        viewer.camera.flyToBoundingSphere(model.boundingSphere, {
          duration,
          offset: modelCameraOffset(viewer, model.boundingSphere),
          complete() {
            requestRender()
            resolve(true)
          },
          cancel() {
            resolve(false)
          },
        })
      })
    }
    await viewer.flyTo(managed.resource as GeoJsonDataSource | Cesium3DTilesetType, { duration })
    return true
  }

  async function setTerrain(id: GeoTerrainResourceId, url?: string): Promise<GeoTerrainSnapshot> {
    assertActive()
    const requestVersion = ++terrainRequestVersion
    let provider: TerrainProvider
    try {
      if (id === 'ellipsoid') {
        provider = new EllipsoidTerrainProvider()
      } else if (id === 'cesium-world-terrain') {
        provider = await createWorldTerrainAsync({
          requestVertexNormals: true,
          requestWaterMask: true,
        })
      } else {
        if (!url) {
          throw new Error('自定义地形需要 URL')
        }
        provider = await CesiumTerrainProvider.fromUrl(url)
      }
    } catch (error) {
      if (requestVersion !== terrainRequestVersion) {
        return terrainSnapshot
      }
      throw error
    }

    if (requestVersion !== terrainRequestVersion) {
      return terrainSnapshot
    }
    assertActive()
    viewer.scene.globe.terrainProvider = provider
    terrainSnapshot = {
      id,
      label:
        id === 'ellipsoid'
          ? '椭球体地形'
          : id === 'cesium-world-terrain'
            ? 'Cesium World Terrain'
            : '自定义地形',
      status: 'ready',
    }
    requestRender()
    return terrainSnapshot
  }

  function getTerrain(): GeoTerrainSnapshot {
    return terrainSnapshot
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    pendingLoads.forEach((controller) => controller.abort())
    pendingLoads.clear()
    terrainRequestVersion += 1
    ;[...pendingModelWaits].forEach(function cancelModelWait(cancel) {
      cancel()
    })
    removePreRenderListener()
    removeClockTickListener()
    removeRenderErrorListener()
    ;[...resources.keys()].forEach(function disposeResource(id) {
      const managed = resources.get(id)
      resources.delete(id)
      managed?.remove()
    })
    browserOptions.onActiveTilesetChange?.(undefined)
    requestRender()
  }

  const captureSubjects: GeoCaptureSubjects = {
    list() {
      if (disposed || viewer.isDestroyed()) {
        return []
      }
      return [...resources.values()].flatMap(function subject(managed) {
        if (managed.snapshot.kind !== 'model') {
          return []
        }
        const model = managed.resource as Model
        if (model.isDestroyed() || !model.ready || !model.show) {
          return []
        }
        const center = Cartographic.fromCartesian(model.boundingSphere.center)
        return [
          {
            id: managed.snapshot.id,
            label: managed.snapshot.label,
            url: managed.snapshot.url,
            anchor: [
              CesiumMath.toDegrees(center.longitude),
              CesiumMath.toDegrees(center.latitude),
              center.height,
            ] as [number, number, number],
            radius: model.boundingSphere.radius,
            clips: managed.animation?.snapshot().clips ?? [],
          },
        ]
      })
    },
    ready() {
      return (
        !disposed &&
        [...resources.values()].every(function loaded(managed) {
          if (!managed.resource.show) {
            return true
          }
          if (managed.snapshot.kind === '3d-tiles') {
            return !managed.tilesetError && (managed.resource as Cesium3DTilesetType).tilesLoaded
          }
          return managed.snapshot.kind !== 'model' || (managed.resource as Model).ready
        })
      )
    },
    acquire(id) {
      assertActive()
      const selected = resources.get(id)
      if (!selected || selected.snapshot.kind !== 'model' || !selected.resource.show) {
        throw new Error('拍摄主体已隐藏或移除，请重新选择已加载模型。')
      }
      const leases: ReturnType<GeoModelAnimationPlayer['acquireExternal']>[] = []
      let selectedLease: ReturnType<GeoModelAnimationPlayer['acquireExternal']> | undefined
      try {
        resources.forEach(function freeze(managed) {
          if (!managed.animation) {
            return
          }
          const lease = managed.animation.acquireExternal()
          leases.push(lease)
          if (managed === selected) {
            selectedLease = lease
          }
        })
      } catch (error) {
        leases.reverse().forEach((lease) => lease.dispose())
        throw error
      }
      return {
        sample(clip, seconds) {
          if (resources.get(id) !== selected || !selected.resource.show) {
            throw new Error('拍摄主体已隐藏或移除。')
          }
          if (clip === undefined) {
            selectedLease?.reset()
            return
          }
          if (!selectedLease) {
            throw new Error('拍摄主体没有可播放的动画。')
          }
          selectedLease.sample(clip, seconds)
        },
        dispose() {
          leases.reverse().forEach((lease) => lease.dispose())
        },
      }
    },
  }

  return {
    captureSubjects,
    list,
    loadGeoJson,
    loadModel,
    loadTileset,
    remove,
    clear,
    setVisible,
    setTilesetVisualStyle,
    updateModelTransform,
    controlModelAnimation,
    flyTo,
    setTerrain,
    getTerrain,
    dispose,
  }
}
