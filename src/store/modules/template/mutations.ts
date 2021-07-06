import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { State } from './state'
import { TemplateMutationTypes } from './mutation-types'

export const mutations: MutationTree<State> = {
  [TemplateMutationTypes.RESET_STATE](state: State) {
    Object.assign(state, defaultState())
  },
}
