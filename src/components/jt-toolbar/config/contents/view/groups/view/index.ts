import { Group, ClickHandlerOption } from '../../../Types'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'

const view: Group = {
  name: '视图',
  items: [
    {
      name: '切换视图',
      icon: 'view-lp',
      dropdownOnClick: true,
      dropdown: {
        componentName: 'select-view-mode',
      },
    },

    {
      name: '相机设置',
      icon: 'setting-config',

      clickHandler: (option: ClickHandlerOption): void => {
        option.store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.ADD_UNIQUE_NAME_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          'jt-camera-setting'
        )
      },
    },

    {
      name: '范围限制',
      icon: 'rectangle',

      clickHandler: (option: ClickHandlerOption): void => {
        option.store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.ADD_UNIQUE_NAME_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          'jt-cartographic-limit-rectangle'
        )
      },
    },
  ],
  invisible: false,
  disable: false,
}

export default view
