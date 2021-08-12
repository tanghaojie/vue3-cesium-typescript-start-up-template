import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { Tool3DTileState } from './state'
import { Tool3DTileMutationTypes } from './mutation-types'

export const mutations: MutationTree<Tool3DTileState> = {
  [Tool3DTileMutationTypes.RESET_STATE](state: Tool3DTileState) {
    Object.assign(state, defaultState())
  },

  // tool3dtile
  [Tool3DTileMutationTypes.SET_HIGHLIGHT_3DTILE_FEATURE_ACTIVE](
    state: Tool3DTileState,
    payload: boolean
  ) {
    state.highlight3DTileFeatureActive = payload
  },

  [Tool3DTileMutationTypes.SET_HOVER_CLASSIFICATION_ACTIVE](
    state: Tool3DTileState,
    payload: boolean
  ) {
    state.hoverClassificationActive = payload
  },

  [Tool3DTileMutationTypes.SET_CLICK_CLASSIFICATION_ACTIVE](
    state: Tool3DTileState,
    payload: boolean
  ) {
    state.clickClassificationActive = payload
  },
}
