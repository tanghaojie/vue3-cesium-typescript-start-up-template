declare module 'cesium' {
  import('cesium')
  import { ImageryLayer, Viewer } from 'cesium'
  import Draw from '@/libs/cesium/libs/draw/Draw'

  interface ImageryLayer {
    name: string
    uuid: string
  }

  interface Viewer {
    jtDraw?: Draw
  }
}
