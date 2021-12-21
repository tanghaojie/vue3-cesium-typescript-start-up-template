import * as Cesium from 'cesium'

import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { PrimitiveState } from './state'
import { PrimitiveMutationTypes } from './mutation-types'
import { PrimitiveActionTypes } from './action-types'

export const actions: ActionTree<PrimitiveState, RootState> = {
  async [PrimitiveActionTypes.RESET_STATE]({ commit }) {
    commit(PrimitiveMutationTypes.RESET_STATE)
  },

  // Primitive
  async [PrimitiveActionTypes.SYNC_PRIMITIVES](
    { commit },
    payload: Cesium.Viewer
  ) {
    commit(PrimitiveMutationTypes.SYNC_PRIMITIVES, payload)
  },
}
