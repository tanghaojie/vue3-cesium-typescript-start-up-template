import { defineComponent, h } from 'vue'
import type { GeoPluginDefinition, GeoPluginContext } from '../../core/geo-plugin'
import DrawingPanel from './DrawingPanel.vue'
import { createDrawingController, type DrawingController } from './drawing.controller'

function panelFor(controller: DrawingController) {
  return defineComponent({
    name: 'DrawingPluginPanel',
    setup() {
      return () => h(DrawingPanel, { controller })
    },
  })
}

export const drawingPlugin: GeoPluginDefinition = {
  id: 'drawing',
  order: 40,
  install(context: GeoPluginContext) {
    const controller = createDrawingController(context.viewer, context.interactions)
    context.scope.use(controller)
    return {
      contributions: {
        groups: [{ id: 'drawing', label: '标绘', labelKey: 'geo.groups.drawing', order: 40 }],
        panels: [{ id: 'panel', panelId: 'drawing.panel', component: panelFor(controller) }],
        tools: [
          {
            id: 'point',
            kind: 'action',
            groupId: 'drawing',
            label: '点标绘',
            labelKey: 'geo.tools.drawing.point',
            run: () => controller.startPoint(),
          },
          {
            id: 'polyline',
            kind: 'action',
            groupId: 'drawing',
            label: '线标绘',
            labelKey: 'geo.tools.drawing.polyline',
            run: () => controller.startPolyline(),
          },
          {
            id: 'polygon',
            kind: 'action',
            groupId: 'drawing',
            label: '面标绘',
            labelKey: 'geo.tools.drawing.polygon',
            run: () => controller.startPolygon(),
          },
          {
            id: 'clear-all',
            kind: 'action',
            groupId: 'drawing',
            label: '清除全部标绘',
            run: () => controller.clearAll(),
          },
          {
            id: 'open-panel',
            kind: 'panel',
            groupId: 'drawing',
            panelId: 'drawing.panel',
            label: '标绘工具',
          },
        ],
      },
      dispose() {},
    }
  },
}
