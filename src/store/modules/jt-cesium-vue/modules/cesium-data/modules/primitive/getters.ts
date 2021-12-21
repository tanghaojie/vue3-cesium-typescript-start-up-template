import { GetterTree } from 'vuex'
import { RootState } from '@/store'
import { PrimitiveState } from './state'

export const getters: GetterTree<PrimitiveState, RootState> = {
  // getTestStr: (state) => state.test.toString() + 'str',
}
