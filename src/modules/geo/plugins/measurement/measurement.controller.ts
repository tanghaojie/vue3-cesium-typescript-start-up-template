import { BoundingSphere, Cartesian3, HeadingPitchRange, type Viewer } from 'cesium'
import { markRaw, reactive, shallowReadonly } from 'vue'
import type { Disposable } from '../../core/disposable'
import type { GeoInteractionManager } from '../../core/interaction-manager'
import {
  DistanceMeasurementTool,
  type DistanceMeasurement,
} from '../../tools/measurement/distance-measurement'
import {
  AreaMeasurementTool,
  PointMeasurementTool,
  type AreaMeasurement,
  type PointMeasurement,
} from '../../tools/measurement/measurement-tools'

export type MeasurementStatus = 'idle' | 'measuring' | 'complete' | 'failed'
export type MeasurementMode = 'point' | 'distance' | 'area'

export interface MeasurementHistoryItem {
  readonly id: string
  readonly mode: MeasurementMode
  readonly createdAt: number
  readonly resultMeters?: number
  readonly resultSquareMeters?: number
  readonly point?: {
    readonly longitude: number
    readonly latitude: number
    readonly height: number
  }
}

export interface MeasurementState {
  status: MeasurementStatus
  mode?: MeasurementMode
  resultMeters?: number
  resultSquareMeters?: number
  point?: PointMeasurement
  history: readonly MeasurementHistoryItem[]
  error?: string
}

export interface MeasurementController extends Disposable {
  readonly state: Readonly<MeasurementState>
  startPoint(): void
  startDistance(): void
  startArea(): void
  cancel(): void
  clearCurrent(): void
  remove(id: string): void
  flyTo(id: string): boolean
  clearAll(): void
  clear(): void
}

const POINT_INTERACTION_ID = 'measurement.point'
const DISTANCE_INTERACTION_ID = 'measurement.distance'
const AREA_INTERACTION_ID = 'measurement.area'

type MeasurementHistoryInput = Omit<MeasurementHistoryItem, 'id' | 'createdAt'>

interface MeasurementRecord {
  readonly item: MeasurementHistoryItem
  readonly positions: readonly Cartesian3[]
  readonly remove: () => void
}

export function createMeasurementController(
  viewer: Viewer,
  interactions: GeoInteractionManager,
): MeasurementController {
  const tool = markRaw(new DistanceMeasurementTool(viewer))
  const pointTool = markRaw(new PointMeasurementTool(viewer))
  const areaTool = markRaw(new AreaMeasurementTool(viewer))
  const state = reactive<MeasurementState>({ status: 'idle', history: [] })
  const records = new Map<string, MeasurementRecord>()
  let historySequence = 0
  let currentHistoryId: string | undefined

  function resetResult(): void {
    state.resultMeters = undefined
    state.resultSquareMeters = undefined
    state.point = undefined
    currentHistoryId = undefined
  }

  function refreshHistory(): void {
    state.history = [...records.values()].map(function copyHistory(record) {
      return record.item
    })
  }

  function addHistory(
    input: MeasurementHistoryInput,
    positions: readonly Cartesian3[],
    remove: () => void,
  ): void {
    const id = `measurement-${Date.now()}-${historySequence + 1}`
    historySequence += 1
    const item: MeasurementHistoryItem = {
      ...input,
      id,
      createdAt: Date.now(),
    }
    records.set(id, {
      item,
      positions: positions.map((position) => Cartesian3.clone(position)),
      remove,
    })
    currentHistoryId = id
    refreshHistory()
  }

  function startPoint(): void {
    state.status = 'measuring'
    state.mode = 'point'
    state.error = undefined
    resetResult()
    try {
      interactions.activate({
        id: POINT_INTERACTION_ID,
        cursor: 'crosshair',
        start(interactionContext) {
          return pointTool.start({
            signal: interactionContext.signal,
            onComplete(point) {
              state.point = point
              state.status = 'complete'
              addHistory(
                {
                  mode: 'point',
                  point: {
                    longitude: point.longitude,
                    latitude: point.latitude,
                    height: point.height,
                  },
                },
                [point.position],
                function removePoint() {
                  pointTool.remove(point)
                },
              )
              interactionContext.complete()
            },
            onCancel() {
              if (state.status === 'measuring') {
                state.status = 'idle'
                resetResult()
              }
            },
          })
        },
      })
      state.status = 'measuring'
      state.mode = 'point'
    } catch (error) {
      state.status = 'failed'
      state.error = error instanceof Error ? error.message : 'Point measurement failed'
    }
  }

  function startDistance(): void {
    state.status = 'measuring'
    state.mode = 'distance'
    state.error = undefined
    resetResult()
    try {
      interactions.activate({
        id: DISTANCE_INTERACTION_ID,
        cursor: 'crosshair',
        start(interactionContext) {
          return tool.startDistance({
            signal: interactionContext.signal,
            onUpdate(distanceMeters) {
              state.resultMeters = distanceMeters
            },
            onComplete(result: DistanceMeasurement) {
              state.resultMeters = result.distanceMeters
              state.status = 'complete'
              addHistory(
                { mode: 'distance', resultMeters: result.distanceMeters },
                result.positions,
                function removeDistance() {
                  tool.remove(result)
                },
              )
              interactionContext.complete()
            },
            onCancel() {
              if (state.status === 'measuring') {
                state.status = 'idle'
                resetResult()
              }
            },
          })
        },
      })
      state.status = 'measuring'
      state.mode = 'distance'
    } catch (error) {
      state.status = 'failed'
      state.error = error instanceof Error ? error.message : 'Distance measurement failed'
    }
  }

  function startArea(): void {
    state.status = 'measuring'
    state.mode = 'area'
    state.error = undefined
    resetResult()
    try {
      interactions.activate({
        id: AREA_INTERACTION_ID,
        cursor: 'crosshair',
        start(interactionContext) {
          return areaTool.start({
            signal: interactionContext.signal,
            onUpdate(areaSquareMeters) {
              state.resultSquareMeters = areaSquareMeters
            },
            onComplete(result: AreaMeasurement) {
              state.resultSquareMeters = result.areaSquareMeters
              state.status = 'complete'
              addHistory(
                { mode: 'area', resultSquareMeters: result.areaSquareMeters },
                result.positions,
                function removeArea() {
                  areaTool.remove(result)
                },
              )
              interactionContext.complete()
            },
            onCancel() {
              if (state.status === 'measuring') {
                state.status = 'idle'
                resetResult()
              }
            },
          })
        },
      })
      state.status = 'measuring'
      state.mode = 'area'
    } catch (error) {
      state.status = 'failed'
      state.error = error instanceof Error ? error.message : 'Area measurement failed'
    }
  }

  function cancel(): void {
    if (
      interactions.state.activeId === POINT_INTERACTION_ID ||
      interactions.state.activeId === DISTANCE_INTERACTION_ID ||
      interactions.state.activeId === AREA_INTERACTION_ID
    ) {
      interactions.cancel()
    }
    if (state.status === 'measuring') {
      state.status = 'idle'
      resetResult()
    }
  }

  function remove(id: string): void {
    const record = records.get(id)
    if (!record) {
      return
    }
    record.remove()
    records.delete(id)
    if (currentHistoryId === id) {
      resetResult()
      state.status = 'idle'
    }
    refreshHistory()
  }

  function clearCurrent(): void {
    cancel()
    if (currentHistoryId) {
      remove(currentHistoryId)
    }
    state.status = 'idle'
    resetResult()
  }

  function flyTo(id: string): boolean {
    const record = records.get(id)
    if (!record || !record.positions.length) {
      return false
    }
    const sphere = BoundingSphere.fromPoints([...record.positions])
    viewer.camera.flyToBoundingSphere(sphere, {
      duration: 1.2,
      offset: new HeadingPitchRange(0, -Math.PI / 4, Math.max(sphere.radius * 3, 1_000)),
    })
    return true
  }

  function clearAll(): void {
    cancel()
    tool.clear()
    pointTool.clear()
    areaTool.clear()
    records.clear()
    refreshHistory()
    resetResult()
    state.status = 'idle'
    state.error = undefined
  }

  function clear(): void {
    clearAll()
  }

  function dispose(): void {
    clearAll()
    tool.dispose()
    pointTool.dispose()
    areaTool.dispose()
  }

  return {
    state: shallowReadonly(state),
    startPoint,
    startDistance,
    startArea,
    cancel,
    clearCurrent,
    remove,
    flyTo,
    clearAll,
    clear,
    dispose,
  }
}
