import { Group, ClickHandlerOption, ActiveOption, T } from '../../../Types'
import { MeasureActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/measure/action-types'
import type { MeasureUserCallBackOption } from '@/libs/cesium/libs/measure/Measure'

const view: Group = {
  name: (t: T): string => {
    return t('toolbar.tool.measure', '测量')
  },
  items: [
    {
      name: (t: T): string => {
        return t('toolbar.tool.measurePoint', '点')
      },
      icon: 'ruler-point',
      clickHandler: (option: ClickHandlerOption): void => {
        if (
          !option ||
          !option.viewer ||
          !option.viewer.jt ||
          option.store.state.jtCesiumVue.toolbar.measure.measurePointActive
        ) {
          return
        }

        const cb: MeasureUserCallBackOption = {
          started: () => {
            option.store.dispatch(
              `jtCesiumVue/toolbar/measure/${MeasureActionTypes.SET_MEASURE_POINT_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            option.store.dispatch(
              `jtCesiumVue/toolbar/measure/${MeasureActionTypes.SET_MEASURE_POINT_ACTIVE}`,
              false
            )
          },
        }
        option.viewer.jt.measure.measurePoint(cb)
      },
      active: (option: ActiveOption): boolean => {
        return option.store.state.jtCesiumVue.toolbar.measure.measurePointActive
      },
    },
    {
      name: (t: T): string => {
        return t('toolbar.tool.measureLine', '线')
      },
      icon: 'ruler-line',
      clickHandler: (option: ClickHandlerOption): void => {
        if (
          !option ||
          !option.viewer ||
          !option.viewer.jt ||
          option.store.state.jtCesiumVue.toolbar.measure.measurePolylineActive
        ) {
          return
        }

        const cb: MeasureUserCallBackOption = {
          started: () => {
            option.store.dispatch(
              `jtCesiumVue/toolbar/measure/${MeasureActionTypes.SET_MEASURE_POLYLINE_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            option.store.dispatch(
              `jtCesiumVue/toolbar/measure/${MeasureActionTypes.SET_MEASURE_POLYLINE_ACTIVE}`,
              false
            )
          },
        }
        option.viewer.jt.measure.measurePolyline(cb)
      },
      active: (option: ActiveOption): boolean => {
        return option.store.state.jtCesiumVue.toolbar.measure
          .measurePolylineActive
      },
    },
    {
      name: (t: T): string => {
        return t('toolbar.tool.measurePolygon', '面')
      },
      icon: 'polygon2',
      clickHandler: (option: ClickHandlerOption): void => {
        if (
          !option ||
          !option.viewer ||
          !option.viewer.jt ||
          option.store.state.jtCesiumVue.toolbar.measure.measurePolygonActive
        ) {
          return
        }
        const cb: MeasureUserCallBackOption = {
          started: () => {
            option.store.dispatch(
              `jtCesiumVue/toolbar/measure/${MeasureActionTypes.SET_MEASURE_POLYGON_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            option.store.dispatch(
              `jtCesiumVue/toolbar/measure/${MeasureActionTypes.SET_MEASURE_POLYGON_ACTIVE}`,
              false
            )
          },
        }
        option.viewer.jt.measure.measurePolygon(cb)
      },
      active: (option: ActiveOption): boolean => {
        return option.store.state.jtCesiumVue.toolbar.measure
          .measurePolygonActive
      },
    },
    {
      name: (t: T): string => {
        return t('toolbar.tool.removeMeasure', '移除')
      },
      icon: 'delete',
      clickHandler: (option: ClickHandlerOption): void => {
        if (!option || !option.viewer || !option.viewer.jt) {
          return
        }
        option.viewer.jt.measure.removeAllMeasured()
      },
    },
  ],
}

export default view
