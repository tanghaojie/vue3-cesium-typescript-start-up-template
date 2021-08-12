import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { State } from './state'
import { SettingMutationTypes } from './mutation-types'
import { SettingActionTypes } from './action-types'

export const actions: ActionTree<State, RootState> = {
  async [SettingActionTypes.RESET_STATE]({ commit }) {
    commit(SettingMutationTypes.RESET_STATE)
  },

  async [SettingActionTypes.SET_SHOW_SETTING]({ commit }, payload: boolean) {
    commit(SettingMutationTypes.SET_SHOW_SETTING, payload)
  },
}
