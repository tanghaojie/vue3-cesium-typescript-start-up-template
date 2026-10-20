import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Rectangle,
  SceneMode,
  type Viewer,
} from 'cesium'

export type GeoSceneMode = '3D' | '2D' | 'COLUMBUS_VIEW'
export type GeoViewLocationId = 'global' | 'china' | 'chengdu'

export interface GeoViewLocation {
  readonly id: GeoViewLocationId
  readonly label: string
  readonly destination: Cartesian3
  readonly orientation: {
    readonly heading: number
    readonly pitch: number
    readonly roll: number
  }
}

export interface GeoCameraSnapshot {
  readonly longitude: number
  readonly latitude: number
  readonly height: number
  readonly heading: number
  readonly pitch: number
  readonly roll: number
  readonly sceneMode: GeoSceneMode
}

export interface GeoCameraView {
  readonly longitude: number
  readonly latitude: number
  readonly height: number
  readonly heading: number
  readonly pitch: number
  readonly roll: number
}

export const DEFAULT_GEO_CAMERA_VIEW: GeoCameraView = {
  longitude: 104.07,
  latitude: 30.5,
  height: 1_600,
  heading: 360,
  pitch: -20,
  roll: 0,
}

export interface GeoCameraLimits {
  readonly minimumZoomDistance: number
  readonly maximumZoomDistance: number
  readonly enableCollisionDetection: boolean
}

export interface GeoFlyToOptions {
  readonly duration?: number
  readonly maximumHeight?: number
  readonly complete?: () => void
  readonly cancel?: () => void
}

const LOCATION_DEFINITIONS: readonly GeoViewLocation[] = [
  {
    id: 'global',
    label: '全球',
    destination: Cartesian3.fromDegrees(0, 10, 25_000_000),
    orientation: { heading: 0, pitch: CesiumMath.toRadians(-90), roll: 0 },
  },
  {
    id: 'china',
    label: '中国',
    destination: Cartesian3.fromDegrees(100.6664, 24.4388, 11_358_500),
    orientation: { heading: CesiumMath.toRadians(360), pitch: CesiumMath.toRadians(-90), roll: 0 },
  },
  {
    id: 'chengdu',
    label: '成都',
    destination: Cartesian3.fromDegrees(
      DEFAULT_GEO_CAMERA_VIEW.longitude,
      DEFAULT_GEO_CAMERA_VIEW.latitude,
      DEFAULT_GEO_CAMERA_VIEW.height,
    ),
    orientation: {
      heading: CesiumMath.toRadians(DEFAULT_GEO_CAMERA_VIEW.heading),
      pitch: CesiumMath.toRadians(DEFAULT_GEO_CAMERA_VIEW.pitch),
      roll: CesiumMath.toRadians(DEFAULT_GEO_CAMERA_VIEW.roll),
    },
  },
]

function toSceneMode(mode: GeoSceneMode): SceneMode {
  if (mode === '2D') {
    return SceneMode.SCENE2D
  }
  if (mode === 'COLUMBUS_VIEW') {
    return SceneMode.COLUMBUS_VIEW
  }
  return SceneMode.SCENE3D
}

function fromSceneMode(mode: SceneMode): GeoSceneMode {
  if (mode === SceneMode.SCENE2D) {
    return '2D'
  }
  if (mode === SceneMode.COLUMBUS_VIEW) {
    return 'COLUMBUS_VIEW'
  }
  return '3D'
}

function degreesOrZero(radians: number | undefined): number {
  return typeof radians === 'number' && Number.isFinite(radians) ? CesiumMath.toDegrees(radians) : 0
}

export function listGeoViewLocations(): readonly GeoViewLocation[] {
  return LOCATION_DEFINITIONS
}

export function getGeoViewLocation(id: GeoViewLocationId): GeoViewLocation {
  const location = LOCATION_DEFINITIONS.find(function findLocation(item) {
    return item.id === id
  })
  if (!location) {
    throw new Error(`Unknown Geo view location: ${id}`)
  }
  return location
}

export function flyToGeoLocation(
  viewer: Viewer,
  id: GeoViewLocationId,
  options: GeoFlyToOptions = {},
): void {
  const location = getGeoViewLocation(id)
  viewer.camera.flyTo({
    destination: location.destination,
    orientation: location.orientation,
    duration: options.duration ?? 1.4,
    maximumHeight: options.maximumHeight,
    complete: options.complete,
    cancel: options.cancel,
  })
}

export function resetGeoCamera(viewer: Viewer, duration = 1.4): void {
  flyToGeoLocation(viewer, 'chengdu', { duration })
}

export function setGeoSceneMode(viewer: Viewer, mode: GeoSceneMode, duration = 0.8): void {
  if (mode === '2D') {
    viewer.scene.morphTo2D(duration)
  } else if (mode === 'COLUMBUS_VIEW') {
    viewer.scene.morphToColumbusView(duration)
  } else {
    viewer.scene.morphTo3D(duration)
  }
}

export function getGeoSceneMode(viewer: Viewer): GeoSceneMode {
  return fromSceneMode(viewer.scene.mode)
}

export function getGeoCameraSnapshot(viewer: Viewer): GeoCameraSnapshot {
  const cartographic = viewer.camera.positionCartographic
  return {
    longitude: CesiumMath.toDegrees(cartographic.longitude),
    latitude: CesiumMath.toDegrees(cartographic.latitude),
    height: cartographic.height,
    heading: degreesOrZero(viewer.camera.heading),
    pitch: degreesOrZero(viewer.camera.pitch),
    roll: degreesOrZero(viewer.camera.roll),
    sceneMode: getGeoSceneMode(viewer),
  }
}

export function setGeoCameraView(viewer: Viewer, view: GeoCameraView): void {
  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(view.longitude, view.latitude, view.height),
    orientation: {
      heading: CesiumMath.toRadians(view.heading),
      pitch: CesiumMath.toRadians(view.pitch),
      roll: CesiumMath.toRadians(view.roll),
    },
  })
}

export function getGeoCameraLimits(viewer: Viewer): GeoCameraLimits {
  const controller = viewer.scene.screenSpaceCameraController
  return {
    minimumZoomDistance: controller.minimumZoomDistance,
    maximumZoomDistance: controller.maximumZoomDistance,
    enableCollisionDetection: controller.enableCollisionDetection,
  }
}

export function setGeoCameraLimits(
  viewer: Viewer,
  limits: Partial<GeoCameraLimits>,
): GeoCameraLimits {
  const controller = viewer.scene.screenSpaceCameraController
  if (limits.minimumZoomDistance !== undefined) {
    controller.minimumZoomDistance = Math.max(0, limits.minimumZoomDistance)
    controller.maximumZoomDistance = Math.max(
      controller.minimumZoomDistance,
      controller.maximumZoomDistance,
    )
  }
  if (limits.maximumZoomDistance !== undefined) {
    controller.maximumZoomDistance = Math.max(
      controller.minimumZoomDistance,
      limits.maximumZoomDistance,
    )
  }
  if (limits.enableCollisionDetection !== undefined) {
    controller.enableCollisionDetection = limits.enableCollisionDetection
  }
  return getGeoCameraLimits(viewer)
}

export function pickGeoGlobePosition(
  viewer: Viewer,
  windowPosition: Cartesian2,
): Cartographic | undefined {
  const scene = viewer.scene
  const depthPosition = scene.pickPositionSupported ? scene.pickPosition(windowPosition) : undefined
  const position =
    depthPosition ?? viewer.camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid)
  return position ? Cartographic.fromCartesian(position) : undefined
}

export function getGeoRectangleForLocation(id: GeoViewLocationId): Rectangle {
  const location = getGeoViewLocation(id)
  const cartographic = Cartographic.fromCartesian(location.destination)
  const halfWidth = CesiumMath.toRadians(id === 'global' ? 180 : id === 'china' ? 22 : 3)
  const halfHeight = CesiumMath.toRadians(id === 'global' ? 80 : id === 'china' ? 18 : 2)
  return Rectangle.fromRadians(
    cartographic.longitude - halfWidth,
    cartographic.latitude - halfHeight,
    cartographic.longitude + halfWidth,
    cartographic.latitude + halfHeight,
  )
}
