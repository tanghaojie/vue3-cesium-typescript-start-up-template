import { reactive, readonly } from 'vue'
import { createGeoCapabilityToken } from './capability-registry'

export interface GeoWorkspacePresentation {
  readonly state: { readonly clean: boolean; readonly aspectRatio?: number }
  set(clean: boolean, aspectRatio?: number): void
}

export const geoWorkspacePresentationCapability =
  createGeoCapabilityToken<GeoWorkspacePresentation>('workspace.presentation')

export function createGeoWorkspacePresentation(): GeoWorkspacePresentation {
  const state = reactive<{ clean: boolean; aspectRatio?: number }>({ clean: false })
  return {
    state: readonly(state),
    set(clean, aspectRatio) {
      state.clean = clean
      state.aspectRatio = aspectRatio
    },
  }
}
