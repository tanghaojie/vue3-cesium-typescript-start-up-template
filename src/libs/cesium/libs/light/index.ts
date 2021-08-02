import * as Cesium from 'cesium'

export const getSunLight = (): Cesium.SunLight => {
  return new Cesium.SunLight()
}

export const getFlashLight = (scene: Cesium.Scene): Cesium.DirectionalLight => {
  return new Cesium.DirectionalLight({
    direction: scene.camera.directionWC,
  })
}

export const updateFlashLightListener = (scene: Cesium.Scene): void => {
  ;(scene.light as any).direction = Cesium.Cartesian3.clone(
    scene.camera.directionWC,
    (scene.light as any).direction
  )
}

export const getMoonDirection = (
  currentTime: Cesium.JulianDate
): Cesium.Cartesian3 => {
  const icrfToFixed = new Cesium.Matrix3()
  const scratchMoonPosition = new Cesium.Cartesian3()
  const scratchMoonDirection = new Cesium.Cartesian3()
  if (
    !Cesium.defined(
      Cesium.Transforms.computeIcrfToFixedMatrix(currentTime, icrfToFixed)
    )
  ) {
    Cesium.Transforms.computeTemeToPseudoFixedMatrix(currentTime, icrfToFixed)
  }
  const moonPosition =
    Cesium.Simon1994PlanetaryPositions.computeMoonPositionInEarthInertialFrame(
      currentTime,
      scratchMoonPosition
    )
  Cesium.Matrix3.multiplyByVector(icrfToFixed, moonPosition, moonPosition)
  const moonDirection = Cesium.Cartesian3.normalize(
    moonPosition,
    scratchMoonDirection
  )
  return Cesium.Cartesian3.negate(moonDirection, new Cesium.Cartesian3())
}

export const getMoonLight = (
  currentTime: Cesium.JulianDate
): Cesium.DirectionalLight => {
  return new Cesium.DirectionalLight({
    direction: getMoonDirection(currentTime),
    color: new Cesium.Color(0.9, 0.925, 1.0),
    intensity: 1,
  })
}

export const updateMoonLightListener = (
  scene: Cesium.Scene,
  currentTime: Cesium.JulianDate
): void => {
  ;(scene.light as Cesium.DirectionalLight).direction =
    getMoonDirection(currentTime)
}
