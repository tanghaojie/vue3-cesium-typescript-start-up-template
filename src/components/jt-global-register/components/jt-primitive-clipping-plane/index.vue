<template>
  <jtDraggableResizable
    v-model="visible"
    :resizable="false"
    :w="480"
    :h="'auto'"
    :initialPosition="'tr'"
    class="pointer-events-auto"
  >
    <template v-slot:title>
      {{ t('jtPrimitiveClipPlane.title', '模型剖分') }}
    </template>
    <div class="w-full bg-gray-800 bg-opacity-70 p-2">
      <div class="w-full flex flex-col px-8 rounded-lg" @click.stop>
        <button class="btn-small" @click="cleanAllPrimitivesClippingPlane">
          {{ t('jtPrimitiveClipPlane.clear', '全部清除') }}
        </button>

        <div class="mt-4">
          <div class="flex">
            <div class="flex flex-col">
              <label class="text-white">
                {{ t('jtPrimitiveClipPlane.selectModel', '选择模型') }}
              </label>
              <el-select
                v-model="selectedPrimitive"
                placeholder="选择模型"
                :size="'small'"
                @change="selectPrimitiveChange"
              >
                <el-option
                  v-for="(p, index) in jtPrimitives"
                  :key="index"
                  :label="p.name"
                  :value="index"
                >
                </el-option>
              </el-select>
            </div>

            <div class="flex flex-col ml-4">
              <label class="text-white">
                {{ t('jtPrimitiveClipPlane.selectDir', '选择方向') }}
              </label>
              <el-select
                v-model="selectClippingDirection.value"
                placeholder="选择方向"
                :disabled="!selectClippingDirection.enable"
                :size="'small'"
                @change="handleSelectClippingDirectionChange"
              >
                <el-option
                  v-for="(c, index) in clippingDirections"
                  :key="index"
                  :label="c.name"
                  :value="index"
                >
                </el-option>
              </el-select>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <div class="flex justify-between">
            <div class="flex flex-col">
              <label class="text-white">
                {{ t('jtPrimitiveClipPlane.minValue', '最小值') }}
              </label>
              <el-input-number
                v-model="minClippingDistanceInput.h"
                :min="minClippingDistanceInput.limit"
                :max="maxClippingDistanceInput.h"
                :disabled="!minClippingDistanceInput.enable"
                :precision="1"
                :step="1"
                size="small"
              ></el-input-number>
            </div>
            <div class="flex flex-col">
              <label class="text-white">
                {{ t('jtPrimitiveClipPlane.maxValue', '最大值') }}
              </label>
              <el-input-number
                v-model="maxClippingDistanceInput.h"
                :min="minClippingDistanceInput.h"
                :max="maxClippingDistanceInput.limit"
                :disabled="!maxClippingDistanceInput.enable"
                :precision="1"
                :step="1"
                size="small"
              ></el-input-number>
            </div>
          </div>

          <el-slider
            v-model="currentClippingDistance.value"
            @change="handleCurrectClippingDistanceChange"
            :disabled="!currentClippingDistance.enable"
            :step="0.1"
            :max="maxClippingDistanceInput.h"
            :min="minClippingDistanceInput.h"
            class="mb-4"
          >
          </el-slider>
        </div>
      </div>
    </div>
  </jtDraggableResizable>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, ref, inject, watch, onMounted } from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import * as Cesium from 'cesium'
import {
  ElCheckbox,
  ElCheckboxGroup,
  ElSelect,
  ElOption,
  ElSlider,
  ElInputNumber,
} from 'element-plus'
import { useStore } from '@/store'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import calculatePrimitiveCenter from '@/libs/cesium/libs/calculate-primitive-center'
import { JTPrimitiveActionTypes } from '@/store/modules/jt-cesium-vue/modules/cesium-data/modules/jt-primitive/action-types'
import { useI18n } from 'vue-i18n'
import { Arrayable } from 'element-plus/es/utils'

type SelectClippingDirection = {
  value: number | undefined
  enable: boolean
}

export default defineComponent({
  name: 'jt-primitive-clipping-plane',
  components: {
    ElCheckbox,
    ElCheckboxGroup,
    ElSelect,
    ElOption,
    ElSlider,
    ElInputNumber,
    jtDraggableResizable,
  },
  setup() {
    const store = useStore()

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const clippingDirections = reactive([
      {
        name: '-Z',
        x: 0,
        y: 0,
        z: -1,
      },
      {
        name: '+Z',
        x: 0,
        y: 0,
        z: 1,
      },
      {
        name: '+X',
        x: 1,
        y: 0,
        z: 0,
      },
      {
        name: '-X',
        x: -1,
        y: 0,
        z: 0,
      },
      {
        name: '+Y',
        x: 0,
        y: 1,
        z: 0,
      },
      {
        name: '-Y',
        x: 0,
        y: -1,
        z: 0,
      },
    ])

    const selectClippingDirection = reactive<SelectClippingDirection>({
      value: undefined,
      enable: false,
    })

    const selectedPrimitive = ref<number | undefined>(undefined)

    const maxClippingDistanceInput = reactive({
      h: 100,
      limit: 1000,
      enable: false,
    })
    const minClippingDistanceInput = reactive({
      h: 0,
      limit: -1000,
      enable: false,
    })

    const currentClippingDistance = reactive({
      value: 0,
      enable: false,
    })

    const visible = computed({
      get(): boolean {
        return true
      },
      set(val: boolean): void {
        cesiumRef?.viewer &&
          cesiumRef?.viewer?.jt?.clippingPlane.removeAllPrimitiveClippingPlanes(true)
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.REMOVE_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          'jt-primitive-clipping-plane'
        )
      },
    })

    const syncJTPrimitive = (): void => {
      store.dispatch(
        `jtCesiumVue/cesiumData/jtPrimitive/${JTPrimitiveActionTypes.SYNC_JTPRIMITIVES}`,
        cesiumRef?.viewer
      )
    }

    const jtPrimitives = computed(() => {
      return store.state.jtCesiumVue.cesiumData.jtPrimitive.jtPrimitives
    })

    const selectPrimitiveChange = (val: number): void => {
      const pri = (cesiumRef || {}).viewer?.jt?.primitiveManager.getPrimitiveByJTPrimitiveIndex(val)
      if (!pri.show) {
        pri.show = true
        syncJTPrimitive()
      }
      const location = calculatePrimitiveCenter(pri)
      cesiumRef?.viewer?.jt?.flyTo.flyTo({
        duration: 0.8,
        destination: Cesium.Cartesian3.fromDegrees(
          location.longitude,
          location.latitude - 0.001,
          location.height + 500
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-78),
          roll: 0.0,
        },
      })
    }

    const cleanAllPrimitivesClippingPlane = (): void => {
      selectedPrimitive.value = undefined
      cesiumRef?.viewer?.jt?.clippingPlane.removeAllPrimitiveClippingPlanes()
    }

    const handleCurrectClippingDistanceChange = (val: Arrayable<number>): void => {
      createOrUpdateClippingPlanes()
    }

    const handleSelectClippingDirectionChange = (val: number): void => {
      createOrUpdateClippingPlanes()
    }

    const createOrUpdateClippingPlanes = (): void => {
      if (selectedPrimitive.value === undefined) {
        return
      }

      const pri = (cesiumRef || {}).viewer?.jt?.primitiveManager.getPrimitiveByJTPrimitiveIndex(
        selectedPrimitive.value
      )
      if (
        !pri ||
        !(pri instanceof Cesium.Cesium3DTileset || pri instanceof Cesium.Model) ||
        selectClippingDirection.value === undefined
      ) {
        return
      }
      const direction = clippingDirections[selectClippingDirection.value]

      const distance = currentClippingDistance.value

      cesiumRef?.viewer?.jt?.clippingPlane.createOrUpdateOnly1Plane(
        pri,
        direction.x,
        direction.y,
        direction.z,
        distance
      )
    }

    watch(selectedPrimitive, (val) => {
      if (val && val >= 0) {
        selectClippingDirection.enable = true
        currentClippingDistance.enable = true
        maxClippingDistanceInput.enable = true
        minClippingDistanceInput.enable = true
      } else {
        selectClippingDirection.enable = false
        currentClippingDistance.enable = false
        maxClippingDistanceInput.enable = false
        minClippingDistanceInput.enable = false
      }
    })

    const onMountedLoadDefaultExample = (): void => {
      jtPrimitives.value.forEach((jtPri, index) => {
        if (jtPri.name !== '精模') {
          return
        }
        selectedPrimitive.value = index
        selectPrimitiveChange(index)
        selectClippingDirection.value = 0
        currentClippingDistance.value = 14.6
        createOrUpdateClippingPlanes()
      })
    }

    onMounted(() => {
      syncJTPrimitive()
      onMountedLoadDefaultExample()
    })

    const { t } = useI18n()

    return {
      visible,
      jtPrimitives,
      clippingDirections,
      selectClippingDirection,
      selectedPrimitive,
      syncJTPrimitive,
      selectPrimitiveChange,
      cleanAllPrimitivesClippingPlane,
      maxClippingDistanceInput,
      minClippingDistanceInput,
      currentClippingDistance,
      handleCurrectClippingDistanceChange,
      handleSelectClippingDirectionChange,
      createOrUpdateClippingPlanes,
      onMountedLoadDefaultExample,
      t,
    }
  },
})
</script>
