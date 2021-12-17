declare module 'cesium' {
  import('cesium')
  import { ImageryLayer, Viewer } from 'cesium'
  import Jt from '@/libs/cesium/cesium-jt'
  import ImageryLayerCoordinateTransform from '@/libs/cesium/libs/imagery-layer-coordinate-transform/ImageryLayerCoordinateTransform'
  import PrimitiveManager from '@/libs/cesium/libs/primitive-manager/PrimitiveManager'

  interface ImageryLayer {
    name: string
    uuid: string
    coordinateTransform: ?ImageryLayerCoordinateTransform
  }

  interface Viewer {
    jt?: Jt
  }

  interface Model {
    name: string
    uuid: string
    _PriManagFlag: string
  }

  interface Cesium3DTileset {
    name: string
    uuid: string
    _PriManagFlag: string
  }
}
