// @ts-ignore
import { createI18n } from 'vue-i18n'
import messages from './languages'

const defaultLocale = 'zh'
const localStorageKey = 'locale.name'

const cachedLocale = localStorage.getItem(localStorageKey)
const locale = cachedLocale ? cachedLocale : defaultLocale

export function setLocaleCache(locale: string) {
  localStorage.setItem(localStorageKey, locale)
}

const i18n = createI18n({
  locale,
  fallbackLocale: 'en',
  legacy: false,
  globalInstall: false,
  messages,
})

export default i18n
