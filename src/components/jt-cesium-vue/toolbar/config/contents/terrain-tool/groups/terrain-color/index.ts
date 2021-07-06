import { Group } from '../../../Types'
import * as Cesium from 'cesium'
import store from '@/store'
import {
  showElevationContour,
  removeElevationContour,
} from '@/libs/cesium/libs/elevation-contour'
import { ClickHandlerOption } from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'

const view: Group = {
  name: '地形着色',
  items: [
    {
      name: '等高线',
      icon: 'contour2',
      dropdown: {
        componentName: 'elevationContourSetting',
      },
      clickHandler: (option: ClickHandlerOption | undefined): any => {
        if (!option) {
          return
        }
        const { viewer, item } = option
        if (!viewer) {
          return
        }
        if (store.state.jtCesiumVue.toolbar.elevationContourActive) {
          removeElevationContour({ viewer })
          store.dispatch(
            `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_ELEVATION_CONTURE_ACTIVE}`,
            false
          )
        } else {
          showElevationContour({ viewer })
          store.dispatch(
            `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_ELEVATION_CONTURE_ACTIVE}`,
            true
          )
        }
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.elevationContourActive
      },
    },
  ],
}

export default view
