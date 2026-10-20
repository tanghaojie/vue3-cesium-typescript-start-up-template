import type { Disposable, DisposableScope } from './disposable'

/** A nominal token keeps capability lookup typed without exposing a service locator. */
export interface GeoCapabilityToken<T> {
  readonly id: string
  readonly __type?: T
}

export function createGeoCapabilityToken<T>(id: string): GeoCapabilityToken<T> {
  if (!id.trim()) {
    throw new Error('Geo capability token id cannot be empty')
  }
  return Object.freeze({ id })
}

export interface GeoCapabilityRegistry extends Disposable {
  register<T>(token: GeoCapabilityToken<T>, value: T): Disposable
  provide<T>(token: GeoCapabilityToken<T>, value: T, scope: DisposableScope): T
  get<T>(token: GeoCapabilityToken<T>): T | undefined
  require<T>(token: GeoCapabilityToken<T>): T
  has<T>(token: GeoCapabilityToken<T>): boolean
}

interface CapabilityEntry<T> {
  readonly value: T
  readonly registration: Disposable
}

export function createGeoCapabilityRegistry(): GeoCapabilityRegistry {
  const entries = new Map<GeoCapabilityToken<unknown>, CapabilityEntry<unknown>>()
  let disposed = false

  function register<T>(token: GeoCapabilityToken<T>, value: T): Disposable {
    if (disposed) {
      throw new Error(`Cannot register Geo capability "${token.id}" after disposal`)
    }
    if (entries.has(token)) {
      throw new Error(`Geo capability "${token.id}" is already registered`)
    }

    let released = false
    const registration: Disposable = {
      dispose() {
        if (released) {
          return
        }
        released = true
        const current = entries.get(token)
        if (current?.registration === registration) {
          entries.delete(token)
        }
      },
    }
    entries.set(token, { value, registration })
    return registration
  }

  function provide<T>(token: GeoCapabilityToken<T>, value: T, scope: DisposableScope): T {
    const registration = register(token, value)
    scope.use(registration)
    return value
  }

  function get<T>(token: GeoCapabilityToken<T>): T | undefined {
    return entries.get(token)?.value as T | undefined
  }

  function requireCapability<T>(token: GeoCapabilityToken<T>): T {
    const value = get(token)
    if (value === undefined) {
      throw new Error(`Geo capability "${token.id}" is not available`)
    }
    return value
  }

  function has<T>(token: GeoCapabilityToken<T>): boolean {
    return entries.has(token)
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    entries.forEach(function releaseCapability(entry) {
      entry.registration.dispose()
    })
    entries.clear()
  }

  return {
    register,
    provide,
    get,
    require: requireCapability,
    has,
    dispose,
  }
}
