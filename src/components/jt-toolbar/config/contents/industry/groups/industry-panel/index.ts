import { Group, T } from '../../../Types'

const view: Group = {
  name: (t: T): string => {
    return t('toolbar.industry.content', '应用')
  },
  items: [
    {
      name: (t: T): string => {
        return t('toolbar.industry.home', '主页')
      },
      icon: 'factory-industry',
      clickHandler: (option): void => {
        option.router?.push('/industry')
      },
    },
  ],
}

export default view
