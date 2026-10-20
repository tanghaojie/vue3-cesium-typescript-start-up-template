import { markRaw, reactive, readonly } from 'vue'
import { ImageryProvider, type Viewer } from 'cesium'
import type { Disposable } from '../../core/disposable'
import {
  SceneCompareTool,
  type SceneCompareOptions,
  type SceneCompareSession,
} from '../../tools/compare/scene-compare'
import type {
  GeoImageryLayerReference,
  ImageryLayerCollectionCapability,
} from '../data/data.capabilities'

export interface CompareState {
  enabled: boolean
  hasSession: boolean
  splitPosition: number
  layers: readonly CompareLayerOption[]
  error?: string
}

export interface CompareLayerOption {
  readonly id: string
  readonly index: number
  readonly label: string
}

export interface CompareController extends Disposable {
  readonly state: Readonly<CompareState>
  enable(options: SceneCompareOptions): void
  enableWithProviders(left: ImageryProvider, right: ImageryProvider): void
  enableLayerComparison(leftId: string, rightId: string): void
  refreshLayers(): void
  setSplitPosition(value: number): void
  setEnabled(enabled: boolean): void
  disable(): void
}

interface CompareSessionLayerIds {
  readonly left: string
  readonly right: string
}

export function createCompareController(
  viewer: Viewer,
  imageryLayers: ImageryLayerCollectionCapability,
): CompareController {
  const tool = markRaw(new SceneCompareTool(viewer))
  const state = reactive<CompareState>({
    enabled: false,
    hasSession: false,
    splitPosition: 0.5,
    layers: [],
  })
  let session: SceneCompareSession | undefined
  let sessionLayerIds: CompareSessionLayerIds | undefined

  function refreshLayers(): void {
    state.layers = imageryLayers.list().map(function mapLayer(layer) {
      return { id: layer.id, index: layer.index, label: layer.label }
    })
  }

  function enable(options: SceneCompareOptions, layerIds?: CompareSessionLayerIds): void {
    try {
      session?.stop()
      session = undefined
      sessionLayerIds = undefined
      session = tool.enable({
        ...options,
        splitPosition: options.splitPosition ?? state.splitPosition,
      })
      state.enabled = true
      state.hasSession = true
      sessionLayerIds = layerIds
      state.splitPosition = options.splitPosition ?? state.splitPosition
      state.error = undefined
    } catch (error) {
      state.enabled = false
      state.hasSession = false
      sessionLayerIds = undefined
      state.error = error instanceof Error ? error.message : 'Scene comparison failed'
    }
  }

  function enableWithProviders(left: ImageryProvider, right: ImageryProvider): void {
    enable({ leftProvider: left, rightProvider: right })
  }

  function enableLayerComparison(leftId: string, rightId: string): void {
    if (leftId === rightId) {
      state.error = '左右图层必须不同'
      return
    }
    const leftLayer = imageryLayers.getLayer(leftId)
    const rightLayer = imageryLayers.getLayer(rightId)
    if (!leftLayer || !rightLayer) {
      state.error = '选择的影像图层不存在'
      refreshLayers()
      return
    }
    enable({ leftLayer, rightLayer }, { left: leftId, right: rightId })
  }

  function setSplitPosition(value: number): void {
    if (!Number.isFinite(value)) {
      state.error = '分屏位置必须是有效数字'
      return
    }
    const nextValue = Math.min(Math.max(value, 0), 1)
    state.splitPosition = nextValue
    try {
      session?.setSplitPosition(nextValue)
    } catch (error) {
      state.error = error instanceof Error ? error.message : '分屏位置设置失败'
    }
  }

  function setEnabled(enabled: boolean): void {
    if (!session) {
      state.enabled = false
      if (enabled) {
        state.error = '请先开始对比'
      }
      return
    }
    session.setEnabled(enabled)
    state.enabled = session.enabled
    state.error = undefined
  }

  function disable(): void {
    session?.stop()
    session = undefined
    sessionLayerIds = undefined
    state.enabled = false
    state.hasSession = false
  }

  function dispose(): void {
    layerSubscription.dispose()
    disable()
    tool.dispose()
  }

  const layerSubscription = imageryLayers.subscribe(function synchronizeLayers(
    layers: readonly GeoImageryLayerReference[],
  ) {
    state.layers = layers.map(function mapLayer(layer) {
      return { id: layer.id, index: layer.index, label: layer.label }
    })
    if (
      sessionLayerIds &&
      (!imageryLayers.getLayer(sessionLayerIds.left) ||
        !imageryLayers.getLayer(sessionLayerIds.right))
    ) {
      disable()
      state.error = '参与对比的影像图层已被移除，对比会话已关闭'
    }
  })
  return {
    state: readonly(state),
    enable,
    enableWithProviders,
    enableLayerComparison,
    refreshLayers,
    setSplitPosition,
    setEnabled,
    disable,
    dispose,
  }
}
