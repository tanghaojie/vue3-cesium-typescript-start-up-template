/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
  readonly VITE_PORT?: string
  readonly VITE_GEO_TIANDITU_TOKEN?: string
  readonly VITE_GEO_AI_MODELS_CATALOG_URL?: string
}

declare module 'virtual:svg-icons-register' {
  const registerSvgIcons: void
  export default registerSvgIcons
}

declare module 'virtual:svg-icons-names' {
  const iconSymbolIds: string[]
  export default iconSymbolIds
}
