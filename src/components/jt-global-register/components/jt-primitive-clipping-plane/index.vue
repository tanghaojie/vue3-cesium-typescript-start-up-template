<template>
  <jtDraggableResizable
    v-model="visible"
    :resizable="false"
    :w="280"
    :h="'auto'"
    :initialPosition="'tr'"
    class="pointer-events-auto"
  >
    <template v-slot:title>模型剖分</template>
    <div class="w-full bg-gray-800 bg-opacity-70 pb-2">
      <div class="w-full flex flex-col px-8 rounded-lg" @click.stop>
        <el-select
          v-model="selectedPrimitive"
          placeholder="选择模型"
          :size="'mini'"
          @change="selectPrimitiveChange"
        >
          <el-option
            v-for="(p, index) in primitives"
            :key="index"
            :label="p.name"
            :value="index"
          >
          </el-option>
        </el-select>
      </div>
    </div>
  </jtDraggableResizable>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  reactive,
  ref,
  inject,
  watch,
  onMounted,
} from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import * as Cesium from 'cesium'
import { ElCheckbox, ElCheckboxGroup, ElSelect, ElOption } from 'element-plus'
import { useStore } from '@/store'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import { Primitive } from '@/libs/cesium/libs/primitive-manager/PrimitiveManager'
import calculatePrimitiveCenter from '@/libs/cesium/libs/calculate-primitive-center'

export default defineComponent({
  name: 'jt-primitive-clipping-plane',
  components: {
    ElCheckbox,
    ElCheckboxGroup,
    ElSelect,
    ElOption,
    jtDraggableResizable,
  },
  setup() {
    const store = useStore()
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const primitives = reactive<Primitive[]>([])

    const selectedPrimitive = ref(undefined)

    const visible = computed({
      get(): boolean {
        return true
      },
      set(val: boolean): void {
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.REMOVE_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          'jt-primitive-clipping-plane'
        )
      },
    })

    const syncPrimitiveList = (): void => {
      primitives.splice(0, primitives.length)
      const pris = (
        cesiumRef || {}
      ).viewer?.jt?.primitiveManager.syncPrimitives()
      pris && primitives.push(...pris)
    }

    const selectPrimitiveChange = (val: number): void => {
      const pri = (cesiumRef || {}).viewer?.jt?.primitiveManager.getPrimitive(
        val
      )
      console.log(pri.name)

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

    onMounted(() => {
      syncPrimitiveList()
    })

    return {
      visible,
      primitives,
      selectedPrimitive,
      syncPrimitiveList,
      selectPrimitiveChange,
    }
  },
})
</script>
