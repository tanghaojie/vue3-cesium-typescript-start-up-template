import { Group, ClickHandlerOption } from '../../../Types'

const view: Group = {
  name: '相机',
  items: [
    {
      name: '全球',
      icon: 'earth',
      clickHandler: (options: ClickHandlerOption | undefined): void => {
        const viewer = options?.viewer
        if (!viewer) {
          return
        }
        viewer.jt?.flyTo.flyToEarth()
      },
    },
    {
      name: '中国',
      icon: 'china_compressed',
      clickHandler: (options: ClickHandlerOption | undefined): void => {
        const viewer = options?.viewer
        if (!viewer) {
          return
        }
        viewer.jt?.flyTo.flyToChina()
      },
    },
  ],
  invisible: false,
  disable: false,
}

export default view
