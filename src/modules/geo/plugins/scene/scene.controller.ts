import { reactive, readonly, type DeepReadonly } from 'vue'
import type { Viewer } from 'cesium'
import type { GeoRenderMode } from '../../core/render-performance'
import type { GeoModelRenderingManager } from '../../tools/scene/model-rendering'
import { createGeoRenderQuality } from '../../tools/scene/render-quality'
import {
  getGeoSceneSettings,
  setGeoSceneSettings,
  type GeoSceneSettings,
  type GeoSceneSettingsPatch,
} from '../../tools/scene/scene-settings'

export interface GeoSceneController {
  acquireFixedResolution(): { dispose(): void }
  readonly state: DeepReadonly<GeoSceneSettings & { renderMode: GeoRenderMode }>
  setRenderMode(mode: GeoRenderMode): void
  set(patch: GeoSceneSettingsPatch): void
  toggle(key: keyof GeoSceneSettings): void
  refresh(): void
  dispose(): void
}

export function createGeoSceneController(
  viewer: Viewer,
  models: GeoModelRenderingManager,
): GeoSceneController {
  const quality = createGeoRenderQuality(viewer, models)
  const state = reactive<GeoSceneSettings & { renderMode: GeoRenderMode }>({
    ...getGeoSceneSettings(viewer),
    renderMode: 'balanced',
  })
  let disposed = false

  function guard(): void {
    if (disposed) {
      throw new Error('Geo scene controller has been disposed')
    }
  }

  function update(patch: GeoSceneSettingsPatch): void {
    guard()
    Object.assign(state, setGeoSceneSettings(viewer, patch))
  }

  function set(patch: GeoSceneSettingsPatch): void {
    update(patch)
  }

  function toggle(key: keyof GeoSceneSettings): void {
    if (typeof state[key] !== 'boolean') {
      return
    }
    update({ [key]: !state[key] })
  }

  function refresh(): void {
    guard()
    Object.assign(state, getGeoSceneSettings(viewer))
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    quality.dispose()
  }

  return {
    acquireFixedResolution: quality.acquireFixedResolution,
    state: readonly(state),
    setRenderMode(mode) {
      guard()
      quality.setMode(mode)
      state.renderMode = mode
      refresh()
    },
    set,
    toggle,
    refresh,
    dispose,
  }
}
