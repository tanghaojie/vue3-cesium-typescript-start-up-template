import { Group, ClickHandlerOption } from '../../../Types'

import { flyToChina, flyToEarth } from '@/libs/cesium/libs/fly-to'

const view: Group = {
  name: '视角',
  items: [
    {
      name: '全球',
      icon: 'earth',
      clickHandler: (options: ClickHandlerOption | undefined): void => {
        const viewer = options?.viewer
        if (!viewer) {
          return
        }
        flyToEarth(viewer)
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
        flyToChina(viewer)
      },
    },
  ],
  invisible: false,
  disable: false,
}

export default view
