import * as Cesium from 'cesium'

import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { JTPrimitiveState } from './state'
import { JTPrimitiveMutationTypes } from './mutation-types'
import { JTPrimitiveActionTypes } from './action-types'

export const actions: ActionTree<JTPrimitiveState, RootState> = {
  async [JTPrimitiveActionTypes.RESET_STATE]({ commit }) {
    commit(JTPrimitiveMutationTypes.RESET_STATE)
  },

  // Primitive
  async [JTPrimitiveActionTypes.SYNC_JTPRIMITIVES](
    { commit, state },
    payload: Cesium.Viewer
  ) {
    if (!payload) {
      return
    }
    const pris = payload.jt?.primitiveManager.syncJTPrimitives()

    commit(JTPrimitiveMutationTypes.SYNC_JTPRIMITIVES, pris)
  },
}
