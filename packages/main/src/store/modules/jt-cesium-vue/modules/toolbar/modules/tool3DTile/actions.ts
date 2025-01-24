import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { Tool3DTileState } from './state'
import { Tool3DTileMutationTypes } from './mutation-types'
import { Tool3DTileActionTypes } from './action-types'

export const actions: ActionTree<Tool3DTileState, RootState> = {
  async [Tool3DTileActionTypes.RESET_STATE]({ commit }) {
    commit(Tool3DTileMutationTypes.RESET_STATE)
  },

  async [Tool3DTileActionTypes.SET_HIGHLIGHT_3DTILE_FEATURE_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(Tool3DTileMutationTypes.SET_HIGHLIGHT_3DTILE_FEATURE_ACTIVE, payload)
  },

  async [Tool3DTileActionTypes.SET_HOVER_CLASSIFICATION_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(Tool3DTileMutationTypes.SET_HOVER_CLASSIFICATION_ACTIVE, payload)
  },

  async [Tool3DTileActionTypes.SET_CLICK_CLASSIFICATION_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(Tool3DTileMutationTypes.SET_CLICK_CLASSIFICATION_ACTIVE, payload)
  },
}
