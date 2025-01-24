import Vue from '@vitejs/plugin-vue'
import VueI18n from './vueI18n'
import Svg from './svg'
import ElementPlus from 'unplugin-element-plus/vite'
import Cesium from './cesium'
import tailwindcss from '@tailwindcss/vite'

export function createVitePlugins(viteEnv: Record<string, string>, isBuild: boolean = false) {
  const vitePlugins = [
    // vitePluginCesium(),
    VueI18n(),
    Vue(),
    Svg(),
    ElementPlus(),
    Cesium(),
    tailwindcss(),
  ]

  return vitePlugins
}
