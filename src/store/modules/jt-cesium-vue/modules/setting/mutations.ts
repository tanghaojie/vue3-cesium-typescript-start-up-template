import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { State } from './state'
import { SettingMutationTypes } from './mutation-types'

export const mutations: MutationTree<State> = {
  [SettingMutationTypes.RESET_STATE](state: State) {
    Object.assign(state, defaultState())
  },

  [SettingMutationTypes.SET_SHOW_SETTING](state: State, payload: boolean) {
    state.showSetting = payload
  },
}
