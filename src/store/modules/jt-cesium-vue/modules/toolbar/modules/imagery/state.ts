export type SplitType = {
  enable: boolean
  position: number
}

export type ImageryState = {
  split: SplitType
}

export const defaultState = (): ImageryState => {
  return {
    split: {
      enable: false,
      position: 0,
    },
  }
}

export const state: ImageryState = defaultState()
