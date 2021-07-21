import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// global css
import './assets/styles/index.css'

// jt icon
import importAll from './utils/import/import-all'
importAll(require.context('./components/jt-icon/svgs', true, /\.svg$/))
import jtIcon from './components/jt-icon/index.vue'

// cesium vue
import cesiumVue from './libs/cesium/cesium-vue'

import 'element-plus/packages/theme-chalk/src/base.scss'

;(window as any).ss = process.env

const app = createApp(App)

app.use(store).use(router).use(cesiumVue)

app.component('jt-icon', jtIcon)

app.mount('#app')
