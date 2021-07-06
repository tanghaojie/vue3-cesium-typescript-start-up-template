import * as Cesium from 'cesium'

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
}

export type ClickHandler = (option?: ClickHandlerOption) => void | any

export type Active = () => boolean

export type Dropdown = {
  componentName: string
}

export type OnMountedOption = {
  viewer?: Cesium.Viewer
  iconEl?: HTMLElement
}

export type OnMounted = (option?: OnMountedOption) => void

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
