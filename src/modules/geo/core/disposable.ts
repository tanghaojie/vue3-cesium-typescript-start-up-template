export interface Disposable {
  dispose(): void
}

export interface DisposableScope extends Disposable {
  readonly disposed: boolean
  use<T extends Disposable>(resource: T): T
  defer(cleanup: () => void): void
  child(): DisposableScope
}

/**
 * Registers a Cesium-style destroyable object with a scope.
 *
 * Cesium resources intentionally use a structural type here. This keeps the
 * lifecycle helper usable for Viewer-owned collections, primitives, handlers,
 * and post-process stages without coupling the core to every Cesium class.
 */
export interface DestroyableResource {
  destroy(): unknown
  isDestroyed?(): boolean
}

export function registerDestroyable<T extends DestroyableResource>(
  scope: DisposableScope,
  resource: T,
): T {
  scope.defer(function destroyResource() {
    if (!resource.isDestroyed || !resource.isDestroyed()) {
      resource.destroy()
    }
  })
  return resource
}

/** Semantic alias used by Geo plugins when registering a Cesium-owned object. */
export function registerCesiumResource<T extends DestroyableResource>(
  scope: DisposableScope,
  resource: T,
): T {
  return registerDestroyable(scope, resource)
}

export function registerEventCleanup(scope: DisposableScope, remove: () => void): void {
  scope.defer(remove)
}

export function registerCesiumEvent(scope: DisposableScope, remove: () => void): void {
  registerEventCleanup(scope, remove)
}

export function registerAbortController(
  scope: DisposableScope,
  controller: AbortController,
): AbortController {
  scope.defer(function abortResource() {
    controller.abort()
  })
  return controller
}

export function registerTimeout(
  scope: DisposableScope,
  timer: ReturnType<typeof setTimeout>,
): ReturnType<typeof setTimeout> {
  scope.defer(function clearTimeoutResource() {
    clearTimeout(timer)
  })
  return timer
}

export function registerInterval(
  scope: DisposableScope,
  timer: ReturnType<typeof setInterval>,
): ReturnType<typeof setInterval> {
  scope.defer(function clearIntervalResource() {
    clearInterval(timer)
  })
  return timer
}

export interface RemovableCollection<T> {
  remove(item: T): boolean
}

export function registerCollectionItem<T>(
  scope: DisposableScope,
  collection: RemovableCollection<T>,
  item: T,
): T {
  scope.defer(function removeCollectionItem() {
    collection.remove(item)
  })
  return item
}

export function registerEntity<T>(
  scope: DisposableScope,
  collection: RemovableCollection<T>,
  entity: T,
): T {
  return registerCollectionItem(scope, collection, entity)
}

export function registerDataSource<T>(
  scope: DisposableScope,
  collection: RemovableCollection<T>,
  dataSource: T,
): T {
  return registerCollectionItem(scope, collection, dataSource)
}

export function registerPrimitive<T>(
  scope: DisposableScope,
  collection: RemovableCollection<T>,
  primitive: T,
): T {
  return registerCollectionItem(scope, collection, primitive)
}

export function registerScreenSpaceEventHandler<T extends DestroyableResource>(
  scope: DisposableScope,
  handler: T,
): T {
  return registerDestroyable(scope, handler)
}

export function registerPostProcessStage<T extends DestroyableResource>(
  scope: DisposableScope,
  stage: T,
): T {
  return registerDestroyable(scope, stage)
}

export function createDisposableScope(): DisposableScope {
  let disposed = false
  const cleanups: Array<() => void> = []

  function defer(cleanup: () => void): void {
    if (disposed) {
      cleanup()
      return
    }
    cleanups.push(cleanup)
  }

  function use<T extends Disposable>(resource: T): T {
    defer(function disposeResource() {
      resource.dispose()
    })
    return resource
  }

  function child(): DisposableScope {
    return use(createDisposableScope())
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    const errors: unknown[] = []
    while (cleanups.length) {
      const cleanup = cleanups.pop()
      try {
        cleanup?.()
      } catch (error) {
        errors.push(error)
      }
    }
    if (errors.length) {
      throw new AggregateError(errors, 'One or more Geo resources could not be disposed')
    }
  }

  return {
    get disposed() {
      return disposed
    },
    use,
    defer,
    child,
    dispose,
  }
}
