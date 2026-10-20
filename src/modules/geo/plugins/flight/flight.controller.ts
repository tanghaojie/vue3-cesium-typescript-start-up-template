import { reactive, readonly, type DeepReadonly } from 'vue'
import type { SimulatedFlightLayer } from '../../tools/flight/simulated-flight-layer'
import type { GeoTimePlaybackCapability } from '../time/time.capabilities'

export interface GeoFlightState {
  enabled: boolean
  aircraftCount: number
  routesVisible: boolean
}

export interface GeoFlightController {
  readonly state: DeepReadonly<GeoFlightState>
  setEnabled(enabled: boolean): void
  setRoutesVisible(visible: boolean): void
  reset(): void
  dispose(): void
}

export function createGeoFlightController(
  layer: SimulatedFlightLayer,
  playback: GeoTimePlaybackCapability,
): GeoFlightController {
  const state = reactive<GeoFlightState>({
    enabled: false,
    aircraftCount: 0,
    routesVisible: true,
  })
  let disposed = false

  function setEnabled(enabled: boolean): void {
    if (disposed || state.enabled === enabled) {
      return
    }
    state.enabled = enabled
    state.aircraftCount = enabled ? layer.show() : 0
    if (enabled) {
      layer.flyToAllRoutes()
      playback.setPlaying(true)
    } else {
      layer.clear()
    }
  }

  function setRoutesVisible(visible: boolean): void {
    if (disposed || state.routesVisible === visible) {
      return
    }
    state.routesVisible = visible
    layer.setRoutesVisible(visible)
  }

  function reset(): void {
    if (!disposed && state.enabled) {
      state.aircraftCount = layer.show()
    }
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    layer.dispose()
    state.enabled = false
    state.aircraftCount = 0
    disposed = true
  }

  return {
    state: readonly(state),
    setEnabled,
    setRoutesVisible,
    reset,
    dispose,
  }
}
