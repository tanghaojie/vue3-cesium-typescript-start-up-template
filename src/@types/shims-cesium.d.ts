declare module 'cesium' {
  import('cesium')
  import { ImageryLayer } from 'cesium'

  interface ImageryLayer {
    name: string
    uuid: string
  }
}
