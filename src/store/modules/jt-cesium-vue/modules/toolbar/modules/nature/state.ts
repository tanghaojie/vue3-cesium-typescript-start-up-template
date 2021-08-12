export type NatureState = {
  showSun: boolean
  showMoon: boolean
  showSkyAtmosphere: boolean
  enableLighting: boolean
  showSkyBox: boolean
  showShadow: boolean
}

export const defaultState = (): NatureState => {
  return {
    showSun: true,
    showMoon: false,
    showSkyAtmosphere: true,
    enableLighting: false,
    showSkyBox: true,
    showShadow: false,
  }
}

export const state: NatureState = defaultState()
