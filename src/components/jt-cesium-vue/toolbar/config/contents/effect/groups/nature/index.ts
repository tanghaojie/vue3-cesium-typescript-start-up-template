import { Group } from '../../../Types'
import store from '@/store'
import {
  ClickHandlerOption,
  OnMountedOption,
} from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'

const view: Group = {
  name: '自然环境',
  items: [
    {
      name: '太阳',
      icon: 'earth',

      clickHandler: (options: ClickHandlerOption | undefined): void => {
        store.dispatch(
          `jtCesiumVue/toolbar/${ToolbarActionTypes.SWITCH_SHOW_SUN}`,
          options
        )
      },

      active: () => store.state.jtCesiumVue.toolbar.nature.showSun,

      onMounted: (options: OnMountedOption | undefined): void => {
        store.state.jtCesiumVue.toolbar.nature.showSun =
          !!options?.viewer?.scene.sun?.show
      },
    },
    {
      name: '月亮',
      icon: 'earth',

      clickHandler: (options: ClickHandlerOption | undefined): void => {
        store.dispatch(
          `jtCesiumVue/toolbar/${ToolbarActionTypes.SWITCH_SHOW_MOON}`,
          options
        )
      },

      active: () => store.state.jtCesiumVue.toolbar.nature.showMoon,

      onMounted: (options: OnMountedOption | undefined): void => {
        store.state.jtCesiumVue.toolbar.nature.showMoon =
          !!options?.viewer?.scene.moon?.show
      },
    },
    {
      name: '大气层',
      icon: 'earth',

      clickHandler: (options: ClickHandlerOption | undefined): void => {
        store.dispatch(
          `jtCesiumVue/toolbar/${ToolbarActionTypes.SWITCH_SHOW_SKY_ATMOSPHERE}`,
          options
        )
      },

      active: () => store.state.jtCesiumVue.toolbar.nature.showSkyAtmosphere,

      onMounted: (options: OnMountedOption | undefined): void => {
        store.state.jtCesiumVue.toolbar.nature.showSkyAtmosphere =
          !!options?.viewer?.scene.skyAtmosphere?.show
      },
    },
    {
      name: '日照阴影',
      icon: 'earth',

      clickHandler: (options: ClickHandlerOption | undefined): void => {
        store.dispatch(
          `jtCesiumVue/toolbar/${ToolbarActionTypes.SWITCH_ENABLE_LIGHT}`,
          options
        )
      },

      active: () => store.state.jtCesiumVue.toolbar.nature.enableLighting,

      onMounted: (options: OnMountedOption | undefined): void => {
        store.state.jtCesiumVue.toolbar.nature.enableLighting =
          !!options?.viewer?.scene.globe?.enableLighting
      },
    },
    {
      name: '天空盒',
      icon: 'earth',

      clickHandler: (options: ClickHandlerOption | undefined): void => {
        store.dispatch(
          `jtCesiumVue/toolbar/${ToolbarActionTypes.SWITCH_SHOW_SKY_BOX}`,
          options
        )
      },

      active: () => store.state.jtCesiumVue.toolbar.nature.showSkyBox,

      onMounted: (options: OnMountedOption | undefined): void => {
        store.state.jtCesiumVue.toolbar.nature.showSkyBox =
          !!options?.viewer?.scene.skyBox?.show
      },
    },
  ],
}

export default view
