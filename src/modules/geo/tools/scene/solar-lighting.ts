import {
  Cartesian3,
  Ellipsoid,
  JulianDate,
  Math as CesiumMath,
  Matrix3,
  Simon1994PlanetaryPositions,
  Transforms,
} from 'cesium'

const directionScratch = new Cartesian3()
const normalScratch = new Cartesian3()
const matrixScratch = new Matrix3()
const inertialScratch = new Cartesian3()
const fixedScratch = new Cartesian3()

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1)
  return t * t * (3 - 2 * t)
}

export function solarHeightDegrees(origin: Cartesian3, sunFixed: Cartesian3): number {
  const direction = Cartesian3.subtract(sunFixed, origin, directionScratch)
  Cartesian3.normalize(direction, direction)
  const normal = Ellipsoid.WGS84.geodeticSurfaceNormal(origin, normalScratch)
  const cosine = Math.min(Math.max(Cartesian3.dot(normal, direction), -1), 1)
  return CesiumMath.toDegrees(Math.asin(cosine))
}

export function sunPositionFixed(time: JulianDate): Cartesian3 | undefined {
  const transform = Transforms.computeIcrfToCentralBodyFixedMatrix(time, matrixScratch)
  if (!transform) {
    return undefined
  }
  const inertial = Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(
    time,
    inertialScratch,
  )
  return Matrix3.multiplyByVector(transform, inertial, fixedScratch)
}
