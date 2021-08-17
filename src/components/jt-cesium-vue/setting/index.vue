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
    <div class="w-full h-full p-4 flex justify-center items-center bg-white">
      <div>
        <el-checkbox v-model="toolbarShow">工具栏</el-checkbox>
        <el-checkbox v-model="browserPanelShow">数据列表</el-checkbox>
        <el-checkbox
          v-for="(inspector, index) in inspectors"
          :key="index"
          v-model="inspector.show"
          @change="inspectorCheckChange(index)"
        >
          {{ inspector.name }}
        </el-checkbox>
      </div>
    </div>
  </jtDraggableResizable>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, inject } from 'vue'
import * as Cesium from 'cesium'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { ElCheckbox } from 'element-plus'
import store from '@/store'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import { SettingActionTypes } from '@/store/modules/jt-cesium-vue/modules/setting/action-types'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'

export default defineComponent({
  name: '',
  components: { ElCheckbox, jtDraggableResizable },
  setup() {
    const inspectors = reactive([
      {
        name: 'Cesium调试器',
        namespace: 'viewerCesiumInspectorMixin',
        property: 'cesiumInspector',
        show: false,
      },
      {
        name: '3D Tiles调试器',
        namespace: 'viewerCesium3DTilesInspectorMixin',
        property: 'cesium3DTilesInspector',
        show: false,
      },
    ])

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

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

    const inspectorCheckChange = (index: number) => {
      const viewer = cesiumRef?.viewer
      if (!viewer) {
        return
      }
      const inspector = inspectors[index]
      const prop = (viewer as any)[inspector.property]

      if (inspector.show) {
        if (prop) {
          prop.container.style.display = 'block'
        } else {
          viewer.extend((Cesium as any)[inspector.namespace])
        }
      } else {
        if (prop) {
          prop.container.style.display = 'none'
        }
      }
    }

    return {
      inspectors,
      settingShow,
      toolbarShow,
      browserPanelShow,
      inspectorCheckChange,
    }
  },
})
</script>
