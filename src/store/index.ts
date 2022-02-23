import { InjectionKey } from 'vue'
import { createStore, useStore as baseUseStore, Store } from 'vuex'
import { store as template, State as TemplateState } from './modules/template'
import { store as jtCesiumVue, JTCesiumVueState } from './modules/jt-cesium-vue'

export type RootState = {
  template: TemplateState
  jtCesiumVue: JTCesiumVueState
}

export const key: InjectionKey<Store<RootState>> = Symbol()

export const store = createStore<RootState>({
  modules: {
    template,
    jtCesiumVue,
  },
})

export function useStore(): Store<RootState> {
  return baseUseStore(key)
}

export default store
