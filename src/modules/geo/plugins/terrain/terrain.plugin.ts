import { defineComponent, h } from 'vue'
import type { GeoPluginDefinition, GeoPluginContext } from '../../core/geo-plugin'
import TerrainPanel from './TerrainPanel.vue'
import { createTerrainController, type TerrainController } from './terrain.controller'

function panelFor(controller: TerrainController) {
  return defineComponent({
    name: 'TerrainPluginPanel',
    setup() {
      return () => h(TerrainPanel, { controller })
    },
  })
}

export const terrainPlugin: GeoPluginDefinition = {
  id: 'terrain',
  order: 70,
  install(context: GeoPluginContext) {
    const controller = createTerrainController(context.viewer, context.interactions)
    context.scope.use(controller)
    return {
      contributions: {
        groups: [{ id: 'terrain', label: '地形分析', labelKey: 'geo.groups.terrain', order: 70 }],
        panels: [{ id: 'panel', panelId: 'terrain.panel', component: panelFor(controller) }],
        tools: [
          {
            id: 'elevation-color',
            kind: 'action',
            groupId: 'terrain',
            label: '高程着色',
            labelKey: 'geo.tools.terrain.elevationColor',
            run: () => controller.setTerrainColorMode('elevation'),
          },
          {
            id: 'contour-color',
            kind: 'panel',
            groupId: 'terrain',
            panelId: 'terrain.panel',
            label: '等高线',
            labelKey: 'geo.tools.terrain.contourColor',
          },
          {
            id: 'clear-color',
            kind: 'action',
            groupId: 'terrain',
            label: '恢复地形颜色',
            labelKey: 'geo.tools.terrain.clearColor',
            run: () => controller.clearTerrainColorMode(),
          },
          {
            id: 'open-panel',
            kind: 'panel',
            groupId: 'terrain',
            panelId: 'terrain.panel',
            label: '地形工具',
          },
        ],
      },
      dispose() {},
    }
  },
}
