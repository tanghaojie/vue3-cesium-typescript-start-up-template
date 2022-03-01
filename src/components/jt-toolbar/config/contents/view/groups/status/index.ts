import { Group, ClickHandlerOption, ActiveOption, T } from '../../../Types'

import { LocationBarActionTypes } from '@/store/modules/jt-cesium-vue/modules/locationbar/action-types'

const view: Group = {
  name: (t: T): string => {
    return t('toolbar.view.statusbar', '状态栏')
  },
  items: [
    {
      name: (t: T): string => {
        return t('toolbar.view.viewPosition', '视角坐标')
      },
      icon: 'camera2',
      clickHandler: (option: ClickHandlerOption): void => {
        const payload: boolean =
          !option.store.state.jtCesiumVue.locationbar.showCameraLocation
        option.store.dispatch(
          `jtCesiumVue/locationbar/${LocationBarActionTypes.SET_SHOW_CAMERA_LOCATION}`,
          payload
        )
      },
      active: (option: ActiveOption): boolean => {
        return (
          option.store.state.jtCesiumVue.locationbar.showCameraLocation || false
        )
      },
      dropdown: {
        componentName: 'camera-percentage-change-rate',
      },
    },
    {
      name: (t: T): string => {
        return t('toolbar.view.mousePosition', '鼠标坐标')
      },
      icon: 'click',
      clickHandler: (option: ClickHandlerOption): void => {
        const payload: boolean =
          !option.store.state.jtCesiumVue.locationbar.showMouseLocation
        option.store?.dispatch(
          `jtCesiumVue/locationbar/${LocationBarActionTypes.SET_SHOW_MOUSE_LOCATION}`,
          payload
        )
      },
      active: (option: ActiveOption): boolean => {
        return option.store.state.jtCesiumVue.locationbar.showMouseLocation!
      },
    },
    {
      name: (t: T): string => {
        return t('toolbar.view.fps', 'FPS')
      },
      icon: 'fps',
      clickHandler: (option: ClickHandlerOption): void => {
        const payload: boolean =
          !option.store.state.jtCesiumVue.locationbar.showFPS
        option.store.dispatch(
          `jtCesiumVue/locationbar/${LocationBarActionTypes.SET_SHOW_FPS}`,
          payload
        )
      },
      active: (option: ActiveOption): boolean => {
        return option.store.state.jtCesiumVue.locationbar.showFPS!
      },
    },
  ],
}

export default view
