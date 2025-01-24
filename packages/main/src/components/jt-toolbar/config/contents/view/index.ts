import { Content, T } from '../Types'
import groups from './groups'

const content: Content = {
  name: (t: T): string => {
    return t('toolbar.view.content', '视图')
  },
  groups,
}

export default content
