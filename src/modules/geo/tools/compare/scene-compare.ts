import { ImageryLayer, ImageryProvider, SplitDirection, type Viewer } from 'cesium'

export interface SceneCompareOptions {
  readonly leftLayer?: ImageryLayer
  readonly rightLayer?: ImageryLayer
  readonly leftProvider?: ImageryProvider
  readonly rightProvider?: ImageryProvider
  readonly splitPosition?: number
}

export interface SceneCompareSession {
  readonly enabled: boolean
  setSplitPosition(value: number): void
  setEnabled(enabled: boolean): void
  stop(): void
  dispose(): void
}

export class SceneCompareTool {
  private session?: SceneCompareSession
  private disposed = false

  constructor(private readonly viewer: Viewer) {}

  enable(options: SceneCompareOptions): SceneCompareSession {
    if (this.disposed) {
      throw new Error('Scene compare tool has been disposed')
    }
    if (
      (!options.leftLayer && !options.leftProvider) ||
      (!options.rightLayer && !options.rightProvider)
    ) {
      throw new Error('Scene comparison requires a left and a right imagery source')
    }
    if (options.leftLayer && options.leftLayer === options.rightLayer) {
      throw new Error('Scene comparison requires two different imagery layers')
    }
    if (options.splitPosition !== undefined && !Number.isFinite(options.splitPosition)) {
      throw new Error('Scene comparison split position must be finite')
    }
    this.stop()
    const ownedLayers: ImageryLayer[] = []
    let leftLayer: ImageryLayer | undefined
    let rightLayer: ImageryLayer | undefined
    try {
      leftLayer = options.leftLayer ?? this.addProvider(options.leftProvider, ownedLayers)
      rightLayer = options.rightLayer ?? this.addProvider(options.rightProvider, ownedLayers)
    } catch (error) {
      ownedLayers.forEach((layer) => this.viewer.imageryLayers.remove(layer, true))
      throw error
    }
    if (!leftLayer || !rightLayer) {
      ownedLayers.forEach((layer) => this.viewer.imageryLayers.remove(layer, true))
      throw new Error('Scene comparison requires two imagery layers or providers')
    }
    const previousLeftDirection = leftLayer.splitDirection
    const previousRightDirection = rightLayer.splitDirection
    const previousLeftShow = leftLayer.show
    const previousRightShow = rightLayer.show
    const previousSplitPosition = this.viewer.scene.splitPosition
    let enabled = true
    let stopped = false
    const setSplitPosition = (value: number): void => {
      if (stopped) {
        return
      }
      if (!Number.isFinite(value)) {
        throw new Error('Scene comparison split position must be finite')
      }
      this.viewer.scene.splitPosition = Math.min(Math.max(value, 0), 1)
      this.viewer.scene.requestRender()
    }
    const setEnabled = (nextEnabled: boolean): void => {
      if (stopped) {
        return
      }
      enabled = nextEnabled
      leftLayer.splitDirection = nextEnabled ? SplitDirection.LEFT : SplitDirection.NONE
      rightLayer.splitDirection = nextEnabled ? SplitDirection.RIGHT : SplitDirection.NONE
      this.viewer.scene.requestRender()
    }
    const stop = (): void => {
      if (stopped) {
        return
      }
      stopped = true
      leftLayer.splitDirection = previousLeftDirection
      rightLayer.splitDirection = previousRightDirection
      leftLayer.show = previousLeftShow
      rightLayer.show = previousRightShow
      this.viewer.scene.splitPosition = previousSplitPosition
      ownedLayers.forEach((layer) => this.viewer.imageryLayers.remove(layer, true))
      this.viewer.scene.requestRender()
      if (this.session === session) {
        this.session = undefined
      }
    }
    const session: SceneCompareSession = {
      get enabled() {
        return enabled
      },
      setSplitPosition,
      setEnabled,
      stop,
      dispose: stop,
    }
    try {
      setEnabled(true)
      setSplitPosition(options.splitPosition ?? 0.5)
    } catch (error) {
      leftLayer.splitDirection = previousLeftDirection
      rightLayer.splitDirection = previousRightDirection
      this.viewer.scene.splitPosition = previousSplitPosition
      ownedLayers.forEach((layer) => this.viewer.imageryLayers.remove(layer, true))
      throw error
    }
    this.session = session
    return session
  }

  setSplitPosition(value: number): void {
    this.session?.setSplitPosition(value)
  }

  stop(): void {
    this.session?.stop()
    this.session = undefined
  }

  dispose(): void {
    if (this.disposed) {
      return
    }
    this.disposed = true
    this.stop()
  }

  private addProvider(
    provider: ImageryProvider | undefined,
    ownedLayers: ImageryLayer[],
  ): ImageryLayer | undefined {
    if (!provider) {
      return undefined
    }
    const layer = this.viewer.imageryLayers.addImageryProvider(provider)
    ownedLayers.push(layer)
    return layer
  }
}
