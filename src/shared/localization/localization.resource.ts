export const supportedLocaleCodes = ['zh-CN', 'en-US'] as const

export type SupportedLocale = (typeof supportedLocaleCodes)[number]
export type TranslationMessages = Readonly<Record<string, string>>

export interface LocalizationResource {
  namespace: string
  messages: Readonly<Record<SupportedLocale, TranslationMessages>>
}

type MatchingMessageKeys<
  Source extends TranslationMessages,
  Candidate extends { [Key in keyof Source]: string },
> = Candidate & Record<Exclude<keyof Candidate, keyof Source>, never>

/**
 * 以中文资源为结构基准校验英文键集合，避免运行时切换后才发现整段文案缺失。
 */
export function defineLocalizationResource<
  const Chinese extends TranslationMessages,
  const English extends { [Key in keyof Chinese]: string },
>(
  namespace: string,
  messages: {
    'zh-CN': Chinese
    'en-US': MatchingMessageKeys<Chinese, English>
  },
): LocalizationResource {
  return { namespace, messages }
}
