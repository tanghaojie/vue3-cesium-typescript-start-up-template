import { defineComponent, h } from 'vue'
import type { GeoPluginDefinition, GeoPluginContext } from '../../core/geo-plugin'
import { createSimulatedFlightLayer } from '../../tools/flight/simulated-flight-layer'
import FlightPanel from './FlightPanel.vue'
import { createGeoFlightController, type GeoFlightController } from './flight.controller'
import { geoTimePlaybackCapability } from '../time/time.capabilities'

function panelFor(controller: GeoFlightController) {
  return defineComponent({
    name: 'GeoFlightPluginPanel',
    setup() {
      return () => h(FlightPanel, { controller })
    },
  })
}

export const geoFlightPlugin: GeoPluginDefinition = {
  id: 'flight',
  order: 38,
  requires: ['time'],
  async install(context: GeoPluginContext) {
    const layer = await createSimulatedFlightLayer(context.viewer)
    if (context.signal.aborted) {
      layer.dispose()
      throw new DOMException('Geo flight plugin installation was aborted', 'AbortError')
    }

    const playback = context.capabilities.require(geoTimePlaybackCapability)
    const controller = createGeoFlightController(layer, playback)
    context.scope.use(controller)
    return {
      contributions: {
        groups: [
          {
            id: 'flight',
            label: '模拟航班',
            labelKey: 'geo.tasks.flight',
            icon: 'activity',
            order: 38,
          },
        ],
        tools: [
          {
            id: 'open-panel',
            kind: 'panel',
            groupId: 'flight',
            panelId: 'flight.panel',
            label: '模拟航班',
            labelKey: 'geo.flight.title',
            icon: 'activity',
          },
        ],
        panels: [
          {
            id: 'panel',
            panelId: 'flight.panel',
            component: panelFor(controller),
            groupId: 'flight',
          },
        ],
      },
      dispose() {},
    }
  },
}
