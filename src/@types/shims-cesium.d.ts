declare module 'cesium' {
  import('cesium')
  import { ImageryLayer, Viewer } from 'cesium'
  import Jt from '@/libs/cesium/cesium-jt'
  import ImageryLayerCoordinateTransform from '@/libs/cesium/libs/imagery-layer-coordinate-transform/ImageryLayerCoordinateTransform'

  interface ImageryLayer {
    name: string
    uuid: string
    coordinateTransform: ?ImageryLayerCoordinateTransform
  }

  interface Viewer {
    jt?: Jt
  }
}
