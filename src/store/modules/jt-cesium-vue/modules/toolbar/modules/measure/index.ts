import { Module } from 'vuex'
import { RootState } from '@/store'

import { state } from './state'
import type { MeasureState } from './state'
export { MeasureState }

import { getters } from './getters'
import { mutations } from './mutations'
import { actions } from './actions'

export const store: Module<MeasureState, RootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
