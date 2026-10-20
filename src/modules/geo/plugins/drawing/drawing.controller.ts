import { markRaw, reactive, shallowReadonly } from 'vue'
import type { Color, Viewer } from 'cesium'
import type { Disposable } from '../../core/disposable'
import type { GeoInteractionManager } from '../../core/interaction-manager'
import { DrawingTool, type DrawingMode, type DrawingResult } from '../../tools/drawing/drawing-tool'

export type DrawingStatus = 'idle' | 'drawing' | 'complete' | 'failed'

export interface DrawingState {
  status: DrawingStatus
  mode?: DrawingMode
  pointCount: number
  result?: DrawingResult
  error?: string
}

export interface DrawingController extends Disposable {
  readonly state: Readonly<DrawingState>
  startPoint(): void
  startPolyline(): void
  startPolygon(): void
  cancel(): void
  clearCurrent(): void
  clearAll(): void
}

const INTERACTION_IDS: Record<DrawingMode, string> = {
  point: 'drawing.point',
  polyline: 'drawing.polyline',
  polygon: 'drawing.polygon',
}

export function createDrawingController(
  viewer: Viewer,
  interactions: GeoInteractionManager,
  color?: Color,
): DrawingController {
  const tool = markRaw(new DrawingTool(viewer))
  const state = reactive<DrawingState>({ status: 'idle', pointCount: 0 })

  function start(mode: DrawingMode): void {
    state.status = 'drawing'
    state.mode = mode
    state.pointCount = 0
    state.result = undefined
    state.error = undefined
    try {
      interactions.activate({
        id: INTERACTION_IDS[mode],
        cursor: 'crosshair',
        start(context) {
          const starter =
            mode === 'point'
              ? tool.startPoint.bind(tool)
              : mode === 'polyline'
                ? tool.startPolyline.bind(tool)
                : tool.startPolygon.bind(tool)
          return starter({
            signal: context.signal,
            color,
            onUpdate(positions) {
              state.pointCount = positions.length
            },
            onComplete(result: DrawingResult) {
              state.pointCount = result.positions.length
              state.result = result
              state.status = 'complete'
              context.complete()
            },
            onCancel() {
              if (state.status === 'drawing') {
                state.status = 'idle'
                state.pointCount = 0
              }
            },
          })
        },
      })
      state.status = 'drawing'
      state.mode = mode
    } catch (error) {
      state.status = 'failed'
      state.error = error instanceof Error ? error.message : 'Drawing failed'
    }
  }

  function cancel(): void {
    interactions.cancel()
    tool.stop()
    if (state.status === 'drawing') {
      state.status = 'idle'
      state.pointCount = 0
    }
  }

  function clearCurrent(): void {
    cancel()
    tool.clearCurrent()
    state.result = undefined
    state.pointCount = 0
    state.status = 'idle'
  }

  function clearAll(): void {
    cancel()
    tool.clearAll()
    state.result = undefined
    state.pointCount = 0
    state.status = 'idle'
    state.error = undefined
  }

  function dispose(): void {
    cancel()
    tool.dispose()
  }

  return {
    state: shallowReadonly(state),
    startPoint: () => start('point'),
    startPolyline: () => start('polyline'),
    startPolygon: () => start('polygon'),
    cancel,
    clearCurrent,
    clearAll,
    dispose,
  }
}
