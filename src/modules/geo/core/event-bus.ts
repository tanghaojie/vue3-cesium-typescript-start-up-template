import type { Disposable, DisposableScope } from './disposable'

export type GeoEventMap = Record<string, unknown>

export interface GeoEventBus<Events extends GeoEventMap = GeoEventMap> extends Disposable {
  on<K extends keyof Events & string>(
    event: K,
    listener: (payload: Events[K]) => void,
    scope?: DisposableScope,
  ): Disposable
  once<K extends keyof Events & string>(
    event: K,
    listener: (payload: Events[K]) => void,
    scope?: DisposableScope,
  ): Disposable
  emit<K extends keyof Events & string>(event: K, payload: Events[K]): void
}

type Listener = (payload: unknown) => void

export function createGeoEventBus<Events extends GeoEventMap = GeoEventMap>(): GeoEventBus<Events> {
  const listeners = new Map<string, Set<Listener>>()
  let disposed = false

  function subscribe<K extends keyof Events & string>(
    event: K,
    listener: (payload: Events[K]) => void,
    scope: DisposableScope | undefined,
    once: boolean,
  ): Disposable {
    if (disposed) {
      throw new Error('Cannot subscribe to a disposed Geo event bus')
    }
    const typedListener = listener as Listener
    const eventListeners = listeners.get(event) ?? new Set<Listener>()
    listeners.set(event, eventListeners)
    let active = true
    let registeredListener: Listener = typedListener
    const registration: Disposable = {
      dispose() {
        if (!active) {
          return
        }
        active = false
        eventListeners.delete(registeredListener)
        if (eventListeners.size === 0) {
          listeners.delete(event)
        }
      },
    }
    const wrappedListener: Listener = once
      ? function callOnce(payload: unknown) {
          registration.dispose()
          listener(payload as Events[K])
        }
      : typedListener

    registeredListener = once ? wrappedListener : typedListener
    eventListeners.add(registeredListener)
    if (scope) {
      scope.use(registration)
    }
    return registration
  }

  function emit<K extends keyof Events & string>(event: K, payload: Events[K]): void {
    if (disposed) {
      return
    }
    const eventListeners = listeners.get(event)
    if (!eventListeners) {
      return
    }
    Array.from(eventListeners).forEach(function notifyListener(listener) {
      listener(payload)
    })
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    listeners.clear()
  }

  return {
    on(event, listener, scope) {
      return subscribe(event, listener, scope, false)
    },
    once(event, listener, scope) {
      return subscribe(event, listener, scope, true)
    },
    emit,
    dispose,
  }
}
