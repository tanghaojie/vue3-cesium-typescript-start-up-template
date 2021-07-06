import { Group } from '../../../Types'
import store from '@/store'
import {
  measurePoint,
  measureShape,
  MeasureMode,
  removeMeasured,
} from '@/libs/cesium/libs/measure'
import type {
  MeasurePointOption,
  MeasureShapeOption,
} from '@/libs/cesium/libs/measure'
import {
  ClickHandlerOption,
  OnMountedOption,
} from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'

const view: Group = {
  name: '测量',
  items: [
    {
      name: '点',
      icon: 'point',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (!option) {
          return
        }
        const { viewer } = option
        if (!viewer) {
          return
        }
        if (store.state.jtCesiumVue.toolbar.measure.measurePointActive) {
          return
        }
        measurePoint({
          viewer,
          started: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_MEASURE_POINT_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_MEASURE_POINT_ACTIVE}`,
              false
            )
          },
        })
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.measure.measurePointActive
      },
    },
    {
      name: '线',
      icon: 'line',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (!option) {
          return
        }
        const { viewer } = option
        if (!viewer) {
          return
        }
        if (store.state.jtCesiumVue.toolbar.measure.measurePolylineActive) {
          return
        }
        measureShape({
          viewer,
          measureMode: MeasureMode.Polyline,
          started: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_MEASURE_POLYLINE_ACTIVE}`,
              true
            )
          },
          stoped: () => {
            store.dispatch(
              `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_MEASURE_POLYLINE_ACTIVE}`,
              false
            )
          },
        })
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.measure.measurePolylineActive
      },
    },
    {
      name: '面',
      icon: 'polygon',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (!option) {
          return
        }
        const { viewer } = option
        if (!viewer) {
          return
        }
        if (store.state.jtCesiumVue.toolbar.measure.measurePolygonActive) {
          return
        }
        measureShape({
          viewer,
          measureMode: MeasureMode.Polygon,
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
        return store.state.jtCesiumVue.toolbar.measure.measurePolygonActive
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
        removeMeasured(viewer)
      },
    },
  ],
}

export default view
