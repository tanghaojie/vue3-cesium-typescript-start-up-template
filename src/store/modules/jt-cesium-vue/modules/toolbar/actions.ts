import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { State, DropdownState, TerrainSamplingState } from './state'
import { ToolbarMutationTypes } from './mutation-types'
import { ToolbarActionTypes } from './action-types'

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
