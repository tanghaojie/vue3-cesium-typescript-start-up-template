import {
  CallbackProperty,
  Cartesian2,
  Cartesian3,
  Color,
  HeightReference,
  PolygonHierarchy,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Entity,
  type Viewer,
} from 'cesium'

export type DrawingMode = 'point' | 'polyline' | 'polygon'

export interface DrawingResult {
  readonly id: string
  readonly mode: DrawingMode
  readonly positions: readonly Cartesian3[]
  readonly entities: readonly Entity[]
}

export interface DrawingSession {
  readonly mode: DrawingMode
  stop(): void
  dispose(): void
}

export interface DrawingOptions {
  readonly signal?: AbortSignal
  readonly color?: Color
  readonly onUpdate?: (positions: readonly Cartesian3[]) => void
  readonly onComplete?: (result: DrawingResult) => void
  readonly onCancel?: () => void
}

const DEFAULT_COLOR = Color.fromCssColorString('#55d6ff')

function clonePositions(positions: readonly Cartesian3[]): Cartesian3[] {
  return positions.map(function clone(position) {
    return Cartesian3.clone(position)
  })
}

export class DrawingTool {
  private readonly results = new Map<string, DrawingResult>()
  private readonly sessions = new Set<DrawingSession>()
  private activeSession?: DrawingSession
  private disposed = false

  constructor(private readonly viewer: Viewer) {}

  startPoint(options: DrawingOptions = {}): DrawingSession {
    return this.start('point', options)
  }

  startPolyline(options: DrawingOptions = {}): DrawingSession {
    return this.start('polyline', options)
  }

  startPolygon(options: DrawingOptions = {}): DrawingSession {
    return this.start('polygon', options)
  }

  clearCurrent(): void {
    const last = Array.from(this.results.values()).at(-1)
    if (!last) {
      return
    }
    this.removeResult(last)
  }

  clearAll(): void {
    this.stopActive()
    Array.from(this.results.values()).forEach((result) => this.removeResult(result))
  }

  stop(): void {
    this.stopActive()
  }

  dispose(): void {
    if (this.disposed) {
      return
    }
    this.disposed = true
    this.clearAll()
  }

  private start(mode: DrawingMode, options: DrawingOptions): DrawingSession {
    if (this.disposed) {
      throw new Error('Drawing tool has been disposed')
    }
    if (options.signal?.aborted) {
      throw new Error('Drawing was cancelled before it started')
    }

    this.stopActive()
    const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas)
    const positions: Cartesian3[] = []
    const entities: Entity[] = []
    let previewPosition: Cartesian3 | undefined
    let completed = false
    let disposed = false

    const color = options.color ?? DEFAULT_COLOR
    const pickPosition = (screenPosition: Cartesian2): Cartesian3 | undefined => {
      const ray = this.viewer.camera.getPickRay(screenPosition)
      return ray ? this.viewer.scene.globe.pick(ray, this.viewer.scene) : undefined
    }
    const displayedPositions = (): Cartesian3[] =>
      previewPosition ? [...positions, previewPosition] : [...positions]
    const displayedLinePositions = (): Cartesian3[] => {
      const currentPositions = displayedPositions()
      if (mode === 'polygon' && completed && currentPositions.length >= 3) {
        return [...currentPositions, currentPositions[0]]
      }
      return currentPositions
    }

    const lineEntity = this.viewer.entities.add({
      polyline:
        mode === 'point'
          ? undefined
          : {
              positions: new CallbackProperty(displayedLinePositions, false),
              width: 3,
              material: color,
              clampToGround: true,
            },
      polygon:
        mode === 'polygon'
          ? {
              hierarchy: new CallbackProperty(
                () => new PolygonHierarchy(displayedPositions()),
                false,
              ),
              material: color.withAlpha(0.22),
              outline: true,
              outlineColor: color,
              heightReference: HeightReference.CLAMP_TO_GROUND,
            }
          : undefined,
    })
    entities.push(lineEntity)

    const addPointEntity = (position: Cartesian3): void => {
      const entity = this.viewer.entities.add({
        position,
        point: {
          color,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          pixelSize: 9,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
      entities.push(entity)
    }

    const complete = (): void => {
      if (disposed || completed) {
        return
      }
      const minimumPoints = mode === 'point' ? 1 : 2
      if (positions.length < minimumPoints || (mode === 'polygon' && positions.length < 3)) {
        return
      }
      completed = true
      previewPosition = undefined
      const result: DrawingResult = {
        id: `drawing-${Date.now()}-${this.results.size + 1}`,
        mode,
        positions: clonePositions(positions),
        entities: [...entities],
      }
      this.results.set(result.id, result)
      options.onComplete?.(result)
      this.viewer.scene.requestRender()
    }

    const cancel = (): void => {
      if (disposed || completed) {
        return
      }
      disposed = true
      options.onCancel?.()
      destroySession()
    }

    const addPosition = (position: Cartesian3): void => {
      const previous = positions.at(-1)
      if (previous && Cartesian3.distance(previous, position) < 0.25) {
        return
      }
      positions.push(Cartesian3.clone(position))
      addPointEntity(position)
      previewPosition = undefined
      options.onUpdate?.(clonePositions(positions))
      this.viewer.scene.requestRender()
      if (mode === 'point') {
        complete()
      }
    }

    handler.setInputAction((event: ScreenSpaceEventHandler.PositionedEvent) => {
      const position = pickPosition(event.position)
      if (position) {
        addPosition(position)
      }
    }, ScreenSpaceEventType.LEFT_CLICK)
    handler.setInputAction((event: ScreenSpaceEventHandler.MotionEvent) => {
      if (!positions.length || mode === 'point') {
        return
      }
      previewPosition = pickPosition(event.endPosition)
      options.onUpdate?.(clonePositions(displayedPositions()))
      this.viewer.scene.requestRender()
    }, ScreenSpaceEventType.MOUSE_MOVE)
    handler.setInputAction(complete, ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

    const session: DrawingSession = {
      mode,
      stop: cancel,
      dispose: cancel,
    }
    const removeAbortListener = (): void => {
      options.signal?.removeEventListener('abort', cancel)
    }
    const destroySession = (): void => {
      removeAbortListener()
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', onKeyDown)
      }
      if (!handler.isDestroyed()) {
        handler.destroy()
      }
      if (!completed) {
        entities.forEach((entity) => this.viewer.entities.remove(entity))
        this.viewer.scene.requestRender()
      }
      this.sessions.delete(session)
      if (this.activeSession === session) {
        this.activeSession = undefined
      }
    }
    // The callback closes over the session and is intentionally assigned after construction.
    ;(session as { stop: () => void }).stop = (): void => {
      if (disposed) {
        return
      }
      disposed = true
      if (!completed) {
        options.onCancel?.()
      }
      destroySession()
    }
    ;(session as { dispose: () => void }).dispose = session.stop

    this.sessions.add(session)
    this.activeSession = session
    options.signal?.addEventListener('abort', session.stop, { once: true })
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

  private stopActive(): void {
    this.activeSession?.stop()
    this.activeSession = undefined
  }

  private removeResult(result: DrawingResult): void {
    result.entities.forEach((entity) => this.viewer.entities.remove(entity))
    this.results.delete(result.id)
    this.viewer.scene.requestRender()
  }
}
