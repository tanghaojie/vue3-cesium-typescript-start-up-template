import { GetterTree } from 'vuex'
import { RootState } from '@/store'
import { ImageryState } from './state'

export const getters: GetterTree<ImageryState, RootState> = {
  // getTestStr: (state) => state.test.toString() + 'str',
}
