import { GetterTree } from 'vuex'

import { RootState } from '@/store'

import { State } from './state'
import { LocationBarGetterTypes } from './getter-types'

export type Getter = {
  [LocationBarGetterTypes.ALL_SHOW](state: State): boolean
}

export const getters: GetterTree<State, RootState> & Getter = {
  [LocationBarGetterTypes.ALL_SHOW](state) {
    return state.showCameraLocation || state.showFPS || state.showMouseLocation
  },
}
