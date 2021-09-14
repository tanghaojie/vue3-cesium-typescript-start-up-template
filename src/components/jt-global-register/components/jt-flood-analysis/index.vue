<template>
  <jtDraggableResizable
    v-model="viewShow"
    :resizable="false"
    :w="260"
    :h="180"
    :initialPosition="'tr'"
    class="pointer-events-auto"
  >
    <template v-slot:title>淹没分析</template>
    <div class="w-full h-full p-4 bg-white">
      <button class="btn" @click="drawFloodArea">
        绘制分析范围（右键结束）
      </button>
      <button class="btn" @click="startAnimate">开始动画</button>
    </div>
  </jtDraggableResizable>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, ref, inject, watch } from 'vue'
import * as Cesium from 'cesium'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { ElCheckbox } from 'element-plus'
import store from '@/store'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import FloodAnalysis from '@/libs/cesium/libs/flood-analysis/FloodAnalysis'

const componentName = 'jt-flood-analysis'

export default defineComponent({
  name: '',
  components: { ElCheckbox, jtDraggableResizable },
  setup() {
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewShow = computed({
      get(): boolean {
        return true
      },
      set(val: boolean): void {
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.REMOVE_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          componentName
        )
      },
    })

    const drawFloodArea = () => {
      if (!cesiumRef || !cesiumRef.viewer) {
        return
      }
      const floodAnalysis = cesiumRef.viewer.jt?.floodAnalysis
      if (!floodAnalysis) {
        return
      }
      floodAnalysis.drawFloodArea({
        stoped: () => {
          console.log(floodAnalysis.minHeight)
          console.log(floodAnalysis.maxHeight)
        },
      })
    }

    const startAnimate = () => {
      if (!cesiumRef || !cesiumRef.viewer) {
        return
      }
      const floodAnalysis = cesiumRef.viewer.jt?.floodAnalysis
      if (!floodAnalysis) {
        return
      }
      floodAnalysis.startFloodAnimate()
    }

    return {
      viewShow,
      drawFloodArea,
      startAnimate,
    }
  },
})
</script>
