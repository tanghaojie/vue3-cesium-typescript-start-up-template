export type OverlayDynamicView = {
  name: string
  uuid: string
}

export type State = {
  showBrowserPanel: boolean
  showToolbar: boolean
  toolbarHeight: number
  overlayDynamicViews: OverlayDynamicView[]
}
export const defaultState = (): State => {
  return {
    showBrowserPanel: true,
    showToolbar: true,
    toolbarHeight: 0,
    overlayDynamicViews: [],
  }
}
export const state: State = defaultState()
