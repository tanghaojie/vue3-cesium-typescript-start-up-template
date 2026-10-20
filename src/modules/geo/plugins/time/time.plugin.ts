import { defineComponent, h } from 'vue'
import type { GeoPluginDefinition, GeoPluginContext } from '../../core/geo-plugin'
import {
  geoSolarLightingCapability,
  type GeoSolarLightingCapability,
} from '../scene/scene.capabilities'
import TimeDock from './TimeDock.vue'
import { geoTimePlaybackCapability, type GeoTimePlaybackCapability } from './time.capabilities'
import { createGeoTimeController, type GeoTimeController } from './time.controller'

function dockFor(controller: GeoTimeController, solarLighting: GeoSolarLightingCapability) {
  return defineComponent({
    name: 'GeoTimePluginDock',
    props: {
      collapsed: { type: Boolean, default: false },
      joinedWithStatus: { type: Boolean, default: false },
      collapseLabel: { type: String, required: true },
      expandLabel: { type: String, required: true },
    },
    emits: ['update:collapsed'],
    setup(props, { emit }) {
      return () =>
        h(TimeDock, {
          controller,
          solarLighting,
          collapsed: props.collapsed,
          joinedWithStatus: props.joinedWithStatus,
          collapseLabel: props.collapseLabel,
          expandLabel: props.expandLabel,
          'onUpdate:collapsed': function updateCollapsed(collapsed: boolean) {
            emit('update:collapsed', collapsed)
          },
        })
    },
  })
}

export function createGeoTimePlugin(): GeoPluginDefinition {
  return {
    id: 'time',
    order: 35,
    requires: ['scene'],
    install(context: GeoPluginContext) {
      const controller = createGeoTimeController(context.viewer)
      context.scope.use(controller)
      const playback: GeoTimePlaybackCapability = {
        setPlaying: controller.setPlaying,
      }
      context.capabilities.provide(geoTimePlaybackCapability, playback, context.scope)
      const solarLighting = context.capabilities.require(geoSolarLightingCapability)
      return {
        contributions: {
          bottomDocks: [
            {
              id: 'timeline',
              labelKey: 'geo.time.timeline',
              component: dockFor(controller, solarLighting),
              order: 10,
            },
          ],
        },
        dispose() {},
      }
    },
  }
}

export const geoTimePlugin: GeoPluginDefinition = createGeoTimePlugin()
