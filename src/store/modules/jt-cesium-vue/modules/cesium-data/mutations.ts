import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { State } from './state'
import { ToolbarMutationTypes } from './mutation-types'

export const mutations: MutationTree<State> = {
  [ToolbarMutationTypes.RESET_STATE](state: State) {
    Object.assign(state, defaultState())
  },
}
