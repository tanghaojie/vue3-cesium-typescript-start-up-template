<template>
  <div
    class="bg-gray-800 location-bar px-1 flex pointer-events-auto text-white opacity-90 absolute right-0 bottom-0 whitespace-nowrap"
  >
    <div v-if="cameraLocationVisible" class="type">
      <span> {{ t('locationBar.view', '视角') }}: </span>
      <div class="item">
        <!-- <span class="label">经度:</span> -->
        <span class="value">{{ cameraLocationLongitudeFix5 }}°</span>
      </div>
      <div class="item">
        <!-- <span class="label">纬度:</span> -->
        <span class="value">{{ cameraLocationLatitudeFix5 }}°</span>
      </div>
      <div class="item">
        <!-- <span class="label">高度:</span> -->
        <span class="value">{{ cameraLocationHeightFix0 }}m</span>
      </div>
    </div>

    <div v-if="mouseLocationVisible" class="type">
      <span>{{ t('locationBar.mouse', '鼠标') }}:</span>
      <div class="item">
        <!-- <span class="label">经度:</span> -->
        <span class="value">{{ mouseLocationLongitudeFix5 }}°</span>
      </div>
      <div class="item">
        <!-- <span class="label">纬度:</span> -->
        <span class="value">{{ mouseLocationLatitudeFix5 }}°</span>
      </div>
      <div class="item">
        <!-- <span class="label">海拔:</span> -->
        <span class="value">{{ mouseLocationHeightFix0 }}m</span>
      </div>
    </div>

    <div v-if="fpsVisible" class="type">
      <span>FPS:</span>
      <div class="item">
        <span class="value">{{ fpxFix0 }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  reactive,
  ref,
  watch,
  computed,
  onMounted,
  onUnmounted,
  inject,
} from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { useStore } from '@/store'
import type { State } from '@/store/modules/jt-cesium-vue/modules/locationbar/state'
import * as Cesium from 'cesium'
import { useI18n } from 'vue-i18n'
const LONG_LAT_VALUE_DECIMAL_PRECISION = 5
const HEIGHT_VALUE_DECIMAL_PRECISION = 1

export default defineComponent({
  name: 'jt-locationbar',
  components: {},
  props: {
    // 范围[0,1]，数字越小越精确，但影响性能
    percentageChanged: {
      type: Number,
      default: 0.5,
    },
    // fps刷新速度（毫秒）
    fpsRate: {
      type: Number,
      default: 1000,
    },
  },
  setup(props) {
    const store = useStore()
    const cameraLocation = reactive({
      longitude: 0,
      latitude: 0,
      height: 0,
    })

    const mouseLocation = reactive({
      longitude: 0,
      latitude: 0,
      height: 0,
    })

    const fps = ref(0)
    const unbindCameraLocation = ref(function () {})
    const unbindMouseLocation = ref(function () {})
    const unbindFps = ref(function () {})

    const cameraLocationVisible = computed((): boolean => {
      return store.state.jtCesiumVue.locationbar.showCameraLocation
    })

    const mouseLocationVisible = computed((): boolean => {
      return store.state.jtCesiumVue.locationbar.showMouseLocation
    })

    const fpsVisible = computed((): boolean => {
      return store.state.jtCesiumVue.locationbar.showFPS
    })

    const cameraLocationHeightFix0 = computed((): string => {
      return cameraLocation.height.toFixed(HEIGHT_VALUE_DECIMAL_PRECISION)
    })

    const cameraLocationLongitudeFix5 = computed((): string => {
      return cameraLocation.longitude.toFixed(LONG_LAT_VALUE_DECIMAL_PRECISION)
    })

    const cameraLocationLatitudeFix5 = computed((): string => {
      return cameraLocation.latitude.toFixed(LONG_LAT_VALUE_DECIMAL_PRECISION)
    })

    const mouseLocationHeightFix0 = computed((): string => {
      return mouseLocation.height.toFixed(HEIGHT_VALUE_DECIMAL_PRECISION)
    })

    const mouseLocationLongitudeFix5 = computed((): string => {
      return mouseLocation.longitude.toFixed(LONG_LAT_VALUE_DECIMAL_PRECISION)
    })

    const mouseLocationLatitudeFix5 = computed((): string => {
      return mouseLocation.latitude.toFixed(LONG_LAT_VALUE_DECIMAL_PRECISION)
    })

    const fpxFix0 = computed((): string => {
      return fps.value.toFixed(0)
    })

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const setViewerPercentageChange = () => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      viewer.jt?.percentageChange.set(props.percentageChanged)
    }

    const bindCameraLocation = (): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      setViewerPercentageChange()
      unbindCameraLocation.value = viewer.camera.changed.addEventListener(function () {
        const pos = viewer.camera.positionCartographic
        cameraLocation.height = viewer.camera.positionCartographic.height
        cameraLocation.longitude = Cesium.Math.toDegrees(pos.longitude)
        cameraLocation.latitude = Cesium.Math.toDegrees(pos.latitude)
      })
    }

    const bindMouseLocation = (): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
      const hasDepthTest = viewer.scene.globe.depthTestAgainstTerrain
      handler.setInputAction(function (e: any) {
        let position
        if (hasDepthTest) {
          position = viewer.scene.pickPosition(e.endPosition)
        } else {
          position = viewer.scene.camera.pickEllipsoid(e.endPosition, viewer.scene.globe.ellipsoid)
        }

        if (!position || !Cesium.defined(position)) {
          return
        }
        const cartographic = Cesium.Cartographic.fromCartesian(position)
        mouseLocation.longitude = Cesium.Math.toDegrees(cartographic.longitude)
        mouseLocation.latitude = Cesium.Math.toDegrees(cartographic.latitude)
        mouseLocation.height = cartographic.height
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

      unbindMouseLocation.value = () => {
        handler.destroy()
      }
    }

    const bindFPS = (): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      const frameRateMonitor = Cesium.FrameRateMonitor.fromScene(viewer.scene)
      const self = this
      fps.value = frameRateMonitor.lastFramesPerSecond || 0

      const intervalId = setInterval(() => {
        fps.value = frameRateMonitor.lastFramesPerSecond || 0
      }, props.fpsRate)

      unbindFps.value = () => {
        clearInterval(intervalId)
        frameRateMonitor.destroy()
      }
    }

    const bindAll = (): void => {
      cameraLocationVisible.value && bindCameraLocation()
      mouseLocationVisible.value && bindMouseLocation()
      fpsVisible.value && bindFPS()
    }

    const unbindAll = (): void => {
      unbindCameraLocation.value && unbindCameraLocation.value()
      unbindMouseLocation.value && unbindMouseLocation.value()
      unbindFps.value && unbindFps.value()
    }

    watch(
      () => props.fpsRate,
      (): void => {
        if (fpsVisible.value) {
          unbindFps.value && unbindFps.value()
          bindFPS()
        } else {
          unbindFps.value && unbindFps.value()
        }
      }
    )

    watch(
      () => props.percentageChanged,
      (): void => {
        setViewerPercentageChange()
      }
    )

    watch(cameraLocationVisible, (val) => {
      if (!val) {
        return
      }
      if (val) {
        unbindCameraLocation.value && unbindCameraLocation.value()
        bindCameraLocation()
      } else {
        unbindCameraLocation.value && unbindCameraLocation.value()
      }
    })

    watch(mouseLocationVisible, (val) => {
      if (!val) {
        return
      }
      if (val) {
        unbindMouseLocation.value && unbindMouseLocation.value()
        bindMouseLocation()
      } else {
        unbindMouseLocation.value && unbindMouseLocation.value()
      }
    })

    watch(fpsVisible, (val) => {
      if (!val) {
        return
      }

      if (val) {
        unbindFps.value && unbindFps.value()
        bindFPS()
      } else {
        unbindFps.value && unbindFps.value()
      }
    })

    onMounted(() => {
      bindAll()
    })

    onUnmounted(() => {
      unbindAll()
    })

    const { t } = useI18n()

    return {
      cameraLocation,
      mouseLocation,
      fps,
      unbindCameraLocation,
      unbindMouseLocation,
      unbindFps,
      cameraLocationVisible,
      mouseLocationVisible,
      fpsVisible,
      cameraLocationHeightFix0,
      cameraLocationLongitudeFix5,
      cameraLocationLatitudeFix5,
      mouseLocationHeightFix0,
      mouseLocationLongitudeFix5,
      mouseLocationLatitudeFix5,
      fpxFix0,
      setViewerPercentageChange,
      bindCameraLocation,
      bindMouseLocation,
      bindFPS,
      bindAll,
      unbindAll,
      t,
    }
  },
})
</script>

<style scoped lang="scss">
.type {
  @apply flex justify-center items-center py-1 px-1;
  span {
    @apply inline-block whitespace-nowrap;
  }
  .item {
    @apply mx-1.5 my-0.5;
  }
}
</style>
