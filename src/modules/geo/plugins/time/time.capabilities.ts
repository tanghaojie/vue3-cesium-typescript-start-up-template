import { createGeoCapabilityToken } from '../../core/capability-registry'

export interface GeoTimePlaybackCapability {
  setPlaying(playing: boolean): void
}

export const geoTimePlaybackCapability =
  createGeoCapabilityToken<GeoTimePlaybackCapability>('time.playback')
