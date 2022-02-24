import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { NatureState } from './state'
import { NatureMutationTypes } from './mutation-types'
import { NatureActionTypes } from './action-types'

import { ClickHandlerOption } from '@/components/jt-toolbar/config/contents/Types'
import * as Cesium from 'cesium'

export const actions: ActionTree<NatureState, RootState> = {
  async [NatureActionTypes.RESET_STATE]({ commit }) {
    commit(NatureMutationTypes.RESET_STATE)
  },

  // nature
  async [NatureActionTypes.SWITCH_SHOW_SUN](
    { commit, state },
    options: ClickHandlerOption
  ) {
    const { viewer } = options
    if (!viewer) {
      return
    }
    if (!viewer.scene.sun) {
      viewer.scene.sun = new Cesium.Sun()
    }
    const switchTo = !state.showSun
    viewer.scene.sun.show = switchTo
    commit(NatureMutationTypes.SET_SHOW_SUN, switchTo)
  },

  async [NatureActionTypes.SWITCH_SHOW_MOON](
    { commit, state },
    options: ClickHandlerOption
  ) {
    const { viewer } = options
    if (!viewer) {
      return
    }
    if (!viewer.scene.moon) {
      viewer.scene.moon = new Cesium.Moon()
    }
    const switchTo = !state.showMoon
    viewer.scene.moon.show = switchTo
    commit(NatureMutationTypes.SET_SHOW_MOON, switchTo)
  },

  async [NatureActionTypes.SWITCH_SHOW_SKY_ATMOSPHERE](
    { commit, state },
    options: ClickHandlerOption
  ) {
    const { viewer } = options
    if (!viewer) {
      return
    }
    if (!viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere = new Cesium.SkyAtmosphere()
    }
    const switchTo = !state.showSkyAtmosphere
    viewer.scene.skyAtmosphere.show = switchTo
    commit(NatureMutationTypes.SET_SHOW_SKY_ATMOSPHERE, switchTo)
  },

  async [NatureActionTypes.SWITCH_ENABLE_LIGHT](
    { commit, state },
    options: ClickHandlerOption
  ) {
    const { viewer } = options
    if (!viewer) {
      return
    }
    const switchTo = !state.enableLighting
    viewer.scene.globe.enableLighting = switchTo
    commit(NatureMutationTypes.SET_ENABLE_LIGHT, switchTo)
  },

  async [NatureActionTypes.SWITCH_SHOW_SKY_BOX](
    { commit, state },
    options: ClickHandlerOption
  ) {
    const { viewer } = options
    if (!viewer) {
      return
    }
    // if (!viewer.scene.skyBox) {
    //   viewer.scene.skyBox = new Cesium.SkyBox()
    // }
    const switchTo = !state.showSkyBox
    viewer.scene.skyBox.show = switchTo
    commit(NatureMutationTypes.SET_SHOW_SKY_BOX, switchTo)
  },

  async [NatureActionTypes.SWITCH_SHOW_SHADOW](
    { commit, state },
    options: ClickHandlerOption
  ) {
    const { viewer } = options
    if (!viewer) {
      return
    }
    const switchTo = !state.showShadow
    viewer.shadows = switchTo
    if (switchTo) {
      viewer.terrainShadows = Cesium.ShadowMode.ENABLED
    } else {
      viewer.terrainShadows = Cesium.ShadowMode.RECEIVE_ONLY
    }
    commit(NatureMutationTypes.SET_SHOW_SHADOW, switchTo)
  },
}
