import { App } from 'vue'

export type CesiumRef = import('@/@types/shims-cesium-ref').CesiumRef

export const CESIUM_REF_KEY = Symbol('cesiumRef')

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    readonly $cesiumRef: CesiumRef
    readonly cesiumRef: CesiumRef
  }
}

export default {
  install: function (app: App<Element>): void {
    const cr: CesiumRef = {
      viewer: undefined,
      viewerContainer: undefined,
    }
    app.config.globalProperties.$cesiumRef = cr
    app.provide<CesiumRef>(CESIUM_REF_KEY, cr)
  },
}
