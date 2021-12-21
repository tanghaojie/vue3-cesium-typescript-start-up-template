import * as Cesium from 'cesium'
import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { PrimitiveState } from './state'
import { PrimitiveMutationTypes } from './mutation-types'

export const mutations: MutationTree<PrimitiveState> = {
  [PrimitiveMutationTypes.RESET_STATE](state: PrimitiveState) {
    Object.assign(state, defaultState())
  },

  // primitive
  [PrimitiveMutationTypes.SYNC_PRIMITIVES](
    state: PrimitiveState,
    payload: Cesium.Viewer
  ) {
    state.primitives.splice(0, state.primitives.length)
    if (!payload) {
      return
    }
    const pris = payload.jt?.primitiveManager.syncPrimitives()
    pris && state.primitives.push(...pris)
  },
}
