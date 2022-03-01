import { Group, T } from '../../../Types'

const view: Group = {
  name: (t: T): string => {
    return t('toolbar.other.content', 'Cesium')
  },
  items: [
    {
      name: (t: T): string => {
        return t('toolbar.other.api', 'API文档')
      },
      icon: 'document',
      clickHandler: (): void => {
        window.open('https://cesium.com/docs/cesiumjs-ref-doc/index.html')
      },
    },
    {
      name: (t: T): string => {
        return t('toolbar.other.demo', '官方Demo')
      },
      icon: 'demo',
      clickHandler: (): void => {
        window.open('https://sandcastle.cesium.com/')
      },
    },
    {
      name: (t: T): string => {
        return t('toolbar.other.test', 'test')
      },
      icon: 'demo',
      clickHandler: (): void => {},
    },
  ],
}

export default view
