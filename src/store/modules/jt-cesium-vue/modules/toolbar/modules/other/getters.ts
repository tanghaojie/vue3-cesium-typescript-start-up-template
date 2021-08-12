import { GetterTree } from 'vuex'
import { RootState } from '@/store'
import { OtherState } from './state'

export const getters: GetterTree<OtherState, RootState> = {
  // getTestStr: (state) => state.test.toString() + 'str',
}
