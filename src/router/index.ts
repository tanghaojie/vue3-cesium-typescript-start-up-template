import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/home.vue'
import Test from '../views/test.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/test',
    name: 'test',
    component: Test,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
