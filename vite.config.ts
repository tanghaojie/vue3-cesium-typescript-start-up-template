import { defineConfig, loadEnv } from 'vite'
import { resolve, dirname } from 'path'
import cesium from 'vite-plugin-cesium'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import vueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { fileURLToPath } from 'url'

const x = resolve(dirname(fileURLToPath(import.meta.url)), './src/i18n/languages/**')
console.log(x)

export default defineConfig(({ command, mode }) => {
  const alias = [{ find: '@', replacement: resolve(__dirname, 'src') }]
  // if (mode === 'development') {
  //   alias['vue-i18n'] = 'vue-i18n/dist/vue-i18n.cjs.js'
  // }

  return {
    plugins: [
      vueI18nPlugin({
        include: resolve(dirname(fileURLToPath(import.meta.url)), './src/i18n/languages/**'),
      }),
      vue(),
      cesium(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      createSvgIconsPlugin({
        iconDirs: [
          resolve(process.cwd(), 'src/components/jt-global-register/components/jt-icon/svgs'),
        ],
        symbolId: '[name]',
        inject: 'body-last',
        customDomId: '__jt__svg__icons__dom__',
      }),
    ],
    resolve: {
      alias,
    },
  }
})
