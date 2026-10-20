import {
  Cartographic,
  Cartesian2,
  Cartesian3,
  Color,
  createElevationBandMaterial,
  EllipsoidGeodesic,
  Material,
  CallbackProperty,
  PolygonHierarchy,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Entity,
  type Material as CesiumMaterial,
  type TerrainProvider,
  type Viewer,
  sampleTerrainMostDetailed,
} from 'cesium'

export interface TerrainSample {
  readonly requested: Cartographic
  readonly sampled: Cartographic
  readonly height: number
  readonly position: Cartesian3
}

export interface TerrainProfileSample extends TerrainSample {
  readonly distanceMeters: number
}

export interface TerrainSampleOptions {
  readonly signal?: AbortSignal
  readonly maxSamples?: number
  readonly onProgress?: (completed: number, total: number) => void
}

export interface TerrainProfileOptions {
  readonly signal?: AbortSignal
  readonly onComplete: (positions: readonly Cartesian3[]) => void
  readonly onCancel?: () => void
}

export interface FloodOptions {
  readonly signal?: AbortSignal
  readonly waterHeight: number
  readonly durationMs?: number
  readonly color?: Color
  readonly onProgress?: (waterHeight: number) => void
}

export interface TerrainAnalysisSession {
  stop(): void
  dispose(): void
}

export type TerrainColorMode = 'elevation' | 'contour' | 'slope' | 'aspect'

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('Terrain analysis was cancelled', 'AbortError')
  }
}

function toCartographic(position: Cartesian3): Cartographic {
  return Cartographic.fromCartesian(position)
}

function pickGlobePosition(viewer: Viewer, screenPosition: Cartesian2): Cartesian3 | undefined {
  const ray = viewer.camera.getPickRay(screenPosition)
  return ray ? viewer.scene.globe.pick(ray, viewer.scene) : undefined
}

function createColorRamp(stops: readonly { offset: number; color: string }[]): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    throw new Error('Terrain color ramps require a browser document')
  }
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Terrain color ramp canvas is unavailable')
  }
  const gradient = context.createLinearGradient(0, 0, canvas.width, 0)
  stops.forEach(function addStop(stop) {
    gradient.addColorStop(stop.offset, stop.color)
  })
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}

function interpolateProfilePositions(
  positions: readonly Cartesian3[],
  maxSamples: number,
): { requested: Cartographic[]; distances: number[] } {
  const cartographics = positions.map(toCartographic)
  const segments = cartographics.slice(1).map(function createSegment(end, index) {
    const start = cartographics[index]
    const geodesic = new EllipsoidGeodesic(start, end)
    return { start, end, geodesic, distance: geodesic.surfaceDistance }
  })
  const totalDistance = segments.reduce((sum, segment) => sum + segment.distance, 0)
  if (totalDistance <= 0) {
    throw new Error('采样线长度必须大于 0')
  }
  const sampleCount = Math.min(maxSamples, Math.max(32, Math.ceil(totalDistance / 100) + 1))
  const requested: Cartographic[] = []
  const distances: number[] = []
  let segmentIndex = 0
  let segmentStartDistance = 0
  for (let index = 0; index < sampleCount; index += 1) {
    const distance = (totalDistance * index) / (sampleCount - 1)
    while (
      segmentIndex < segments.length - 1 &&
      distance > segmentStartDistance + segments[segmentIndex].distance
    ) {
      segmentStartDistance += segments[segmentIndex].distance
      segmentIndex += 1
    }
    const segment = segments[segmentIndex]
    const localDistance = Math.min(Math.max(distance - segmentStartDistance, 0), segment.distance)
    const interpolated = segment.geodesic.interpolateUsingSurfaceDistance(localDistance)
    const fraction = segment.distance ? localDistance / segment.distance : 0
    interpolated.height =
      segment.start.height + (segment.end.height - segment.start.height) * fraction
    requested.push(Cartographic.clone(interpolated, new Cartographic()))
    distances.push(distance)
  }
  return { requested, distances }
}

export class TerrainAnalysisTool {
  private readonly entities = new Set<Entity>()
  private readonly profileEntities = new Set<Entity>()
  private readonly originalMaterial: CesiumMaterial | undefined
  private activeSession?: TerrainAnalysisSession
  private profileSession?: TerrainAnalysisSession
  private disposed = false

  constructor(
    private readonly viewer: Viewer,
    private readonly terrainProvider?: TerrainProvider,
  ) {
    this.originalMaterial = viewer.scene.globe.material
  }

  async sample(
    positions: readonly Cartesian3[],
    options: TerrainSampleOptions = {},
  ): Promise<TerrainSample[]> {
    if (this.disposed) {
      throw new Error('Terrain analysis tool has been disposed')
    }
    const maxSamples = Math.min(Math.max(options.maxSamples ?? 500, 1), 2000)
    const boundedPositions = positions.slice(0, maxSamples)
    if (!boundedPositions.length) {
      return []
    }
    throwIfAborted(options.signal)
    const requested = boundedPositions.map(toCartographic)
    const terrainProvider = this.terrainProvider ?? this.viewer.scene.globe.terrainProvider
    if (!terrainProvider.availability) {
      throw new Error('当前地形不支持高精度采样，请先在数据面板切换到可采样地形')
    }
    const sampled = await sampleTerrainMostDetailed(terrainProvider, requested)
    throwIfAborted(options.signal)
    options.onProgress?.(sampled.length, sampled.length)
    return sampled.map(function makeSample(cartographic, index) {
      const original = requested[index]
      return {
        requested: Cartographic.clone(original, new Cartographic()),
        sampled: Cartographic.clone(cartographic, new Cartographic()),
        height: cartographic.height,
        position: Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          cartographic.height,
        ),
      }
    })
  }

  startProfile(options: TerrainProfileOptions): TerrainAnalysisSession {
    if (this.disposed) {
      throw new Error('Terrain analysis tool has been disposed')
    }
    this.clearProfile()
    if (options.signal?.aborted) {
      throw new Error('地形剖面绘制在开始前已取消')
    }
    const positions: Cartesian3[] = []
    let previewPosition: Cartesian3 | undefined
    let completed = false
    let stopped = false
    const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas)
    const displayedPositions = new CallbackProperty(
      () => (previewPosition ? [...positions, previewPosition] : positions),
      false,
    )
    const line = this.viewer.entities.add({
      polyline: {
        positions: displayedPositions,
        width: 3,
        material: Color.fromCssColorString('#55d6ff'),
        depthFailMaterial: Color.fromCssColorString('#55d6ff').withAlpha(0.55),
      },
    })
    this.entities.add(line)
    this.profileEntities.add(line)

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
        this.clearProfileEntities()
        options.onCancel?.()
      }
      if (this.activeSession === session) {
        this.activeSession = undefined
      }
      if (this.profileSession === session) {
        this.profileSession = undefined
      }
      this.viewer.scene.requestRender()
    }
    const session: TerrainAnalysisSession = { stop, dispose: stop }
    const addPoint = (position: Cartesian3): void => {
      const lastPosition = positions.at(-1)
      if (lastPosition && Cartesian3.distance(lastPosition, position) < 0.25) {
        return
      }
      positions.push(Cartesian3.clone(position))
      const point = this.viewer.entities.add({
        position,
        point: {
          color: Color.fromCssColorString('#55d6ff'),
          outlineColor: Color.fromCssColorString('#06111d'),
          outlineWidth: 2,
          pixelSize: 9,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
      this.entities.add(point)
      this.profileEntities.add(point)
    }
    handler.setInputAction((event: ScreenSpaceEventHandler.PositionedEvent) => {
      const position = pickGlobePosition(this.viewer, event.position)
      if (!position || stopped) {
        return
      }
      addPoint(position)
      previewPosition = undefined
      this.viewer.scene.requestRender()
    }, ScreenSpaceEventType.LEFT_CLICK)
    handler.setInputAction((event: ScreenSpaceEventHandler.MotionEvent) => {
      if (!positions.length || stopped) {
        return
      }
      previewPosition = pickGlobePosition(this.viewer, event.endPosition)
      this.viewer.scene.requestRender()
    }, ScreenSpaceEventType.MOUSE_MOVE)
    handler.setInputAction(() => {
      if (positions.length < 2 || stopped) {
        return
      }
      completed = true
      previewPosition = undefined
      options.onComplete(positions.map((position) => Cartesian3.clone(position)))
      stop()
    }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        stop()
      }
    }
    options.signal?.addEventListener('abort', stop, { once: true })
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKeyDown)
    }
    this.activeSession = session
    this.profileSession = session
    this.viewer.scene.requestRender()
    return session
  }

  async sampleProfile(
    positions: readonly Cartesian3[],
    options: TerrainSampleOptions = {},
  ): Promise<TerrainProfileSample[]> {
    if (this.disposed) {
      throw new Error('Terrain analysis tool has been disposed')
    }
    if (positions.length < 2) {
      throw new Error('请至少绘制两个采样线端点')
    }
    const maxSamples = Math.min(Math.max(options.maxSamples ?? 500, 2), 500)
    const { requested, distances } = interpolateProfilePositions(positions, maxSamples)
    throwIfAborted(options.signal)
    const terrainProvider = this.terrainProvider ?? this.viewer.scene.globe.terrainProvider
    if (!terrainProvider.availability) {
      throw new Error('当前地形不支持高精度采样，请先在数据面板切换到可采样地形')
    }
    const sampled = await sampleTerrainMostDetailed(terrainProvider, requested)
    throwIfAborted(options.signal)
    options.onProgress?.(sampled.length, sampled.length)
    const result = sampled.map(function makeProfileSample(cartographic, index) {
      return {
        requested: Cartographic.clone(requested[index], new Cartographic()),
        sampled: Cartographic.clone(cartographic, new Cartographic()),
        height: cartographic.height,
        distanceMeters: distances[index],
        position: Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          cartographic.height,
        ),
      }
    })
    this.clearProfileEntities()
    const profileLine = this.viewer.entities.add({
      polyline: {
        positions: result.map((sample) => sample.position),
        width: 4,
        material: Color.fromCssColorString('#ffbd66'),
        depthFailMaterial: Color.fromCssColorString('#ffbd66').withAlpha(0.65),
      },
    })
    this.entities.add(profileLine)
    this.profileEntities.add(profileLine)
    this.viewer.scene.requestRender()
    return result
  }

  startFlood(positions: readonly Cartesian3[], options: FloodOptions): TerrainAnalysisSession {
    if (this.disposed) {
      throw new Error('Terrain analysis tool has been disposed')
    }
    if (positions.length < 3 || !Number.isFinite(options.waterHeight)) {
      throw new Error('Flood analysis needs at least three positions and a finite water height')
    }
    this.stop()
    let currentHeight = 0
    const polygon = this.viewer.entities.add({
      polygon: {
        hierarchy: new PolygonHierarchy(positions.map((position) => Cartesian3.clone(position))),
        height: new CallbackProperty(() => currentHeight, false),
        extrudedHeight: new CallbackProperty(() => currentHeight, false),
        perPositionHeight: false,
        material: (options.color ?? Color.fromCssColorString('#3a9dff')).withAlpha(0.45),
        outline: true,
        outlineColor: options.color ?? Color.fromCssColorString('#3a9dff'),
      },
    })
    this.entities.add(polygon)
    const duration = Math.min(Math.max(options.durationMs ?? 0, 0), 120_000)
    let stopped = false
    let animationFrame: number | undefined
    const startTime = Date.now()
    const update = (): void => {
      if (stopped || options.signal?.aborted) {
        stop()
        return
      }
      const progress = duration === 0 ? 1 : Math.min((Date.now() - startTime) / duration, 1)
      currentHeight = options.waterHeight * progress
      // CallbackProperty reads the current height on every render frame.
      options.onProgress?.(currentHeight)
      this.viewer.scene.requestRender()
      if (progress < 1) {
        animationFrame = requestAnimationFrame(update)
      }
    }
    const stop = (): void => {
      if (stopped) {
        return
      }
      stopped = true
      options.signal?.removeEventListener('abort', stop)
      if (animationFrame !== undefined) {
        cancelAnimationFrame(animationFrame)
      }
      this.viewer.entities.remove(polygon)
      this.entities.delete(polygon)
      this.viewer.scene.requestRender()
      if (this.activeSession === session) {
        this.activeSession = undefined
      }
    }
    const session: TerrainAnalysisSession = { stop, dispose: stop }
    this.activeSession = session
    options.signal?.addEventListener('abort', stop, { once: true })
    update()
    return session
  }

  setTerrainColorMode(mode: TerrainColorMode, contourInterval = 100): void {
    if (this.disposed) {
      throw new Error('Terrain analysis tool has been disposed')
    }
    const globe = this.viewer.scene.globe
    if (mode === 'elevation') {
      globe.material = createElevationBandMaterial({
        scene: this.viewer.scene,
        layers: [
          {
            entries: [
              { height: -500, color: Color.fromCssColorString('#254b8e') },
              { height: 0, color: Color.fromCssColorString('#4ca36b') },
              { height: 1200, color: Color.fromCssColorString('#d8bf71') },
              { height: 3500, color: Color.fromCssColorString('#f4f4f4') },
            ],
            extendDownwards: true,
            extendUpwards: true,
          },
        ],
      })
      this.viewer.scene.requestRender()
      return
    }
    if (mode === 'contour') {
      globe.material = Material.fromType(Material.ElevationContourType, {
        color: Color.fromCssColorString('#ffe08a'),
        spacing: Math.min(Math.max(contourInterval, 1), 10_000),
        width: 1.2,
      })
      this.viewer.scene.requestRender()
      return
    }
    globe.material = Material.fromType(
      mode === 'slope' ? Material.SlopeRampMaterialType : Material.AspectRampMaterialType,
      {
        image:
          mode === 'slope'
            ? createColorRamp([
                { offset: 0, color: '#214f84' },
                { offset: 0.28, color: '#4db17b' },
                { offset: 0.58, color: '#e5c76a' },
                { offset: 0.82, color: '#df7749' },
                { offset: 1, color: '#f2f4f5' },
              ])
            : createColorRamp([
                { offset: 0, color: '#d84a46' },
                { offset: 0.2, color: '#e7bf4b' },
                { offset: 0.4, color: '#63b96c' },
                { offset: 0.6, color: '#4bb9d9' },
                { offset: 0.8, color: '#486ec8' },
                { offset: 1, color: '#c05abe' },
              ]),
      },
    )
    this.viewer.scene.requestRender()
  }

  clearTerrainColorMode(): void {
    this.viewer.scene.globe.material = this.originalMaterial
    this.viewer.scene.requestRender()
  }

  clear(): void {
    this.stop()
    this.entities.forEach((entity) => this.viewer.entities.remove(entity))
    this.entities.clear()
    this.profileEntities.clear()
    this.clearTerrainColorMode()
  }

  private clearProfileEntities(): void {
    this.profileEntities.forEach((entity) => {
      this.viewer.entities.remove(entity)
      this.entities.delete(entity)
    })
    this.profileEntities.clear()
  }

  clearProfile(): void {
    this.profileSession?.stop()
    this.profileSession = undefined
    this.clearProfileEntities()
    this.viewer.scene.requestRender()
  }

  stop(): void {
    this.activeSession?.stop()
    this.activeSession = undefined
  }

  dispose(): void {
    if (this.disposed) {
      return
    }
    this.disposed = true
    this.clear()
  }
}
