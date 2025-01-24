import * as Cesium from 'cesium'
import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { JTPrimitiveState } from './state'
import { JTPrimitiveMutationTypes } from './mutation-types'
import { JTPrimitive } from '@/libs/cesium/libs/primitive-manager/PrimitiveManager'

export const mutations: MutationTree<JTPrimitiveState> = {
  [JTPrimitiveMutationTypes.RESET_STATE](state: JTPrimitiveState) {
    Object.assign(state, defaultState())
  },

  // primitive
  [JTPrimitiveMutationTypes.SYNC_JTPRIMITIVES](
    state: JTPrimitiveState,
    payload: JTPrimitive[]
  ) {
    state.jtPrimitives.splice(0, state.jtPrimitives.length)
    state.jtPrimitives.push(...payload)
  },
}
