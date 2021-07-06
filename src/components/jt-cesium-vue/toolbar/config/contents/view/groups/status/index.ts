import { Group } from '../../../Types'
import store from '@/store'

import type { State } from '@/store/modules/jt-cesium-vue/modules/locationbar/state'
import { LocationBarActionTypes } from '@/store/modules/jt-cesium-vue/modules/locationbar/action-types'

const view: Group = {
  name: '状态栏',
  items: [
    {
      name: '视角坐标',
      icon: 'camera2',
      clickHandler: (): void => {
        const payload: boolean =
          !store.state.jtCesiumVue.locationbar.showCameraLocation
        store.dispatch(
          `jtCesiumVue/locationbar/${LocationBarActionTypes.SET_SHOW_CAMERA_LOCATION}`,
          payload
        )
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.locationbar.showCameraLocation
      },
      dropdown: {
        componentName: 'camera-percentage-change-rate',
      },
    },
    {
      name: '鼠标坐标',
      icon: 'click',
      clickHandler: (): void => {
        const payload: boolean =
          !store.state.jtCesiumVue.locationbar.showMouseLocation
        store.dispatch(
          `jtCesiumVue/locationbar/${LocationBarActionTypes.SET_SHOW_MOUSE_LOCATION}`,
          payload
        )
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.locationbar.showMouseLocation!
      },
    },
    {
      name: 'FPS',
      icon: 'fps',
      clickHandler: (): void => {
        const payload: boolean = !store.state.jtCesiumVue.locationbar.showFPS
        store.dispatch(
          `jtCesiumVue/locationbar/${LocationBarActionTypes.SET_SHOW_FPS}`,
          payload
        )
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.locationbar.showFPS!
      },
    },
  ],
}

export default view
