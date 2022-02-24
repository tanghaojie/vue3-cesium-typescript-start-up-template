import { Group, ClickHandlerOption, ActiveOption } from '../../../Types'

import { LocationBarActionTypes } from '@/store/modules/jt-cesium-vue/modules/locationbar/action-types'

const view: Group = {
  name: '状态栏',
  items: [
    {
      name: '视角坐标',
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
      name: '鼠标坐标',
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
      name: 'FPS',
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
