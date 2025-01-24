import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { MeasureState } from './state'
import { MeasureMutationTypes } from './mutation-types'

export const mutations: MutationTree<MeasureState> = {
  [MeasureMutationTypes.RESET_STATE](state: MeasureState) {
    Object.assign(state, defaultState())
  },

  // measure
  [MeasureMutationTypes.SET_MEASURE_POINT_ACTIVE](
    state: MeasureState,
    payload: boolean
  ) {
    state.measurePointActive = payload
  },

  [MeasureMutationTypes.SET_MEASURE_POLYLINE_ACTIVE](
    state: MeasureState,
    payload: boolean
  ) {
    state.measurePolylineActive = payload
  },

  [MeasureMutationTypes.SET_MEASURE_POLYGON_ACTIVE](
    state: MeasureState,
    payload: boolean
  ) {
    state.measurePolygonActive = payload
  },
}
