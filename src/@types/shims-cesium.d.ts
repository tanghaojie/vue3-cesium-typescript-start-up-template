declare module 'cesium' {
  import('cesium')
  import { ImageryLayer, Viewer } from 'cesium'
  import Jt from '@/libs/cesium/cesium-jt'

  interface ImageryLayer {
    name: string
    uuid: string
  }

  interface Viewer {
    jt?: Jt
  }
}
