import { Module } from 'vuex'
import { RootState } from '@/store'

import { state } from './state'
import type { JTPrimitiveState } from './state'
export { JTPrimitiveState }

import { getters } from './getters'
import { mutations } from './mutations'
import { actions } from './actions'

export const store: Module<JTPrimitiveState, RootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
