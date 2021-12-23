import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { State } from './state'
import { CesiumDataMutationTypes } from './mutation-types'

export const mutations: MutationTree<State> = {
  [CesiumDataMutationTypes.RESET_STATE](state: State) {
    Object.assign(state, defaultState())
  },
}
