import { Group, ClickHandlerOption } from '../../../Types'

import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'

const view: Group = {
  name: '设置',
  items: [
    {
      name: '设置',
      icon: 'setting',
      clickHandler: (option: ClickHandlerOption): void => {
        option.store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.ADD_UNIQUE_NAME_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          'jt-setting'
        )
      },
    },
  ],
}

export default view
