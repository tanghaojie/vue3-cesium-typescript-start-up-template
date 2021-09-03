import { Group } from '../../../Types'
import store from '@/store'
import ElevationContour from '@/libs/cesium/libs/elevation-contour/ElevationContour'
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
        if (!option || !option.viewer) {
          return
        }
        const { viewer, item } = option
        if (!viewer.jtElevationContour) {
          viewer.jtElevationContour = new ElevationContour(viewer)
        }

        const { jtElevationContour } = viewer
        if (store.state.jtCesiumVue.toolbar.elevationContourActive) {
          jtElevationContour.remove()
          store.dispatch(
            `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_ELEVATION_CONTURE_ACTIVE}`,
            false
          )
        } else {
          jtElevationContour.show()
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
