import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { DrawState } from './state'
import { DrawMutationTypes } from './mutation-types'
import { DrawActionTypes } from './action-types'

export const actions: ActionTree<DrawState, RootState> = {
  async [DrawActionTypes.RESET_STATE]({ commit }) {
    commit(DrawMutationTypes.RESET_STATE)
  },

  // draw
  async [DrawActionTypes.SET_DRAW_POINT_ACTIVE]({ commit }, payload: boolean) {
    commit(DrawMutationTypes.SET_DRAW_POINT_ACTIVE, payload)
  },

  async [DrawActionTypes.SET_DRAW_POLYLINE_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(DrawMutationTypes.SET_DRAW_POLYLINE_ACTIVE, payload)
  },

  async [DrawActionTypes.SET_DRAW_POLYGON_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(DrawMutationTypes.SET_DRAW_POLYGON_ACTIVE, payload)
  },
}
