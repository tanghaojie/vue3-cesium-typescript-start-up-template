import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useLayoutStore = defineStore('JTIS_VUE_CESIUM_LAYOUT', () => {
  const layout = reactive({
    toolbarHeight: 144,
    toolbarVisible: true,
    resourcePanelWidth: 144,
    resourcePanelVisible: true,
  })

  return {
    layout,
  }
})
