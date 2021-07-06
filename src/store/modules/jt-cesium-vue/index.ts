import { Module } from 'vuex'
import { RootState } from '@/store'

import {
  store as locationbar,
  State as LocationbarState,
} from './modules/locationbar'

import { store as toolbar, State as ToolbarState } from './modules/toolbar'

import { store as setting, State as SettingState } from './modules/setting'

export type JTCesiumVueState = {
  locationbar: LocationbarState
  toolbar: ToolbarState
  setting: SettingState
}

export const store: Module<JTCesiumVueState, RootState> = {
  namespaced: true,
  modules: {
    locationbar,
    toolbar,
    setting,
  },
}
