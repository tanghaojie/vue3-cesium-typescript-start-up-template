import { Content, T } from '../Types'
import groups from './groups'

const content: Content = {
  name: (t: T): string => {
    return t('toolbar.other.content', '其他')
  },
  groups,
}

export default content
