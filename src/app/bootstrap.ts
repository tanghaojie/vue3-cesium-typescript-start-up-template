import { createApp } from 'vue'
import GeoWorkspacePage from '@/modules/geo/pages/GeoWorkspacePage.vue'
import { localization, registerLocalizationResources } from '@/shared/localization/localization'
import { localizationResource } from '@/modules/geo/geo.locales'
import { appConfig } from './app.config'

export function startApplication(): void {
  registerLocalizationResources({ geo: { localizationResource } })
  if (import.meta.env.VITE_APP_NAME) {
    document.title = appConfig.fullName
  }
  createApp(GeoWorkspacePage, { projectInfoUrl: '/about/' }).use(localization).mount('#app')
}
