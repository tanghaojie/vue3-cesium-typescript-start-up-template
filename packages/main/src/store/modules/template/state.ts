export type State = {
  test: boolean
}
export const defaultState = (): State => {
  return {
    test: false,
  }
}
export const state: State = defaultState()
