import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { TerrainSamplingState, State, DropdownState } from './state'
import { ToolbarMutationTypes } from './mutation-types'

export const mutations: MutationTree<State> = {
  [ToolbarMutationTypes.RESET_STATE](state: State) {
    Object.assign(state, defaultState())
  },

  [ToolbarMutationTypes.SET_VISIBLE](state: State, payload: boolean) {
    state.visible = payload
  },

  [ToolbarMutationTypes.SET_DROP_DOWN](state: State, payload: DropdownState) {
    state.dropdown = payload
  },

  [ToolbarMutationTypes.SET_DROP_DOWN](state: State, payload: DropdownState) {
    state.dropdown = payload
  },

  // elevation contour
  [ToolbarMutationTypes.SET_ELEVATION_CONTURE_ACTIVE](
    state: State,
    payload: boolean
  ) {
    state.elevationContourActive = payload
  },

  // terrain sampling
  [ToolbarMutationTypes.SET_TERRAIN_SAMPLING](
    state: State,
    payload: TerrainSamplingState
  ) {
    state.terrainSampling = payload
  },
}
