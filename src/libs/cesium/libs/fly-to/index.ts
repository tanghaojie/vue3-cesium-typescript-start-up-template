import * as Cesium from 'cesium'

const flyTo = function (
  viewer: Cesium.Viewer,
  options: {
    destination: Cesium.Cartesian3 | Cesium.Rectangle
    orientation?: any
    duration?: number
    complete?: Cesium.Camera.FlightCompleteCallback
    cancel?: Cesium.Camera.FlightCancelledCallback
    endTransform?: Cesium.Matrix4
    maximumHeight?: number
    pitchAdjustHeight?: number
    flyOverLongitude?: number
    flyOverLongitudeWeight?: number
    convert?: boolean
    easingFunction?: Cesium.EasingFunction.Callback
  }
): void {
  viewer.camera.flyTo(options)
}

export default flyTo

const flyToEarth = function (viewer: Cesium.Viewer): void {
  flyTo(viewer, {
    destination: Cesium.Cartesian3.fromDegrees(110, 16, 20000000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0,
    },
    duration: 1,
  })
}

const flyToChina = function (viewer: Cesium.Viewer): void {
  flyTo(viewer, {
    destination: Cesium.Cartesian3.fromDegrees(109, 33.2, 5000000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0,
    },
    duration: 1,
  })
}

export { flyToEarth, flyToChina }
