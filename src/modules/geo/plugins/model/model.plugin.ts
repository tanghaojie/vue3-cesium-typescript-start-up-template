import { defineComponent, h } from 'vue'
import type { GeoPluginDefinition, GeoPluginContext } from '../../core/geo-plugin'
import ModelPanel from './ModelPanel.vue'
import ModelInspector from './ModelInspector.vue'
import { activeTilesetCapability } from '../data/data.capabilities'
import { createModelController, type ModelController } from './model.controller'

function panelFor(controller: ModelController) {
  return defineComponent({
    name: 'ModelPluginPanel',
    setup() {
      return () => h(ModelPanel, { controller })
    },
  })
}

function inspectorFor(controller: ModelController) {
  return defineComponent({
    name: 'ModelFeatureInspector',
    setup() {
      return () => h(ModelInspector, { controller })
    },
  })
}

export const modelPlugin: GeoPluginDefinition = {
  id: 'model',
  order: 60,
  requires: ['data'],
  install(context: GeoPluginContext) {
    const controller = createModelController(context.viewer, context.interactions)
    context.scope.use(controller)
    const activeTileset = context.capabilities.require(activeTilesetCapability)
    activeTileset.subscribe(controller.attachTileset, context.scope)
    return {
      contributions: {
        groups: [{ id: 'model', label: '三维模型', labelKey: 'geo.groups.model', order: 60 }],
        panels: [{ id: 'panel', panelId: 'model.panel', component: panelFor(controller) }],
        inspectors: [
          {
            id: 'feature-inspector',
            label: '模型属性',
            component: inspectorFor(controller),
            matches(object: unknown) {
              const selected = controller.state.selected
              return Boolean(
                selected &&
                (object === undefined || object === selected || object === selected.feature),
              )
            },
          },
        ],
        tools: [
          {
            id: 'highlight',
            kind: 'action',
            groupId: 'model',
            label: '3D Tiles 高亮',
            labelKey: 'geo.tools.model.highlight',
            isAvailable: () => controller.state.hasTileset,
            run: () => controller.startHighlight(),
          },
          {
            id: 'classify',
            kind: 'action',
            groupId: 'model',
            label: '点击分类',
            labelKey: 'geo.tools.model.classify',
            isAvailable: () => controller.state.hasTileset,
            run: () => controller.startClassification(),
          },
          {
            id: 'clear',
            kind: 'action',
            groupId: 'model',
            label: '恢复模型',
            run: () => controller.clear(),
          },
          {
            id: 'open-panel',
            kind: 'panel',
            groupId: 'model',
            panelId: 'model.panel',
            label: '模型工具',
          },
        ],
      },
      dispose() {},
    }
  },
}
