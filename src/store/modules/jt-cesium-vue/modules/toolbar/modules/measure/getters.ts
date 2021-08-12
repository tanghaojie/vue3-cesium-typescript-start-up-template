import { GetterTree } from 'vuex'
import { RootState } from '@/store'
import { MeasureState } from './state'

export const getters: GetterTree<MeasureState, RootState> = {
  // getTestStr: (state) => state.test.toString() + 'str',
}
