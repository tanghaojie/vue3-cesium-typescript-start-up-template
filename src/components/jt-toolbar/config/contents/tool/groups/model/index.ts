import { Group, ClickHandlerOption } from '../../../Types'

import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'

const view: Group = {
  name: '模型',
  items: [
    {
      name: '剖分',
      icon: 'overlap',

      clickHandler: (option: ClickHandlerOption): void => {
        option.store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.ADD_UNIQUE_NAME_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          'jt-primitive-clipping-plane'
        )
      },
    },
  ],
}

export default view
