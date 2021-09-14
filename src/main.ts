import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import register from './components/jt-global-register'

// global css
import './assets/styles/index.css'

// cesium vue
import cesiumVue from './libs/cesium/cesium-vue'

import 'element-plus/packages/theme-chalk/src/base.scss'

const app = createApp(App)

app.use(store).use(router).use(cesiumVue)

register(app)

app.mount('#app')
