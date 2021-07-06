export type State = {
  visible: boolean
  dropdown: DropdownState
  nature: NatureState
  other: OtherState
  draw: DrawState
  measure: MeasureState
  tool3DTile: Tool3DTileState
  elevationContourActive: boolean
  terrainSampling: TerrainSamplingState
}

export type DropdownState = {
  show: boolean
  componentName: string
  top: number
  left: number
  iconEl?: HTMLElement
}

export type NatureState = {
  showSun: boolean
  showMoon: boolean
  showSkyAtmosphere: boolean
  enableLighting: boolean
  showSkyBox: boolean
}

export type OtherState = {
  depthTestAgainstTerrain: boolean
}

export type DrawState = {
  drawPointActive: boolean
  drawPolylineActive: boolean
  drawPolygonActive: boolean
}

export type MeasureState = {
  measurePointActive: boolean
  measurePolylineActive: boolean
  measurePolygonActive: boolean
}

export type Tool3DTileState = {
  highlight3DTileFeatureActive: boolean
  hoverClassificationActive: boolean
  clickClassificationActive: boolean
}

export type TerrainSamplingData = {
  index: number
  height: number
}

export type TerrainSamplingState = {
  show: boolean
  datas: TerrainSamplingData[]
}

export const defaultState = (): State => {
  return {
    visible: true,
    dropdown: { show: false, componentName: '', top: 0, left: 0 },
    nature: {
      showSun: true,
      showMoon: false,
      showSkyAtmosphere: true,
      enableLighting: false,
      showSkyBox: true,
    },
    other: {
      depthTestAgainstTerrain: true,
    },
    draw: {
      drawPointActive: false,
      drawPolylineActive: false,
      drawPolygonActive: false,
    },
    measure: {
      measurePointActive: false,
      measurePolylineActive: false,
      measurePolygonActive: false,
    },
    tool3DTile: {
      highlight3DTileFeatureActive: false,
      hoverClassificationActive: false,
      clickClassificationActive: false,
    },
    elevationContourActive: false,
    terrainSampling: {
      show: false,
      datas: [],
    },
  }
}

export const state: State = defaultState()
