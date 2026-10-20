import { defineComponent, h } from 'vue'
import type { GeoPluginDefinition, GeoPluginContext } from '../../core/geo-plugin'
import MeasurementPanel from './MeasurementPanel.vue'
import { createMeasurementController, type MeasurementController } from './measurement.controller'

function panelFor(controller: MeasurementController) {
  return defineComponent({
    name: 'MeasurementPluginPanel',
    setup() {
      return () =>
        h(MeasurementPanel, {
          controller,
          title: '测量方式',
          distanceLabel: '距离',
          areaLabel: '面积',
          pointLabel: '点位',
          unitLabel: '显示单位',
          unitMetersLabel: '米',
          unitKilometersLabel: '千米',
          snapLabel: '贴合地形',
          startLabel: '开始测量',
          cancelLabel: '取消测量',
          clearLabel: '清除结果',
          historyLabel: '历史测量结果',
          historyEmptyLabel: '暂无历史测量结果',
          clearAllLabel: '清除全部测量',
          historyLocateLabel: '点击定位到地图位置',
          exitHintLabel: 'Esc 退出当前测量',
        })
    },
  })
}

export const measurementPlugin: GeoPluginDefinition = {
  id: 'measurement',
  order: 50,
  install(context: GeoPluginContext) {
    const controller = createMeasurementController(context.viewer, context.interactions)
    context.scope.use(controller)
    return {
      contributions: {
        groups: [
          { id: 'measurement', label: '测量', labelKey: 'geo.groups.measurement', order: 50 },
        ],
        panels: [{ id: 'panel', panelId: 'measurement.panel', component: panelFor(controller) }],
        tools: [
          {
            id: 'point',
            kind: 'action',
            groupId: 'measurement',
            label: '点位测量',
            labelKey: 'geo.tools.measurement.point',
            run: () => controller.startPoint(),
          },
          {
            id: 'distance',
            kind: 'action',
            groupId: 'measurement',
            label: '距离测量',
            labelKey: 'geo.tools.measurement.distance',
            run: () => controller.startDistance(),
          },
          {
            id: 'area',
            kind: 'action',
            groupId: 'measurement',
            label: '面积测量',
            labelKey: 'geo.tools.measurement.area',
            run: () => controller.startArea(),
          },
          {
            id: 'clear-all',
            kind: 'action',
            groupId: 'measurement',
            label: '清除测量结果',
            run: () => controller.clearAll(),
          },
          {
            id: 'open-panel',
            kind: 'panel',
            groupId: 'measurement',
            panelId: 'measurement.panel',
            label: '测量工具',
          },
        ],
      },
      dispose() {},
    }
  },
}
