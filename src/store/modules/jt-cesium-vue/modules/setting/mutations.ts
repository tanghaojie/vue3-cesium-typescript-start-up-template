import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { State } from './state'
import { SettingMutationTypes } from './mutation-types'

export const mutations: MutationTree<State> = {
  [SettingMutationTypes.RESET_STATE](state: State) {
    Object.assign(state, defaultState())
  },

  [SettingMutationTypes.SET_SHOW_BROWSER_PANEL](
    state: State,
    payload: boolean
  ) {
    state.showBrowserPanel = payload
  },

  [SettingMutationTypes.SET_SHOW_TOOLBAR](state: State, payload: boolean) {
    state.showToolbar = payload
  },

  [SettingMutationTypes.SET_SHOW_SETTING](state: State, payload: boolean) {
    state.showSetting = payload
  },
}
