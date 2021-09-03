import { Group, ClickHandlerOption } from '../../../Types'
import FlyTo from '@/libs/cesium/libs/fly-to/FlyTo'

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
        if (!viewer.jtFlyTo) {
          viewer.jtFlyTo = new FlyTo(viewer)
        }
        viewer.jtFlyTo.flyToEarth()
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
        if (!viewer.jtFlyTo) {
          viewer.jtFlyTo = new FlyTo(viewer)
        }
        viewer.jtFlyTo.flyToChina()
      },
    },
  ],
  invisible: false,
  disable: false,
}

export default view
