import { GetterTree } from 'vuex'
import { RootState } from '@/store'
import { State } from './state'

export const getters: GetterTree<State, RootState> = {
  // getTestStr: (state) => state.test.toString() + 'str',
}
