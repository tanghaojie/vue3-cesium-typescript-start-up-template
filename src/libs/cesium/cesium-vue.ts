import { App } from 'vue'
import * as Cesium from 'cesium'

declare module '@vue/runtime-core' {
  interface CesiumVue {
    viewer: Cesium.Viewer | undefined
    viewerContainer: HTMLElement | undefined
  }
  interface ComponentCustomProperties {
    readonly $cv: CesiumVue
  }
}

export default {
  install: function (app: App<Element>): void {
    app.config.globalProperties.$cv = {
      viewer: undefined,
      viewerContainer: undefined,
    }
  },
}
