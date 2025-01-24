import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { DrawState } from './state'
import { DrawMutationTypes } from './mutation-types'

export const mutations: MutationTree<DrawState> = {
  [DrawMutationTypes.RESET_STATE](state: DrawState) {
    Object.assign(state, defaultState())
  },

  // draw
  [DrawMutationTypes.SET_DRAW_POINT_ACTIVE](
    state: DrawState,
    payload: boolean
  ) {
    state.drawPointActive = payload
  },

  [DrawMutationTypes.SET_DRAW_POLYLINE_ACTIVE](
    state: DrawState,
    payload: boolean
  ) {
    state.drawPolylineActive = payload
  },

  [DrawMutationTypes.SET_DRAW_POLYGON_ACTIVE](
    state: DrawState,
    payload: boolean
  ) {
    state.drawPolygonActive = payload
  },
}
