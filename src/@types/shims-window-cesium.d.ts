/* eslint-disable */
declare namespace globalThis {
  import('cesium')
  import * as Cesium from 'cesium'

  interface Window {
    viewer?: Cesium.Viewer
    Cesium?: Cesium
  }
}
