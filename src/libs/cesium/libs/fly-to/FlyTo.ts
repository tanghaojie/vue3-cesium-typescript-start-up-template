import * as Cesium from 'cesium'

class FlyTo {
  private viewer: Cesium.Viewer

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  flyTo(options: {
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
  }): void {
    this.viewer.camera.flyTo(options)
  }

  flyToEarth(): void {
    this.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(110, 16, 20000000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0.0,
      },
      duration: 1,
    })
  }

  flyToChina(): void {
    this.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(109, 33.2, 5000000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0.0,
      },
      duration: 1,
    })
  }
}

export default FlyTo
