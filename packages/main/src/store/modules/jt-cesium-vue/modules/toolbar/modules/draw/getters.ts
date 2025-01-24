import { GetterTree } from 'vuex'
import { RootState } from '@/store'
import { DrawState } from './state'

export const getters: GetterTree<DrawState, RootState> = {
  // getTestStr: (state) => state.test.toString() + 'str',
}
