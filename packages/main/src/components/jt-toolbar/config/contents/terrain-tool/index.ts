import { Content, T } from '../Types'
import groups from './groups'

const content: Content = {
  name: (t: T): string => {
    return t('toolbar.terrainTool.content', '地形')
  },
  groups,
  disable: false,
}

export default content
