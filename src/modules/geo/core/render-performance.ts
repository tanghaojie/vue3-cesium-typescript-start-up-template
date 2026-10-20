import type { Viewer } from 'cesium'
import type { Disposable } from './disposable'

const MINIMUM_RESOLUTION_SCALE = 0.6
const TARGET_RENDER_PIXELS = 1_600_000
const LOW_FRAME_RATE = 28
const HIGH_FRAME_RATE = 50
const FRAME_SAMPLE_SIZE = 20
const IDLE_FRAME_GAP_MS = 250
const ADJUSTMENT_COOLDOWN_MS = 1_500
const SCALE_DOWN_STEP = 0.1
const SCALE_UP_STEP = 0.05

export type GeoRenderMode = 'performance' | 'balanced' | 'compatible'

export interface GeoRenderPerformanceController extends Disposable {
  setMode(mode: GeoRenderMode): void
  acquireFixedResolution(): Disposable
}

function clampScale(value: number): number {
  return Math.min(1, Math.max(MINIMUM_RESOLUTION_SCALE, value))
}

function roundedScale(value: number): number {
  return Math.round(clampScale(value) * 100) / 100
}

function resolutionScaleLimit(viewer: Viewer, mode: GeoRenderMode): number {
  if (mode === 'performance') {
    return 1
  }
  const canvas = viewer.scene.canvas
  const cssPixels = Math.max(canvas.clientWidth * canvas.clientHeight, 1)
  if (mode === 'compatible') {
    return Math.round(Math.min(0.85, Math.max(0.4, Math.sqrt(900_000 / cssPixels))) * 100) / 100
  }
  return roundedScale(Math.sqrt(TARGET_RENDER_PIXELS / cssPixels))
}

function applyResolutionScale(viewer: Viewer, value: number): boolean {
  const nextScale = Math.round(value * 100) / 100
  if (Math.abs(viewer.resolutionScale - nextScale) < 0.001) {
    return false
  }
  viewer.resolutionScale = nextScale
  viewer.resize()
  viewer.scene.requestRender()
  return true
}

export function createGeoRenderPerformanceController(
  viewer: Viewer,
): GeoRenderPerformanceController {
  let mode: GeoRenderMode = 'balanced'
  const originalScale = viewer.resolutionScale
  const originalBrowserResolution = viewer.useBrowserRecommendedResolution
  const originalTargetFrameRate = viewer.targetFrameRate
  let scaleLimit = resolutionScaleLimit(viewer, mode)
  let lastFrameAt: number | undefined
  let sampleStartedAt: number | undefined
  let sampleFrames = 0
  let lastAdjustmentAt = 0
  let disposed = false
  let fixedResolution = false

  applyResolutionScale(viewer, Math.min(viewer.resolutionScale, scaleLimit))

  function resetSample(): void {
    lastFrameAt = undefined
    sampleStartedAt = undefined
    sampleFrames = 0
  }

  function handlePostRender(): void {
    if (disposed || fixedResolution || document.hidden || mode === 'performance') {
      resetSample()
      return
    }
    const now = performance.now()
    if (lastFrameAt === undefined || now - lastFrameAt > IDLE_FRAME_GAP_MS) {
      lastFrameAt = now
      sampleStartedAt = now
      sampleFrames = 0
      return
    }
    lastFrameAt = now
    sampleFrames += 1
    if (sampleFrames < FRAME_SAMPLE_SIZE || sampleStartedAt === undefined) {
      return
    }

    const elapsed = now - sampleStartedAt
    const framesPerSecond = elapsed > 0 ? (sampleFrames * 1000) / elapsed : HIGH_FRAME_RATE
    const lowFrameRate = mode === 'compatible' ? 22 : LOW_FRAME_RATE
    const highFrameRate = mode === 'compatible' ? 28 : HIGH_FRAME_RATE
    if (now - lastAdjustmentAt >= ADJUSTMENT_COOLDOWN_MS) {
      if (framesPerSecond < lowFrameRate) {
        const minimum = mode === 'compatible' ? 0.4 : MINIMUM_RESOLUTION_SCALE
        if (
          applyResolutionScale(viewer, Math.max(minimum, viewer.resolutionScale - SCALE_DOWN_STEP))
        ) {
          lastAdjustmentAt = now
        }
      } else if (framesPerSecond > highFrameRate && viewer.resolutionScale < scaleLimit) {
        if (
          applyResolutionScale(viewer, Math.min(viewer.resolutionScale + SCALE_UP_STEP, scaleLimit))
        ) {
          lastAdjustmentAt = now
        }
      }
    }
    sampleStartedAt = now
    sampleFrames = 0
  }

  function handleResize(): void {
    if (disposed || fixedResolution) {
      return
    }
    scaleLimit = resolutionScaleLimit(viewer, mode)
    if (viewer.resolutionScale > scaleLimit) {
      applyResolutionScale(viewer, scaleLimit)
    } else {
      viewer.resize()
      viewer.scene.requestRender()
    }
    resetSample()
  }

  const removePostRenderListener = viewer.scene.postRender.addEventListener(handlePostRender)
  window.addEventListener('resize', handleResize)

  return {
    acquireFixedResolution() {
      if (disposed || fixedResolution) {
        throw new Error('输出分辨率已被锁定或场景已关闭。')
      }
      const previous = {
        scale: viewer.resolutionScale,
        browser: viewer.useBrowserRecommendedResolution,
      }
      fixedResolution = true
      viewer.useBrowserRecommendedResolution = true
      viewer.resolutionScale = 1
      resetSample()
      let released = false
      return {
        dispose() {
          if (released) {
            return
          }
          released = true
          fixedResolution = false
          if (!disposed && !viewer.isDestroyed()) {
            viewer.useBrowserRecommendedResolution = previous.browser
            viewer.resolutionScale = previous.scale
            viewer.forceResize()
          }
          resetSample()
        },
      }
    },
    setMode(nextMode) {
      if (disposed) {
        return
      }
      mode = nextMode
      viewer.useBrowserRecommendedResolution = mode !== 'performance'
      viewer.targetFrameRate = mode === 'compatible' ? 30 : 60
      scaleLimit = resolutionScaleLimit(viewer, mode)
      applyResolutionScale(viewer, scaleLimit)
      viewer.resize()
      viewer.scene.requestRender()
      resetSample()
    },
    dispose() {
      if (disposed) {
        return
      }
      disposed = true
      removePostRenderListener()
      window.removeEventListener('resize', handleResize)
      if (!viewer.isDestroyed()) {
        viewer.useBrowserRecommendedResolution = originalBrowserResolution
        viewer.targetFrameRate = originalTargetFrameRate
        viewer.resolutionScale = originalScale
        viewer.resize()
      }
    },
  }
}
