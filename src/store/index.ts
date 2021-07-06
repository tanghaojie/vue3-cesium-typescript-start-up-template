import { createStore } from 'vuex'
import { store as template, State as TemplateState } from './modules/template'
import { store as jtCesiumVue, JTCesiumVueState } from './modules/jt-cesium-vue'

export type RootState = {
  template: TemplateState
  jtCesiumVue: JTCesiumVueState
}

export default createStore<RootState>({
  modules: {
    template,
    jtCesiumVue,
  },
})
