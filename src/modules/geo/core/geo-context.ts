import type { InjectionKey } from 'vue'
import { inject, provide } from 'vue'
import type { Viewer } from 'cesium'
import type { GeoRuntime } from './geo-runtime'

const geoRuntimeKey: InjectionKey<GeoRuntime> = Symbol('geo-runtime')

export function provideGeoRuntime(runtime: GeoRuntime): void {
  provide(geoRuntimeKey, runtime)
}

export function useGeoRuntime(): GeoRuntime {
  const runtime = inject(geoRuntimeKey)
  if (!runtime) {
    throw new Error('Geo runtime is not available in the current component tree')
  }
  return runtime
}

export function useCesiumViewer(): Viewer {
  return useGeoRuntime().viewerAccess.require()
}
