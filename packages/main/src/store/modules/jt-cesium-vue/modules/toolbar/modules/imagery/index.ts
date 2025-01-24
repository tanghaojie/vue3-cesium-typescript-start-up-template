import { Module } from 'vuex'
import { RootState } from '@/store'

import { state } from './state'
import type { ImageryState } from './state'
export { ImageryState }

import { getters } from './getters'
import { mutations } from './mutations'
import { actions } from './actions'

export const store: Module<ImageryState, RootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
