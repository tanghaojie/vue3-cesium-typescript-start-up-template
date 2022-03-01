import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { store, key } from './store'
import register from './components/jt-global-register'
import i18n from './i18n'

// global css
import './assets/styles/index.css'

// cesium vue
import cesiumVue from './libs/cesium/cesium-vue'

const app = createApp(App)

app.use(store, key).use(router).use(cesiumVue).use(i18n)

register(app)

app.mount('#app')
