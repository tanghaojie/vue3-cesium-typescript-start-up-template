import { Group } from '../../../Types'
import * as Cesium from 'cesium'
import store from '@/store'
import { ClickHandlerOption } from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'

const view: Group = {
  name: '采样',
  items: [
    {
      name: '地形采样',
      icon: 'terrain',
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        if (!option || !option.viewer || !option.viewer.jt) {
          return
        }

        option.viewer.jt.terrainSampling.sampling().then((datas) => {
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
        if (!option || !option.viewer || !option.viewer.jt) {
          return
        }
        store.dispatch(
          `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_TERRAIN_SAMPLING}`,
          {
            show: false,
            datas: [],
          }
        )
        option.viewer.jt.terrainSampling.removeAll()
      },
    },
  ],
}

export default view
