import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { State } from './state'
import { ToolbarMutationTypes } from './mutation-types'
import { ToolbarActionTypes } from './action-types'

export const actions: ActionTree<State, RootState> = {
  async [ToolbarActionTypes.RESET_STATE]({ commit }) {
    commit(ToolbarMutationTypes.RESET_STATE)
  },
}
