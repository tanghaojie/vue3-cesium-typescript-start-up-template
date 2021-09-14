import { createApp, defineAsyncComponent } from 'vue'
import { Group } from '../../../Types'
import * as Cesium from 'cesium'
import store from '@/store'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import { ClickHandlerOption } from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'
const componentName = 'jt-flood-analysis'
const view: Group = {
  name: '分析',
  items: [
    {
      name: '淹没分析',
      icon: 'flooded-house',
      disable: true,
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.ADD_UNIQUE_NAME_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          componentName
        )
      },
    },
    {
      name: '移除',
      icon: 'delete',
      disable: true,
      clickHandler: (option: ClickHandlerOption | undefined): void => {
        // if (!option || !option.viewer || !option.viewer.jt) {
        //   return
        // }
        // store.dispatch(
        //   `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_TERRAIN_SAMPLING}`,
        //   {
        //     show: false,
        //     datas: [],
        //   }
        // )
        // option.viewer.jt.terrainSampling.removeAll()
      },
    },
  ],
}

export default view
