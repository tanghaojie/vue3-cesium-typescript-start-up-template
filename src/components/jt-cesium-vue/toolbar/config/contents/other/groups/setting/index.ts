import { Group } from '../../../Types'
import store from '@/store'

import { SettingActionTypes } from '@/store/modules/jt-cesium-vue/modules/setting/action-types'

const view: Group = {
  name: '设置',
  items: [
    {
      name: '设置',
      icon: 'setting',
      clickHandler: (): void => {
        store.dispatch(
          `jtCesiumVue/setting/${SettingActionTypes.SET_SHOW_SETTING}`,
          true
        )
      },
    },
  ],
}

export default view
