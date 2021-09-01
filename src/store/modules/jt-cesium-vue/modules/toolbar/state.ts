import type { NatureState } from './modules/nature'
import type { Tool3DTileState } from './modules/tool3DTile'
import type { OtherState } from './modules/other'
import type { DrawState } from './modules/draw'
import type { MeasureState } from './modules/measure'
import type { ImageryState } from './modules/imagery'

export type ToolbarStateAndModule = {
  visible: boolean
  dropdown: DropdownState
  elevationContourActive: boolean
  terrainSampling: TerrainSamplingState

  nature: NatureState
  tool3DTile: Tool3DTileState
  other: OtherState
  draw: DrawState
  measure: MeasureState
  imagery: ImageryState
}

export type State = {
  visible: boolean
  dropdown: DropdownState
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
    elevationContourActive: false,
    terrainSampling: {
      show: false,
      datas: [],
    },
  }
}

export const state: State = defaultState()
