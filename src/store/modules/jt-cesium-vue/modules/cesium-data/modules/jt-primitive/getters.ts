import { GetterTree } from 'vuex'
import { RootState } from '@/store'
import { JTPrimitiveState } from './state'

export const getters: GetterTree<JTPrimitiveState, RootState> = {
  // getTestStr: (state) => state.test.toString() + 'str',
}
