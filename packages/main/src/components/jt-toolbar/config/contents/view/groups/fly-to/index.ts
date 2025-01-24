import { Group, ClickHandlerOption, T } from '../../../Types'

const view: Group = {
  name: (t: T): string => {
    return t('toolbar.view.flyTo', '快速定位')
  },
  items: [
    {
      name: (t: T): string => {
        return t('toolbar.view.earth', '全球')
      },
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
      name: (t: T): string => {
        return t('toolbar.view.china', '中国')
      },
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
