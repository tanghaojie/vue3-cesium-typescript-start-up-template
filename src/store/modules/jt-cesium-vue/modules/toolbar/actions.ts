import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { State, DropdownState, TerrainSamplingState } from './state'
import { ToolbarMutationTypes } from './mutation-types'
import { ToolbarActionTypes } from './action-types'
import { ClickHandlerOption } from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import * as Cesium from 'cesium'

export const actions: ActionTree<State, RootState> = {
  async [ToolbarActionTypes.RESET_STATE]({ commit }) {
    commit(ToolbarMutationTypes.RESET_STATE)
  },

  async [ToolbarActionTypes.SET_VISIBLE]({ commit }, payload: boolean) {
    commit(ToolbarMutationTypes.SET_VISIBLE, payload)
  },

  async [ToolbarActionTypes.SET_DROP_DOWN]({ commit }, payload: DropdownState) {
    commit(ToolbarMutationTypes.SET_DROP_DOWN, payload)
  },

  // nature
  async [ToolbarActionTypes.SWITCH_SHOW_SUN](
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
    const switchTo = !state.nature.showSun
    viewer.scene.sun.show = switchTo
    commit(ToolbarMutationTypes.SET_SHOW_SUN, switchTo)
  },

  async [ToolbarActionTypes.SWITCH_SHOW_MOON](
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
    const switchTo = !state.nature.showMoon
    viewer.scene.moon.show = switchTo
    commit(ToolbarMutationTypes.SET_SHOW_MOON, switchTo)
  },

  async [ToolbarActionTypes.SWITCH_SHOW_SKY_ATMOSPHERE](
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
    const switchTo = !state.nature.showSkyAtmosphere
    viewer.scene.skyAtmosphere.show = switchTo
    commit(ToolbarMutationTypes.SET_SHOW_SKY_ATMOSPHERE, switchTo)
  },

  async [ToolbarActionTypes.SWITCH_ENABLE_LIGHT](
    { commit, state },
    options: ClickHandlerOption
  ) {
    const { viewer } = options
    if (!viewer) {
      return
    }
    const switchTo = !state.nature.enableLighting
    viewer.scene.globe.enableLighting = switchTo
    commit(ToolbarMutationTypes.SET_ENABLE_LIGHT, switchTo)
  },

  async [ToolbarActionTypes.SWITCH_SHOW_SKY_BOX](
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
    const switchTo = !state.nature.showSkyBox
    viewer.scene.skyBox.show = switchTo
    commit(ToolbarMutationTypes.SET_SHOW_SKY_BOX, switchTo)
  },

  // other
  async [ToolbarActionTypes.SWITCH_DEPTH_TEST_AGAINST_TERRAIN](
    { commit, state },
    options: ClickHandlerOption
  ) {
    const { viewer } = options
    if (!viewer) {
      return
    }
    const switchTo = !state.other.depthTestAgainstTerrain
    viewer.scene.globe.depthTestAgainstTerrain = switchTo
    commit(ToolbarMutationTypes.SET_DEPTH_TEST_AGAINST_TERRAIN, switchTo)
  },

  // draw
  async [ToolbarActionTypes.SET_DRAW_POINT_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(ToolbarMutationTypes.SET_DRAW_POINT_ACTIVE, payload)
  },

  async [ToolbarActionTypes.SET_DRAW_POLYLINE_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(ToolbarMutationTypes.SET_DRAW_POLYLINE_ACTIVE, payload)
  },

  async [ToolbarActionTypes.SET_DRAW_POLYGON_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(ToolbarMutationTypes.SET_DRAW_POLYGON_ACTIVE, payload)
  },

  // measure
  async [ToolbarActionTypes.SET_MEASURE_POINT_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(ToolbarMutationTypes.SET_MEASURE_POINT_ACTIVE, payload)
  },

  async [ToolbarActionTypes.SET_MEASURE_POLYLINE_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(ToolbarMutationTypes.SET_MEASURE_POLYLINE_ACTIVE, payload)
  },

  async [ToolbarActionTypes.SET_MEASURE_POLYGON_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(ToolbarMutationTypes.SET_MEASURE_POLYGON_ACTIVE, payload)
  },

  // measure
  async [ToolbarActionTypes.SET_HIGHLIGHT_3DTILE_FEATURE_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(ToolbarMutationTypes.SET_HIGHLIGHT_3DTILE_FEATURE_ACTIVE, payload)
  },

  async [ToolbarActionTypes.SET_HOVER_CLASSIFICATION_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(ToolbarMutationTypes.SET_HOVER_CLASSIFICATION_ACTIVE, payload)
  },

  async [ToolbarActionTypes.SET_CLICK_CLASSIFICATION_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(ToolbarMutationTypes.SET_CLICK_CLASSIFICATION_ACTIVE, payload)
  },

  // elevation contour
  async [ToolbarActionTypes.SET_ELEVATION_CONTURE_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(ToolbarMutationTypes.SET_ELEVATION_CONTURE_ACTIVE, payload)
  },

  // terrain sampling
  async [ToolbarActionTypes.SET_TERRAIN_SAMPLING](
    { commit },
    payload: TerrainSamplingState
  ) {
    commit(ToolbarMutationTypes.SET_TERRAIN_SAMPLING, payload)
  },
}
