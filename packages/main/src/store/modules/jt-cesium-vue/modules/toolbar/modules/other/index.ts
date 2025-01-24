import { Module } from 'vuex'
import { RootState } from '@/store'

import { state } from './state'
import type { OtherState } from './state'
export { OtherState }

import { getters } from './getters'
import { mutations } from './mutations'
import { actions } from './actions'

export const store: Module<OtherState, RootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
