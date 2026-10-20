import { reactive, readonly } from 'vue'
import { createDisposableScope, type Disposable, type DisposableScope } from './disposable'

export interface GeoInteractionContext {
  readonly signal: AbortSignal
  readonly scope: DisposableScope
  complete(): void
}

export interface GeoInteractionDefinition {
  readonly id: string
  readonly cursor?: string
  start(context: GeoInteractionContext): Disposable | void | Promise<Disposable | void>
  onError?(error: unknown): void
}

export interface GeoInteractionState {
  activeId?: string
  cursor?: string
}

export interface GeoInteractionManager extends Disposable {
  readonly state: Readonly<GeoInteractionState>
  activate(definition: GeoInteractionDefinition): void
  cancel(reason?: GeoInteractionCancelReason): void
}

export type GeoInteractionCancelReason = 'switch' | 'cancel' | 'complete' | 'dispose' | 'error'

interface ActiveInteraction {
  readonly definition: GeoInteractionDefinition
  readonly abortController: AbortController
  readonly scope: DisposableScope
}

export function createGeoInteractionManager(): GeoInteractionManager {
  const state = reactive<GeoInteractionState>({})
  let activeInteraction: ActiveInteraction | undefined

  function finish(active: ActiveInteraction, _reason: GeoInteractionCancelReason): void {
    if (activeInteraction !== active) {
      return
    }
    activeInteraction = undefined
    state.activeId = undefined
    state.cursor = undefined
    active.abortController.abort()
    try {
      active.scope.dispose()
    } catch (error) {
      console.error('Failed to dispose Geo interaction resources', error)
    }
  }

  function cancel(reason: GeoInteractionCancelReason = 'cancel'): void {
    if (activeInteraction) {
      finish(activeInteraction, reason)
    }
  }

  function activate(definition: GeoInteractionDefinition): void {
    cancel('switch')
    const scope = createDisposableScope()
    const abortController = new AbortController()
    const active = { definition, abortController, scope }
    activeInteraction = active
    state.activeId = definition.id
    state.cursor = definition.cursor

    try {
      const result = definition.start({
        signal: abortController.signal,
        scope,
        complete() {
          finish(active, 'complete')
        },
      })
      Promise.resolve(result)
        .then(function registerInteractionResource(resource) {
          if (resource && !abortController.signal.aborted && activeInteraction === active) {
            scope.use(resource)
          } else if (resource) {
            resource.dispose()
          }
        })
        .catch(function handleInteractionError(error: unknown) {
          if (activeInteraction === active) {
            finish(active, 'error')
          }
          definition.onError?.(error)
        })
    } catch (error) {
      finish(active, 'error')
      definition.onError?.(error)
      throw error
    }
  }

  function dispose(): void {
    cancel('dispose')
  }

  return {
    state: readonly(state),
    activate,
    cancel,
    dispose,
  }
}
