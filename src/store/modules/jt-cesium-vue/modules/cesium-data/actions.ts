import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { State } from './state'
import { CesiumDataMutationTypes } from './mutation-types'
import { CesiumDataActionTypes } from './action-types'

export const actions: ActionTree<State, RootState> = {
  async [CesiumDataActionTypes.RESET_STATE]({ commit }) {
    commit(CesiumDataMutationTypes.RESET_STATE)
  },
}
