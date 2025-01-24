import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { ImageryState, SplitType } from './state'
import { ImageryMutationTypes } from './mutation-types'

export const mutations: MutationTree<ImageryState> = {
  [ImageryMutationTypes.RESET_STATE](state: ImageryState) {
    Object.assign(state, defaultState())
  },

  // imagery
  [ImageryMutationTypes.SET_SPLIT](state: ImageryState, payload: SplitType) {
    state.split = payload
  },
}
