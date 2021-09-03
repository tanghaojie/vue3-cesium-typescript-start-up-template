import { Group } from '../../../Types'
import store from '@/store'
import {
  ClickHandlerOption,
  OnMountedOption,
} from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import { DrawActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/draw/action-types'
import Draw from '@/libs/cesium/libs/draw/Draw'
import type { DrawUserCallBackOption } from '@/libs/cesium/libs/draw/Draw'

const view: Group = {
  name: '绘制(左键开始，右键结束)',
  items: [
    {
      name: '画点',
      icon: 'point',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (
          !option ||
          !option.viewer ||
          store.state.jtCesiumVue.toolbar.draw.drawPointActive
        ) {
          return
        }

        const { viewer } = option
        if (!viewer.jtDraw) {
          viewer.jtDraw = new Draw(viewer)
        }
        const { jtDraw } = viewer
        const cb: DrawUserCallBackOption = {
          started: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/draw/${DrawActionTypes.SET_DRAW_POINT_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/draw/${DrawActionTypes.SET_DRAW_POINT_ACTIVE}`,
              false
            )
          },
        }
        jtDraw.drawPoint(cb)
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.draw.drawPointActive
      },
    },
    {
      name: '画线',
      icon: 'line',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (
          !option ||
          !option.viewer ||
          store.state.jtCesiumVue.toolbar.draw.drawPolylineActive
        ) {
          return
        }

        const { viewer } = option
        if (!viewer.jtDraw) {
          viewer.jtDraw = new Draw(viewer)
        }
        const { jtDraw } = viewer
        const cb: DrawUserCallBackOption = {
          started: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/draw/${DrawActionTypes.SET_DRAW_POLYLINE_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/draw/${DrawActionTypes.SET_DRAW_POLYLINE_ACTIVE}`,
              false
            )
          },
        }
        jtDraw.drawPolyline(cb)
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.draw.drawPolylineActive
      },
    },
    {
      name: '画面',
      icon: 'polygon',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (
          !option ||
          !option.viewer ||
          store.state.jtCesiumVue.toolbar.draw.drawPolygonActive
        ) {
          return
        }

        const { viewer } = option
        if (!viewer.jtDraw) {
          viewer.jtDraw = new Draw(viewer)
        }
        const { jtDraw } = viewer
        const cb: DrawUserCallBackOption = {
          started: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/draw/${DrawActionTypes.SET_DRAW_POLYGON_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/draw/${DrawActionTypes.SET_DRAW_POLYGON_ACTIVE}`,
              false
            )
          },
        }
        jtDraw.drawPolygon(cb)
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.draw.drawPolygonActive
      },
    },
    {
      name: '移除',
      icon: 'delete',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (!option || !option.viewer) {
          return
        }
        const { viewer } = option
        if (!viewer.jtDraw) {
          viewer.jtDraw = new Draw(viewer)
        }
        const { jtDraw } = viewer
        jtDraw.removeAllDrawed()
      },
    },
  ],
}

export default view
