<template>
  <jtDraggableResizable
    v-model="settingShow"
    :resizable="false"
    :w="260"
    :h="180"
    :y="60"
    :initialPosition="'tm'"
    class="pointer-events-auto"
  >
    <template v-slot:title>
      {{ t('jtSetting.title', '设置') }}
    </template>
    <div class="w-full h-full p-4 flex justify-center items-center bg-white">
      <div>
        <el-checkbox v-model="toolbarShow">
          {{ t('jtSetting.toolbar', '工具栏') }}
        </el-checkbox>
        <el-checkbox v-model="browserPanelShow">
          {{ t('jtSetting.browserPanel', '数据列表') }}
        </el-checkbox>
        <el-checkbox
          v-for="(inspector, index) in inspectors"
          :key="index"
          v-model="inspector.show"
          @change="inspectorCheckChange(index)"
        >
          {{ inspector.name }}
        </el-checkbox>

        <el-checkbox v-model="showCoordinateWhenClick">
          {{ t('jtSetting.logLonLatCoordOnClick', '点击输出鼠标经纬度') }}
        </el-checkbox>
      </div>
    </div>
  </jtDraggableResizable>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, ref, inject, watch } from 'vue'
import * as Cesium from 'cesium'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { ElCheckbox } from 'element-plus'
import { useStore } from '@/store'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import logMousePositionMixin, {
  additionPropertyName,
} from '@/libs/cesium/mixins/logMousePositionMixin'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'jt-setting',
  components: { ElCheckbox, jtDraggableResizable },
  setup() {
    const store = useStore()
    const { t } = useI18n()
    const inspectors = reactive([
      {
        name: t('jtSetting.cesiumInspector', 'Cesium调试器'),
        namespace: 'viewerCesiumInspectorMixin',
        property: 'cesiumInspector',
        show: false,
      },
      {
        name: t('jtSetting.d3dtileInspector', '3D Tiles调试器'),
        namespace: 'viewerCesium3DTilesInspectorMixin',
        property: 'cesium3DTilesInspector',
        show: false,
      },
    ])

    const showCoordinateWhenClick = ref(false)

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const toolbarShow = computed({
      get(): boolean {
        return store.state.jtCesiumVue.layout.showToolbar
      },
      set(val: boolean): void {
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_TOOLBAR}`,
          val
        )
        // show setting button, if hide toolbar
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_SETTING_BUTTON}`,
          !val
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

    const settingShow = computed({
      get(): boolean {
        return true
      },
      set(val: boolean): void {
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.REMOVE_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          'jt-setting'
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

    watch(showCoordinateWhenClick, (newVal) => {
      const viewer = cesiumRef?.viewer
      if (!viewer) {
        return
      }
      if (newVal) {
        const options = {
          withHeight: true,
        }
        viewer.extend(logMousePositionMixin, options)
      } else {
        const mixin = (viewer as any)[additionPropertyName]
        mixin && mixin.handler && mixin.handler.destroy()
        ;(viewer as any)[additionPropertyName] = undefined
      }
    })

    return {
      inspectors,
      toolbarShow,
      settingShow,
      browserPanelShow,
      inspectorCheckChange,
      showCoordinateWhenClick,
      t,
    }
  },
})
</script>
