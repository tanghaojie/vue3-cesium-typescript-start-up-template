import Vue from '@vitejs/plugin-vue'
import VueI18n from './vueI18n'
import Svg from './svg'
import ElementPlus from 'unplugin-element-plus/vite'

export function createVitePlugins(viteEnv: Record<string, string>, isBuild: boolean = false) {
  const vitePlugins = [
    // vitePluginCesium(),
    VueI18n(),
    Vue(),
    Svg(),
    ElementPlus(),
  ]

  return vitePlugins
}
