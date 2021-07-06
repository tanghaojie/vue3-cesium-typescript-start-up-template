import { Group } from '../../../Types'
import store from '@/store'
import {
  drawPoint,
  drawShape,
  DrawMode,
  removeDrawed,
} from '@/libs/cesium/libs/draw'
import type { DrawPointOption, DrawShapeOption } from '@/libs/cesium/libs/draw'
import {
  ClickHandlerOption,
  OnMountedOption,
} from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'

const view: Group = {
  name: '绘制(左键开始，右键结束)',
  items: [
    {
      name: '画点',
      icon: 'point',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (!option) {
          return
        }
        const { viewer } = option
        if (!viewer) {
          return
        }
        if (store.state.jtCesiumVue.toolbar.draw.drawPointActive) {
          return
        }
        drawPoint({
          viewer,
          started: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_DRAW_POINT_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_DRAW_POINT_ACTIVE}`,
              false
            )
          },
        })
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.draw.drawPointActive
      },
    },
    {
      name: '画线',
      icon: 'line',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (!option) {
          return
        }
        const { viewer } = option
        if (!viewer) {
          return
        }
        if (store.state.jtCesiumVue.toolbar.draw.drawPolylineActive) {
          return
        }
        drawShape({
          viewer,
          drawMode: DrawMode.Polyline,
          started: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_DRAW_POLYLINE_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_DRAW_POLYLINE_ACTIVE}`,
              false
            )
          },
        })
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.draw.drawPolylineActive
      },
    },
    {
      name: '画面',
      icon: 'polygon',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (!option) {
          return
        }
        const { viewer } = option
        if (!viewer) {
          return
        }
        if (store.state.jtCesiumVue.toolbar.draw.drawPolygonActive) {
          return
        }
        drawShape({
          viewer,
          drawMode: DrawMode.Polygon,
          started: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_DRAW_POLYGON_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_DRAW_POLYGON_ACTIVE}`,
              false
            )
          },
        })
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.draw.drawPolygonActive
      },
    },
    {
      name: '移除',
      icon: 'delete',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (!option) {
          return
        }
        const { viewer } = option
        if (!viewer) {
          return
        }
        removeDrawed(viewer)
      },
    },
  ],
}

export default view
