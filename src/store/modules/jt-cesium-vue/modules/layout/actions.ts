import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { State, OverlayDynamicView } from './state'
import { LayoutMutationTypes } from './mutation-types'
import { LayoutActionTypes } from './action-types'

export const actions: ActionTree<State, RootState> = {
  async [LayoutActionTypes.RESET_STATE]({ commit }) {
    commit(LayoutMutationTypes.RESET_STATE)
  },

  async [LayoutActionTypes.SET_SHOW_BROWSER_PANEL](
    { commit },
    payload: boolean
  ) {
    commit(LayoutMutationTypes.SET_SHOW_BROWSER_PANEL, payload)
  },

  async [LayoutActionTypes.SET_SHOW_TOOLBAR]({ commit }, payload: boolean) {
    commit(LayoutMutationTypes.SET_SHOW_TOOLBAR, payload)
  },

  async [LayoutActionTypes.SET_SHOW_SETTING_BUTTON](
    { commit },
    payload: boolean
  ) {
    commit(LayoutMutationTypes.SET_SHOW_SETTING_BUTTON, payload)
  },

  async [LayoutActionTypes.SET_TOOLBAR_HEIGHT]({ commit }, payload: number) {
    commit(LayoutMutationTypes.SET_TOOLBAR_HEIGHT, payload)
  },

  async [LayoutActionTypes.ADD_UNIQUE_NAME_OVERLAY_DYNAMIC_VIEW_BY_NAME](
    { commit },
    payload: string
  ) {
    commit(
      LayoutMutationTypes.ADD_UNIQUE_NAME_OVERLAY_DYNAMIC_VIEW_BY_NAME,
      payload
    )
  },

  async [LayoutActionTypes.REMOVE_OVERLAY_DYNAMIC_VIEW_BY_NAME](
    { commit },
    payload: string
  ) {
    commit(LayoutMutationTypes.REMOVE_OVERLAY_DYNAMIC_VIEW_BY_NAME, payload)
  },
}
