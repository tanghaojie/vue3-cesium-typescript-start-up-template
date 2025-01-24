import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
import { createVitePlugins } from './vite/plugins'
import { CESIUM_STATIC } from './vite/plugins/cesium'

export default defineConfig(({ command, mode }) => {
  const alias = [{ find: '@', replacement: resolve(__dirname, 'src') }]
  const env = loadEnv(mode, '')

  return {
    define: {
      CESIUM_BASE_URL: JSON.stringify(`/${CESIUM_STATIC}`),
    },
    plugins: createVitePlugins(env, command === 'build'),
    resolve: {
      alias,
    },
  }
})
