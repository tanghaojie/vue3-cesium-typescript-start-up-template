import { markRaw, reactive, shallowReadonly } from 'vue'
import {
  Color,
  EllipsoidTerrainProvider,
  type Cartesian3,
  type TerrainProvider,
  type Viewer,
} from 'cesium'
import type { Disposable } from '../../core/disposable'
import type { GeoInteractionManager } from '../../core/interaction-manager'
import {
  TerrainAnalysisTool,
  type TerrainAnalysisSession,
  type TerrainColorMode,
  type TerrainProfileSample,
} from '../../tools/terrain/terrain-analysis'
import { DrawingTool } from '../../tools/drawing/drawing-tool'

export type TerrainStatus = 'idle' | 'running' | 'complete' | 'failed'
export type TerrainActivity = 'drawing-profile' | 'sampling-profile' | 'drawing-flood' | 'flood'

const TERRAIN_REQUIRED_MESSAGE = '当前未加载地形，等高线无法使用。请先到数据面板加载地形。'

export interface TerrainState {
  status: TerrainStatus
  activity?: TerrainActivity
  progress: number
  sampled: TerrainProfileSample[]
  terrainAvailable: boolean
  contourInterval: number
  colorMode?: TerrainColorMode
  error?: string
}

export interface TerrainController extends Disposable {
  readonly state: Readonly<TerrainState>
  startProfile(): void
  clearProfile(): void
  startFlood(waterHeight: number, durationMs?: number): void
  setContour(interval?: number): void
  setTerrainColorMode(mode: TerrainColorMode): void
  clearTerrainColorMode(): void
  cancel(): void
  clear(): void
}

export function createTerrainController(
  viewer: Viewer,
  interactions: GeoInteractionManager,
  terrainProvider?: TerrainProvider,
): TerrainController {
  const tool = markRaw(new TerrainAnalysisTool(viewer, terrainProvider))
  const floodDrawingTool = markRaw(new DrawingTool(viewer))
  const state = reactive<TerrainState>({
    status: 'idle',
    progress: 0,
    sampled: [],
    terrainAvailable: !(viewer.scene.globe.terrainProvider instanceof EllipsoidTerrainProvider),
    contourInterval: 100,
  })
  let operation: AbortController | undefined
  let floodSession: TerrainAnalysisSession | undefined
  const PROFILE_INTERACTION_ID = 'terrain.profile'
  const FLOOD_INTERACTION_ID = 'terrain.flood'

  function captureTerrainProvider(provider: TerrainProvider): void {
    if (
      state.sampled.length ||
      state.activity === 'drawing-profile' ||
      state.activity === 'sampling-profile'
    ) {
      cancel()
      tool.clearProfile()
      state.sampled = []
      state.progress = 0
    }
    state.terrainAvailable = !(provider instanceof EllipsoidTerrainProvider)
    if (state.terrainAvailable && state.error === TERRAIN_REQUIRED_MESSAGE) {
      state.status = 'idle'
      state.error = undefined
    }
    if (!state.terrainAvailable && state.colorMode === 'contour') {
      tool.clearTerrainColorMode()
      state.colorMode = undefined
    }
  }

  const removeTerrainProviderChanged =
    viewer.scene.globe.terrainProviderChanged.addEventListener(captureTerrainProvider)

  async function sampleProfile(positions: readonly Cartesian3[]): Promise<void> {
    operation?.abort()
    const request = new AbortController()
    operation = request
    state.status = 'running'
    state.activity = 'sampling-profile'
    state.progress = 0
    state.error = undefined
    try {
      state.sampled = await tool.sampleProfile(positions, {
        signal: request.signal,
        onProgress(completed, total) {
          state.progress = total ? completed / total : 1
        },
      })
      if (operation !== request || request.signal.aborted) {
        return
      }
      state.status = 'complete'
      state.activity = undefined
      state.progress = 1
    } catch (error) {
      if (operation !== request) {
        return
      }
      if (request.signal.aborted) {
        state.status = 'idle'
        state.activity = undefined
        return
      }
      state.status = 'failed'
      state.activity = undefined
      state.error = error instanceof Error ? error.message : 'Terrain sampling failed'
    } finally {
      if (operation === request) {
        operation = undefined
      }
    }
  }

  function startProfile(): void {
    cancel()
    state.sampled = []
    state.status = 'running'
    state.activity = 'drawing-profile'
    state.progress = 0
    state.error = undefined
    try {
      interactions.activate({
        id: PROFILE_INTERACTION_ID,
        cursor: 'crosshair',
        start(interactionContext) {
          return tool.startProfile({
            signal: interactionContext.signal,
            onComplete(positions) {
              interactionContext.complete()
              void sampleProfile(positions)
            },
            onCancel() {
              if (state.activity === 'drawing-profile') {
                state.status = 'idle'
                state.activity = undefined
              }
            },
          })
        },
        onError(error) {
          state.status = 'failed'
          state.activity = undefined
          state.error = error instanceof Error ? error.message : 'Terrain profile drawing failed'
        },
      })
    } catch (error) {
      state.status = 'failed'
      state.activity = undefined
      state.error = error instanceof Error ? error.message : 'Terrain profile drawing failed'
    }
  }

  function runFlood(
    positions: Parameters<TerrainAnalysisTool['startFlood']>[0],
    waterHeight: number,
    durationMs: number,
  ): void {
    state.status = 'running'
    state.activity = 'flood'
    state.progress = 0
    state.error = undefined
    try {
      floodSession = tool.startFlood(positions, {
        waterHeight,
        durationMs,
        color: Color.fromCssColorString('#3a9dff'),
        onProgress(currentHeight) {
          state.progress = waterHeight === 0 ? 1 : Math.min(currentHeight / waterHeight, 1)
          if (state.progress >= 1) {
            state.status = 'complete'
            state.activity = undefined
          }
        },
      })
    } catch (error) {
      state.status = 'failed'
      state.activity = undefined
      state.error = error instanceof Error ? error.message : 'Flood analysis failed'
    }
  }

  function startFlood(waterHeight: number, durationMs = 0): void {
    cancel()
    floodDrawingTool.clearAll()
    state.status = 'running'
    state.activity = 'drawing-flood'
    state.progress = 0
    state.error = undefined
    try {
      interactions.activate({
        id: FLOOD_INTERACTION_ID,
        cursor: 'crosshair',
        start(interactionContext) {
          return floodDrawingTool.startPolygon({
            signal: interactionContext.signal,
            color: Color.fromCssColorString('#3a9dff'),
            onComplete(result) {
              interactionContext.complete()
              runFlood(result.positions, waterHeight, durationMs)
            },
            onCancel() {
              if (state.activity === 'drawing-flood') {
                state.status = 'idle'
                state.activity = undefined
              }
            },
          })
        },
        onError(error) {
          state.status = 'failed'
          state.activity = undefined
          state.error = error instanceof Error ? error.message : 'Flood boundary drawing failed'
        },
      })
    } catch (error) {
      state.status = 'failed'
      state.activity = undefined
      state.error = error instanceof Error ? error.message : 'Flood boundary drawing failed'
    }
  }

  function setContour(interval = 100): void {
    if (!state.terrainAvailable) {
      state.status = 'failed'
      state.error = TERRAIN_REQUIRED_MESSAGE
      return
    }
    const boundedInterval = Math.min(Math.max(interval, 1), 10_000)
    state.contourInterval = boundedInterval
    setTerrainColorMode('contour')
  }

  function setTerrainColorMode(mode: TerrainColorMode): void {
    try {
      tool.setTerrainColorMode(mode, state.contourInterval)
      state.colorMode = mode
      if (state.status !== 'running') {
        state.status = 'idle'
      }
      state.error = undefined
    } catch (error) {
      state.status = 'failed'
      state.error = error instanceof Error ? error.message : 'Terrain coloring failed'
    }
  }

  function clearTerrainColorMode(): void {
    tool.clearTerrainColorMode()
    state.colorMode = undefined
  }

  function clearProfile(): void {
    if (interactions.state.activeId === PROFILE_INTERACTION_ID) {
      interactions.cancel()
    }
    if (state.activity === 'sampling-profile') {
      operation?.abort()
      operation = undefined
    }
    tool.clearProfile()
    state.sampled = []
    state.progress = 0
    if (state.activity === 'drawing-profile' || state.activity === 'sampling-profile') {
      state.status = 'idle'
      state.activity = undefined
    }
  }

  function cancel(): void {
    if (
      interactions.state.activeId === PROFILE_INTERACTION_ID ||
      interactions.state.activeId === FLOOD_INTERACTION_ID
    ) {
      interactions.cancel()
    }
    operation?.abort()
    operation = undefined
    floodSession?.stop()
    floodSession = undefined
    floodDrawingTool.stop()
    tool.stop()
    if (state.status === 'running') {
      state.status = 'idle'
      state.activity = undefined
      state.progress = 0
    }
  }

  function clear(): void {
    cancel()
    tool.clear()
    floodDrawingTool.clearAll()
    state.sampled = []
    state.progress = 0
    state.colorMode = undefined
    state.status = 'idle'
    state.activity = undefined
    state.error = undefined
  }

  function dispose(): void {
    cancel()
    removeTerrainProviderChanged()
    tool.dispose()
    floodDrawingTool.dispose()
  }

  return {
    state: shallowReadonly(state),
    startProfile,
    clearProfile,
    startFlood,
    setContour,
    setTerrainColorMode,
    clearTerrainColorMode,
    cancel,
    clear,
    dispose,
  }
}
