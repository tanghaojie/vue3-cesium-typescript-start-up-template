import { Group } from '../../../Types'
import store from '@/store'
import {
  ClickHandlerOption,
  OnMountedOption,
} from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'

const view: Group = {
  name: '其他',
  items: [
    {
      name: '深度检测(地形遮挡实体)',
      icon: 'earth',

      clickHandler: (options: ClickHandlerOption | undefined): void => {
        store.dispatch(
          `jtCesiumVue/toolbar/${ToolbarActionTypes.SWITCH_DEPTH_TEST_AGAINST_TERRAIN}`,
          options
        )
      },

      active: () =>
        store.state.jtCesiumVue.toolbar.other.depthTestAgainstTerrain,

      onMounted: (options: OnMountedOption | undefined): void => {
        const viewer = options?.viewer
        if (viewer) {
          store.state.jtCesiumVue.toolbar.other.depthTestAgainstTerrain =
            viewer.scene.globe.depthTestAgainstTerrain
        }
      },
    },
  ],
}

export default view
