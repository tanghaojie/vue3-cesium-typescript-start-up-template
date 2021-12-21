import type { PrimitiveState } from './modules/primitive'

export type CesiumDataStateAndModule = {
  notUsed: number

  primitive: PrimitiveState
}

export type State = {
  notUsed: number
}

export const defaultState = (): State => {
  return {
    notUsed: -1,
  }
}

export const state: State = defaultState()
