<template>
  <jtDraggableResizable
    v-model="isShow"
    :resizable="false"
    :w="280"
    :h="'auto'"
    :initialPosition="'tr'"
    class="pointer-events-auto"
  >
    <template v-slot:title>
      {{ t('jtCartographicLimit.title', '地图范围限制') }}
    </template>
    <div class="w-full bg-gray-800 bg-opacity-70">
      <div
        class="w-full flex flex-col px-6 rounded-lg text-white pb-3"
        @click.stop
      >
        <div class="my-1">
          {{ t('jtCartographicLimit.east', '东经') }}:
          <el-input-number
            v-model="eastLongitude"
            :min="westLongitude"
            :max="180"
            :step="0.2"
            @change="handleEastLongitudeChange"
          />
        </div>

        <div class="my-1">
          {{ t('jtCartographicLimit.west', '西经') }}:
          <el-input-number
            v-model="westLongitude"
            :min="-180"
            :max="eastLongitude"
            :step="0.2"
            @change="handleWestLongitudeChange"
          />
        </div>

        <div class="my-1">
          {{ t('jtCartographicLimit.north', '北纬') }}:
          <el-input-number
            v-model="northLatitude"
            :min="southLatitude"
            :max="180"
            :step="0.2"
            @change="handleNorthLatitudeChange"
          />
        </div>

        <div class="my-1">
          {{ t('jtCartographicLimit.south', '南纬') }}:
          <el-input-number
            v-model="southLatitude"
            :min="-180"
            :max="northLatitude"
            :step="0.2"
            @change="handleSouthLatitudeChange"
          />
        </div>

        <button class="btn" @click="calculateViewRectangle">
          {{
            t(
              'jtCartographicLimit.currentViewExtend',
              '当前视口范围(3D模式有效)'
            )
          }}
        </button>

        <div class="flex justify-center align-middle mt-3">
          <button class="btn" @click="setCartographicLimitRectangle">
            {{ t('jtCartographicLimit.confirm', '确定') }}
          </button>

          <button class="btn ml-3" @click="resetCartographicLimitRectangle">
            {{ t('jtCartographicLimit.reset', '重置') }}
          </button>
        </div>
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
import {
  ElCheckbox,
  ElCheckboxGroup,
  ElInputNumber,
  notificationTypes,
} from 'element-plus'
import { useStore } from '@/store'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import { Rectangle, Math as CesiumMath } from 'cesium'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'jt-cartographic-limit-rectangle',
  components: {
    ElCheckbox,
    ElCheckboxGroup,
    ElInputNumber,
    jtDraggableResizable,
  },
  setup() {
    const store = useStore()

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const isShow = computed({
      get(): boolean {
        return true
      },
      set(val: boolean): void {
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.REMOVE_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          'jt-cartographic-limit-rectangle'
        )
      },
    })

    const westLongitude = ref(0)
    const handleWestLongitudeChange = () => {}

    const eastLongitude = ref(0)
    const handleEastLongitudeChange = () => {}

    const northLatitude = ref(0)
    const handleNorthLatitudeChange = () => {}

    const southLatitude = ref(0)
    const handleSouthLatitudeChange = () => {}

    const setCartographicLimitRectangle = () => {
      const viewer = cesiumRef?.viewer
      if (!viewer) {
        return
      }
      const rectangle = Rectangle.fromDegrees(
        westLongitude.value,
        southLatitude.value,
        eastLongitude.value,
        northLatitude.value
      )
      viewer.scene.globe.cartographicLimitRectangle = rectangle
    }

    const resetCartographicLimitRectangle = () => {
      const viewer = cesiumRef?.viewer
      if (!viewer) {
        return
      }
      viewer.scene.globe.cartographicLimitRectangle = Rectangle.MAX_VALUE
    }

    const rectangleToDegree = (rectangle: Rectangle) => {
      return [
        CesiumMath.toDegrees(rectangle.east),
        CesiumMath.toDegrees(rectangle.west),
        CesiumMath.toDegrees(rectangle.north),
        CesiumMath.toDegrees(rectangle.south),
      ]
    }

    const calculateViewRectangle = () => {
      const viewer = cesiumRef?.viewer
      if (!viewer) {
        return
      }
      const rectangle = viewer.camera.computeViewRectangle()
      if (!rectangle) {
        return
      }
      const [east, west, north, south] = rectangleToDegree(rectangle)
      eastLongitude.value = east
      westLongitude.value = west
      northLatitude.value = north
      southLatitude.value = south
    }

    onMounted(() => {
      const viewer = cesiumRef?.viewer
      if (!viewer) {
        return
      }
      const rectangle = viewer.scene.globe.cartographicLimitRectangle
      if (!rectangle) {
        return
      }
      if (rectangle === Rectangle.MAX_VALUE) {
        return
      }
      const [east, west, north, south] = rectangleToDegree(rectangle)
      eastLongitude.value = east
      westLongitude.value = west
      northLatitude.value = north
      southLatitude.value = south
    })

    const { t } = useI18n()
    return {
      isShow,
      westLongitude,
      handleWestLongitudeChange,
      eastLongitude,
      handleEastLongitudeChange,
      northLatitude,
      handleNorthLatitudeChange,
      southLatitude,
      handleSouthLatitudeChange,
      setCartographicLimitRectangle,
      resetCartographicLimitRectangle,
      rectangleToDegree,
      calculateViewRectangle,
      t,
    }
  },
})
</script>

<style lang="scss" scoped></style>
