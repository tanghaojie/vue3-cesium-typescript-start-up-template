<template>
  <div>
    <el-checkbox v-model="toolbarShow">工具栏</el-checkbox>
    <el-checkbox v-model="browserPanelShow">数据列表</el-checkbox>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { ElCheckbox } from 'element-plus'
import store from '@/store'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'

export default defineComponent({
  name: '',
  components: { ElCheckbox },
  setup() {
    const toolbarShow = computed({
      get(): boolean {
        return store.state.jtCesiumVue.layout.showToolbar
      },
      set(val: boolean): void {
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_TOOLBAR}`,
          val
        )
      },
    })

    const browserPanelShow = computed({
      get(): boolean {
        return store.state.jtCesiumVue.layout.showBrowserPanel
      },
      set(val: boolean): void {
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_BROWSER_PANEL}`,
          val
        )
      },
    })

    return {
      toolbarShow,
      browserPanelShow,
    }
  },
})
</script>
