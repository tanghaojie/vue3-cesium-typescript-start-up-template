import { createGeoCapabilityToken } from '../../core/capability-registry'
import type { GeoModelRenderingManager } from '../../tools/scene/model-rendering'
import type { GeoRenderMode } from '../../core/render-performance'

export interface GeoRenderQualityCapability {
  acquireFixedResolution(): { dispose(): void }
  readonly state: { readonly renderMode: GeoRenderMode }
  setMode(mode: GeoRenderMode): void
}

export const geoRenderQualityCapability =
  createGeoCapabilityToken<GeoRenderQualityCapability>('scene.renderQuality')

export interface GeoSolarLightingState {
  readonly lighting: boolean
  readonly shadows: boolean
}

export interface GeoSolarLightingCapability {
  readonly state: GeoSolarLightingState
  setLighting(enabled: boolean): void
  setShadows(enabled: boolean): void
}

export const geoSolarLightingCapability =
  createGeoCapabilityToken<GeoSolarLightingCapability>('scene.solarLighting')

export const geoModelRenderingCapability =
  createGeoCapabilityToken<GeoModelRenderingManager>('scene.modelRendering')
