import { Module } from 'vuex'
import { RootState } from '@/store'

import { state } from './state'
import type { State } from './state'
export { State }

import { mutations } from './mutations'
import { actions } from './actions'

export const store: Module<State, RootState> = {
  namespaced: true,
  state,
  mutations,
  actions,
}
