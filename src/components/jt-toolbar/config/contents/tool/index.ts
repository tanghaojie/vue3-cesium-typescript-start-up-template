import { Content, T } from '../Types'
import groups from './groups'

const content: Content = {
  name: (t: T): string => {
    return t('toolbar.tool.content', '工具')
  },
  groups,
  disable: false,
}

export default content
