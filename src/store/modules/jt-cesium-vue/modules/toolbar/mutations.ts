import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { TerrainSamplingState, State, DropdownState } from './state'
import { ToolbarMutationTypes } from './mutation-types'

export const mutations: MutationTree<State> = {
  [ToolbarMutationTypes.RESET_STATE](state: State) {
    Object.assign(state, defaultState())
  },

  [ToolbarMutationTypes.SET_VISIBLE](state: State, payload: boolean) {
    state.visible = payload
  },

  [ToolbarMutationTypes.SET_DROP_DOWN](state: State, payload: DropdownState) {
    state.dropdown = payload
  },

  [ToolbarMutationTypes.SET_DROP_DOWN](state: State, payload: DropdownState) {
    state.dropdown = payload
  },

  // nature
  [ToolbarMutationTypes.SET_SHOW_SUN](state: State, payload: boolean) {
    state.nature.showSun = payload
  },

  [ToolbarMutationTypes.SET_SHOW_MOON](state: State, payload: boolean) {
    state.nature.showMoon = payload
  },

  [ToolbarMutationTypes.SET_SHOW_SKY_ATMOSPHERE](
    state: State,
    payload: boolean
  ) {
    state.nature.showSkyAtmosphere = payload
  },

  [ToolbarMutationTypes.SET_ENABLE_LIGHT](state: State, payload: boolean) {
    state.nature.enableLighting = payload
  },

  [ToolbarMutationTypes.SET_SHOW_SKY_BOX](state: State, payload: boolean) {
    state.nature.showSkyBox = payload
  },

  [ToolbarMutationTypes.SET_SHOW_SHADOW](state: State, payload: boolean) {
    state.nature.showShadow = payload
  },

  // other
  [ToolbarMutationTypes.SET_DEPTH_TEST_AGAINST_TERRAIN](
    state: State,
    payload: boolean
  ) {
    state.other.depthTestAgainstTerrain = payload
  },

  // draw
  [ToolbarMutationTypes.SET_DRAW_POINT_ACTIVE](state: State, payload: boolean) {
    state.draw.drawPointActive = payload
  },

  [ToolbarMutationTypes.SET_DRAW_POLYLINE_ACTIVE](
    state: State,
    payload: boolean
  ) {
    state.draw.drawPolylineActive = payload
  },

  [ToolbarMutationTypes.SET_DRAW_POLYGON_ACTIVE](
    state: State,
    payload: boolean
  ) {
    state.draw.drawPolygonActive = payload
  },

  // measure
  [ToolbarMutationTypes.SET_MEASURE_POINT_ACTIVE](
    state: State,
    payload: boolean
  ) {
    state.measure.measurePointActive = payload
  },

  [ToolbarMutationTypes.SET_MEASURE_POLYLINE_ACTIVE](
    state: State,
    payload: boolean
  ) {
    state.measure.measurePolylineActive = payload
  },

  [ToolbarMutationTypes.SET_MEASURE_POLYGON_ACTIVE](
    state: State,
    payload: boolean
  ) {
    state.measure.measurePolygonActive = payload
  },

  // tool3dtile
  [ToolbarMutationTypes.SET_HIGHLIGHT_3DTILE_FEATURE_ACTIVE](
    state: State,
    payload: boolean
  ) {
    state.tool3DTile.highlight3DTileFeatureActive = payload
  },

  [ToolbarMutationTypes.SET_HOVER_CLASSIFICATION_ACTIVE](
    state: State,
    payload: boolean
  ) {
    state.tool3DTile.hoverClassificationActive = payload
  },

  [ToolbarMutationTypes.SET_CLICK_CLASSIFICATION_ACTIVE](
    state: State,
    payload: boolean
  ) {
    state.tool3DTile.clickClassificationActive = payload
  },

  // elevation contour
  [ToolbarMutationTypes.SET_ELEVATION_CONTURE_ACTIVE](
    state: State,
    payload: boolean
  ) {
    state.elevationContourActive = payload
  },

  // terrain sampling
  [ToolbarMutationTypes.SET_TERRAIN_SAMPLING](
    state: State,
    payload: TerrainSamplingState
  ) {
    state.terrainSampling = payload
  },
}
