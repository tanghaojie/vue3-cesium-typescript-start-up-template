export type MeasureState = {
  measurePointActive: boolean
  measurePolylineActive: boolean
  measurePolygonActive: boolean
}

export const defaultState = (): MeasureState => {
  return {
    measurePointActive: false,
    measurePolylineActive: false,
    measurePolygonActive: false,
  }
}

export const state: MeasureState = defaultState()
