import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { State } from './state'
import { LocationBarMutationTypes } from './mutation-types'

export const mutations: MutationTree<State> = {
  [LocationBarMutationTypes.RESET_STATE](state: State) {
    Object.assign(state, defaultState())
  },

  [LocationBarMutationTypes.SET_SHOW_CAMERA_LOCATION](
    state: State,
    payload: boolean
  ) {
    state.showCameraLocation = payload
  },

  [LocationBarMutationTypes.SET_SHOW_MOUSE_LOCATION](
    state: State,
    payload: boolean
  ) {
    state.showMouseLocation = payload
  },

  [LocationBarMutationTypes.SET_SHOW_FPS](state: State, payload: boolean) {
    state.showFPS = payload
  },
}
