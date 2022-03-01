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
      {{ t('jtCameraSetting.cameraSetting', '相机设置') }}
    </template>
    <div class="w-full bg-gray-800 bg-opacity-70">
      <div class="w-full flex flex-col px-6 rounded-lg" @click.stop>
        <div class="my-1">
          <el-checkbox
            :label="enableMinimumDistanceTitle"
            size="large"
            class="text-white"
            v-model="enableMinimumDistance"
            @change="handleEnableMinimumDistanceChange"
          />
          <el-input-number
            v-model="minimumZoomDistance"
            :min="1"
            :step="1000"
            :disabled="!enableMinimumDistance"
            @change="handleMinimumZoomDistanceChange"
          />
        </div>

        <div class="my-1">
          <el-checkbox
            :label="enableMaximumDistanceTitle"
            size="large"
            class="text-white"
            v-model="enableMaximumDistance"
            @change="handleEnableMaximumDistanceChange"
          />
          <el-input-number
            v-model="maximumZoomDistance"
            :min="minimumZoomDistance + 5000"
            :step="1000"
            :disabled="!enableMaximumDistance"
            @change="handleMaximumZoomDistanceChange"
          />
        </div>

        <div class="my-1">
          <el-checkbox
            :label="enableRotateTitle"
            size="large"
            class="text-white"
            v-model="enableRotate"
            @change="handleEnableRotateChange"
          />
        </div>

        <div class="my-1">
          <el-checkbox
            :label="enableTranslateTitle"
            size="large"
            class="text-white"
            v-model="enableTranslate"
            @change="handleEnableTranslateChange"
          />
        </div>

        <div class="my-1">
          <el-checkbox
            :label="enableZoomTitle"
            size="large"
            class="text-white"
            v-model="enableZoom"
            @change="handleEnableZoomChange"
          />
        </div>

        <div class="my-1">
          <el-checkbox
            :label="enableTiltTitle"
            size="large"
            class="text-white"
            v-model="enableTilt"
            @change="handleEnableTiltChange"
          />
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
import { ElCheckbox, ElCheckboxGroup, ElInputNumber } from 'element-plus'
import { useStore } from '@/store'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'jt-camera-setting',
  components: {
    ElCheckbox,
    ElCheckboxGroup,
    ElInputNumber,
    jtDraggableResizable,
  },
  setup() {
    const store = useStore()

    const { t } = useI18n()

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const isShow = computed({
      get(): boolean {
        return true
      },
      set(val: boolean): void {
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.REMOVE_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          'jt-camera-setting'
        )
      },
    })

    onMounted(() => {
      const viewer = cesiumRef?.viewer
      if (!viewer) {
        return
      }
      if (viewer.scene.screenSpaceCameraController.minimumZoomDistance > 1) {
        enableMinimumDistance.value = true
      }
      minimumZoomDistance.value =
        viewer.scene.screenSpaceCameraController.minimumZoomDistance
      if (
        viewer.scene.screenSpaceCameraController.maximumZoomDistance !==
        Infinity
      ) {
        enableMaximumDistance.value = true
      }
      maximumZoomDistance.value =
        viewer.scene.screenSpaceCameraController.maximumZoomDistance

      enableRotate.value = viewer.scene.screenSpaceCameraController.enableRotate
      enableTranslate.value =
        viewer.scene.screenSpaceCameraController.enableTranslate
      enableZoom.value = viewer.scene.screenSpaceCameraController.enableZoom
      enableTilt.value = viewer.scene.screenSpaceCameraController.enableTilt
    })

    const minimumZoomDistance = ref(0)
    const handleMinimumZoomDistanceChange = () => {
      if (minimumZoomDistance.value < 1) {
        minimumZoomDistance.value = 1
      }
      if (minimumZoomDistance.value > maximumZoomDistance.value) {
        minimumZoomDistance.value = maximumZoomDistance.value - 1
      }
      const viewer = cesiumRef?.viewer
      viewer &&
        (viewer.scene.screenSpaceCameraController.minimumZoomDistance =
          minimumZoomDistance.value)
    }

    const enableMinimumDistance = ref(false)
    const handleEnableMinimumDistanceChange = () => {
      if (!enableMinimumDistance.value) {
        minimumZoomDistance.value = 1
        handleMinimumZoomDistanceChange()
      }
    }
    const enableMinimumDistanceTitle = t(
      'jtCameraSetting.enableMinCameraDistance',
      '最小镜头距离设置'
    )

    const maximumZoomDistance = ref(minimumZoomDistance.value)
    const handleMaximumZoomDistanceChange = () => {
      if (maximumZoomDistance.value < minimumZoomDistance.value) {
        maximumZoomDistance.value = minimumZoomDistance.value + 1000
      }
      const viewer = cesiumRef?.viewer
      viewer &&
        (viewer.scene.screenSpaceCameraController.maximumZoomDistance =
          maximumZoomDistance.value)
    }

    const enableMaximumDistance = ref(false)
    const handleEnableMaximumDistanceChange = () => {
      if (!enableMaximumDistance.value) {
        maximumZoomDistance.value = Infinity
        handleMaximumZoomDistanceChange()
      }
    }
    const enableMaximumDistanceTitle = t(
      'jtCameraSetting.enableMaxCameraDistance',
      '最大镜头距离设置'
    )

    const enableRotate = ref(true)
    const handleEnableRotateChange = () => {
      const viewer = cesiumRef?.viewer
      viewer &&
        (viewer.scene.screenSpaceCameraController.enableRotate =
          enableRotate.value)
    }
    const enableRotateTitle = t('jtCameraSetting.enableRotate', '启动相机旋转')

    const enableTranslate = ref(true)
    const handleEnableTranslateChange = () => {
      const viewer = cesiumRef?.viewer
      viewer &&
        (viewer.scene.screenSpaceCameraController.enableTranslate =
          enableTranslate.value)
    }
    const enableTranslateTitle = t(
      'jtCameraSetting.enableTranslate',
      '启动相机平移'
    )

    const enableZoom = ref(true)
    const handleEnableZoomChange = () => {
      const viewer = cesiumRef?.viewer
      viewer &&
        (viewer.scene.screenSpaceCameraController.enableZoom = enableZoom.value)
    }
    const enableZoomTitle = t('jtCameraSetting.enableZoom', '启动相机缩放')

    const enableTilt = ref(true)
    const handleEnableTiltChange = () => {
      const viewer = cesiumRef?.viewer
      viewer &&
        (viewer.scene.screenSpaceCameraController.enableTilt = enableTilt.value)
    }
    const enableTiltTitle = t('jtCameraSetting.enableTilt', '启动相机倾斜')

    return {
      isShow,

      minimumZoomDistance,
      handleMinimumZoomDistanceChange,
      enableMinimumDistance,
      enableMinimumDistanceTitle,
      handleEnableMinimumDistanceChange,

      maximumZoomDistance,
      handleMaximumZoomDistanceChange,
      enableMaximumDistance,
      enableMaximumDistanceTitle,
      handleEnableMaximumDistanceChange,

      enableRotate,
      enableRotateTitle,
      handleEnableRotateChange,

      enableTranslate,
      enableTranslateTitle,
      handleEnableTranslateChange,

      enableZoom,
      enableZoomTitle,
      handleEnableZoomChange,

      enableTilt,
      enableTiltTitle,
      handleEnableTiltChange,
      t,
    }
  },
})
</script>

<style lang="scss" scoped></style>
