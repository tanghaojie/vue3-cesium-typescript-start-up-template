import { Module } from 'vuex'
import { RootState } from '@/store'

import { state } from './state'
import type { DrawState } from './state'
export { DrawState }

import { getters } from './getters'
import { mutations } from './mutations'
import { actions } from './actions'

export const store: Module<DrawState, RootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
