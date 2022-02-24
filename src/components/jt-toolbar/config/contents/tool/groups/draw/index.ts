import { Group, ClickHandlerOption, ActiveOption } from '../../../Types'
import { DrawActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/draw/action-types'
import type { DrawUserCallBackOption } from '@/libs/cesium/libs/draw/Draw'

const view: Group = {
  name: '绘制(左键开始，右键结束)',
  items: [
    {
      name: '画点',
      icon: 'point',
      clickHandler: (option: ClickHandlerOption): void => {
        if (
          !option ||
          !option.viewer ||
          !option.viewer.jt ||
          option.store.state.jtCesiumVue.toolbar.draw.drawPointActive
        ) {
          return
        }
        const cb: DrawUserCallBackOption = {
          started: () => {
            option.store.dispatch(
              `jtCesiumVue/toolbar/draw/${DrawActionTypes.SET_DRAW_POINT_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            option.store.dispatch(
              `jtCesiumVue/toolbar/draw/${DrawActionTypes.SET_DRAW_POINT_ACTIVE}`,
              false
            )
          },
        }
        option.viewer.jt.draw.drawPoint(cb)
      },
      active: (option: ActiveOption): boolean => {
        return option.store.state.jtCesiumVue.toolbar.draw.drawPointActive
      },
    },
    {
      name: '画线',
      icon: 'line',
      clickHandler: (option: ClickHandlerOption): void => {
        if (
          !option ||
          !option.viewer ||
          !option.viewer.jt ||
          option.store.state.jtCesiumVue.toolbar.draw.drawPolylineActive
        ) {
          return
        }
        const cb: DrawUserCallBackOption = {
          started: () => {
            option.store.dispatch(
              `jtCesiumVue/toolbar/draw/${DrawActionTypes.SET_DRAW_POLYLINE_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            option.store.dispatch(
              `jtCesiumVue/toolbar/draw/${DrawActionTypes.SET_DRAW_POLYLINE_ACTIVE}`,
              false
            )
          },
        }
        option.viewer.jt.draw.drawPolyline(cb)
      },
      active: (option: ActiveOption): boolean => {
        return option.store.state.jtCesiumVue.toolbar.draw.drawPolylineActive
      },
    },
    {
      name: '画面',
      icon: 'polygon',
      clickHandler: (option: ClickHandlerOption): void => {
        if (
          !option ||
          !option.viewer ||
          !option.viewer.jt ||
          option.store.state.jtCesiumVue.toolbar.draw.drawPolygonActive
        ) {
          return
        }
        const cb: DrawUserCallBackOption = {
          started: () => {
            option.store.dispatch(
              `jtCesiumVue/toolbar/draw/${DrawActionTypes.SET_DRAW_POLYGON_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            option.store.dispatch(
              `jtCesiumVue/toolbar/draw/${DrawActionTypes.SET_DRAW_POLYGON_ACTIVE}`,
              false
            )
          },
        }
        option.viewer.jt.draw.drawPolygon(cb)
      },
      active: (option: ActiveOption): boolean => {
        return option.store.state.jtCesiumVue.toolbar.draw.drawPolygonActive
      },
    },
    {
      name: '移除',
      icon: 'delete',
      clickHandler: (option: ClickHandlerOption): void => {
        if (!option || !option.viewer || !option.viewer.jt) {
          return
        }
        option.viewer.jt.draw.removeAllDrawed()
      },
    },
  ],
}

export default view
