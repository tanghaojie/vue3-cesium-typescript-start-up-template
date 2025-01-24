import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { store, key } from './store'
// import register from './components/jt-global-register'
import i18n from './i18n'
import VueCesium from './libs/cesium/VueCesium'
// global css
import './assets/styles/index.css'

const app = createApp(App)

app.use(store, key).use(router).use(VueCesium).use(i18n)

app.mount('#app')
