import { Module } from 'vuex'
import { RootState } from '@/store'

import { store as jtPrimitive } from './modules/jt-primitive'

import { state } from './state'
import type { CesiumDataStateAndModule, State } from './state'
export { CesiumDataStateAndModule }

import { getters } from './getters'
import { mutations } from './mutations'
import { actions } from './actions'

type CesiumDataState = CesiumDataStateAndModule | State

export const store: Module<CesiumDataState, RootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
  modules: {
    jtPrimitive,
  },
}
