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

const view: Group = {
  name: '影像',
  items: [
    {
      name: '分屏',
      icon: 'split',

      dropdown: {
        componentName: 'imagery-split-position',
      },

      clickHandler: (options: ClickHandlerOption | undefined): void => {
        const viewer = options?.viewer
        if (viewer) {
          const ils = viewer.imageryLayers
          const layerLen = ils.length

          let split: SplitType
          let switchToPosition: number
          const position = viewer.scene.imagerySplitPosition
          if (position <= 0 && layerLen >= 2) {
            // do split
            switchToPosition = 0.5
            split = {
              enable: true,
              position: switchToPosition,
            }
            const tFirst: Cesium.ImageryLayer = ils.get(layerLen - 1)
            const tSecond: Cesium.ImageryLayer = ils.get(layerLen - 2)

            tFirst.splitDirection = Cesium.ImagerySplitDirection.RIGHT
            tSecond.splitDirection = Cesium.ImagerySplitDirection.LEFT
          } else {
            // cancel split
            switchToPosition = 0
            split = {
              enable: false,
              position: switchToPosition,
            }
            for (let i = layerLen - 1; i >= 0; --i) {
              ils.get(i).splitDirection = Cesium.ImagerySplitDirection.NONE
            }
          }

          viewer.scene.imagerySplitPosition = switchToPosition
          store.dispatch(
            `jtCesiumVue/toolbar/imagery/${ImageryActionTypes.SET_SPLIT}`,
            split
          )
        }
      },

      active: () => store.state.jtCesiumVue.toolbar.imagery.split.enable,

      onMounted: (options: OnMountedOption | undefined): void => {
        const viewer = options?.viewer
        if (viewer) {
          const position = viewer.scene.imagerySplitPosition
          const split: SplitType = {
            enable: position > 0,
            position: position,
          }
          store.commit(
            `jtCesiumVue/toolbar/imagery/${ImageryMutationTypes.SET_SPLIT}`,
            split
          )
        }
      },
    },
  ],
}

export default view
