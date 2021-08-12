import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { OtherState } from './state'
import { OtherMutationTypes } from './mutation-types'

export const mutations: MutationTree<OtherState> = {
  [OtherMutationTypes.RESET_STATE](state: OtherState) {
    Object.assign(state, defaultState())
  },

  // other
  [OtherMutationTypes.SET_DEPTH_TEST_AGAINST_TERRAIN](
    state: OtherState,
    payload: boolean
  ) {
    state.depthTestAgainstTerrain = payload
  },
}
