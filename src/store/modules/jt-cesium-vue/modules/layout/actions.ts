import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { State } from './state'
import { LayoutMutationTypes } from './mutation-types'
import { LayoutActionTypes } from './action-types'

export const actions: ActionTree<State, RootState> = {
  async [LayoutActionTypes.RESET_STATE]({ commit }) {
    commit(LayoutMutationTypes.RESET_STATE)
  },

  async [LayoutActionTypes.SET_SHOW_BROWSER_PANEL](
    { commit },
    payload: boolean
  ) {
    commit(LayoutMutationTypes.SET_SHOW_BROWSER_PANEL, payload)
  },

  async [LayoutActionTypes.SET_SHOW_TOOLBAR]({ commit }, payload: boolean) {
    commit(LayoutMutationTypes.SET_SHOW_TOOLBAR, payload)
  },
}
