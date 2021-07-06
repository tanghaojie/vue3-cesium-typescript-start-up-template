import { Group } from '../../../Types'
import * as Cesium from 'cesium'
import store from '@/store'
import sampleTerrain, { removeAll } from '@/libs/cesium/libs/terrain-sampling'
import { ClickHandlerOption } from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'

const view: Group = {
  name: '采样',
  items: [
    {
      name: '地形采样',
      icon: 'terrain',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (!option) {
          return
        }
        const { viewer } = option
        if (!viewer) {
          return
        }
        sampleTerrain({
          viewer,
        }).then((datas) => {
          store.dispatch(
            `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_TERRAIN_SAMPLING}`,
            {
              show: true,
              datas: datas,
            }
          )
        })
      },
    },
    {
      name: '移除',
      icon: 'delete',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (!option) {
          return
        }
        const { viewer } = option
        if (!viewer) {
          return
        }
        store.dispatch(
          `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_TERRAIN_SAMPLING}`,
          {
            show: false,
            datas: [],
          }
        )
        removeAll(viewer)
      },
    },
  ],
}

export default view
