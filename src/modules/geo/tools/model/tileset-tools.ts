import {
  Cartesian2,
  Cartesian3,
  Cesium3DTileFeature,
  Cesium3DTileset,
  ClippingPlane,
  ClippingPlaneCollection,
  Color,
  Matrix4,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  SplitDirection,
  type Viewer,
} from 'cesium'

export interface TilesetFeatureInfo {
  readonly feature: Cesium3DTileFeature
  readonly properties: Readonly<Record<string, unknown>>
}

export interface TilesetInteractionSession {
  stop(): void
  dispose(): void
}

export interface TilesetPickOptions {
  readonly signal?: AbortSignal
  readonly color?: Color
  readonly onPick?: (feature: TilesetFeatureInfo | undefined) => void
  readonly onCancel?: () => void
}

const HIGHLIGHT_COLOR = Color.fromCssColorString('#57d8ff')

function isTileFeature(value: unknown): value is Cesium3DTileFeature {
  return value instanceof Cesium3DTileFeature
}

function featureInfo(feature: Cesium3DTileFeature): TilesetFeatureInfo {
  const properties: Record<string, unknown> = {}
  feature.getPropertyIds().forEach(function copyProperty(propertyId) {
    properties[propertyId] = feature.getProperty(propertyId)
  })
  return { feature, properties }
}

export class TilesetTools {
  private readonly originalModelMatrix: Matrix4
  private readonly originalClippingPlanes: ClippingPlaneCollection
  private activeSession?: TilesetInteractionSession
  private highlighted?: { feature: Cesium3DTileFeature; color: Color }
  private readonly classified = new Map<Cesium3DTileFeature, Color>()
  private ownClippingPlanes?: ClippingPlaneCollection
  private disposed = false

  constructor(
    private readonly viewer: Viewer,
    private readonly tileset: Cesium3DTileset,
  ) {
    this.originalModelMatrix = Matrix4.clone(tileset.modelMatrix, new Matrix4())
    this.originalClippingPlanes = tileset.clippingPlanes
  }

  startHighlight(options: TilesetPickOptions = {}): TilesetInteractionSession {
    return this.startPicking(ScreenSpaceEventType.MOUSE_MOVE, options)
  }

  startClassification(options: TilesetPickOptions = {}): TilesetInteractionSession {
    return this.startPicking(ScreenSpaceEventType.LEFT_CLICK, options)
  }

  pick(screenPosition: Cartesian2): TilesetFeatureInfo | undefined {
    const picked = this.viewer.scene.pick(screenPosition)
    if (!isTileFeature(picked) || picked.tileset !== this.tileset) {
      return undefined
    }
    return featureInfo(picked)
  }

  setHeightOffset(offsetMeters: number): void {
    if (!Number.isFinite(offsetMeters)) {
      throw new Error('Tileset height offset must be a finite number')
    }
    const translation = new Cartesian3(0, 0, offsetMeters)
    this.tileset.modelMatrix = Matrix4.multiplyByTranslation(
      this.originalModelMatrix,
      translation,
      new Matrix4(),
    )
    this.viewer.scene.requestRender()
  }

  setClippingPlane(normal: Cartesian3, distance: number): void {
    if (!Number.isFinite(distance) || Cartesian3.magnitude(normal) < 1e-8) {
      throw new Error('A clipping plane requires a finite distance and non-zero normal')
    }
    const normalized = Cartesian3.normalize(normal, new Cartesian3())
    this.clearClippingPlane()
    const collection = new ClippingPlaneCollection({
      planes: [new ClippingPlane(normalized, distance)],
      enabled: true,
      edgeColor: HIGHLIGHT_COLOR,
      edgeWidth: 1.5,
    })
    this.ownClippingPlanes = collection
    this.tileset.clippingPlanes = collection
    this.viewer.scene.requestRender()
  }

  clearClippingPlane(): void {
    if (this.ownClippingPlanes) {
      this.tileset.clippingPlanes = this.originalClippingPlanes
      if (!this.ownClippingPlanes.isDestroyed()) {
        this.ownClippingPlanes.destroy()
      }
      this.ownClippingPlanes = undefined
      this.viewer.scene.requestRender()
    }
  }

  setSplitDirection(direction: SplitDirection): void {
    this.tileset.splitDirection = direction
    this.viewer.scene.requestRender()
  }

  clear(): void {
    this.stop()
    this.restoreHighlight()
    this.restoreClassified()
    this.clearClippingPlane()
    this.tileset.modelMatrix = Matrix4.clone(this.originalModelMatrix, new Matrix4())
    this.tileset.splitDirection = SplitDirection.NONE
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

  private startPicking(
    eventType: ScreenSpaceEventType,
    options: TilesetPickOptions,
  ): TilesetInteractionSession {
    if (this.disposed) {
      throw new Error('Tileset tools have been disposed')
    }
    if (options.signal?.aborted) {
      throw new Error('Tileset interaction was cancelled before it started')
    }
    this.stop()
    const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas)
    let stopped = false
    const color = options.color ?? HIGHLIGHT_COLOR
    const onEvent = (
      event: ScreenSpaceEventHandler.PositionedEvent | ScreenSpaceEventHandler.MotionEvent,
    ): void => {
      if (stopped) {
        return
      }
      const screenPosition = 'position' in event ? event.position : event.endPosition
      const picked = this.pick(screenPosition)
      if (eventType === ScreenSpaceEventType.MOUSE_MOVE) {
        this.restoreHighlight()
        if (picked) {
          const originalColor = Color.clone(picked.feature.color, new Color())
          picked.feature.color = color
          this.highlighted = { feature: picked.feature, color: originalColor }
        }
      } else if (picked) {
        this.restoreHighlight()
        const originalColor =
          this.classified.get(picked.feature) ?? Color.clone(picked.feature.color, new Color())
        this.classified.set(picked.feature, originalColor)
        picked.feature.color = color
      }
      options.onPick?.(picked)
      this.viewer.scene.requestRender()
    }
    handler.setInputAction(onEvent, eventType)
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
      this.restoreHighlight()
      options.onCancel?.()
      if (this.activeSession === session) {
        this.activeSession = undefined
      }
    }
    const session: TilesetInteractionSession = { stop, dispose: stop }
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

  private restoreHighlight(): void {
    if (!this.highlighted) {
      return
    }
    this.highlighted.feature.color = this.highlighted.color
    this.highlighted = undefined
    this.viewer.scene.requestRender()
  }

  private restoreClassified(): void {
    this.classified.forEach((color, feature) => {
      feature.color = color
    })
    this.classified.clear()
    this.viewer.scene.requestRender()
  }
}
