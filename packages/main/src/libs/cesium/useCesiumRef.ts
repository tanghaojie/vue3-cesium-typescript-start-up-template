import { inject } from 'vue'
import { CESIUM_REF_KEY, CesiumRef } from './VueCesium'

export function useCesiumRef(): CesiumRef {
  const ref = inject<CesiumRef>(CESIUM_REF_KEY)
  if (!ref) {
    throw new Error('Cesium not initialized!')
  }
  return ref
}
