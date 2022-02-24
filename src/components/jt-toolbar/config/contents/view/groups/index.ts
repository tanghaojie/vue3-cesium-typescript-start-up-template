import { Group } from '../../Types'

import state from './status'
import camera from './camera'
import view from './view'

const groups: Array<Group> = [camera, state, view]
export default groups
