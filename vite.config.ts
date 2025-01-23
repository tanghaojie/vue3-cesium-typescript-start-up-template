import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
import { createVitePlugins } from './vite/plugins'

export default defineConfig(({ command, mode }) => {
  const alias = [{ find: '@', replacement: resolve(__dirname, 'src') }]
  const env = loadEnv(mode, '')

  return {
    plugins: createVitePlugins(env, command === 'build'),
    resolve: {
      alias,
    },
  }
})
