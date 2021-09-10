import { Group } from '../../../Types'
import store from '@/store'
import {
  ClickHandlerOption,
  OnMountedOption,
} from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import { MeasureActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/measure/action-types'
import type { MeasureUserCallBackOption } from '@/libs/cesium/libs/measure/Measure'

const view: Group = {
  name: '测量',
  items: [
    {
      name: '点',
      icon: 'ruler-point',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (
          !option ||
          !option.viewer ||
          !option.viewer.jt ||
          store.state.jtCesiumVue.toolbar.measure.measurePointActive
        ) {
          return
        }

        const cb: MeasureUserCallBackOption = {
          started: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/measure/${MeasureActionTypes.SET_MEASURE_POINT_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/measure/${MeasureActionTypes.SET_MEASURE_POINT_ACTIVE}`,
              false
            )
          },
        }
        option.viewer.jt.measure.measurePoint(cb)
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.measure.measurePointActive
      },
    },
    {
      name: '线',
      icon: 'ruler-line',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (
          !option ||
          !option.viewer ||
          !option.viewer.jt ||
          store.state.jtCesiumVue.toolbar.measure.measurePolylineActive
        ) {
          return
        }

        const cb: MeasureUserCallBackOption = {
          started: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/measure/${MeasureActionTypes.SET_MEASURE_POLYLINE_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/measure/${MeasureActionTypes.SET_MEASURE_POLYLINE_ACTIVE}`,
              false
            )
          },
        }
        option.viewer.jt.measure.measurePolyline(cb)
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.measure.measurePolylineActive
      },
    },
    {
      name: '面',
      icon: 'polygon2',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (
          !option ||
          !option.viewer ||
          !option.viewer.jt ||
          store.state.jtCesiumVue.toolbar.measure.measurePolygonActive
        ) {
          return
        }
        const cb: MeasureUserCallBackOption = {
          started: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/measure/${MeasureActionTypes.SET_MEASURE_POLYGON_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/measure/${MeasureActionTypes.SET_MEASURE_POLYGON_ACTIVE}`,
              false
            )
          },
        }
        option.viewer.jt.measure.measurePolygon(cb)
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.measure.measurePolygonActive
      },
    },
    {
      name: '移除',
      icon: 'delete',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (!option || !option.viewer || !option.viewer.jt) {
          return
        }
        option.viewer.jt.measure.removeAllMeasured()
      },
    },
  ],
}

export default view
