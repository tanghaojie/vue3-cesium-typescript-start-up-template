import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { MeasureState } from './state'
import { MeasureMutationTypes } from './mutation-types'
import { MeasureActionTypes } from './action-types'

export const actions: ActionTree<MeasureState, RootState> = {
  async [MeasureActionTypes.RESET_STATE]({ commit }) {
    commit(MeasureMutationTypes.RESET_STATE)
  },

  // measure
  async [MeasureActionTypes.SET_MEASURE_POINT_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(MeasureMutationTypes.SET_MEASURE_POINT_ACTIVE, payload)
  },

  async [MeasureActionTypes.SET_MEASURE_POLYLINE_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(MeasureMutationTypes.SET_MEASURE_POLYLINE_ACTIVE, payload)
  },

  async [MeasureActionTypes.SET_MEASURE_POLYGON_ACTIVE](
    { commit },
    payload: boolean
  ) {
    commit(MeasureMutationTypes.SET_MEASURE_POLYGON_ACTIVE, payload)
  },
}
