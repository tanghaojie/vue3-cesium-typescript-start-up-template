import { Module } from 'vuex'
import { RootState } from '@/store'

import { state } from './state'
import type { Tool3DTileState } from './state'
export { Tool3DTileState }

import { getters } from './getters'
import { mutations } from './mutations'
import { actions } from './actions'

export const store: Module<Tool3DTileState, RootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
