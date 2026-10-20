import { computed } from 'vue'
import { createI18n, useI18n } from 'vue-i18n'
import {
  supportedLocaleCodes,
  type LocalizationResource,
  type SupportedLocale,
} from '@/shared/localization/localization.resource'

function browserStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

const DEFAULT_LOCALE: SupportedLocale = 'zh-CN'
function storageKey(): string {
  return 'cesium-workbench:locale:v1'
}

export interface LocalizedLabel {
  key?: string
  fallback: string
}

interface LocalizationResourceModule {
  localizationResource: LocalizationResource
}

interface LocaleMessageTree {
  [key: string]: string | LocaleMessageTree
}

export const supportedLocales = Object.freeze([
  { code: 'zh-CN' as const, shortLabel: '中', nativeLabel: '中文' },
  { code: 'en-US' as const, shortLabel: 'EN', nativeLabel: 'English' },
])

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return (
    typeof value === 'string' &&
    supportedLocaleCodes.includes(value as (typeof supportedLocaleCodes)[number])
  )
}

function initialLocale(): SupportedLocale {
  try {
    const requested = new URLSearchParams(window.location.search).get('lang')
    if (isSupportedLocale(requested)) {
      return requested
    }
    const stored = browserStorage()?.getItem(storageKey())
    return isSupportedLocale(stored) ? stored : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

function expandMessageKeys(messages: Readonly<Record<string, string>>): LocaleMessageTree {
  const expanded: LocaleMessageTree = Object.create(null)

  for (const [path, message] of Object.entries(messages)) {
    const segments = path.split('.')
    let target = expanded
    for (const [index, segment] of segments.entries()) {
      if (index === segments.length - 1) {
        target[segment] = message
        continue
      }
      const child = target[segment]
      if (typeof child === 'string') {
        throw new Error(`Localization key "${path}" conflicts with an existing message`)
      }
      target[segment] = child ?? Object.create(null)
      target = target[segment] as LocaleMessageTree
    }
  }

  return expanded
}

const namespaces = new Set<string>()

function collectMessages(
  resourceModules: Readonly<Record<string, unknown>>,
): Record<SupportedLocale, Record<string, LocaleMessageTree>> {
  const messages: Record<SupportedLocale, Record<string, LocaleMessageTree>> = {
    'zh-CN': Object.create(null),
    'en-US': Object.create(null),
  }
  for (const [modulePath, candidate] of Object.entries(resourceModules).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const module = candidate as LocalizationResourceModule
    const resource = module.localizationResource
    if (!resource || !/^[a-z][a-z0-9-]*$/.test(resource.namespace)) {
      throw new Error(`Invalid localization resource exported by "${modulePath}"`)
    }
    if (namespaces.has(resource.namespace)) {
      throw new Error(`Duplicate localization namespace "${resource.namespace}"`)
    }
    namespaces.add(resource.namespace)
    messages['zh-CN'][resource.namespace] = expandMessageKeys(resource.messages['zh-CN'])
    messages['en-US'][resource.namespace] = expandMessageKeys(resource.messages['en-US'])
  }

  return messages
}

const initialLocalizationResources: Record<string, LocalizationResourceModule> = {}

export const localization = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: collectMessages(initialLocalizationResources),
  fallbackWarn: false,
  missingWarn: import.meta.env.DEV,
})

export function registerLocalizationResources(
  resourceModules: Readonly<Record<string, unknown>>,
): void {
  const messages = collectMessages(resourceModules)
  for (const locale of supportedLocaleCodes) {
    localization.global.setLocaleMessage(locale, {
      ...localization.global.getLocaleMessage(locale),
      ...messages[locale],
    })
  }
}

export const currentLocale = computed(() => localization.global.locale.value as SupportedLocale)

function synchronizeDocument(locale: SupportedLocale): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}

export function setLocale(locale: SupportedLocale): void {
  if (!isSupportedLocale(locale)) {
    return
  }
  localization.global.locale.value = locale
  synchronizeDocument(locale)
  try {
    browserStorage()?.setItem(storageKey(), locale)
  } catch {
    // 浏览器拒绝持久化时保留响应式内存状态，当前页面仍可继续切换。
  }
}

export function translate(key: string, named?: Record<string, string | number>): string {
  return named ? localization.global.t(key, named) : localization.global.t(key)
}

export function resolveLocalizedLabel(label: LocalizedLabel | string): string {
  if (typeof label === 'string') {
    return label
  }
  if (label.key && localization.global.te(label.key)) {
    return translate(label.key)
  }
  return label.fallback
}

export function formatDateTime(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return new Intl.DateTimeFormat(currentLocale.value, options).format(date)
}

export function useLocalization() {
  const composer = useI18n({ useScope: 'global' })

  return {
    ...composer,
    currentLocale,
    supportedLocales,
    setLocale,
    resolveLocalizedLabel,
    formatDateTime,
  }
}

synchronizeDocument(currentLocale.value)

export type { SupportedLocale } from '@/shared/localization/localization.resource'
