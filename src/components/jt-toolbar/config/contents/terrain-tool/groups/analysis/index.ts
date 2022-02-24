import { Group, ClickHandlerOption } from '../../../Types'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
const componentName = 'jt-flood-analysis'
const view: Group = {
  name: '分析',
  items: [
    {
      name: '淹没分析',
      icon: 'flooded-house',
      clickHandler: (option: ClickHandlerOption): void => {
        option.store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.ADD_UNIQUE_NAME_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          componentName
        )
      },
    },
  ],
}

export default view
