import { defineComponent, h } from 'vue'
import DataPanel from './DataPanel.vue'
import ExternalDataPanel from './ExternalDataPanel.vue'
import ModelCoordinateDialog from './ModelCoordinateDialog.vue'
import type { GeoPluginDefinition, GeoPluginContext } from '../../core/geo-plugin'
import {
  activeTilesetCapability,
  createActiveTilesetCapability,
  createImageryLayerCollectionCapability,
  imageryLayerCollectionCapability,
  geoCaptureSubjectsCapability,
} from './data.capabilities'
import { geoModelRenderingCapability } from '../scene/scene.capabilities'
import {
  createGeoDataController,
  type GeoDataController,
  type GeoDataControllerOptions,
} from './data.controller'
import {
  DEFAULT_GEO_TILESET_ID,
  DEFAULT_GEO_TILESET_LABEL,
  DEFAULT_GEO_TILESET_MAX_CAMERA_HEIGHT,
  DEFAULT_GEO_TILESET_URL,
} from '../../tools/data/data-presets'

export interface GeoDataPluginInstance {
  readonly id: 'data'
  readonly controller: GeoDataController
  readonly panel: typeof DataPanel
  dispose(): void
}

function panelFor(controller: GeoDataController, external = false) {
  return defineComponent({
    name: external ? 'GeoExternalDataPluginPanel' : 'GeoDataPluginPanel',
    setup() {
      return () => h(external ? ExternalDataPanel : DataPanel, { controller })
    },
  })
}

async function loadDefaultTileset(controller: GeoDataController): Promise<void> {
  await controller.loadTileset({
    id: DEFAULT_GEO_TILESET_ID,
    label: DEFAULT_GEO_TILESET_LABEL,
    url: DEFAULT_GEO_TILESET_URL,
    visualStyle: 'cyber-scan',
    maximumVisibleCameraHeight: DEFAULT_GEO_TILESET_MAX_CAMERA_HEIGHT,
  })
}

export function createGeoDataPlugin(options: GeoDataControllerOptions = {}): GeoPluginDefinition {
  const pluginOptions: GeoDataControllerOptions = {
    ...options,
    aiModelCatalogUrl: options.aiModelCatalogUrl ?? import.meta.env.VITE_GEO_AI_MODELS_CATALOG_URL,
    coordinateCorrection: options.coordinateCorrection ?? 'auto',
    tiandituToken:
      options.tiandituToken ?? (import.meta.env.VITE_GEO_TIANDITU_TOKEN as string | undefined),
  }
  return {
    id: 'data',
    order: 10,
    requires: ['scene'],
    async install(context: GeoPluginContext) {
      const activeTileset = createActiveTilesetCapability()
      const imageryLayers = createImageryLayerCollectionCapability()
      context.capabilities.provide(activeTilesetCapability, activeTileset, context.scope)
      context.capabilities.provide(imageryLayerCollectionCapability, imageryLayers, context.scope)
      const controller = createGeoDataController(context.viewer, {
        ...pluginOptions,
        modelRendering: context.capabilities.require(geoModelRenderingCapability),
        signal: context.signal,
        onActiveTilesetChange: activeTileset.setCurrent,
        onImageryLayersChange: imageryLayers.setLayers,
      })
      context.scope.use(controller)
      context.capabilities.provide(
        geoCaptureSubjectsCapability,
        controller.captureSubjects,
        context.scope,
      )
      if (!context.signal.aborted && !context.viewer.isDestroyed()) {
        await controller.addImagery('google-hybrid')
      }
      if (!context.signal.aborted && !context.viewer.isDestroyed()) {
        void loadDefaultTileset(controller)
      }
      const instance: GeoDataPluginInstance = {
        id: 'data',
        controller,
        panel: DataPanel,
        dispose() {},
      }
      return {
        contributions: {
          overlays: [
            {
              id: 'model-coordinates',
              component: defineComponent({
                name: 'GeoModelCoordinateOverlay',
                setup() {
                  return () => h(ModelCoordinateDialog, { controller })
                },
              }),
            },
          ],
          groups: [
            { id: 'data', label: '数据', icon: 'database', order: 10 },
            { id: 'external-data', label: '外部数据', icon: 'link', order: 15 },
          ],
          tools: [
            {
              id: 'external-data-browser',
              kind: 'panel',
              panelId: 'data.external-panel',
              groupId: 'external-data',
              label: '外部数据',
              icon: 'link',
              order: 15,
            },
            {
              id: 'data-browser',
              kind: 'panel',
              panelId: 'data.panel',
              groupId: 'data',
              label: '数据浏览器',
              icon: 'database',
              order: 10,
            },
          ],
          panels: [
            {
              id: 'external-panel',
              panelId: 'data.external-panel',
              component: panelFor(controller, true),
              groupId: 'external-data',
            },
            {
              id: 'panel',
              panelId: 'data.panel',
              component: panelFor(controller),
              groupId: 'data',
            },
          ],
        },
        dispose: instance.dispose,
      }
    },
  }
}

export const geoDataPlugin: GeoPluginDefinition = createGeoDataPlugin()
