import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import vueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default function vueI18n() {
  return vueI18nPlugin({
    include: resolve(dirname(fileURLToPath(import.meta.url)), './src/i18n/languages/**'),
  })
}
