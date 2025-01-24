export type State = {
  showCameraLocation: boolean
  showMouseLocation: boolean
  showFPS: boolean
}
export const defaultState = (): State => {
  return {
    showCameraLocation: false,
    showMouseLocation: false,
    showFPS: false,
  }
}
export const state: State = defaultState()
