<template>
  <jtDraggableResizable
    v-model="viewShow"
    :resizable="false"
    :w="416"
    :h="370"
    :initialPosition="'tr'"
    class="pointer-events-auto"
  >
    <template v-slot:title>
      {{ t('jtFloodAnalysis.title', '淹没分析') }}
    </template>
    <div class="w-full h-full p-4 bg-gray-800 opacity-90">
      <button class="btn" @click="drawFloodArea">
        {{ t('jtFloodAnalysis.drawArea', '点击绘制范围') }}
      </button>
      <label class="text-gray-100">
        {{ t('jtFloodAnalysis.drawAreaDescription', '(左键开始,右键结束)') }}
      </label>
      <div class="mt-4 w-96">
        <div class="flex justify-between">
          <div class="flex flex-col">
            <label class="text-white">
              {{ t('jtFloodAnalysis.minHeight', '最小高度') }}
            </label>
            <el-input-number
              v-model="minInput.h"
              @change="handleMinHeightChange"
              :min="minInput.limit"
              :max="maxInput.h"
              :disabled="!minInput.enable"
              :precision="2"
              :step="1"
              size="small"
            ></el-input-number>
          </div>
          <div class="flex flex-col">
            <label class="text-white">
              {{ t('jtFloodAnalysis.maxHeight', '最大高度') }}
            </label>
            <el-input-number
              v-model="maxInput.h"
              @change="handleMaxHeightChange"
              :min="minInput.h"
              :max="maxInput.limit"
              :disabled="!maxInput.enable"
              :precision="2"
              :step="1"
              size="small"
            ></el-input-number>
          </div>
        </div>

        <div class="px-4">
          <el-slider
            v-model="currentInput.h"
            @change="handleCurrentHeightChange"
            :max="maxInput.h"
            :min="minInput.h"
            :disabled="!currentInput.enable"
            :step="0.01"
            class="my-4"
          >
          </el-slider>
        </div>
      </div>

      <div class="w-96">
        <div class="flex">
          <div class="flex flex-col">
            <label class="text-white">
              {{ t('jtFloodAnalysis.animateTime', '动画时长') }}
            </label>
            <el-input-number
              v-model="animate.totalSecond"
              :disabled="!animate.enable"
              :min="1"
              :step="0.1"
              size="small"
            ></el-input-number>
          </div>

          <div class="flex-grow ml-3">
            <label class="text-white">
              {{ t('jtFloodAnalysis.animateDetail', '动画细粒度') }}
            </label>
            <div class="px-4">
              <el-slider
                v-model="animate.detailPercent"
                :max="100"
                :min="0"
                :disabled="!animate.enable"
                :step="1"
                :format-tooltip="(val) => `${val}%`"
              >
              </el-slider>
            </div>
          </div>
        </div>

        <button class="btn mt-4" @click="startAnimate">
          {{ t('jtFloodAnalysis.startAnimate', '开始动画') }}
        </button>
      </div>
    </div>
  </jtDraggableResizable>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, ref, inject, watch } from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { ElInputNumber, ElSlider } from 'element-plus'
import { useStore } from '@/store'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import FloodAnalysis from '@/libs/cesium/libs/flood-analysis/FloodAnalysis'
import { useI18n } from 'vue-i18n'
import { Arrayable } from 'element-plus/es/utils'

const componentName = 'jt-flood-analysis'

export default defineComponent({
  name: componentName,
  components: { ElInputNumber, ElSlider, jtDraggableResizable },
  setup() {
    const store = useStore()
    const { t } = useI18n()
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewShow = computed({
      get(): boolean {
        return true
      },
      set(val: boolean): void {
        if (!val) {
          cesiumRef?.viewer?.jt?.floodAnalysis?.removeDrawedFloodArea()
          store.dispatch(
            `jtCesiumVue/layout/${LayoutActionTypes.REMOVE_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
            componentName
          )
        }
      },
    })

    const maxInput = reactive({
      h: 9999,
      limit: FloodAnalysis.FLOOD_ANALYSIS_MAX_HEIGHT_LIMIT,
      enable: false,
    })
    const minInput = reactive({
      h: 0,
      limit: FloodAnalysis.FLOOD_ANALYSIS_MIN_HEIGHT_LIMIT,
      enable: false,
    })
    const currentInput = reactive({
      h: 0,
      enable: false,
    })

    const animate = reactive({
      totalSecond: 3,
      detailPercent: 50,
      enable: false,
    })

    const drawFloodArea = () => {
      if (!cesiumRef || !cesiumRef.viewer) {
        return
      }
      const floodAnalysis = cesiumRef.viewer.jt?.floodAnalysis
      if (!floodAnalysis) {
        return
      }
      maxInput.enable = minInput.enable = currentInput.enable = animate.enable = false
      floodAnalysis.drawFloodArea({
        stoped: () => {
          maxInput.h = Math.round((floodAnalysis.maxHeight * 10000) / 10000)
          minInput.h = Math.round((floodAnalysis.minHeight * 10000) / 10000)
          maxInput.enable = minInput.enable = currentInput.enable = animate.enable = true
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
      const fps = 10 + (60 * animate.detailPercent) / 100 // 0%-100%: 10-60
      floodAnalysis.startFloodAnimate({
        totalMilliseconds: animate.totalSecond * 1000,
        totalFrame: animate.totalSecond * fps,
        currentHeightChange: (val: number) => {
          currentInput.h = val
        },
      })
    }

    const handleMaxHeightChange = (val: number | undefined) => {
      if (!val) {
        return
      }
      const fa = cesiumRef?.viewer?.jt?.floodAnalysis
      if (!fa) {
        return
      }
      fa.maxHeight = val
      fa.setCurrentHeight(val, false)
    }
    const handleMinHeightChange = (val: number | undefined) => {
      if (!val) {
        return
      }
      const fa = cesiumRef?.viewer?.jt?.floodAnalysis
      if (!fa) {
        return
      }
      fa.minHeight = val
      fa.setCurrentHeight(val, false)
    }

    const handleCurrentHeightChange = (val: Arrayable<number>) => {
      if (Array.isArray(val)) {
        return
      }
      const fa = cesiumRef?.viewer?.jt?.floodAnalysis
      if (!fa) {
        return
      }
      fa.setCurrentHeight(val)
    }

    return {
      viewShow,
      maxInput,
      minInput,
      currentInput,
      animate,
      drawFloodArea,
      startAnimate,
      handleMaxHeightChange,
      handleMinHeightChange,
      handleCurrentHeightChange,
      t,
    }
  },
})
</script>
