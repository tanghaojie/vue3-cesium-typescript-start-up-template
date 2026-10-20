import { reactive, readonly, type DeepReadonly } from 'vue'
import {
  Cartesian2,
  Cartographic,
  Math as CesiumMath,
  type Cesium3DTileset,
  type Viewer,
} from 'cesium'
import {
  createGeoDataBrowser,
  type GeoDataBrowser,
  type GeoDataBrowserOptions,
  type GeoDataResourceSnapshot,
  type GeoModelTransform,
  type GeoTerrainResourceId,
  type GeoTerrainSnapshot,
  type GeoTilesetVisualStyle,
  type LoadGeoJsonOptions,
  type LoadModelOptions,
  type LoadTilesetOptions,
} from '../../tools/data/data-browser'
import {
  createGeoImageryCatalog,
  type GeoImageryAvailability,
  type GeoImagerySourceId,
  type GeoImagerySourceOptions,
} from '../../tools/data/imagery-sources'
import {
  createGeoImageryLayerManager,
  type AddImageryLayerOptions,
  type GeoImageryLayerManager,
  type GeoImageryLayerSnapshot,
} from '../../tools/data/imagery-layer-manager'
import type { GeoImageryLayerEntry } from './data.capabilities'
import type { GeoModelRenderingManager } from '../../tools/scene/model-rendering'
import type { GeoModelCoordinates, GeoModelCoordinateSource } from '../../tools/data/model-asset'
import {
  createGeoLandmarkSceneLoader,
  type GeoLandmarkSceneLoader,
  type GeoLandmarkSceneSnapshot,
} from '../../tools/data/landmark-scene-loader'
import {
  DEFAULT_AI_MODEL_CATALOG_URL,
  loadAiModelCatalog,
  type AiModelCatalogItem,
  type AiModelSelection,
} from '../../tools/data/ai-model-catalog'
import { createAiModelLoader, type AiModelGroupSnapshot } from '../../tools/data/ai-model-loader'
import type { GeoModelAnimationCommand } from '../../tools/model/model-animation'
import type { GeoCaptureSubjects } from '../../tools/data/capture-subject'

export type GeoDataLoadingOperation =
  'geojson' | 'model' | 'tileset' | 'landmark-scene' | 'fly-to' | 'transform' | 'ai-model'

export interface GeoDataState {
  imagery: readonly GeoImageryLayerSnapshot[]
  resources: readonly GeoDataResourceSnapshot[]
  landmarkScenes: readonly GeoLandmarkSceneSnapshot[]
  landmarkLoading?: string
  terrain: GeoTerrainSnapshot
  busy: boolean
  loadingOperation?: GeoDataLoadingOperation
  loadingImagerySource?: GeoImagerySourceId
  error?: string
  aiModelCatalog: readonly AiModelCatalogItem[]
  aiModelCatalogStatus: 'idle' | 'loading' | 'ready' | 'failed'
  aiModelCatalogError?: string
  aiModelGroups: readonly AiModelGroupSnapshot[]
  aiModelLoadingId?: string
  aiModelProgress?: string
  modelCoordinateRequest?: {
    readonly coordinates: GeoModelCoordinates
    readonly input?: GeoModelTransform
  }
}

export interface GeoDataController {
  readonly captureSubjects: GeoCaptureSubjects
  readonly state: DeepReadonly<GeoDataState>
  readonly imageryCatalog: ReturnType<typeof createGeoImageryCatalog>
  imageryAvailability(sourceId: GeoImagerySourceId): GeoImageryAvailability
  addImagery(sourceId: GeoImagerySourceId, options?: AddImageryLayerOptions): Promise<void>
  removeImagery(id: string): void
  setImageryVisible(id: string, show: boolean): void
  setImageryAlpha(id: string, alpha: number): void
  raiseImagery(id: string): void
  lowerImagery(id: string): void
  flyToImagery(id: string): void
  loadGeoJson(options: LoadGeoJsonOptions): Promise<void>
  loadModel(options: LoadModelOptions): Promise<void>
  refreshAiModelCatalog(): Promise<void>
  loadAiModel(id: string, selection?: AiModelSelection): Promise<void>
  cancelAiModelLoad(): void
  loadLandmarkScene(url: string): Promise<void>
  retryLandmarkScene(id: string): Promise<void>
  cancelLandmarkLoad(): void
  removeLandmarkScene(id: string): void
  chooseModelCoordinates(source: GeoModelCoordinateSource): void
  loadTileset(options: LoadTilesetOptions): Promise<boolean>
  removeResource(id: string): void
  setResourceVisible(id: string, show: boolean): void
  setTilesetVisualStyle(id: string, style: GeoTilesetVisualStyle): void
  flyToResource(id: string): Promise<void>
  suggestModelTransform(): GeoModelTransform
  updateModelTransform(id: string, transform: GeoModelTransform): Promise<void>
  controlModelAnimation(id: string, command: GeoModelAnimationCommand): void
  setTerrain(id: GeoTerrainResourceId, url?: string): Promise<void>
  refresh(): void
  dispose(): void
}

export interface GeoDataControllerOptions extends GeoImagerySourceOptions {
  readonly aiModelCatalogUrl?: string
  readonly catalog?: ReturnType<typeof createGeoImageryCatalog>
  readonly signal?: AbortSignal
  readonly onActiveTilesetChange?: (tileset: Cesium3DTileset | undefined) => void
  readonly onImageryLayersChange?: (layers: readonly GeoImageryLayerEntry[]) => void
  readonly modelRendering?: GeoModelRenderingManager
}

export function createGeoDataController(
  viewer: Viewer,
  options: GeoDataControllerOptions = {},
): GeoDataController {
  const catalog = options.catalog ?? createGeoImageryCatalog()
  const browserOptions: GeoDataBrowserOptions = {
    signal: options.signal,
    modelRendering: options.modelRendering,
    onActiveTilesetChange: options.onActiveTilesetChange,
    onResourcesChange() {
      if (!disposed) {
        refresh()
      }
    },
    onModelAnimationChange() {
      if (!disposed) {
        refreshResources()
      }
    },
    onResourcesError(message) {
      if (!disposed) {
        state.error = message
      }
    },
  }
  const browser: GeoDataBrowser = createGeoDataBrowser(viewer, browserOptions)
  const state = reactive<GeoDataState>({
    imagery: [],
    resources: [],
    landmarkScenes: [],
    terrain: browser.getTerrain(),
    busy: false,
    aiModelCatalog: [],
    aiModelCatalogStatus: 'idle',
    aiModelGroups: [],
  })
  let imagery: GeoImageryLayerManager
  let landmarks: GeoLandmarkSceneLoader | undefined
  let aiModels: ReturnType<typeof createAiModelLoader> | undefined
  let catalogRequest: AbortController | undefined
  let disposed = false
  let pendingOperations = 0
  let terrainRequestVersion = 0
  let pendingCoordinateChoice: ((source: GeoModelCoordinateSource) => void) | undefined

  function guard(): void {
    if (disposed) {
      throw new Error('Geo data controller has been disposed')
    }
  }

  function publishImageryLayers(layers: readonly GeoImageryLayerSnapshot[]): void {
    options.onImageryLayersChange?.(
      layers.flatMap(function mapLayer(item): GeoImageryLayerEntry[] {
        const layer = imagery.getLayer(item.id)
        return layer ? [{ id: item.id, label: item.label, index: item.index, layer }] : []
      }),
    )
  }

  function refresh(): void {
    state.aiModelGroups = aiModels?.list() ?? []
    state.aiModelLoadingId = aiModels?.loadingId
    state.aiModelProgress = aiModels?.progress
    state.landmarkScenes = landmarks?.sync() ?? []
    state.landmarkLoading = landmarks?.loading
    const imageryLayers = imagery.list()
    state.imagery = imageryLayers.map(function copyImagery(item) {
      return { ...item }
    })
    publishImageryLayers(imageryLayers)
    refreshResources()
    state.terrain = { ...browser.getTerrain() }
  }

  function refreshResources(): void {
    state.resources = browser.list().map(function copyResource(item) {
      return {
        ...item,
        modelTransform: item.modelTransform ? { ...item.modelTransform } : undefined,
      }
    })
  }

  imagery = createGeoImageryLayerManager(viewer, catalog, {
    onChange: refresh,
  })
  state.terrain = browser.getTerrain()

  async function run<T>(
    operation: () => Promise<T>,
    loadingOperation?: GeoDataLoadingOperation,
  ): Promise<T | undefined> {
    guard()
    pendingOperations += 1
    state.busy = true
    if (loadingOperation) {
      state.loadingOperation = loadingOperation
    }
    state.error = undefined
    try {
      return await operation()
    } catch (error) {
      if (!disposed && !(error instanceof DOMException && error.name === 'AbortError')) {
        state.error = error instanceof Error ? error.message : '数据操作失败'
      }
      return undefined
    } finally {
      pendingOperations -= 1
      state.busy = pendingOperations > 0
      if (state.loadingOperation === loadingOperation) {
        state.loadingOperation = undefined
      }
      if (!disposed) {
        refresh()
      }
    }
  }

  async function addImagery(
    sourceId: GeoImagerySourceId,
    layerOptions: AddImageryLayerOptions = {},
  ): Promise<void> {
    guard()
    state.loadingImagerySource = sourceId
    try {
      await run(async function addLayer() {
        await imagery.add(sourceId, {
          ...options,
          ...layerOptions,
          signal: options.signal,
        })
      })
    } finally {
      state.loadingImagerySource = undefined
      refresh()
    }
  }

  function removeImagery(id: string): void {
    guard()
    if (imagery.get(id)) {
      publishImageryLayers(
        imagery.list().filter(function excludeRemovedLayer(item) {
          return item.id !== id
        }),
      )
    }
    imagery.remove(id)
    refresh()
  }

  function setImageryVisible(id: string, show: boolean): void {
    guard()
    imagery.setVisible(id, show)
    refresh()
  }

  function setImageryAlpha(id: string, alpha: number): void {
    guard()
    imagery.setAlpha(id, alpha)
    refresh()
  }

  function raiseImagery(id: string): void {
    guard()
    imagery.raise(id)
    refresh()
  }

  function lowerImagery(id: string): void {
    guard()
    imagery.lower(id)
    refresh()
  }

  function flyToImagery(id: string): void {
    guard()
    imagery.flyTo(id)
  }

  async function loadGeoJson(loadOptions: LoadGeoJsonOptions): Promise<void> {
    await run(async function load() {
      await browser.loadGeoJson(loadOptions)
    }, 'geojson')
  }

  async function loadModel(loadOptions: LoadModelOptions): Promise<void> {
    await run(async function load() {
      const model = await browser.loadModel({
        ...loadOptions,
        chooseCoordinates:
          loadOptions.chooseCoordinates ??
          function requestCoordinates(coordinates) {
            return requestModelCoordinates(coordinates, loadOptions.transform, loadOptions.signal)
          },
      })
      guard()
      await browser.flyTo(model.id)
    }, 'model')
  }

  function requestModelCoordinates(
    coordinates: GeoModelCoordinates,
    input: GeoModelTransform | undefined,
    signal?: AbortSignal,
  ): Promise<GeoModelCoordinateSource> {
    guard()
    if (pendingCoordinateChoice) {
      throw new Error('请先完成当前模型的坐标选择。')
    }
    state.modelCoordinateRequest = { coordinates, input }
    return new Promise<GeoModelCoordinateSource>(function waitForChoice(resolve) {
      const signals = new Set(
        [options.signal, signal].filter((value): value is AbortSignal => Boolean(value)),
      )
      function abort(): void {
        chooseModelCoordinates('cancel')
      }
      pendingCoordinateChoice = function finishChoice(source) {
        signals.forEach((sourceSignal) => sourceSignal.removeEventListener('abort', abort))
        state.modelCoordinateRequest = undefined
        resolve(source)
      }
      signals.forEach((sourceSignal) =>
        sourceSignal.addEventListener('abort', abort, { once: true }),
      )
      if ([...signals].some((sourceSignal) => sourceSignal.aborted)) {
        abort()
      }
    })
  }

  function chooseModelCoordinates(source: GeoModelCoordinateSource): void {
    const finish = pendingCoordinateChoice
    pendingCoordinateChoice = undefined
    finish?.(source)
  }

  landmarks = createGeoLandmarkSceneLoader(viewer, browser, {
    signal: options.signal,
    onChange: refresh,
    chooseCoordinates: requestModelCoordinates,
  })

  aiModels = createAiModelLoader(browser, { signal: options.signal, onChange: refresh })

  async function refreshAiModelCatalog(): Promise<void> {
    guard()
    catalogRequest?.abort()
    const request = new AbortController()
    catalogRequest = request
    function abort(): void {
      request.abort()
    }
    options.signal?.addEventListener('abort', abort, { once: true })
    state.aiModelCatalogStatus = 'loading'
    state.aiModelCatalogError = undefined
    try {
      if (options.signal?.aborted) {
        request.abort()
      }
      const items = await loadAiModelCatalog(
        options.aiModelCatalogUrl ?? DEFAULT_AI_MODEL_CATALOG_URL,
        request.signal,
      )
      if (disposed || request.signal.aborted) {
        return
      }
      state.aiModelCatalog = items
      state.aiModelCatalogStatus = 'ready'
    } catch (error) {
      if (!disposed && !request.signal.aborted) {
        state.aiModelCatalogStatus = 'failed'
        state.aiModelCatalogError = error instanceof Error ? error.message : 'AI 模型目录读取失败'
      }
    } finally {
      options.signal?.removeEventListener('abort', abort)
      if (catalogRequest === request) {
        catalogRequest = undefined
      }
    }
  }

  async function loadAiModel(id: string, selection?: AiModelSelection): Promise<void> {
    if (state.busy) {
      return
    }
    await run(async function loadPublishedModel() {
      const item = state.aiModelCatalog.find((entry) => entry.id === id)
      if (!item) {
        throw new Error('AI 模型不在当前目录中，请刷新目录。')
      }
      await aiModels!.load(item, selection)
    }, 'ai-model')
  }

  function cancelAiModelLoad(): void {
    aiModels?.cancel()
  }

  async function loadLandmarkScene(url: string): Promise<void> {
    await run(async function loadScene() {
      await landmarks!.load(url)
    }, 'landmark-scene')
  }

  async function retryLandmarkScene(id: string): Promise<void> {
    await run(async function retryScene() {
      await landmarks!.retry(id)
    }, 'landmark-scene')
  }

  function cancelLandmarkLoad(): void {
    guard()
    landmarks?.cancel()
  }

  function removeLandmarkScene(id: string): void {
    guard()
    landmarks?.remove(id)
    refresh()
  }

  async function loadTileset(loadOptions: LoadTilesetOptions): Promise<boolean> {
    const loaded = await run(async function load() {
      return browser.loadTileset(loadOptions)
    }, 'tileset')
    return Boolean(loaded)
  }

  function removeResource(id: string): void {
    guard()
    if (!aiModels?.remove(id) && !landmarks?.removeResource(id)) {
      browser.remove(id)
    }
    refresh()
  }

  function setResourceVisible(id: string, show: boolean): void {
    guard()
    if (aiModels?.setVisible(id, show)) {
      refresh()
      return
    }
    landmarks?.setResourceVisible(id, show)
    browser.setVisible(id, show)
    refresh()
  }

  function setTilesetVisualStyle(id: string, style: GeoTilesetVisualStyle): void {
    guard()
    browser.setTilesetVisualStyle(id, style)
    refresh()
  }

  async function flyToResource(id: string): Promise<void> {
    await run(async function flyTo() {
      await browser.flyTo(id)
    }, 'fly-to')
  }

  function suggestModelTransform(): GeoModelTransform {
    guard()
    const canvas = viewer.scene.canvas
    const center = new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2)
    const ray = viewer.camera.getPickRay(center)
    const position = ray ? viewer.scene.globe.pick(ray, viewer.scene) : undefined
    const cartographic = position
      ? Cartographic.fromCartesian(position)
      : viewer.camera.positionCartographic
    return {
      longitude: Number(CesiumMath.toDegrees(cartographic.longitude).toFixed(6)),
      latitude: Number(CesiumMath.toDegrees(cartographic.latitude).toFixed(6)),
      height: position ? Number(cartographic.height.toFixed(2)) : 0,
      scale: 1,
      heading: 0,
      pitch: 0,
      roll: 0,
    }
  }

  async function updateModelTransform(id: string, transform: GeoModelTransform): Promise<void> {
    await run(async function update() {
      aiModels?.assertTransformEditable(id)
      browser.updateModelTransform(id, transform)
    }, 'transform')
  }

  function controlModelAnimation(id: string, command: GeoModelAnimationCommand): void {
    guard()
    try {
      browser.controlModelAnimation(id, command)
    } catch (error) {
      state.error = error instanceof Error ? error.message : '模型动画操作失败'
    }
  }

  async function setTerrain(id: GeoTerrainResourceId, url?: string): Promise<void> {
    guard()
    const requestVersion = ++terrainRequestVersion
    const label =
      id === 'ellipsoid'
        ? '椭球体地形'
        : id === 'cesium-world-terrain'
          ? 'Cesium World Terrain'
          : '自定义地形'
    state.terrain = { id, label, status: 'loading' }
    const terrain = await run(async function set() {
      return browser.setTerrain(id, url)
    })
    if (disposed || requestVersion !== terrainRequestVersion) {
      return
    }
    if (terrain) {
      state.terrain = { ...terrain }
      return
    }
    state.terrain = {
      id,
      label,
      status: 'failed',
      error: state.error ?? '地形切换失败',
    }
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    chooseModelCoordinates('cancel')
    catalogRequest?.abort()
    aiModels?.dispose()
    landmarks?.dispose()
    options.onImageryLayersChange?.([])
    imagery.dispose()
    browser.dispose()
  }

  refresh()
  return {
    captureSubjects: browser.captureSubjects,
    state: readonly(state),
    imageryCatalog: imagery.catalog,
    imageryAvailability(sourceId) {
      const source = imagery.catalog.find(function findSource(item) {
        return item.id === sourceId
      })
      if (!source) {
        return { available: false, reason: `Unknown imagery source: ${sourceId}` }
      }
      return source.checkAvailability(options)
    },
    addImagery,
    removeImagery,
    setImageryVisible,
    setImageryAlpha,
    raiseImagery,
    lowerImagery,
    flyToImagery,
    loadGeoJson,
    loadModel,
    refreshAiModelCatalog,
    loadAiModel,
    cancelAiModelLoad,
    loadLandmarkScene,
    retryLandmarkScene,
    cancelLandmarkLoad,
    removeLandmarkScene,
    chooseModelCoordinates,
    loadTileset,
    removeResource,
    setResourceVisible,
    setTilesetVisualStyle,
    flyToResource,
    suggestModelTransform,
    updateModelTransform,
    controlModelAnimation,
    setTerrain,
    refresh,
    dispose,
  }
}
