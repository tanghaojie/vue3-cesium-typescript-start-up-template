import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { NatureState } from './state'
import { NatureMutationTypes } from './mutation-types'

export const mutations: MutationTree<NatureState> = {
  [NatureMutationTypes.RESET_STATE](state: NatureState) {
    Object.assign(state, defaultState())
  },

  // nature
  [NatureMutationTypes.SET_SHOW_SUN](state: NatureState, payload: boolean) {
    state.showSun = payload
  },

  [NatureMutationTypes.SET_SHOW_MOON](state: NatureState, payload: boolean) {
    state.showMoon = payload
  },

  [NatureMutationTypes.SET_SHOW_SKY_ATMOSPHERE](
    state: NatureState,
    payload: boolean
  ) {
    state.showSkyAtmosphere = payload
  },

  [NatureMutationTypes.SET_ENABLE_LIGHT](state: NatureState, payload: boolean) {
    state.enableLighting = payload
  },

  [NatureMutationTypes.SET_SHOW_SKY_BOX](state: NatureState, payload: boolean) {
    state.showSkyBox = payload
  },

  [NatureMutationTypes.SET_SHOW_SHADOW](state: NatureState, payload: boolean) {
    state.showShadow = payload
  },
}
