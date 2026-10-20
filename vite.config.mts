import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, normalizePath } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const root = fileURLToPath(new URL('.', import.meta.url))
const cesiumBaseUrl = '/cesiumStatic/'
const cesiumSource = normalizePath(resolve(root, 'node_modules/cesium/Build/Cesium'))

export default defineConfig(function configure({ mode }) {
  const environment = loadEnv(mode, root, '')
  return {
    base: '/',
    define: { CESIUM_BASE_URL: JSON.stringify(cesiumBaseUrl) },
    resolve: { alias: { '@': resolve(root, 'src') } },
    build: {
      rollupOptions: {
        input: { workbench: resolve(root, 'index.html'), geo: resolve(root, 'geo.html') },
      },
    },
    plugins: [
      vue(),
      tailwindcss(),
      createSvgIconsPlugin({
        iconDirs: [resolve(root, 'src/shared/assets/icons')],
        symbolId: 'icon-[name]',
      }),
      AutoImport({ resolvers: [ElementPlusResolver()], dts: false }),
      Components({ resolvers: [ElementPlusResolver()], dts: false }),
      viteStaticCopy({
        targets: ['Workers', 'ThirdParty', 'Assets', 'Widgets'].map(
          function staticTarget(directory) {
            return { src: cesiumSource + '/' + directory, dest: 'cesiumStatic' }
          },
        ),
      }),
    ],
    server: { port: Number(environment.VITE_PORT || 3333) },
  }
})
