import {
  Group,
  ClickHandlerOption,
  OnMountedOption,
  ActiveOption,
  T,
} from '../../../Types'

import { OtherActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/other/action-types'
import { OtherMutationTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/other/mutation-types'

const view: Group = {
  name: (t: T): string => {
    return t('toolbar.effect.other', '其他')
  },
  items: [
    {
      name: (t: T): string => {
        return t('toolbar.effect.depthTest', '深度检测')
      },
      icon: '360',

      clickHandler: (option: ClickHandlerOption): void => {
        option.store.dispatch(
          `jtCesiumVue/toolbar/other/${OtherActionTypes.SWITCH_DEPTH_TEST_AGAINST_TERRAIN}`,
          option
        )
      },

      active: (option: ActiveOption) =>
        option.store.state.jtCesiumVue.toolbar.other.depthTestAgainstTerrain,

      onMounted: (option: OnMountedOption): void => {
        const viewer = option?.viewer
        if (viewer) {
          option.store.commit(
            `jtCesiumVue/toolbar/other/${OtherMutationTypes.SET_DEPTH_TEST_AGAINST_TERRAIN}`,
            viewer.scene.globe.depthTestAgainstTerrain
          )
        }
      },
    },
  ],
}

export default view
