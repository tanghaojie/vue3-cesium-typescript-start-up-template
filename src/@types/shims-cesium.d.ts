declare module 'cesium' {
  import('cesium')
  import { ImageryLayer, Viewer } from 'cesium'
  import Draw from '@/libs/cesium/libs/draw/Draw'
  import ElevationContour from '@/libs/cesium/libs/elevation-contour/ElevationContour'

  interface ImageryLayer {
    name: string
    uuid: string
  }

  interface Viewer {
    jtDraw?: Draw
    jtElevationContour?: ElevationContour
  }
}
