import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { State } from './state'
import { LayoutMutationTypes } from './mutation-types'

export const mutations: MutationTree<State> = {
  [LayoutMutationTypes.RESET_STATE](state: State) {
    Object.assign(state, defaultState())
  },

  [LayoutMutationTypes.SET_SHOW_BROWSER_PANEL](state: State, payload: boolean) {
    state.showBrowserPanel = payload
  },

  [LayoutMutationTypes.SET_SHOW_TOOLBAR](state: State, payload: boolean) {
    state.showToolbar = payload
  },
}
