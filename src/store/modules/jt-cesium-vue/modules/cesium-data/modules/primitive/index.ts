import { Module } from 'vuex'
import { RootState } from '@/store'

import { state } from './state'
import type { PrimitiveState } from './state'
export { PrimitiveState }

import { getters } from './getters'
import { mutations } from './mutations'
import { actions } from './actions'

export const store: Module<PrimitiveState, RootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
