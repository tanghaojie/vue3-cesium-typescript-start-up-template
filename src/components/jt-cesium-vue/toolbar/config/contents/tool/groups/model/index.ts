import { Group } from '../../../Types'
import store from '@/store'
import * as Cesium from 'cesium'
import {
  ClickHandlerOption,
  OnMountedOption,
} from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import type { SplitType } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/imagery/state'
import { ImageryActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/imagery/action-types'
import { ImageryMutationTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/imagery/mutation-types'

import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'

const view: Group = {
  name: '模型',
  items: [
    {
      name: '剖分',
      icon: 'overlap',

      clickHandler: (): void => {
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.ADD_UNIQUE_NAME_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          'jt-primitive-clipping-plane'
        )
      },
    },
  ],
}

export default view
