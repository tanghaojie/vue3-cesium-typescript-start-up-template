import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { State } from './state'
import { LocationBarMutationTypes } from './mutation-types'
import { LocationBarActionTypes } from './action-types'

export const actions: ActionTree<State, RootState> = {
  async [LocationBarActionTypes.RESET_STATE]({ commit }) {
    commit(LocationBarMutationTypes.RESET_STATE)
  },

  async [LocationBarActionTypes.SET_SHOW_CAMERA_LOCATION](
    { commit },
    payload: boolean
  ) {
    commit(LocationBarMutationTypes.SET_SHOW_CAMERA_LOCATION, payload)
  },

  async [LocationBarActionTypes.SET_SHOW_MOUSE_LOCATION](
    { commit },
    payload: boolean
  ) {
    commit(LocationBarMutationTypes.SET_SHOW_MOUSE_LOCATION, payload)
  },

  async [LocationBarActionTypes.SET_SHOW_FPS]({ commit }, payload: boolean) {
    commit(LocationBarMutationTypes.SET_SHOW_FPS, payload)
  },
}
