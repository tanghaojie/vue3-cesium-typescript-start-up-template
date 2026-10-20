import { defineComponent, h } from 'vue'
import type { GeoPluginDefinition } from '../../core/geo-plugin'
import { geoWorkspacePresentationCapability } from '../../core/workspace-presentation'
import { geoCaptureSubjectsCapability } from '../data/data.capabilities'
import { geoRenderQualityCapability } from '../scene/scene.capabilities'
import { createCaptureController } from './capture.controller'
import CapturePanel from './CapturePanel.vue'
import CaptureOverlay from './CaptureOverlay.vue'

export const geoCapturePlugin: GeoPluginDefinition = {
  id: 'capture',
  order: 40,
  requires: ['data', 'scene'],
  install(context) {
    const controller = createCaptureController(
      context.viewer,
      context.capabilities.require(geoCaptureSubjectsCapability),
      context.capabilities.require(geoRenderQualityCapability),
      context.capabilities.require(geoWorkspacePresentationCapability),
      context.interactions,
    )
    context.scope.use(controller)
    return {
      contributions: {
        groups: [{ id: 'capture', label: '拍摄', icon: 'monitor', order: 40 }],
        tools: [
          {
            id: 'director',
            kind: 'panel',
            panelId: 'capture.panel',
            groupId: 'capture',
            label: '拍摄',
            icon: 'monitor',
          },
        ],
        panels: [
          {
            id: 'panel',
            panelId: 'capture.panel',
            component: defineComponent({
              name: 'CapturePluginPanel',
              setup: () => () => h(CapturePanel, { controller }),
            }),
          },
        ],
        overlays: [
          {
            id: 'transport',
            component: defineComponent({
              name: 'CapturePluginOverlay',
              setup: () => () => h(CaptureOverlay, { controller }),
            }),
          },
        ],
      },
      dispose() {},
    }
  },
}
