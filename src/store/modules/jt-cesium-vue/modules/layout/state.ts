export type State = {
  showBrowserPanel: boolean
  showToolbar: boolean
  toolbarHeight: number
}
export const defaultState = (): State => {
  return {
    showBrowserPanel: true,
    showToolbar: true,
    toolbarHeight: 0,
  }
}
export const state: State = defaultState()
