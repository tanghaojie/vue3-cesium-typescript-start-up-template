import { Group, ClickHandlerOption, T } from '../../../Types'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'

const view: Group = {
  name: (t: T): string => {
    return t('toolbar.terrainTool.sample', '采样')
  },
  items: [
    {
      name: (t: T): string => {
        return t('toolbar.terrainTool.terrianSample', '地形采样')
      },
      icon: 'terrain',
      clickHandler: (option: ClickHandlerOption): void => {
        if (!option || !option.viewer || !option.viewer.jt) {
          return
        }

        option.viewer.jt.terrainSampling.sampling().then((datas) => {
          option.store.dispatch(
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
      name: (t: T): string => {
        return t('toolbar.terrainTool.remove', '移除')
      },
      icon: 'delete',
      clickHandler: (option: ClickHandlerOption): void => {
        if (!option || !option.viewer || !option.viewer.jt) {
          return
        }
        option.store.dispatch(
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
