import {
  Group,
  ClickHandlerOption,
  ActiveOption,
  OnMountedOption,
  T,
} from '../../../Types'
import * as Cesium from 'cesium'
import type { SplitType } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/imagery/state'
import { ImageryActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/imagery/action-types'
import { ImageryMutationTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/imagery/mutation-types'

import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'

const view: Group = {
  name: (t: T): string => {
    return t('toolbar.effect.imagery', '影像')
  },
  items: [
    {
      name: (t: T): string => {
        return t('toolbar.effect.splitScreen', '分屏')
      },
      icon: 'split',

      dropdown: {
        componentName: 'imagery-split-position',
      },

      clickHandler: (option: ClickHandlerOption): void => {
        const viewer = option?.viewer
        if (viewer) {
          const ils = viewer.imageryLayers
          const layerLen = ils.length

          let split: SplitType
          let switchToPosition: number
          const position = viewer.scene.splitPosition
          if (position <= 0 && layerLen >= 2) {
            // do split
            switchToPosition = 0.5
            split = {
              enable: true,
              position: switchToPosition,
            }
            const tFirst: Cesium.ImageryLayer = ils.get(layerLen - 1)
            // const tSecond: Cesium.ImageryLayer = ils.get(layerLen - 2)

            tFirst.splitDirection = Cesium.SplitDirection.RIGHT
            // tSecond.splitDirection = Cesium.SplitDirection.LEFT
          } else {
            // cancel split
            switchToPosition = 0
            split = {
              enable: false,
              position: switchToPosition,
            }
            for (let i = layerLen - 1; i >= 0; --i) {
              ils.get(i).splitDirection = Cesium.SplitDirection.NONE
            }
          }

          viewer.scene.splitPosition = switchToPosition
          option.store.dispatch(
            `jtCesiumVue/toolbar/imagery/${ImageryActionTypes.SET_SPLIT}`,
            split
          )
        }
      },

      active: (option: ActiveOption) =>
        option.store.state.jtCesiumVue.toolbar.imagery.split.enable,

      onMounted: (option: OnMountedOption): void => {
        const viewer = option?.viewer
        if (viewer) {
          const position = viewer.scene.splitPosition
          const split: SplitType = {
            enable: position > 0,
            position: position,
          }
          option.store.commit(
            `jtCesiumVue/toolbar/imagery/${ImageryMutationTypes.SET_SPLIT}`,
            split
          )
        }
      },
    },

    {
      name: (t: T): string => {
        return t('toolbar.effect.correctOffset', '偏移纠正')
      },
      icon: 'overlap',

      clickHandler: (option: ClickHandlerOption): void => {
        option.store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.ADD_UNIQUE_NAME_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          'jt-imagery-layer-correct-offset'
        )
      },
    },
  ],
}

export default view
