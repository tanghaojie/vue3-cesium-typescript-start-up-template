import {
  CallbackProperty,
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  EllipsoidGeodesic,
  PolygonHierarchy,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from 'cesium'

export interface MeasurementSession {
  stop(): void
  dispose(): void
}

export interface PointMeasurement {
  readonly position: Cartesian3
  readonly longitude: number
  readonly latitude: number
  readonly height: number
  readonly entity: Entity
}

export interface AreaMeasurement {
  readonly areaSquareMeters: number
  readonly positions: readonly Cartesian3[]
  readonly entities: readonly Entity[]
}

export interface PointMeasurementOptions {
  readonly signal?: AbortSignal
  readonly onComplete?: (result: PointMeasurement) => void
  readonly onCancel?: () => void
}

export interface AreaMeasurementOptions {
  readonly signal?: AbortSignal
  readonly onUpdate?: (areaSquareMeters: number) => void
  readonly onComplete?: (result: AreaMeasurement) => void
  readonly onCancel?: () => void
}

const MEASUREMENT_COLOR = Color.fromCssColorString('#ffbd66')

function pickGlobePosition(viewer: Viewer, screenPosition: Cartesian2): Cartesian3 | undefined {
  const ray = viewer.camera.getPickRay(screenPosition)
  return ray ? viewer.scene.globe.pick(ray, viewer.scene) : undefined
}

function calculateAreaSquareMeters(positions: readonly Cartesian3[]): number {
  if (positions.length < 3) {
    return 0
  }
  const cartographics = positions.map((position) => Cartographic.fromCartesian(position))
  const origin = cartographics[0]
  const radius = 6378137
  const projected = cartographics.map(function project(cartographic) {
    return {
      x: (cartographic.longitude - origin.longitude) * radius * Math.cos(origin.latitude),
      y: (cartographic.latitude - origin.latitude) * radius,
    }
  })
  let sum = 0
  for (let index = 0; index < projected.length; index += 1) {
    const current = projected[index]
    const next = projected[(index + 1) % projected.length]
    sum += current.x * next.y - next.x * current.y
  }
  return Math.abs(sum) / 2
}

export class PointMeasurementTool {
  private readonly entities = new Set<Entity>()
  private activeSession?: MeasurementSession
  private disposed = false

  constructor(private readonly viewer: Viewer) {}

  start(options: PointMeasurementOptions = {}): MeasurementSession {
    if (this.disposed) {
      throw new Error('Point measurement tool has been disposed')
    }
    this.activeSession?.stop()
    if (options.signal?.aborted) {
      throw new Error('Point measurement was cancelled before it started')
    }
    const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas)
    let stopped = false
    let completed = false
    const stop = (): void => {
      if (stopped) {
        return
      }
      stopped = true
      options.signal?.removeEventListener('abort', stop)
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', onKeyDown)
      }
      if (!handler.isDestroyed()) {
        handler.destroy()
      }
      if (!completed) {
        options.onCancel?.()
      }
      if (this.activeSession === session) {
        this.activeSession = undefined
      }
    }
    const session: MeasurementSession = { stop, dispose: stop }
    handler.setInputAction((event: ScreenSpaceEventHandler.PositionedEvent) => {
      const position = pickGlobePosition(this.viewer, event.position)
      if (!position || stopped) {
        return
      }
      const cartographic = Cartographic.fromCartesian(position)
      const longitude = (cartographic.longitude * 180) / Math.PI
      const latitude = (cartographic.latitude * 180) / Math.PI
      const entity = this.viewer.entities.add({
        position,
        point: {
          color: MEASUREMENT_COLOR,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          pixelSize: 11,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${longitude.toFixed(5)}, ${latitude.toFixed(5)}`,
          font: '12px sans-serif',
          fillColor: Color.WHITE,
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.75),
          pixelOffset: new Cartesian2(0, -20),
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
      this.entities.add(entity)
      completed = true
      options.onComplete?.({
        position: Cartesian3.clone(position),
        longitude,
        latitude,
        height: cartographic.height,
        entity,
      })
      this.viewer.scene.requestRender()
      stop()
    }, ScreenSpaceEventType.LEFT_CLICK)
    this.activeSession = session
    options.signal?.addEventListener('abort', stop, { once: true })
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        session.stop()
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKeyDown)
    }
    return session
  }

  clear(): void {
    this.activeSession?.stop()
    this.entities.forEach((entity) => this.viewer.entities.remove(entity))
    this.entities.clear()
    this.viewer.scene.requestRender()
  }

  remove(result: PointMeasurement): void {
    this.viewer.entities.remove(result.entity)
    this.entities.delete(result.entity)
  }

  dispose(): void {
    if (this.disposed) {
      return
    }
    this.disposed = true
    this.clear()
  }
}

export class AreaMeasurementTool {
  private readonly entities = new Set<Entity>()
  private activeSession?: MeasurementSession
  private disposed = false

  constructor(private readonly viewer: Viewer) {}

  start(options: AreaMeasurementOptions = {}): MeasurementSession {
    if (this.disposed) {
      throw new Error('Area measurement tool has been disposed')
    }
    this.activeSession?.stop()
    if (options.signal?.aborted) {
      throw new Error('Area measurement was cancelled before it started')
    }
    const positions: Cartesian3[] = []
    let previewPosition: Cartesian3 | undefined
    let completed = false
    let stopped = false
    const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas)
    const displayedPositions = (): Cartesian3[] =>
      previewPosition ? [...positions, previewPosition] : [...positions]
    const polygon = this.viewer.entities.add({
      polygon: {
        hierarchy: new CallbackProperty(() => new PolygonHierarchy(displayedPositions()), false),
        material: MEASUREMENT_COLOR.withAlpha(0.2),
        outline: true,
        outlineColor: MEASUREMENT_COLOR,
      },
      label: {
        text: new CallbackProperty(
          () => `${calculateAreaSquareMeters(displayedPositions()).toFixed(1)} m²`,
          false,
        ),
        show: new CallbackProperty(() => positions.length >= 3, false),
        font: '600 14px sans-serif',
        fillColor: Color.WHITE,
        showBackground: true,
        backgroundColor: Color.BLACK.withAlpha(0.78),
        pixelOffset: new Cartesian2(0, -24),
        verticalOrigin: VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })
    this.entities.add(polygon)
    const stop = (): void => {
      if (stopped) {
        return
      }
      stopped = true
      options.signal?.removeEventListener('abort', stop)
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', onKeyDown)
      }
      if (!handler.isDestroyed()) {
        handler.destroy()
      }
      if (!completed) {
        this.viewer.entities.remove(polygon)
        this.entities.delete(polygon)
        options.onCancel?.()
      }
      if (this.activeSession === session) {
        this.activeSession = undefined
      }
    }
    const session: MeasurementSession = { stop, dispose: stop }
    const finish = (): void => {
      if (positions.length < 3 || stopped) {
        return
      }
      completed = true
      previewPosition = undefined
      options.onComplete?.({
        areaSquareMeters: calculateAreaSquareMeters(positions),
        positions: positions.map((position) => Cartesian3.clone(position)),
        entities: [polygon],
      })
      this.viewer.scene.requestRender()
      stop()
    }
    handler.setInputAction((event: ScreenSpaceEventHandler.PositionedEvent) => {
      const position = pickGlobePosition(this.viewer, event.position)
      if (!position || stopped) {
        return
      }
      positions.push(Cartesian3.clone(position))
      previewPosition = undefined
      options.onUpdate?.(calculateAreaSquareMeters(positions))
      this.viewer.scene.requestRender()
    }, ScreenSpaceEventType.LEFT_CLICK)
    handler.setInputAction((event: ScreenSpaceEventHandler.MotionEvent) => {
      if (positions.length === 0 || stopped) {
        return
      }
      previewPosition = pickGlobePosition(this.viewer, event.endPosition)
      options.onUpdate?.(calculateAreaSquareMeters(displayedPositions()))
      this.viewer.scene.requestRender()
    }, ScreenSpaceEventType.MOUSE_MOVE)
    handler.setInputAction(finish, ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    this.activeSession = session
    options.signal?.addEventListener('abort', stop, { once: true })
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        session.stop()
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKeyDown)
    }
    return session
  }

  clear(): void {
    this.activeSession?.stop()
    this.entities.forEach((entity) => this.viewer.entities.remove(entity))
    this.entities.clear()
    this.viewer.scene.requestRender()
  }

  remove(result: AreaMeasurement): void {
    result.entities.forEach((entity) => {
      this.viewer.entities.remove(entity)
      this.entities.delete(entity)
    })
  }

  dispose(): void {
    if (this.disposed) {
      return
    }
    this.disposed = true
    this.clear()
  }
}

export function getSegmentDistanceMeters(start: Cartesian3, end: Cartesian3): number {
  const startCartographic = Cartographic.fromCartesian(start)
  const endCartographic = Cartographic.fromCartesian(end)
  const geodesic = new EllipsoidGeodesic(startCartographic, endCartographic)
  return Math.hypot(geodesic.surfaceDistance, endCartographic.height - startCartographic.height)
}
