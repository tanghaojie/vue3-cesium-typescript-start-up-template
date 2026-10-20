import { defineComponent, h } from 'vue'
import type { GeoPluginDefinition, GeoPluginContext } from '../../core/geo-plugin'
import ComparePanel from './ComparePanel.vue'
import { createCompareController, type CompareController } from './compare.controller'
import { imageryLayerCollectionCapability } from '../data/data.capabilities'

function panelFor(controller: CompareController) {
  return defineComponent({
    name: 'ComparePluginPanel',
    setup() {
      return () => h(ComparePanel, { controller })
    },
  })
}

export const comparePlugin: GeoPluginDefinition = {
  id: 'compare',
  order: 80,
  requires: ['data'],
  install(context: GeoPluginContext) {
    const imageryLayers = context.capabilities.require(imageryLayerCollectionCapability)
    const controller = createCompareController(context.viewer, imageryLayers)
    context.scope.use(controller)
    return {
      contributions: {
        groups: [{ id: 'compare', label: '对比', labelKey: 'geo.groups.compare', order: 80 }],
        panels: [{ id: 'panel', panelId: 'compare.panel', component: panelFor(controller) }],
        tools: [
          {
            id: 'open-panel',
            kind: 'panel',
            groupId: 'compare',
            panelId: 'compare.panel',
            label: '分屏对比',
            labelKey: 'geo.tools.compare.openPanel',
          },
          {
            id: 'disable',
            kind: 'action',
            groupId: 'compare',
            label: '关闭对比',
            labelKey: 'geo.tools.compare.disable',
            run: () => controller.disable(),
          },
        ],
      },
      dispose() {},
    }
  },
}
