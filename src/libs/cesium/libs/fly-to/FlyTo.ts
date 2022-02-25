import {
  Viewer,
  Matrix4,
  Cartesian3,
  Math,
  Rectangle,
  Camera,
  EasingFunction,
} from 'cesium'

class FlyTo {
  private viewer: Viewer

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  flyTo(options: {
    destination: Cartesian3 | Rectangle
    orientation?: any
    duration?: number
    complete?: Camera.FlightCompleteCallback
    cancel?: Camera.FlightCancelledCallback
    endTransform?: Matrix4
    maximumHeight?: number
    pitchAdjustHeight?: number
    flyOverLongitude?: number
    flyOverLongitudeWeight?: number
    convert?: boolean
    easingFunction?: EasingFunction.Callback
  }): void {
    this.viewer.camera.flyTo(options)
  }

  flyToEarth(): void {
    this.flyTo({
      destination: Cartesian3.fromDegrees(110, 16, 20000000),
      orientation: {
        heading: Math.toRadians(0),
        pitch: Math.toRadians(-90),
        roll: 0.0,
      },
      duration: 1,
    })
  }

  flyToChina(): void {
    this.flyTo({
      destination: Cartesian3.fromDegrees(109, 33.2, 5000000),
      orientation: {
        heading: Math.toRadians(0),
        pitch: Math.toRadians(-90),
        roll: 0.0,
      },
      duration: 1,
    })
  }
}

export default FlyTo
