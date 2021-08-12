import { Group } from '../../../Types'
import store from '@/store'
import {
  ClickHandlerOption,
  OnMountedOption,
} from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import { NatureActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/nature/action-types'

const view: Group = {
  name: '自然环境',
  items: [
    {
      name: '太阳',
      icon: 'sun',

      clickHandler: (options: ClickHandlerOption | undefined): void => {
        store.dispatch(
          `jtCesiumVue/toolbar/nature/${NatureActionTypes.SWITCH_SHOW_SUN}`,
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
      icon: 'moon',

      clickHandler: (options: ClickHandlerOption | undefined): void => {
        store.dispatch(
          `jtCesiumVue/toolbar/nature/${NatureActionTypes.SWITCH_SHOW_MOON}`,
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
      icon: 'atmosphere',

      clickHandler: (options: ClickHandlerOption | undefined): void => {
        store.dispatch(
          `jtCesiumVue/toolbar/nature/${NatureActionTypes.SWITCH_SHOW_SKY_ATMOSPHERE}`,
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
      name: '日照',
      icon: 'shadow2',

      clickHandler: (options: ClickHandlerOption | undefined): void => {
        store.dispatch(
          `jtCesiumVue/toolbar/nature/${NatureActionTypes.SWITCH_ENABLE_LIGHT}`,
          options
        )
      },

      active: () => store.state.jtCesiumVue.toolbar.nature.enableLighting,

      onMounted: (options: OnMountedOption | undefined): void => {
        if (options) {
          const { viewer } = options
          store.state.jtCesiumVue.toolbar.nature.enableLighting =
            !!viewer?.scene.globe?.enableLighting
        }
      },

      dropdown: {
        componentName: 'earth-light-setting',
      },
    },
    {
      name: '天空盒',
      icon: 'universe',

      clickHandler: (options: ClickHandlerOption | undefined): void => {
        store.dispatch(
          `jtCesiumVue/toolbar/nature/${NatureActionTypes.SWITCH_SHOW_SKY_BOX}`,
          options
        )
      },

      active: () => store.state.jtCesiumVue.toolbar.nature.showSkyBox,

      onMounted: (options: OnMountedOption | undefined): void => {
        store.state.jtCesiumVue.toolbar.nature.showSkyBox =
          !!options?.viewer?.scene.skyBox?.show
      },
    },

    {
      name: '阴影',
      icon: 'shadow3',
      disable: false,

      clickHandler: (options: ClickHandlerOption | undefined): void => {
        store.dispatch(
          `jtCesiumVue/toolbar/nature/${NatureActionTypes.SWITCH_SHOW_SHADOW}`,
          options
        )
      },

      active: () => store.state.jtCesiumVue.toolbar.nature.showShadow,

      onMounted: (options: OnMountedOption | undefined): void => {
        store.state.jtCesiumVue.toolbar.nature.showShadow =
          !!options?.viewer?.shadows
      },
    },
  ],
}

export default view
