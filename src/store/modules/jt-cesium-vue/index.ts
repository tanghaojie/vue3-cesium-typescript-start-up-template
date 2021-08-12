import { Module } from 'vuex'
import { RootState } from '@/store'

import {
  store as locationbar,
  State as LocationbarState,
} from './modules/locationbar'

import { store as setting, State as SettingState } from './modules/setting'
import { store as layout, State as LayoutState } from './modules/layout'

import type { ToolbarStateAndModule } from './modules/toolbar'
import { store as toolbar } from './modules/toolbar'

export type JTCesiumVueState = {
  locationbar: LocationbarState
  setting: SettingState
  layout: LayoutState
  toolbar: ToolbarStateAndModule
}

export const store: Module<JTCesiumVueState, RootState> = {
  namespaced: true,
  modules: {
    locationbar,
    setting,
    layout,
    toolbar,
  },
}
