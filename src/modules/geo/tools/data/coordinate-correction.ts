import {
  Cartesian2,
  Cartographic,
  Math as CesiumMath,
  Rectangle,
  WebMercatorTilingScheme,
} from 'cesium'

export type GeoCoordinateCorrection = 'auto' | 'none' | 'gcj02-to-wgs84'

export interface GeoCorrectedTileCoordinates {
  readonly x: number
  readonly y: number
}

const PI = Math.PI
const AXIS = 6378245.0
const EE = 0.00669342162296594323
const CHINA_MIN_LONGITUDE = 72.004
const CHINA_MAX_LONGITUDE = 137.8347
const CHINA_MIN_LATITUDE = 0.8293
const CHINA_MAX_LATITUDE = 55.8271

function isOutsideChina(longitude: number, latitude: number): boolean {
  return (
    longitude < CHINA_MIN_LONGITUDE ||
    longitude > CHINA_MAX_LONGITUDE ||
    latitude < CHINA_MIN_LATITUDE ||
    latitude > CHINA_MAX_LATITUDE
  )
}

function transformLatitude(longitude: number, latitude: number): number {
  let transformed =
    -100.0 +
    2.0 * longitude +
    3.0 * latitude +
    0.2 * latitude * latitude +
    0.1 * longitude * latitude +
    0.2 * Math.sqrt(Math.abs(longitude))
  transformed +=
    ((20.0 * Math.sin(6.0 * longitude * PI) + 20.0 * Math.sin(2.0 * longitude * PI)) * 2.0) / 3.0
  transformed +=
    ((20.0 * Math.sin(latitude * PI) + 40.0 * Math.sin((latitude / 3.0) * PI)) * 2.0) / 3.0
  transformed +=
    ((160.0 * Math.sin((latitude / 12.0) * PI) + 320 * Math.sin((latitude * PI) / 30.0)) * 2.0) /
    3.0
  return transformed
}

function transformLongitude(longitude: number, latitude: number): number {
  let transformed =
    300.0 +
    longitude +
    2.0 * latitude +
    0.1 * longitude * longitude +
    0.1 * longitude * latitude +
    0.1 * Math.sqrt(Math.abs(longitude))
  transformed +=
    ((20.0 * Math.sin(6.0 * longitude * PI) + 20.0 * Math.sin(2.0 * longitude * PI)) * 2.0) / 3.0
  transformed +=
    ((20.0 * Math.sin(longitude * PI) + 40.0 * Math.sin((longitude / 3.0) * PI)) * 2.0) / 3.0
  transformed +=
    ((150.0 * Math.sin((longitude / 12.0) * PI) + 300.0 * Math.sin((longitude / 30.0) * PI)) *
      2.0) /
    3.0
  return transformed
}

export function wgs84ToGcj02(longitude: number, latitude: number): Cartesian2 {
  if (isOutsideChina(longitude, latitude)) {
    return new Cartesian2(longitude, latitude)
  }
  const transformedLatitude = transformLatitude(longitude - 105.0, latitude - 35.0)
  const transformedLongitude = transformLongitude(longitude - 105.0, latitude - 35.0)
  const latitudeRadians = (latitude / 180.0) * PI
  const magic = 1 - EE * Math.sin(latitudeRadians) * Math.sin(latitudeRadians)
  const sqrtMagic = Math.sqrt(magic)
  const deltaLatitude =
    (transformedLatitude * 180.0) / (((AXIS * (1 - EE)) / (magic * sqrtMagic)) * PI)
  const deltaLongitude =
    (transformedLongitude * 180.0) / ((AXIS / sqrtMagic) * Math.cos(latitudeRadians) * PI)
  return new Cartesian2(longitude + deltaLongitude, latitude + deltaLatitude)
}

export function correctGcj02TileCoordinates(
  x: number,
  y: number,
  level: number,
  tilingScheme = new WebMercatorTilingScheme(),
): GeoCorrectedTileCoordinates {
  const rectangle = tilingScheme.tileXYToRectangle(x, y, level)
  const center = Rectangle.center(rectangle)
  const corrected = wgs84ToGcj02(
    CesiumMath.toDegrees(center.longitude),
    CesiumMath.toDegrees(center.latitude),
  )
  const sourceTile = tilingScheme.positionToTileXY(
    Cartographic.fromDegrees(corrected.x, corrected.y),
    level,
  )
  return sourceTile ? { x: sourceTile.x, y: sourceTile.y } : { x, y }
}

export function resolveCoordinateCorrection(
  coordinateSystem: 'WGS84' | 'GCJ-02',
  correction: GeoCoordinateCorrection = 'auto',
): GeoCoordinateCorrection {
  if (coordinateSystem === 'GCJ-02' && (correction === 'auto' || correction === 'gcj02-to-wgs84')) {
    return 'gcj02-to-wgs84'
  }
  return 'none'
}
