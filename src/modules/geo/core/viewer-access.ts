import type { Viewer } from 'cesium'

export type GeoViewerStatus = 'idle' | 'mounting' | 'ready' | 'failed' | 'disposed'

export interface GeoViewerAccess {
  readonly status: GeoViewerStatus
  whenReady(): Promise<Viewer>
  require(): Viewer
}

interface GeoViewerAccessControl extends GeoViewerAccess {
  beginMount(): void
  resolve(viewer: Viewer): void
  fail(error: Error): void
  dispose(): void
}

interface ViewerWaiter {
  resolve(viewer: Viewer): void
  reject(error: Error): void
}

export function createGeoViewerAccess(): GeoViewerAccessControl {
  let status: GeoViewerStatus = 'idle'
  let viewer: Viewer | undefined
  let failure: Error | undefined
  let waiters: ViewerWaiter[] = []

  function rejectWaiters(error: Error): void {
    const currentWaiters = waiters
    waiters = []
    currentWaiters.forEach(function rejectWaiter(waiter) {
      waiter.reject(error)
    })
  }

  function whenReady(): Promise<Viewer> {
    if (status === 'ready' && viewer) {
      return Promise.resolve(viewer)
    }
    if (status === 'failed') {
      return Promise.reject(failure ?? new Error('Geo Viewer initialization failed'))
    }
    if (status === 'disposed') {
      return Promise.reject(new Error('Geo Viewer has been disposed'))
    }
    return new Promise<Viewer>(function waitForViewer(resolve, reject) {
      waiters.push({ resolve, reject })
    })
  }

  function requireViewer(): Viewer {
    if (status !== 'ready' || !viewer) {
      throw new Error(`Geo Viewer is not ready (current status: ${status})`)
    }
    return viewer
  }

  function beginMount(): void {
    if (status !== 'idle' && status !== 'failed') {
      throw new Error(`Geo Viewer cannot mount from status: ${status}`)
    }
    failure = undefined
    status = 'mounting'
  }

  function resolveViewer(nextViewer: Viewer): void {
    if (status !== 'mounting') {
      throw new Error(`Geo Viewer cannot become ready from status: ${status}`)
    }
    viewer = nextViewer
    status = 'ready'
    const currentWaiters = waiters
    waiters = []
    currentWaiters.forEach(function resolveWaiter(waiter) {
      waiter.resolve(nextViewer)
    })
  }

  function failViewer(error: Error): void {
    if (status === 'disposed') {
      return
    }
    viewer = undefined
    failure = error
    status = 'failed'
    rejectWaiters(error)
  }

  function disposeViewerAccess(): void {
    if (status === 'disposed') {
      return
    }
    viewer = undefined
    status = 'disposed'
    rejectWaiters(new Error('Geo Viewer has been disposed'))
  }

  return {
    get status() {
      return status
    },
    whenReady,
    require: requireViewer,
    beginMount,
    resolve: resolveViewer,
    fail: failViewer,
    dispose: disposeViewerAccess,
  }
}
