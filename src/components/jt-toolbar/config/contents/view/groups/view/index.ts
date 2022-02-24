import { Group, ClickHandlerOption } from '../../../Types'

const view: Group = {
  name: '视图',
  items: [
    {
      name: '切换视图',
      icon: 'view-lp',
      dropdownOnClick: true,
      dropdown: {
        componentName: 'select-view-mode',
      },
    },
  ],
  invisible: false,
  disable: false,
}

export default view
