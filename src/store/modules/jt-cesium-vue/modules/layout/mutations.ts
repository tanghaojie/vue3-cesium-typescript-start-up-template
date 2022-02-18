import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { State } from './state'
import type { OverlayDynamicView } from './state'
import { LayoutMutationTypes } from './mutation-types'
import uuid from '@/libs/utils/uuid'

export const mutations: MutationTree<State> = {
  [LayoutMutationTypes.RESET_STATE](state: State) {
    Object.assign(state, defaultState())
  },

  [LayoutMutationTypes.SET_SHOW_BROWSER_PANEL](state: State, payload: boolean) {
    state.showBrowserPanel = payload
  },

  [LayoutMutationTypes.SET_SHOW_TOOLBAR](state: State, payload: boolean) {
    state.showToolbar = payload
  },

  [LayoutMutationTypes.SET_SHOW_SETTING_BUTTON](state: State, payload: boolean) {
    state.showSettingButton = payload
  },

  [LayoutMutationTypes.SET_TOOLBAR_HEIGHT](state: State, payload: number) {
    state.toolbarHeight = payload
  },

  [LayoutMutationTypes.ADD_UNIQUE_NAME_OVERLAY_DYNAMIC_VIEW_BY_NAME](
    state: State,
    payload: string
  ) {
    if (!payload) {
      return
    }
    if (state.overlayDynamicViews.find((x) => x.name === payload)) {
      return
    }
    state.overlayDynamicViews.push({
      name: payload,
      uuid: uuid(),
    })
  },

  [LayoutMutationTypes.REMOVE_OVERLAY_DYNAMIC_VIEW_BY_NAME](
    state: State,
    payload: string
  ) {
    state.overlayDynamicViews = state.overlayDynamicViews.filter(
      (x) => x.name !== payload
    )
  },
}
