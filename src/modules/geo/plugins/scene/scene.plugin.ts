import { defineComponent, h } from 'vue'
import ScenePanel from './ScenePanel.vue'
import {
  geoModelRenderingCapability,
  geoSolarLightingCapability,
  geoRenderQualityCapability,
  type GeoSolarLightingCapability,
} from './scene.capabilities'
import { createGeoSceneController, type GeoSceneController } from './scene.controller'
import type { GeoPluginDefinition, GeoPluginContext } from '../../core/geo-plugin'
import { createGeoModelRenderingManager } from '../../tools/scene/model-rendering'

export interface GeoScenePluginInstance {
  readonly id: 'scene'
  readonly controller: GeoSceneController
  readonly panel: typeof ScenePanel
  dispose(): void
}

function panelFor(controller: GeoSceneController) {
  return defineComponent({
    name: 'GeoScenePluginPanel',
    setup() {
      return () => h(ScenePanel, { controller })
    },
  })
}

export function createGeoScenePlugin(): GeoPluginDefinition {
  return {
    id: 'scene',
    order: 30,
    install(context: GeoPluginContext) {
      const modelRendering = createGeoModelRenderingManager(context.viewer)
      context.scope.use(modelRendering)
      const controller = createGeoSceneController(context.viewer, modelRendering)
      context.scope.use(controller)
      const solarLighting: GeoSolarLightingCapability = {
        state: controller.state,
        setLighting(enabled: boolean) {
          controller.set({ lighting: enabled })
        },
        setShadows(enabled: boolean) {
          controller.set({ shadows: enabled })
        },
      }
      context.capabilities.provide(geoSolarLightingCapability, solarLighting, context.scope)
      context.capabilities.provide(geoModelRenderingCapability, modelRendering, context.scope)
      context.capabilities.provide(
        geoRenderQualityCapability,
        {
          state: controller.state,
          setMode: controller.setRenderMode,
          acquireFixedResolution: controller.acquireFixedResolution,
        },
        context.scope,
      )
      const instance: GeoScenePluginInstance = {
        id: 'scene',
        controller,
        panel: ScenePanel,
        dispose() {},
      }
      return {
        contributions: {
          groups: [{ id: 'scene', label: '场景', icon: 'layers', order: 30 }],
          tools: [
            {
              id: 'scene-browser',
              kind: 'panel',
              panelId: 'scene.panel',
              groupId: 'scene',
              label: '场景环境',
              icon: 'layers',
              order: 10,
            },
          ],
          panels: [
            {
              id: 'panel',
              panelId: 'scene.panel',
              component: panelFor(controller),
              groupId: 'scene',
            },
          ],
        },
        dispose: instance.dispose,
      }
    },
  }
}

export const geoScenePlugin: GeoPluginDefinition = createGeoScenePlugin()
