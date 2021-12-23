import type { JTPrimitiveState } from './modules/jt-primitive'

export type CesiumDataStateAndModule = {
  notUsed: number

  jtPrimitive: JTPrimitiveState
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
