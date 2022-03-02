import { Content, T } from '../Types'
import groups from './groups'

const content: Content = {
  name: (t: T): string => {
    return t('toolbar.industry.content', '应用')
  },
  groups,
  invisible: true,
}

export default content
