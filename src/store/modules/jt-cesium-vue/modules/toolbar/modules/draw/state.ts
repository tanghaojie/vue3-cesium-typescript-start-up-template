export type DrawState = {
  drawPointActive: boolean
  drawPolylineActive: boolean
  drawPolygonActive: boolean
}

export const defaultState = (): DrawState => {
  return {
    drawPointActive: false,
    drawPolylineActive: false,
    drawPolygonActive: false,
  }
}

export const state: DrawState = defaultState()
