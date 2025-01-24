import { Module } from 'vuex'
import { RootState } from '@/store'

import { state } from './state'
import type { NatureState } from './state'
export { NatureState }

import { mutations } from './mutations'
import { actions } from './actions'

export const store: Module<NatureState, RootState> = {
  namespaced: true,
  state,
  mutations,
  actions,
}
