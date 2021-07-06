export type State = {
  showBrowserPanel: boolean
  showToolbar: boolean
  showSetting: boolean
}
export const defaultState = (): State => {
  return {
    showBrowserPanel: true,
    showToolbar: true,
    showSetting: false,
  }
}
export const state: State = defaultState()
