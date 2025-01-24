import { Group, ClickHandlerOption, ActiveOption, T } from '../../../Types'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'

const view: Group = {
  name: (t: T): string => {
    return t('toolbar.terrainTool.terrainColor', '地形着色')
  },
  items: [
    {
      name: (t: T): string => {
        return t('toolbar.terrainTool.elevationContour', '等高线')
      },
      icon: 'contour2',
      dropdown: {
        componentName: 'elevationContourSetting',
      },
      clickHandler: (option: ClickHandlerOption): any => {
        if (!option || !option.viewer || !option.viewer.jt) {
          return
        }
        if (option.store.state.jtCesiumVue.toolbar.elevationContourActive) {
          option.viewer.jt.elevationContour.remove()
          option.store.dispatch(
            `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_ELEVATION_CONTURE_ACTIVE}`,
            false
          )
        } else {
          option.viewer.jt.elevationContour.show()
          option.store.dispatch(
            `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_ELEVATION_CONTURE_ACTIVE}`,
            true
          )
        }
      },
      active: (option: ActiveOption): boolean => {
        return option.store.state.jtCesiumVue.toolbar.elevationContourActive
      },
    },
  ],
}

export default view
