<template>
  <jtDraggableResizable
    v-model="settingShow"
    :resizable="false"
    :w="260"
    :h="120"
    :y="60"
    :initialPosition="'tm'"
    class="pointer-events-auto"
  >
    <template v-slot:title>设置</template>
    <div class="w-full h-full flex justify-center items-center bg-white">
      <div>
        <el-checkbox v-model="toolbarShow">工具栏</el-checkbox>
        <el-checkbox v-model="browserPanelShow">数据列表</el-checkbox>
      </div>
    </div>
  </jtDraggableResizable>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { ElCheckbox } from 'element-plus'
import store from '@/store'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import { SettingActionTypes } from '@/store/modules/jt-cesium-vue/modules/setting/action-types'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'

export default defineComponent({
  name: '',
  components: { ElCheckbox, jtDraggableResizable },
  setup() {
    const settingShow = computed({
      get(): boolean {
        return store.state.jtCesiumVue.setting.showSetting
      },
      set(val: boolean): void {
        store.dispatch(
          `jtCesiumVue/setting/${SettingActionTypes.SET_SHOW_SETTING}`,
          val
        )
      },
    })

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
      settingShow,
      toolbarShow,
      browserPanelShow,
    }
  },
})
</script>
