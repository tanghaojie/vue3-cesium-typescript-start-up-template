import {
  ImageryLayer,
  type ImageryProvider,
  type Request,
  type TileProviderError,
  type Viewer,
} from 'cesium'
import {
  createGeoImageryCatalog,
  type GeoImagerySourceDefinition,
  type GeoImagerySourceId,
  type GeoImagerySourceOptions,
} from './imagery-sources'
import { resolveCoordinateCorrection, type GeoCoordinateCorrection } from './coordinate-correction'

export interface GeoImageryLayerSnapshot {
  readonly id: string
  readonly sourceId: GeoImagerySourceId
  readonly label: string
  readonly role: GeoImagerySourceDefinition['role']
  readonly coordinateSystem: GeoImagerySourceDefinition['coordinateSystem']
  readonly coordinateCorrection: GeoCoordinateCorrection
  readonly show: boolean
  readonly alpha: number
  readonly index: number
  readonly status: 'ready' | 'degraded'
  readonly error?: string
  readonly warning?: string
}

export interface GeoImageryLayerManagerOptions {
  readonly onChange?: () => void
}

export interface AddImageryLayerOptions extends GeoImagerySourceOptions {
  readonly id?: string
  readonly show?: boolean
  readonly alpha?: number
  readonly index?: number
  readonly signal?: AbortSignal
}

interface ManagedImageryLayer {
  readonly snapshotId: string
  readonly definition: GeoImagerySourceDefinition
  readonly layer: ImageryLayer
  removeErrorListener?: () => void
  restoreRequestImage?: () => void
  status: 'ready' | 'degraded'
  error?: string
  warning?: string
  coordinateCorrection: GeoCoordinateCorrection
}

export interface GeoImageryLayerManager {
  readonly catalog: readonly GeoImagerySourceDefinition[]
  list(): readonly GeoImageryLayerSnapshot[]
  add(
    sourceId: GeoImagerySourceId,
    options?: AddImageryLayerOptions,
  ): Promise<GeoImageryLayerSnapshot>
  remove(id: string): boolean
  clear(): void
  setVisible(id: string, show: boolean): void
  setAlpha(id: string, alpha: number): void
  raise(id: string): void
  lower(id: string): void
  raiseToTop(id: string): void
  lowerToBottom(id: string): void
  flyTo(id: string, duration?: number): boolean
  get(id: string): GeoImageryLayerSnapshot | undefined
  getLayer(id: string): ImageryLayer | undefined
  dispose(): void
}

function clampAlpha(alpha: number): number {
  return Math.min(1, Math.max(0, alpha))
}

function normalizeId(sourceId: GeoImagerySourceId, requestedId?: string): string {
  const value = requestedId?.trim()
  return value || sourceId
}

function observeSuccessfulTileRequests(
  provider: ImageryProvider,
  onSuccess: () => void,
): () => void {
  const originalRequestImage = provider.requestImage
  let observing = true

  function observedRequestImage(
    x: number,
    y: number,
    level: number,
    request?: Request,
  ): ReturnType<ImageryProvider['requestImage']> {
    const result = originalRequestImage.call(provider, x, y, level, request)
    if (result) {
      void result.then(
        function observeSuccess() {
          if (observing) {
            onSuccess()
          }
        },
        function ignoreObservedFailure() {},
      )
    }
    return result
  }

  provider.requestImage = observedRequestImage
  return function restoreRequestImage(): void {
    observing = false
    if (provider.requestImage === observedRequestImage) {
      provider.requestImage = originalRequestImage
    }
  }
}

export function createGeoImageryLayerManager(
  viewer: Viewer,
  catalog: readonly GeoImagerySourceDefinition[] = createGeoImageryCatalog(),
  managerOptions: GeoImageryLayerManagerOptions = {},
): GeoImageryLayerManager {
  const definitions = new Map(
    catalog.map(function mapDefinition(definition) {
      return [definition.id, definition] as const
    }),
  )
  const layers = new Map<string, ManagedImageryLayer>()
  let disposed = false

  function requestRender(): void {
    if (!viewer.isDestroyed()) {
      viewer.scene.requestRender()
    }
  }

  function assertActive(signal?: AbortSignal): void {
    if (disposed) {
      throw new Error('Geo imagery layer manager has been disposed')
    }
    if (signal?.aborted) {
      throw new DOMException('Imagery loading was cancelled', 'AbortError')
    }
    if (viewer.isDestroyed()) {
      throw new Error('Geo Viewer has been destroyed')
    }
  }

  function definitionFor(sourceId: GeoImagerySourceId): GeoImagerySourceDefinition {
    const definition = definitions.get(sourceId)
    if (!definition) {
      throw new Error(`Unknown imagery source: ${sourceId}`)
    }
    return definition
  }

  function toSnapshot(id: string, managed: ManagedImageryLayer): GeoImageryLayerSnapshot {
    return {
      id,
      sourceId: managed.definition.id,
      label: managed.definition.label,
      role: managed.definition.role,
      coordinateSystem: managed.definition.coordinateSystem,
      coordinateCorrection: managed.coordinateCorrection,
      show: managed.layer.show,
      alpha: managed.layer.alpha,
      index: viewer.imageryLayers.indexOf(managed.layer),
      status: managed.status,
      error: managed.error,
      warning: managed.warning,
    }
  }

  function find(id: string): ManagedImageryLayer {
    const managed = layers.get(id)
    if (!managed) {
      throw new Error(`Imagery layer not found: ${id}`)
    }
    return managed
  }

  function list(): readonly GeoImageryLayerSnapshot[] {
    return [...layers.entries()]
      .map(function mapLayer([id, managed]) {
        return toSnapshot(id, managed)
      })
      .sort(function sortByIndex(a, b) {
        return b.index - a.index
      })
  }

  async function add(
    sourceId: GeoImagerySourceId,
    options: AddImageryLayerOptions = {},
  ): Promise<GeoImageryLayerSnapshot> {
    assertActive(options.signal)
    const definition = definitionFor(sourceId)
    const id = normalizeId(sourceId, options.id)
    if (layers.has(id)) {
      throw new Error(`Imagery layer id already exists: ${id}`)
    }
    const availability = definition.checkAvailability(options)
    if (!availability.available) {
      throw new Error(availability.reason ?? `${definition.label} is not available`)
    }

    const provider = await definition.createProvider(options)
    assertActive(options.signal)
    const layer = new ImageryLayer(provider)
    layer.show = options.show ?? true
    layer.alpha = clampAlpha(options.alpha ?? 1)

    const managed: ManagedImageryLayer = {
      snapshotId: id,
      definition,
      layer,
      status: 'ready',
      warning: availability.warning,
      coordinateCorrection: resolveCoordinateCorrection(
        definition.coordinateSystem,
        options.coordinateCorrection,
      ),
    }
    managed.removeErrorListener = provider.errorEvent.addEventListener(function onImageryError(
      error: TileProviderError,
    ) {
      managed.error = error.message || error.error?.message || 'Imagery tile request failed'
      managed.status = 'degraded'
      managerOptions.onChange?.()
    })
    managed.restoreRequestImage = observeSuccessfulTileRequests(provider, function onTileSuccess() {
      if (managed.status === 'ready' && !managed.error) {
        return
      }
      managed.status = 'ready'
      managed.error = undefined
      managerOptions.onChange?.()
    })
    layers.set(id, managed)
    try {
      viewer.imageryLayers.add(layer, options.index)
    } catch (error) {
      layers.delete(id)
      managed.removeErrorListener?.()
      managed.restoreRequestImage?.()
      throw error
    }
    requestRender()
    return toSnapshot(id, managed)
  }

  function remove(id: string): boolean {
    assertActive()
    const managed = layers.get(id)
    if (!managed) {
      return false
    }
    managed.removeErrorListener?.()
    managed.restoreRequestImage?.()
    layers.delete(id)
    const removed = viewer.imageryLayers.remove(managed.layer, true)
    requestRender()
    return removed
  }

  function clear(): void {
    ;[...layers.keys()].forEach(remove)
  }

  function setVisible(id: string, show: boolean): void {
    assertActive()
    find(id).layer.show = show
    requestRender()
  }

  function setAlpha(id: string, alpha: number): void {
    assertActive()
    find(id).layer.alpha = clampAlpha(alpha)
    requestRender()
  }

  function raise(id: string): void {
    assertActive()
    viewer.imageryLayers.raise(find(id).layer)
    requestRender()
  }

  function lower(id: string): void {
    assertActive()
    viewer.imageryLayers.lower(find(id).layer)
    requestRender()
  }

  function raiseToTop(id: string): void {
    assertActive()
    viewer.imageryLayers.raiseToTop(find(id).layer)
    requestRender()
  }

  function lowerToBottom(id: string): void {
    assertActive()
    viewer.imageryLayers.lowerToBottom(find(id).layer)
    requestRender()
  }

  function flyTo(id: string, duration = 1.4): boolean {
    assertActive()
    const managed = find(id)
    const rectangle = managed.layer.imageryProvider.rectangle
    if (!rectangle || rectangle.east <= rectangle.west || rectangle.north <= rectangle.south) {
      return false
    }
    viewer.camera.flyTo({ destination: rectangle, duration })
    return true
  }

  function get(id: string): GeoImageryLayerSnapshot | undefined {
    const managed = layers.get(id)
    return managed ? toSnapshot(id, managed) : undefined
  }

  function getLayer(id: string): ImageryLayer | undefined {
    return layers.get(id)?.layer
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    ;[...layers.entries()].forEach(function disposeLayer([id, managed]) {
      managed.removeErrorListener?.()
      managed.restoreRequestImage?.()
      viewer.imageryLayers.remove(managed.layer, true)
      layers.delete(id)
    })
    requestRender()
  }

  return {
    catalog,
    list,
    add,
    remove,
    clear,
    setVisible,
    setAlpha,
    raise,
    lower,
    raiseToTop,
    lowerToBottom,
    flyTo,
    get,
    getLayer,
    dispose,
  }
}

export function formatImageryCoverage(layer: GeoImageryLayerSnapshot): string {
  if (layer.status === 'degraded') {
    return layer.error ?? '瓦片请求异常'
  }
  return `${layer.coordinateSystem} · ${layer.role}`
}
