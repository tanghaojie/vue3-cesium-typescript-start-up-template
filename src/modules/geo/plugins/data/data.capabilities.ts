import type { Cesium3DTileset, ImageryLayer } from 'cesium'
import type { Disposable, DisposableScope } from '../../core/disposable'
import { createGeoCapabilityToken } from '../../core/capability-registry'
import type { GeoCaptureSubjects } from '../../tools/data/capture-subject'

export const geoCaptureSubjectsCapability =
  createGeoCapabilityToken<GeoCaptureSubjects>('data.captureSubjects')

export interface ImageryLayerNamesCapability {
  getName(index: number): string | undefined
}

export interface ActiveTilesetCapability {
  readonly current: Cesium3DTileset | undefined
  getCurrent(): Cesium3DTileset | undefined
  subscribe(
    listener: (tileset: Cesium3DTileset | undefined) => void,
    scope?: DisposableScope,
  ): Disposable
}

export interface ActiveTilesetCapabilityPublisher extends ActiveTilesetCapability {
  setCurrent(tileset: Cesium3DTileset | undefined): void
}

export const activeTilesetCapability =
  createGeoCapabilityToken<ActiveTilesetCapability>('data.activeTileset')

export interface GeoImageryLayerReference {
  readonly id: string
  readonly label: string
  readonly index: number
}

export interface GeoImageryLayerEntry extends GeoImageryLayerReference {
  readonly layer: ImageryLayer
}

export interface ImageryLayerCollectionCapability {
  list(): readonly GeoImageryLayerReference[]
  getLayer(id: string): ImageryLayer | undefined
  subscribe(
    listener: (layers: readonly GeoImageryLayerReference[]) => void,
    scope?: DisposableScope,
  ): Disposable
}

export interface ImageryLayerCollectionCapabilityPublisher extends ImageryLayerCollectionCapability {
  setLayers(layers: readonly GeoImageryLayerEntry[]): void
}

export const imageryLayerCollectionCapability =
  createGeoCapabilityToken<ImageryLayerCollectionCapability>('data.imageryLayers')

export function createActiveTilesetCapability(): ActiveTilesetCapabilityPublisher {
  let current: Cesium3DTileset | undefined
  const listeners = new Set<(tileset: Cesium3DTileset | undefined) => void>()

  function subscribe(
    listener: (tileset: Cesium3DTileset | undefined) => void,
    scope?: DisposableScope,
  ): Disposable {
    listeners.add(listener)
    const registration: Disposable = {
      dispose() {
        listeners.delete(listener)
      },
    }
    scope?.use(registration)
    listener(current)
    return registration
  }

  function setCurrent(tileset: Cesium3DTileset | undefined): void {
    if (current === tileset) {
      return
    }
    current = tileset
    listeners.forEach(function notify(listener) {
      listener(current)
    })
  }

  return {
    get current() {
      return current
    },
    getCurrent() {
      return current
    },
    subscribe,
    setCurrent,
  }
}

export function createImageryLayerCollectionCapability(): ImageryLayerCollectionCapabilityPublisher {
  let references: readonly GeoImageryLayerReference[] = []
  let layersById = new Map<string, ImageryLayer>()
  const listeners = new Set<(layers: readonly GeoImageryLayerReference[]) => void>()

  function subscribe(
    listener: (layers: readonly GeoImageryLayerReference[]) => void,
    scope?: DisposableScope,
  ): Disposable {
    listeners.add(listener)
    const registration: Disposable = {
      dispose() {
        listeners.delete(listener)
      },
    }
    scope?.use(registration)
    listener(references)
    return registration
  }

  function setLayers(entries: readonly GeoImageryLayerEntry[]): void {
    references = entries.map(function copyReference(entry) {
      return { id: entry.id, label: entry.label, index: entry.index }
    })
    layersById = new Map(
      entries.map(function mapLayer(entry) {
        return [entry.id, entry.layer] as const
      }),
    )
    listeners.forEach(function notify(listener) {
      listener(references)
    })
  }

  return {
    list() {
      return references
    },
    getLayer(id) {
      return layersById.get(id)
    },
    subscribe,
    setLayers,
  }
}
