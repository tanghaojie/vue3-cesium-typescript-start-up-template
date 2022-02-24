import { Group } from '../../../Types'

const view: Group = {
  name: '应用',
  items: [
    {
      name: '主页',
      icon: 'factory-industry',
      clickHandler: (option): void => {
        option.router?.push('/industry')
      },
    },
  ],
}

export default view
