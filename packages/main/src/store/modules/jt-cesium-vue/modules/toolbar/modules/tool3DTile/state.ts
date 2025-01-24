export type Tool3DTileState = {
  highlight3DTileFeatureActive: boolean
  hoverClassificationActive: boolean
  clickClassificationActive: boolean
}

export const defaultState = (): Tool3DTileState => {
  return {
    highlight3DTileFeatureActive: false,
    hoverClassificationActive: false,
    clickClassificationActive: false,
  }
}

export const state: Tool3DTileState = defaultState()
