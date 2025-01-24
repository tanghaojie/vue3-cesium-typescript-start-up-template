import * as Cesium from 'cesium'

interface CesiumRef {
  viewer: Cesium.Viewer | undefined
  viewerContainer: HTMLElement | undefined
}
