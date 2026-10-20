import { defineComponent, h } from 'vue'
import { createGeoViewController, type GeoViewController } from './view.controller'
import ViewPanel from './ViewPanel.vue'
import type { GeoPluginDefinition, GeoPluginContext } from '../../core/geo-plugin'

export interface GeoViewPluginInstance {
  readonly id: 'view'
  readonly controller: GeoViewController
  readonly panel: typeof ViewPanel
  dispose(): void
}

function panelFor(controller: GeoViewController) {
  return defineComponent({
    name: 'GeoViewPluginPanel',
    setup() {
      return () => h(ViewPanel, { controller })
    },
  })
}

export function createGeoViewPlugin(): GeoPluginDefinition {
  return {
    id: 'view',
    order: 20,
    install(context: GeoPluginContext) {
      const controller = createGeoViewController(context.viewer)
      context.scope.use(controller)
      const instance: GeoViewPluginInstance = {
        id: 'view',
        controller,
        panel: ViewPanel,
        dispose() {},
      }
      return {
        contributions: {
          groups: [{ id: 'view', label: '视图', icon: 'monitor', order: 20 }],
          tools: [
            {
              id: 'view-browser',
              kind: 'panel',
              panelId: 'view.panel',
              groupId: 'view',
              label: '视图设置',
              icon: 'monitor',
              order: 10,
            },
          ],
          panels: [
            {
              id: 'panel',
              panelId: 'view.panel',
              component: panelFor(controller),
              groupId: 'view',
            },
          ],
        },
        dispose: instance.dispose,
      }
    },
  }
}

export const geoViewPlugin: GeoPluginDefinition = createGeoViewPlugin()
