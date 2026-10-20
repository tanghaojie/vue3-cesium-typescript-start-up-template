import { reactive, readonly, type DeepReadonly } from 'vue'
import { ClockRange, ClockStep, JulianDate, type Clock, type Viewer } from 'cesium'

export interface GeoTimeState {
  viewportStart: number
  viewportStop: number
  currentTime: number
  multiplier: number
  playing: boolean
}

export interface GeoTimeController {
  readonly state: DeepReadonly<GeoTimeState>
  togglePlayback(): void
  setPlaying(playing: boolean): void
  setMultiplier(multiplier: number): void
  seek(epochMilliseconds: number): void
  panViewport(fraction: number): void
  zoomViewport(anchorEpochMilliseconds: number, factor: number): void
  resetToNow(): void
  dispose(): void
}

interface ClockSnapshot {
  readonly startTime: JulianDate
  readonly stopTime: JulianDate
  readonly currentTime: JulianDate
  readonly multiplier: number
  readonly shouldAnimate: boolean
  readonly canAnimate: boolean
  readonly clockRange: ClockRange
  readonly clockStep: ClockStep
}

const DEFAULT_MULTIPLIER = 60
const MIN_VIEWPORT_DURATION_MS = 60 * 1000
const MAX_VIEWPORT_DURATION_MS = Math.round(365.25 * 10 * 24 * 60 * 60 * 1000)
const UI_UPDATE_INTERVAL_MS = 100

function localDayRange(date: Date): { start: number; stop: number } {
  const start = new Date(date.getTime())
  start.setHours(0, 0, 0, 0)
  const stop = new Date(start.getTime())
  // Advance the local calendar day so DST days can span 23 or 25 hours.
  stop.setDate(stop.getDate() + 1)
  return { start: start.getTime(), stop: stop.getTime() }
}

function cloneClock(clock: Clock): ClockSnapshot {
  return {
    startTime: JulianDate.clone(clock.startTime),
    stopTime: JulianDate.clone(clock.stopTime),
    currentTime: JulianDate.clone(clock.currentTime),
    multiplier: clock.multiplier,
    shouldAnimate: clock.shouldAnimate,
    canAnimate: clock.canAnimate,
    clockRange: clock.clockRange,
    clockStep: clock.clockStep,
  }
}

function toEpochMilliseconds(value: JulianDate): number {
  return JulianDate.toDate(value).getTime()
}

function isValidEpochMilliseconds(value: number): boolean {
  return Number.isFinite(value) && Number.isFinite(new Date(value).getTime())
}

function clampViewportDuration(duration: number): number {
  return Math.min(MAX_VIEWPORT_DURATION_MS, Math.max(MIN_VIEWPORT_DURATION_MS, duration))
}

function viewportAround(
  center: number,
  duration: number,
): { start: number; stop: number } | undefined {
  const boundedDuration = clampViewportDuration(duration)
  const start = center - boundedDuration / 2
  const stop = center + boundedDuration / 2
  if (!isValidEpochMilliseconds(start) || !isValidEpochMilliseconds(stop)) {
    return undefined
  }
  return { start, stop }
}

export function createGeoTimeController(viewer: Viewer): GeoTimeController {
  const clock = viewer.clock
  const original = cloneClock(clock)
  const now = new Date()
  const initialViewport = localDayRange(now)

  clock.startTime = JulianDate.fromDate(new Date(initialViewport.start))
  clock.stopTime = JulianDate.fromDate(new Date(initialViewport.stop))
  clock.currentTime = JulianDate.fromDate(now)
  clock.clockRange = ClockRange.UNBOUNDED
  clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER
  clock.multiplier = DEFAULT_MULTIPLIER
  clock.canAnimate = true
  clock.shouldAnimate = false

  const state = reactive<GeoTimeState>({
    viewportStart: initialViewport.start,
    viewportStop: initialViewport.stop,
    currentTime: toEpochMilliseconds(clock.currentTime),
    multiplier: clock.multiplier,
    playing: clock.shouldAnimate,
  })
  let disposed = false
  let lastUiUpdate = 0

  function guard(): void {
    if (disposed) {
      throw new Error('Geo time controller has been disposed')
    }
  }

  function syncState(): void {
    state.currentTime = toEpochMilliseconds(clock.currentTime)
    state.multiplier = clock.multiplier
    state.playing = clock.shouldAnimate
  }

  function setViewport(start: number, stop: number): void {
    const duration = stop - start
    if (
      !isValidEpochMilliseconds(start) ||
      !isValidEpochMilliseconds(stop) ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return
    }
    const viewport = viewportAround((start + stop) / 2, duration)
    if (!viewport) {
      return
    }
    state.viewportStart = viewport.start
    state.viewportStop = viewport.stop
  }

  function keepCurrentTimeVisible(): void {
    const duration = state.viewportStop - state.viewportStart
    if (state.currentTime < state.viewportStart || state.currentTime > state.viewportStop) {
      const viewport = viewportAround(state.currentTime, duration)
      if (viewport) {
        state.viewportStart = viewport.start
        state.viewportStop = viewport.stop
      }
    }
  }

  function handleTick(): void {
    if (disposed || !clock.shouldAnimate) {
      return
    }
    viewer.scene.requestRender()
    const nowMs = performance.now()
    if (nowMs - lastUiUpdate >= UI_UPDATE_INTERVAL_MS) {
      lastUiUpdate = nowMs
      syncState()
      keepCurrentTimeVisible()
    }
  }

  const removeTickListener = clock.onTick.addEventListener(handleTick)

  function setPlaying(playing: boolean): void {
    guard()
    clock.shouldAnimate = playing
    syncState()
    viewer.scene.requestRender()
  }

  function togglePlayback(): void {
    setPlaying(!clock.shouldAnimate)
  }

  function setMultiplier(multiplier: number): void {
    guard()
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      return
    }
    clock.multiplier = multiplier
    syncState()
  }

  function seek(epochMilliseconds: number): void {
    guard()
    if (!isValidEpochMilliseconds(epochMilliseconds)) {
      return
    }
    clock.currentTime = JulianDate.fromDate(new Date(epochMilliseconds))
    clock.shouldAnimate = false
    syncState()
    viewer.scene.requestRender()
  }

  function panViewport(fraction: number): void {
    guard()
    if (!Number.isFinite(fraction)) {
      return
    }
    const duration = state.viewportStop - state.viewportStart
    const offset = duration * fraction
    setViewport(state.viewportStart + offset, state.viewportStop + offset)
  }

  function zoomViewport(anchorEpochMilliseconds: number, factor: number): void {
    guard()
    if (
      !isValidEpochMilliseconds(anchorEpochMilliseconds) ||
      !Number.isFinite(factor) ||
      factor <= 0
    ) {
      return
    }
    const duration = state.viewportStop - state.viewportStart
    const ratio = Math.min(
      1,
      Math.max(0, (anchorEpochMilliseconds - state.viewportStart) / duration),
    )
    const nextDuration = clampViewportDuration(duration * factor)
    const nextStart = anchorEpochMilliseconds - nextDuration * ratio
    setViewport(nextStart, nextStart + nextDuration)
  }

  function resetToNow(): void {
    guard()
    const currentDate = new Date()
    const viewport = localDayRange(currentDate)
    clock.currentTime = JulianDate.fromDate(currentDate)
    clock.shouldAnimate = false
    state.viewportStart = viewport.start
    state.viewportStop = viewport.stop
    syncState()
    viewer.scene.requestRender()
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    removeTickListener()
    clock.startTime = JulianDate.clone(original.startTime)
    clock.stopTime = JulianDate.clone(original.stopTime)
    clock.currentTime = JulianDate.clone(original.currentTime)
    clock.multiplier = original.multiplier
    clock.shouldAnimate = original.shouldAnimate
    clock.canAnimate = original.canAnimate
    clock.clockRange = original.clockRange
    clock.clockStep = original.clockStep
  }

  viewer.scene.requestRender()
  return {
    state: readonly(state),
    togglePlayback,
    setPlaying,
    setMultiplier,
    seek,
    panViewport,
    zoomViewport,
    resetToNow,
    dispose,
  }
}
