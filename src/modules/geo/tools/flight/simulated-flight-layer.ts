import {
  ArcType,
  BoundingSphere,
  CallbackProperty,
  CallbackPositionProperty,
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  CustomDataSource,
  DistanceDisplayCondition,
  EllipsoidGeodesic,
  HeadingPitchRange,
  JulianDate,
  LabelStyle,
  NearFarScalar,
  SceneTransforms,
  VelocityOrientationProperty,
  VerticalOrigin,
  type Entity,
  type PositionProperty,
  type Viewer,
} from 'cesium'

const AIRCRAFT_OUTLINE_COLOR = Color.fromCssColorString('#06111c')
const MINIMUM_DAILY_FLIGHT_DURATION_SECONDS = 9 * 60 * 60
const ROUTE_SAMPLE_COUNT = 192

interface GeoCoordinate {
  readonly longitude: number
  readonly latitude: number
}

interface FlightPalette {
  readonly aircraft: string
  readonly route: Color
}

interface SimulatedFlightDefinition {
  readonly callsign: string
  readonly cruiseHeightMeters: number
  readonly destination: GeoCoordinate
  readonly departureSeconds: number
  readonly durationSeconds: number
  readonly id: string
  readonly origin: GeoCoordinate
  readonly palette: FlightPalette
}

const FLIGHT_PALETTES: readonly FlightPalette[] = [
  { aircraft: '#4cc9f0', route: Color.fromCssColorString('#4cc9f0') },
  { aircraft: '#63e6be', route: Color.fromCssColorString('#63e6be') },
  { aircraft: '#ffcb6b', route: Color.fromCssColorString('#ffcb6b') },
  { aircraft: '#ff7a8f', route: Color.fromCssColorString('#ff7a8f') },
  { aircraft: '#af8cff', route: Color.fromCssColorString('#af8cff') },
]

function flight(
  id: string,
  callsign: string,
  origin: GeoCoordinate,
  destination: GeoCoordinate,
  departureHour: number,
  durationHours: number,
  cruiseHeightMeters: number,
  paletteIndex: number,
): SimulatedFlightDefinition {
  return {
    id,
    callsign,
    origin,
    destination,
    departureSeconds: departureHour * 60 * 60,
    // Flights depart every 45 minutes. Nine-hour daily simulation windows keep
    // at least ten aircraft in the air while preserving longer route durations.
    durationSeconds: Math.max(durationHours * 60 * 60, MINIMUM_DAILY_FLIGHT_DURATION_SECONDS),
    cruiseHeightMeters,
    palette: FLIGHT_PALETTES[paletteIndex % FLIGHT_PALETTES.length],
  }
}

const SIMULATED_FLIGHTS: readonly SimulatedFlightDefinition[] = [
  flight(
    'sim-101',
    'SIM 101',
    { longitude: 116.4074, latitude: 39.9042 },
    { longitude: 121.4737, latitude: 31.2304 },
    0.5,
    2,
    10_200,
    0,
  ),
  flight(
    'sim-202',
    'SIM 202',
    { longitude: 113.2644, latitude: 23.1291 },
    { longitude: 104.0665, latitude: 30.5728 },
    1.25,
    2,
    10_600,
    1,
  ),
  flight(
    'sim-303',
    'SIM 303',
    { longitude: 108.9398, latitude: 34.3416 },
    { longitude: 114.0579, latitude: 22.5431 },
    2,
    2,
    10_100,
    2,
  ),
  flight(
    'sim-404',
    'SIM 404',
    { longitude: 87.6168, latitude: 43.8256 },
    { longitude: 120.1551, latitude: 30.2741 },
    2.75,
    4,
    11_500,
    3,
  ),
  flight(
    'sim-505',
    'SIM 505',
    { longitude: 102.8329, latitude: 24.8801 },
    { longitude: 118.7969, latitude: 32.0603 },
    3.5,
    2.5,
    10_800,
    4,
  ),
  flight(
    'sim-606',
    'SIM 606',
    { longitude: 126.5349, latitude: 45.8038 },
    { longitude: 123.4315, latitude: 41.8057 },
    4.25,
    1.5,
    9_800,
    0,
  ),
  flight(
    'sim-707',
    'SIM 707',
    { longitude: 91.1322, latitude: 29.6604 },
    { longitude: 106.5516, latitude: 29.563 },
    5,
    2.25,
    10_400,
    1,
  ),
  flight(
    'sim-808',
    'SIM 808',
    { longitude: 120.3826, latitude: 36.0671 },
    { longitude: 118.0894, latitude: 24.4798 },
    5.75,
    2,
    10_300,
    2,
  ),
  flight(
    'sim-909',
    'SIM 909',
    { longitude: 121.6147, latitude: 38.914 },
    { longitude: 109.4967, latitude: 18.2528 },
    6.5,
    3.5,
    11_100,
    3,
  ),
  flight(
    'sim-110',
    'SIM 110',
    { longitude: 114.3055, latitude: 30.5928 },
    { longitude: 103.8343, latitude: 36.0611 },
    7.25,
    2.25,
    10_700,
    4,
  ),
  flight(
    'sim-111',
    'SIM 111',
    { longitude: 121.544, latitude: 29.8683 },
    { longitude: 106.6302, latitude: 26.647 },
    8,
    2.5,
    10_600,
    0,
  ),
  flight(
    'sim-112',
    'SIM 112',
    { longitude: 112.9388, latitude: 28.2282 },
    { longitude: 119.2965, latitude: 26.0745 },
    8.75,
    1.75,
    9_900,
    1,
  ),
  flight(
    'sim-113',
    'SIM 113',
    { longitude: 111.7492, latitude: 40.8426 },
    { longitude: 119.2965, latitude: 26.0745 },
    9.5,
    2.25,
    10_300,
    2,
  ),
  flight(
    'sim-114',
    'SIM 114',
    { longitude: 113.6254, latitude: 34.7466 },
    { longitude: 110.1983, latitude: 20.044 },
    10.25,
    2.5,
    10_700,
    3,
  ),
  flight(
    'sim-115',
    'SIM 115',
    { longitude: 108.32, latitude: 22.824 },
    { longitude: 117.1201, latitude: 36.6512 },
    11,
    2.25,
    10_500,
    4,
  ),
  flight(
    'sim-116',
    'SIM 116',
    { longitude: 106.2309, latitude: 38.4872 },
    { longitude: 120.5853, latitude: 31.2989 },
    11.75,
    2.25,
    10_400,
    0,
  ),
  flight(
    'sim-117',
    'SIM 117',
    { longitude: 117.2, latitude: 39.1333 },
    { longitude: 111.2865, latitude: 30.6919 },
    12.5,
    1.5,
    9_700,
    1,
  ),
  flight(
    'sim-118',
    'SIM 118',
    { longitude: 118.0894, latitude: 24.4798 },
    { longitude: 114.3055, latitude: 30.5928 },
    13.25,
    1.25,
    9_500,
    2,
  ),
  flight(
    'sim-119',
    'SIM 119',
    { longitude: 75.9898, latitude: 39.4704 },
    { longitude: 108.9398, latitude: 34.3416 },
    14,
    4.25,
    11_800,
    3,
  ),
  flight(
    'sim-120',
    'SIM 120',
    { longitude: 100.233, latitude: 26.8721 },
    { longitude: 121.4737, latitude: 31.2304 },
    14.75,
    3,
    11_200,
    4,
  ),
  flight(
    'sim-121',
    'SIM 121',
    { longitude: 121.5654, latitude: 25.033 },
    { longitude: 116.4074, latitude: 39.9042 },
    15.5,
    2.5,
    10_900,
    0,
  ),
  flight(
    'sim-122',
    'SIM 122',
    { longitude: 114.1694, latitude: 22.3193 },
    { longitude: 116.4074, latitude: 39.9042 },
    16.25,
    2.75,
    11_100,
    1,
  ),
  flight(
    'sim-123',
    'SIM 123',
    { longitude: 113.5439, latitude: 22.1987 },
    { longitude: 108.9398, latitude: 34.3416 },
    17,
    2,
    10_200,
    2,
  ),
  flight(
    'sim-124',
    'SIM 124',
    { longitude: 126.978, latitude: 37.5665 },
    { longitude: 116.4074, latitude: 39.9042 },
    17.75,
    2,
    10_500,
    3,
  ),
  flight(
    'sim-125',
    'SIM 125',
    { longitude: 139.6917, latitude: 35.6895 },
    { longitude: 121.4737, latitude: 31.2304 },
    18.5,
    3.25,
    11_300,
    4,
  ),
  flight(
    'sim-126',
    'SIM 126',
    { longitude: 100.5018, latitude: 13.7563 },
    { longitude: 102.8329, latitude: 24.8801 },
    19.25,
    2.25,
    10_700,
    0,
  ),
  flight(
    'sim-127',
    'SIM 127',
    { longitude: 105.8342, latitude: 21.0278 },
    { longitude: 108.32, latitude: 22.824 },
    20,
    1.25,
    9_400,
    1,
  ),
  flight(
    'sim-128',
    'SIM 128',
    { longitude: 120.9842, latitude: 14.5995 },
    { longitude: 118.0894, latitude: 24.4798 },
    20.75,
    2,
    10_100,
    2,
  ),
  flight(
    'sim-129',
    'SIM 129',
    { longitude: 76.8897, latitude: 43.2389 },
    { longitude: 87.6168, latitude: 43.8256 },
    21.5,
    2,
    10_300,
    3,
  ),
  flight(
    'sim-130',
    'SIM 130',
    { longitude: 85.324, latitude: 27.7172 },
    { longitude: 91.1322, latitude: 29.6604 },
    22.25,
    1.5,
    9_600,
    4,
  ),
]

export interface SimulatedFlightLayer {
  show(): number
  setRoutesVisible(visible: boolean): void
  flyToAllRoutes(): void
  clear(): void
  dispose(): void
}

function createAircraftIcon(color: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.height = 64
  canvas.width = 64
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('无法创建模拟飞机图标画布')
  }

  context.fillStyle = color
  context.lineJoin = 'round'
  context.lineWidth = 3
  context.strokeStyle = '#06111c'
  context.beginPath()
  context.moveTo(32, 4)
  context.lineTo(39, 25)
  context.lineTo(57, 33)
  context.lineTo(57, 38)
  context.lineTo(39, 36)
  context.lineTo(39, 52)
  context.lineTo(46, 59)
  context.lineTo(42, 61)
  context.lineTo(32, 56)
  context.lineTo(22, 61)
  context.lineTo(18, 59)
  context.lineTo(25, 52)
  context.lineTo(25, 36)
  context.lineTo(7, 38)
  context.lineTo(7, 33)
  context.lineTo(25, 25)
  context.closePath()
  context.fill()
  context.stroke()
  return canvas
}

function createAircraftRotation(viewer: Viewer, position: PositionProperty): CallbackProperty {
  const currentPosition = new Cartesian3()
  const nextPosition = new Cartesian3()
  const previousPosition = new Cartesian3()
  const currentWindowPosition = new Cartesian2()
  const nextWindowPosition = new Cartesian2()

  function rotationFor(start: Cartesian3, end: Cartesian3): number | undefined {
    const startWindowPosition = SceneTransforms.worldToWindowCoordinates(
      viewer.scene,
      start,
      currentWindowPosition,
    )
    const endWindowPosition = SceneTransforms.worldToWindowCoordinates(
      viewer.scene,
      end,
      nextWindowPosition,
    )
    if (!startWindowPosition || !endWindowPosition) {
      return undefined
    }

    const deltaX = endWindowPosition.x - startWindowPosition.x
    const deltaY = endWindowPosition.y - startWindowPosition.y
    if (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01) {
      return undefined
    }
    return Math.atan2(-deltaX, -deltaY)
  }

  return new CallbackProperty(function aircraftRotation(time): number {
    if (!time) {
      return 0
    }
    const current = position.getValue(time, currentPosition)
    if (!current) {
      return 0
    }

    const nextTime = JulianDate.addSeconds(time, 30, new JulianDate())
    const next = position.getValue(nextTime, nextPosition)
    if (next) {
      return rotationFor(current, next) ?? 0
    }

    const previousTime = JulianDate.addSeconds(time, -30, new JulianDate())
    const previous = position.getValue(previousTime, previousPosition)
    return previous ? (rotationFor(previous, current) ?? 0) : 0
  }, false)
}

function createGeodesic(definition: SimulatedFlightDefinition): EllipsoidGeodesic {
  const origin = Cartographic.fromDegrees(definition.origin.longitude, definition.origin.latitude)
  const destination = Cartographic.fromDegrees(
    definition.destination.longitude,
    definition.destination.latitude,
  )
  return new EllipsoidGeodesic(origin, destination)
}

function positionFor(
  geodesic: EllipsoidGeodesic,
  progress: number,
  cruiseHeightMeters: number,
  result: Cartesian3,
): Cartesian3 {
  const coordinate = geodesic.interpolateUsingFraction(progress)
  const altitude = cruiseHeightMeters * Math.sin(progress * Math.PI)
  return Cartesian3.fromRadians(
    coordinate.longitude,
    coordinate.latitude,
    altitude,
    undefined,
    result,
  )
}

function createRoutePositions(definition: SimulatedFlightDefinition): Cartesian3[] {
  const geodesic = createGeodesic(definition)
  return Array.from({ length: ROUTE_SAMPLE_COUNT + 1 }, function createRoutePosition(_, index) {
    return positionFor(
      geodesic,
      index / ROUTE_SAMPLE_COUNT,
      definition.cruiseHeightMeters,
      new Cartesian3(),
    )
  })
}

function createDailyPositionProperty(
  definition: SimulatedFlightDefinition,
): CallbackPositionProperty {
  const geodesic = createGeodesic(definition)
  const positionScratch = new Cartesian3()
  return new CallbackPositionProperty(function dailyFlightPosition(
    time,
    result,
  ): Cartesian3 | undefined {
    if (!time) {
      return undefined
    }
    const currentDate = JulianDate.toDate(time)
    const secondsSinceMidnight =
      currentDate.getUTCHours() * 60 * 60 +
      currentDate.getUTCMinutes() * 60 +
      currentDate.getUTCSeconds() +
      currentDate.getUTCMilliseconds() / 1000
    const elapsedSeconds =
      (secondsSinceMidnight - definition.departureSeconds + 24 * 60 * 60) % (24 * 60 * 60)
    if (elapsedSeconds > definition.durationSeconds) {
      return undefined
    }
    return positionFor(
      geodesic,
      elapsedSeconds / definition.durationSeconds,
      definition.cruiseHeightMeters,
      result ?? positionScratch,
    )
  }, false)
}

function createAircraftLabel(
  definition: SimulatedFlightDefinition,
  position: PositionProperty,
): CallbackProperty {
  const positionScratch = new Cartesian3()
  const cartographicScratch = new Cartographic()
  return new CallbackProperty(function aircraftLabel(time): string {
    const current = time ? position.getValue(time, positionScratch) : undefined
    if (!current) {
      return `SIM · ${definition.callsign}`
    }
    const cartographic = Cartographic.fromCartesian(current, undefined, cartographicScratch)
    const altitudeKilometers = (cartographic?.height ?? 0) / 1_000
    return `SIM · ${definition.callsign}\nALT ${altitudeKilometers.toFixed(1)} km`
  }, false)
}

export async function createSimulatedFlightLayer(viewer: Viewer): Promise<SimulatedFlightLayer> {
  const dataSource = new CustomDataSource('geo-simulated-flights')
  const aircraftIcons = new Map(
    FLIGHT_PALETTES.map(function createPaletteIcon(palette) {
      return [palette, createAircraftIcon(palette.aircraft)] as const
    }),
  )
  const allRoutePositions = SIMULATED_FLIGHTS.flatMap(createRoutePositions)
  const allRoutesBoundingSphere = BoundingSphere.fromPoints(allRoutePositions)
  await viewer.dataSources.add(dataSource)
  let disposed = false
  let routesVisible = true
  let routeEntities: Entity[] = []

  function requestRender(): void {
    if (!viewer.isDestroyed()) {
      viewer.scene.requestRender()
    }
  }

  function show(): number {
    if (disposed) {
      return 0
    }

    dataSource.entities.removeAll()
    routeEntities = []
    for (const definition of SIMULATED_FLIGHTS) {
      const position = createDailyPositionProperty(definition)
      const route = dataSource.entities.add({
        id: `simulated-flight-route:${definition.id}`,
        name: `模拟航线 ${definition.callsign}`,
        show: routesVisible,
        polyline: {
          arcType: ArcType.NONE,
          clampToGround: false,
          material: definition.palette.route.withAlpha(0.88),
          positions: createRoutePositions(definition),
          width: 1.2,
        },
      })
      routeEntities.push(route)
      dataSource.entities.add({
        id: `simulated-flight:${definition.id}`,
        name: `模拟航班 ${definition.callsign}`,
        orientation: new VelocityOrientationProperty(position),
        billboard: {
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          image: aircraftIcons.get(definition.palette),
          rotation: createAircraftRotation(viewer, position),
          scale: 0.86,
          scaleByDistance: new NearFarScalar(20_000, 1, 3_000_000, 0.5),
          verticalOrigin: VerticalOrigin.CENTER,
        },
        position,
        label: {
          backgroundColor: Color.fromCssColorString('#07111c').withAlpha(0.78),
          distanceDisplayCondition: new DistanceDisplayCondition(0, 2_500_000),
          fillColor: definition.palette.route,
          font: '600 12px "IBM Plex Mono", "Cascadia Code", monospace',
          outlineColor: AIRCRAFT_OUTLINE_COLOR,
          outlineWidth: 3,
          pixelOffset: new Cartesian2(12, -12),
          scaleByDistance: new NearFarScalar(20_000, 1, 2_500_000, 0.7),
          showBackground: true,
          style: LabelStyle.FILL_AND_OUTLINE,
          text: createAircraftLabel(definition, position),
        },
      })
    }
    requestRender()
    return SIMULATED_FLIGHTS.length
  }

  function setRoutesVisible(visible: boolean): void {
    if (disposed || routesVisible === visible) {
      return
    }
    routesVisible = visible
    routeEntities.forEach(function updateRouteVisibility(route) {
      route.show = visible
    })
    requestRender()
  }

  function flyToAllRoutes(): void {
    if (disposed || viewer.isDestroyed()) {
      return
    }
    viewer.camera.flyToBoundingSphere(allRoutesBoundingSphere, {
      duration: 1.2,
      offset: new HeadingPitchRange(0, -Math.PI / 2, 0),
    })
  }

  function clear(): void {
    if (disposed) {
      return
    }
    dataSource.entities.removeAll()
    routeEntities = []
    requestRender()
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    clear()
    disposed = true
    if (!viewer.isDestroyed() && viewer.dataSources.contains(dataSource)) {
      viewer.dataSources.remove(dataSource, true)
    }
  }

  return { show, setRoutesVisible, flyToAllRoutes, clear, dispose }
}
