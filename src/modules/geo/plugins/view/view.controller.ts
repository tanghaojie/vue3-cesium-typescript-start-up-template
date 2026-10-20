import { reactive, readonly, type DeepReadonly } from 'vue'
import type { Viewer } from 'cesium'
import {
  flyToGeoLocation,
  getGeoCameraLimits,
  getGeoCameraSnapshot,
  getGeoSceneMode,
  listGeoViewLocations,
  resetGeoCamera,
  setGeoCameraLimits,
  setGeoSceneMode,
  type GeoCameraLimits,
  type GeoCameraSnapshot,
  type GeoSceneMode,
  type GeoViewLocationId,
} from '../../tools/view/camera-view'

export interface GeoViewState {
  mode: GeoSceneMode
  camera: GeoCameraSnapshot
  limits: GeoCameraLimits
  activeLocation?: GeoViewLocationId
  error?: string
}

export interface GeoViewController {
  readonly state: DeepReadonly<GeoViewState>
  readonly locations: ReturnType<typeof listGeoViewLocations>
  flyTo(id: GeoViewLocationId): void
  reset(): void
  setMode(mode: GeoSceneMode): void
  setLimits(limits: Partial<GeoCameraLimits>): void
  refresh(): void
  dispose(): void
}

export function createGeoViewController(viewer: Viewer): GeoViewController {
  const state = reactive<GeoViewState>({
    mode: getGeoSceneMode(viewer),
    camera: getGeoCameraSnapshot(viewer),
    limits: getGeoCameraLimits(viewer),
  })
  let disposed = false

  function guard(): void {
    if (disposed) {
      throw new Error('Geo view controller has been disposed')
    }
  }

  function capture(): void {
    state.mode = getGeoSceneMode(viewer)
    state.camera = getGeoCameraSnapshot(viewer)
    state.limits = getGeoCameraLimits(viewer)
  }

  const removeCameraChanged = viewer.camera.changed.addEventListener(capture)
  const removeCameraMoveEnd = viewer.camera.moveEnd.addEventListener(capture)
  const removeMorphComplete = viewer.scene.morphComplete.addEventListener(capture)

  function flyTo(id: GeoViewLocationId): void {
    guard()
    state.error = undefined
    state.activeLocation = id
    flyToGeoLocation(viewer, id, {
      complete: capture,
      cancel: capture,
    })
  }

  function reset(): void {
    guard()
    state.error = undefined
    state.activeLocation = 'chengdu'
    resetGeoCamera(viewer)
  }

  function setMode(mode: GeoSceneMode): void {
    guard()
    try {
      setGeoSceneMode(viewer, mode)
      state.mode = mode
    } catch (error) {
      state.error = error instanceof Error ? error.message : '场景模式切换失败'
    }
  }

  function setLimits(limits: Partial<GeoCameraLimits>): void {
    guard()
    state.limits = setGeoCameraLimits(viewer, limits)
  }

  function refresh(): void {
    guard()
    capture()
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    removeCameraChanged()
    removeCameraMoveEnd()
    removeMorphComplete()
  }

  return {
    state: readonly(state),
    locations: listGeoViewLocations(),
    flyTo,
    reset,
    setMode,
    setLimits,
    refresh,
    dispose,
  }
}
