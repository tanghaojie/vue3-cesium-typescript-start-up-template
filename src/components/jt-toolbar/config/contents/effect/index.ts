import { Content, T } from '../Types'
import groups from './groups'

const content: Content = {
  name: (t: T): string => {
    return t('toolbar.effect.content', '效果')
  },
  groups,
}

export default content
