import {
  Viewer,
  Color,
  Cartesian3,
  Scene,
  defined,
  JulianDate,
  SunLight,
  DirectionalLight,
  Matrix3,
  Transforms,
  Simon1994PlanetaryPositions,
} from 'cesium'

class Light {
  private viewer: Viewer

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  public static updateFlashLightListener(scene: Scene): void {
    ;(scene.light as any).direction = Cartesian3.clone(
      scene.camera.directionWC,
      (scene.light as any).direction
    )
  }

  public getSunLight(): SunLight {
    return new SunLight()
  }

  public getFlashLight(): DirectionalLight {
    return new DirectionalLight({
      direction: this.viewer.scene.camera.directionWC,
    })
  }

  public static getMoonDirection(currentTime: JulianDate): Cartesian3 {
    const icrfToFixed = new Matrix3()
    const scratchMoonPosition = new Cartesian3()
    const scratchMoonDirection = new Cartesian3()
    if (
      !defined(Transforms.computeIcrfToFixedMatrix(currentTime, icrfToFixed))
    ) {
      Transforms.computeTemeToPseudoFixedMatrix(currentTime, icrfToFixed)
    }
    const moonPosition =
      Simon1994PlanetaryPositions.computeMoonPositionInEarthInertialFrame(
        currentTime,
        scratchMoonPosition
      )
    Matrix3.multiplyByVector(icrfToFixed, moonPosition, moonPosition)
    const moonDirection = Cartesian3.normalize(
      moonPosition,
      scratchMoonDirection
    )
    return Cartesian3.negate(moonDirection, new Cartesian3())
  }

  public getMoonLight(currentTime: JulianDate): DirectionalLight {
    return new DirectionalLight({
      direction: Light.getMoonDirection(currentTime),
      color: new Color(0.9, 0.925, 1.0),
      intensity: 1,
    })
  }

  public static updateMoonLightListener(
    scene: Scene,
    currentTime: JulianDate
  ): void {
    ;(scene.light as DirectionalLight).direction =
      Light.getMoonDirection(currentTime)
  }
}

export default Light
