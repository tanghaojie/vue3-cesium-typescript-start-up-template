import { markRaw, reactive, shallowReadonly } from 'vue'
import { Cartesian3, Cesium3DTileset, Color, SplitDirection, type Viewer } from 'cesium'
import type { Disposable } from '../../core/disposable'
import type { GeoInteractionManager } from '../../core/interaction-manager'
import {
  TilesetTools,
  type TilesetFeatureInfo,
  type TilesetInteractionSession,
} from '../../tools/model/tileset-tools'

export type ModelStatus = 'idle' | 'picking' | 'failed'

export interface ModelState {
  status: ModelStatus
  hasTileset: boolean
  offsetMeters: number
  clipping: boolean
  splitDirection: SplitDirection
  selected?: TilesetFeatureInfo
  error?: string
}

export interface ModelController extends Disposable {
  readonly state: Readonly<ModelState>
  attachTileset(tileset: Cesium3DTileset | undefined): void
  startHighlight(): void
  startClassification(): void
  cancel(): void
  setHeightOffset(offsetMeters: number): void
  setClippingPlane(normal: Cartesian3, distance: number): void
  clearClippingPlane(): void
  setSplitDirection(direction: SplitDirection): void
  clear(): void
}

const HIGHLIGHT = Color.fromCssColorString('#57d8ff')

export function createModelController(
  viewer: Viewer,
  interactions: GeoInteractionManager,
  tileset?: Cesium3DTileset,
): ModelController {
  const state = reactive<ModelState>({
    status: 'idle',
    hasTileset: false,
    offsetMeters: 0,
    clipping: false,
    splitDirection: SplitDirection.NONE,
  })
  let tools: TilesetTools | undefined
  let interactionSession: TilesetInteractionSession | undefined

  function attachTileset(nextTileset: Cesium3DTileset | undefined): void {
    interactionSession?.stop()
    interactions.cancel('switch')
    tools?.dispose()
    tools = nextTileset ? markRaw(new TilesetTools(viewer, nextTileset)) : undefined
    state.hasTileset = Boolean(nextTileset)
    state.selected = undefined
    state.offsetMeters = 0
    state.clipping = false
    state.splitDirection = SplitDirection.NONE
    state.error = undefined
  }

  function ensureTools(): TilesetTools {
    if (!tools) {
      throw new Error('Select or attach a 3D Tileset first')
    }
    return tools
  }

  function startPicking(kind: 'highlight' | 'classification'): void {
    state.status = 'picking'
    state.error = undefined
    try {
      interactions.activate({
        id: `model.${kind}`,
        start(context) {
          const modelTools = ensureTools()
          interactionSession =
            kind === 'highlight'
              ? modelTools.startHighlight({
                  signal: context.signal,
                  color: HIGHLIGHT,
                  onPick(feature) {
                    state.selected = feature
                  },
                  onCancel() {
                    if (state.status === 'picking') {
                      state.status = 'idle'
                    }
                  },
                })
              : modelTools.startClassification({
                  signal: context.signal,
                  color: HIGHLIGHT,
                  onPick(feature) {
                    state.selected = feature
                    if (feature) {
                      context.complete()
                    }
                  },
                  onCancel() {
                    if (state.status === 'picking') {
                      state.status = 'idle'
                    }
                  },
                })
          return interactionSession
        },
      })
      state.status = 'picking'
    } catch (error) {
      state.status = 'failed'
      state.error = error instanceof Error ? error.message : '3D model interaction failed'
    }
  }

  function cancel(): void {
    interactionSession?.stop()
    interactionSession = undefined
    interactions.cancel()
    tools?.stop()
    if (state.status === 'picking') {
      state.status = 'idle'
    }
  }

  function setHeightOffset(offsetMeters: number): void {
    try {
      ensureTools().setHeightOffset(offsetMeters)
      state.offsetMeters = offsetMeters
    } catch (error) {
      state.status = 'failed'
      state.error = error instanceof Error ? error.message : 'Unable to offset tileset'
    }
  }

  function setClippingPlane(normal: Cartesian3, distance: number): void {
    try {
      ensureTools().setClippingPlane(normal, distance)
      state.clipping = true
    } catch (error) {
      state.status = 'failed'
      state.error = error instanceof Error ? error.message : 'Unable to clip tileset'
    }
  }

  function clearClippingPlane(): void {
    tools?.clearClippingPlane()
    state.clipping = false
  }

  function setSplitDirection(direction: SplitDirection): void {
    try {
      ensureTools().setSplitDirection(direction)
      state.splitDirection = direction
    } catch (error) {
      state.status = 'failed'
      state.error = error instanceof Error ? error.message : 'Unable to split tileset'
    }
  }

  function clear(): void {
    cancel()
    tools?.clear()
    state.status = 'idle'
    state.hasTileset = Boolean(tools)
    state.selected = undefined
    state.offsetMeters = 0
    state.clipping = false
    state.splitDirection = SplitDirection.NONE
    state.error = undefined
  }

  function dispose(): void {
    cancel()
    tools?.dispose()
    tools = undefined
    state.hasTileset = false
  }

  if (tileset) {
    attachTileset(tileset)
  }
  return {
    state: shallowReadonly(state),
    attachTileset,
    startHighlight: () => startPicking('highlight'),
    startClassification: () => startPicking('classification'),
    cancel,
    setHeightOffset,
    setClippingPlane,
    clearClippingPlane,
    setSplitDirection,
    clear,
    dispose,
  }
}
