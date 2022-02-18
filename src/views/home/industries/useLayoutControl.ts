import { Store } from 'vuex'
import type { RootState } from '@/store'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'

export default function () {
  function hideAllLayout(store: Store<RootState>) {
    store.dispatch(
      `jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_TOOLBAR}`,
      false
    )
    store.dispatch(
      `jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_BROWSER_PANEL}`,
      false
    )
    store.dispatch(
      `jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_SETTING_BUTTON}`,
      false
    )
  }

  function defaultLayout(store: Store<RootState>) {
    store.dispatch(
      `jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_TOOLBAR}`,
      true
    )
    store.dispatch(
      `jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_BROWSER_PANEL}`,
      true
    )
    store.dispatch(
      `jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_SETTING_BUTTON}`,
      false
    )
  }

  return {
    hideAllLayout,
    defaultLayout,
  }
}
