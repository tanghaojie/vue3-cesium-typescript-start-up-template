import { Group } from '../../Types'

import state from './status'
import flyTo from './fly-to'
import view from './view'

const groups: Array<Group> = [flyTo, state, view]
export default groups
