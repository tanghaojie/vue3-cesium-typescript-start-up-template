export type State = {
  showSetting: boolean
}
export const defaultState = (): State => {
  return {
    showSetting: false,
  }
}
export const state: State = defaultState()
