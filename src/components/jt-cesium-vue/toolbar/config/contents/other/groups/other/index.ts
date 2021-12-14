import { Group } from '../../../Types'

const view: Group = {
  name: 'Cesium',
  items: [
    {
      name: 'API文档',
      icon: 'document',
      clickHandler: (): void => {
        window.open('https://cesium.com/docs/cesiumjs-ref-doc/index.html')
      },
    },
    {
      name: '官方Demo',
      icon: 'demo',
      clickHandler: (): void => {
        window.open('https://sandcastle.cesium.com/')
      },
    },
    {
      name: 'test',
      icon: 'demo',
      clickHandler: (): void => {},
    },
  ],
}

export default view
