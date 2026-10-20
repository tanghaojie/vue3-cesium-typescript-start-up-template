import { createApp } from 'vue'
import GeoWorkspacePage from '@/modules/geo/pages/GeoWorkspacePage.vue'
import { localization, registerLocalizationResources } from '@/shared/localization/localization'
import { localizationResource } from '@/modules/geo/geo.locales'
import { appConfig } from './app.config'

export function startApplication(): void {
  registerLocalizationResources({ geo: { localizationResource } })
  document.title = appConfig.fullName
  createApp(GeoWorkspacePage).use(localization).mount('#app')
}
