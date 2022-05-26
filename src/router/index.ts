import { createRouter, createWebHistory, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Home from '@/views/home'
import IndustryPanels from '@/views/home/industries'
import CarbonNeutalBigscreen from '@/views/home/industries/carbon-neutral-bigscreen'
import Test from '@/views/test/test.vue'

// const routes: Array<RouteRecordRaw> = [
//   {
//     path: '/',
//     name: 'Home',
//     component: Home,
//   },
// ]

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    children: [
      {
        path: 'industry',
        name: 'industry',
        component: IndustryPanels,
      },
      {
        path: 'carbon-neutral-bigscreen',
        name: 'carbon-neutral-bigscreen',
        component: CarbonNeutalBigscreen,
      },
    ],
  },
  {
    path: '/test',
    name: 'test',
    component: Test,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  // history: createWebHistory(),
  routes,
})

export default router
