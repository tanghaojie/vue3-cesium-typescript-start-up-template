import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { OtherState } from './state'
import { OtherMutationTypes } from './mutation-types'
import { OtherActionTypes } from './action-types'
import { ClickHandlerOption } from '@/components/jt-toolbar/config/contents/Types'

export const actions: ActionTree<OtherState, RootState> = {
  async [OtherActionTypes.RESET_STATE]({ commit }) {
    commit(OtherMutationTypes.RESET_STATE)
  },

  // other
  async [OtherActionTypes.SWITCH_DEPTH_TEST_AGAINST_TERRAIN](
    { commit, state },
    options: ClickHandlerOption
  ) {
    const { viewer } = options
    if (!viewer) {
      return
    }
    const switchTo = !state.depthTestAgainstTerrain
    viewer.scene.globe.depthTestAgainstTerrain = switchTo
    commit(OtherMutationTypes.SET_DEPTH_TEST_AGAINST_TERRAIN, switchTo)
  },
}
