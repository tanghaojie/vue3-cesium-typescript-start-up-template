import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { ImageryState, SplitType } from './state'
import { ImageryMutationTypes } from './mutation-types'
import { ImageryActionTypes } from './action-types'

export const actions: ActionTree<ImageryState, RootState> = {
  async [ImageryActionTypes.RESET_STATE]({ commit }) {
    commit(ImageryMutationTypes.RESET_STATE)
  },

  // imagery
  async [ImageryActionTypes.SET_SPLIT]({ commit, state }, payload: SplitType) {
    commit(ImageryMutationTypes.SET_SPLIT, payload)
  },
}
