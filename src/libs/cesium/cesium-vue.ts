import { App } from 'vue'

type CesiumRef = import('@/@types/shims-cesium-ref').CesiumRef

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    readonly $cesiumRef: CesiumRef
    readonly cesiumRef: CesiumRef
  }
}

export default {
  install: function (app: App<Element>): void {
    const cr = {
      viewer: undefined,
      viewerContainer: undefined,
    }
    app.config.globalProperties.$cesiumRef = cr
    app.provide<CesiumRef>('cesiumRef', cr)
  },
}
