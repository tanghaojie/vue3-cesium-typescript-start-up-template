import { Module } from 'vuex'
import { RootState } from '@/store'

import { store as nature } from './modules/nature'
import { store as tool3DTile } from './modules/tool3DTile'
import { store as other } from './modules/other'
import { store as draw } from './modules/draw'
import { store as measure } from './modules/measure'
import { store as imagery } from './modules/imagery'

import { state } from './state'
import type { ToolbarStateAndModule, State } from './state'
export { ToolbarStateAndModule }

import { getters } from './getters'
import { mutations } from './mutations'
import { actions } from './actions'

type ToolbarState = ToolbarStateAndModule | State

export const store: Module<ToolbarState, RootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
  modules: {
    nature,
    tool3DTile,
    other,
    draw,
    measure,
    imagery,
  },
}
