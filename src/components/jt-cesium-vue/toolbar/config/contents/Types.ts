import * as Cesium from 'cesium'
import type { RootState } from '@/store'
import { Store } from 'vuex'

export type Content = {
  name: string
  groups: Array<Group>
  invisible?: boolean
  disable?: boolean
}

export type Group = {
  name: string
  items: Array<Item>
  invisible?: boolean
  disable?: boolean
}

export type Item = {
  name: string
  icon: string
  onMounted?: OnMounted
  invisible?: boolean
  disable?: boolean
  clickHandler?: ClickHandler
  clickHandlerResult?: any
  active?: Active
  dropdown?: Dropdown
}

export type ClickHandlerOption = {
  viewer?: Cesium.Viewer
  item?: Item
  store: Store<RootState>
}

export type ClickHandler = (option: ClickHandlerOption) => void | any

export type ActiveOption = {
  store: Store<RootState>
}

export type Active = (option: ActiveOption) => boolean

export type Dropdown = {
  componentName: string
}

export type OnMountedOption = {
  viewer?: Cesium.Viewer
  iconEl?: HTMLElement
  store: Store<RootState>
}

export type OnMounted = (option: OnMountedOption) => void

const x = {
  name: '视图',
  groups: [
    {
      name: '视角',
      items: [
        {
          name: '全球',
          icon: 'earth',
          clickHandler: undefined,
        },
      ],
    },
  ],
}
