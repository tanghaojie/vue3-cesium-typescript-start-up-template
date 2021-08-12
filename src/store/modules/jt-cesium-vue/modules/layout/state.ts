export type State = {
  showBrowserPanel: boolean
  showToolbar: boolean
}
export const defaultState = (): State => {
  return {
    showBrowserPanel: true,
    showToolbar: true,
  }
}
export const state: State = defaultState()
