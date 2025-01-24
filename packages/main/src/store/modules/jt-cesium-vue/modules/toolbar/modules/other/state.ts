export type OtherState = {
  depthTestAgainstTerrain: boolean
}

export const defaultState = (): OtherState => {
  return {
    depthTestAgainstTerrain: true,
  }
}

export const state: OtherState = defaultState()
