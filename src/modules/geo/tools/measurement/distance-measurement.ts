import {
  CallbackProperty,
  CallbackPositionProperty,
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  EllipsoidGeodesic,
  LabelStyle,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from 'cesium'
import type { Disposable } from '../../core/disposable'

export interface DistanceMeasurementOptions {
  readonly signal: AbortSignal
  onUpdate(distanceMeters: number): void
  onComplete(result: DistanceMeasurement): void
  onCancel?(): void
}

export interface DistanceMeasurementSession extends Disposable {}

export interface DistanceMeasurement {
  readonly distanceMeters: number
  readonly positions: readonly Cartesian3[]
  readonly entities: readonly Entity[]
}

function segmentDistance(start: Cartesian3, end: Cartesian3): number {
  const startCartographic = Cartographic.fromCartesian(start)
  const endCartographic = Cartographic.fromCartesian(end)
  const geodesic = new EllipsoidGeodesic(startCartographic, endCartographic)
  const heightDifference = endCartographic.height - startCartographic.height
  return Math.hypot(geodesic.surfaceDistance, heightDifference)
}

function totalDistance(positions: readonly Cartesian3[]): number {
  return positions.slice(1).reduce(function addSegment(distance, position, index) {
    return distance + segmentDistance(positions[index], position)
  }, 0)
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(2)} km`
  }
  return `${distanceMeters.toFixed(1)} m`
}

export class DistanceMeasurementTool implements Disposable {
  private readonly entities = new Set<Entity>()
  private readonly sessions = new Set<DistanceMeasurementSession>()
  private activeSession?: DistanceMeasurementSession
  private disposed = false

  constructor(private readonly viewer: Viewer) {}

  startDistance(options: DistanceMeasurementOptions): DistanceMeasurementSession {
    if (this.disposed) {
      throw new Error('Distance measurement tool has been disposed')
    }
    if (options.signal.aborted) {
      throw new Error('Distance measurement was cancelled before it started')
    }
    this.activeSession?.dispose()

    const positions: Cartesian3[] = []
    const sessionEntities: Entity[] = []
    let previewPosition: Cartesian3 | undefined
    let completed = false
    let disposed = false
    const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas)

    const dynamicPositions = new CallbackProperty(function currentPositions() {
      return previewPosition ? [...positions, previewPosition] : positions
    }, false)
    const lineEntity = this.viewer.entities.add({
      polyline: {
        positions: dynamicPositions,
        width: 3,
        material: Color.fromCssColorString('#45c8ff'),
        depthFailMaterial: Color.fromCssColorString('#45c8ff').withAlpha(0.6),
      },
    })
    sessionEntities.push(lineEntity)

    const labelEntity = this.viewer.entities.add({
      position: new CallbackPositionProperty(function labelPosition() {
        return previewPosition ?? positions.at(-1)
      }, false),
      label: {
        text: new CallbackProperty(function labelText() {
          const measurementPositions = previewPosition ? [...positions, previewPosition] : positions
          return formatDistance(totalDistance(measurementPositions))
        }, false),
        font: '600 14px Aptos, Segoe UI, sans-serif',
        fillColor: Color.WHITE,
        outlineColor: Color.fromCssColorString('#06111d'),
        outlineWidth: 3,
        style: LabelStyle.FILL_AND_OUTLINE,
        showBackground: true,
        backgroundColor: Color.fromCssColorString('#091522').withAlpha(0.9),
        backgroundPadding: new Cartesian2(10, 7),
        pixelOffset: new Cartesian2(0, -28),
        verticalOrigin: VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })
    sessionEntities.push(labelEntity)
    sessionEntities.forEach((entity) => this.entities.add(entity))

    function measurementPositions(): Cartesian3[] {
      return previewPosition ? [...positions, previewPosition] : positions
    }

    const pickGlobePosition = (screenPosition: Cartesian2): Cartesian3 | undefined => {
      const ray = this.viewer.camera.getPickRay(screenPosition)
      return ray ? this.viewer.scene.globe.pick(ray, this.viewer.scene) : undefined
    }

    const addPoint = (position: Cartesian3): void => {
      const lastPosition = positions.at(-1)
      if (lastPosition && Cartesian3.distance(lastPosition, position) < 0.25) {
        return
      }
      positions.push(position)
      const pointEntity = this.viewer.entities.add({
        position,
        point: {
          color: Color.fromCssColorString('#45c8ff'),
          outlineColor: Color.fromCssColorString('#06111d'),
          outlineWidth: 2,
          pixelSize: 10,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
      sessionEntities.push(pointEntity)
      this.entities.add(pointEntity)
    }

    handler.setInputAction((event: ScreenSpaceEventHandler.PositionedEvent) => {
      const position = pickGlobePosition(event.position)
      if (!position) {
        return
      }
      addPoint(position)
      previewPosition = undefined
      options.onUpdate(totalDistance(positions))
      this.viewer.scene.requestRender()
    }, ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction((event: ScreenSpaceEventHandler.MotionEvent) => {
      if (!positions.length) {
        return
      }
      previewPosition = pickGlobePosition(event.endPosition)
      options.onUpdate(totalDistance(measurementPositions()))
      this.viewer.scene.requestRender()
    }, ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction(() => {
      if (positions.length < 2) {
        return
      }
      completed = true
      previewPosition = undefined
      options.onComplete({
        distanceMeters: totalDistance(positions),
        positions: positions.map((position) => Cartesian3.clone(position)),
        entities: [...sessionEntities],
      })
      this.viewer.scene.requestRender()
    }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

    const session: DistanceMeasurementSession = {
      dispose: () => {
        if (disposed) {
          return
        }
        disposed = true
        options.signal.removeEventListener('abort', session.dispose)
        if (typeof window !== 'undefined') {
          window.removeEventListener('keydown', onKeyDown)
        }
        if (!handler.isDestroyed()) {
          handler.destroy()
        }
        if (!completed) {
          options.onCancel?.()
          sessionEntities.forEach((entity) => {
            this.viewer.entities.remove(entity)
            this.entities.delete(entity)
          })
          this.viewer.scene.requestRender()
        }
        this.sessions.delete(session)
        if (this.activeSession === session) {
          this.activeSession = undefined
        }
      },
    }
    this.sessions.add(session)
    this.activeSession = session
    options.signal.addEventListener('abort', session.dispose, { once: true })
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        session.dispose()
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKeyDown)
    }
    return session
  }

  clear(): void {
    this.sessions.forEach(function disposeSession(session) {
      session.dispose()
    })
    this.sessions.clear()
    this.entities.forEach((entity) => this.viewer.entities.remove(entity))
    this.entities.clear()
    this.viewer.scene.requestRender()
  }

  remove(result: DistanceMeasurement): void {
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
