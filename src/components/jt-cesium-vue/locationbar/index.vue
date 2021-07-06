<template>
  <div
    class="
      bg-gray-800
      location-bar
      px-1
      py-1
      flex
      pointer-events-auto
      text-white
      opacity-80
      absolute
      right-0
      bottom-0
      whitespace-nowrap
    "
  >
    <div v-if="cameraLocationVisible" class="type">
      <span>视角:</span>
      <div class="item">
        <span class="label">经度:</span>
        <span class="value">{{ cameraLocationLongitudeFix5 }}</span>
      </div>
      <div class="item">
        <span class="label">纬度:</span>
        <span class="value">{{ cameraLocationLatitudeFix5 }}</span>
      </div>
      <div class="item">
        <span class="label">高度:</span>
        <span class="value">{{ cameraLocationHeightFix0 }}</span>
      </div>
    </div>

    <div v-if="mouseLocationVisible" class="type">
      <span>鼠标:</span>
      <div class="item">
        <span class="label">经度:</span>
        <span class="value">{{ mouseLocationLongitudeFix5 }}</span>
      </div>
      <div class="item">
        <span class="label">纬度:</span>
        <span class="value">{{ mouseLocationLatitudeFix5 }}</span>
      </div>
      <div class="item">
        <span class="label">海拔:</span>
        <span class="value">{{ mouseLocationHeightFix0 }}</span>
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
import { defineComponent } from 'vue'
import store from '@/store'
import type { State } from '@/store/modules/jt-cesium-vue/modules/locationbar/state'
import * as Cesium from 'cesium'
import { setPercentageChange } from '@/libs/cesium/libs/percentage-change'

type RemoveCallback = () => void
interface IData {
  cameraLocation: {
    longitude: number
    latitude: number
    height: number
  }
  unbindCameraLocation: RemoveCallback
  mouseLocation: {
    longitude: number
    latitude: number
    height: number
  }
  unbindMouseLocation: RemoveCallback
  fps: number
  unbindFps: RemoveCallback
}

export default defineComponent({
  name: '',
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
  data(): IData {
    return {
      cameraLocation: {
        longitude: 0,
        latitude: 0,
        height: 0,
      },
      unbindCameraLocation: () => {},
      mouseLocation: {
        longitude: 0,
        latitude: 0,
        height: 0,
      },
      unbindMouseLocation: () => {},
      fps: 0,
      unbindFps: () => {},
    }
  },
  computed: {
    cameraLocationVisible(): boolean {
      return store.state.jtCesiumVue.locationbar.showCameraLocation
    },

    mouseLocationVisible(): boolean {
      return store.state.jtCesiumVue.locationbar.showMouseLocation
    },

    fpsVisible(): boolean {
      return store.state.jtCesiumVue.locationbar.showFPS
    },

    cameraLocationHeightFix0(): string {
      return this.cameraLocation.height.toFixed(0)
    },

    cameraLocationLongitudeFix5(): string {
      return this.cameraLocation.longitude.toFixed(5)
    },

    cameraLocationLatitudeFix5(): string {
      return this.cameraLocation.latitude.toFixed(5)
    },

    mouseLocationHeightFix0(): string {
      return this.mouseLocation.height.toFixed(0)
    },

    mouseLocationLongitudeFix5(): string {
      return this.mouseLocation.longitude.toFixed(5)
    },

    mouseLocationLatitudeFix5(): string {
      return this.mouseLocation.latitude.toFixed(5)
    },

    fpxFix0(): string {
      return this.fps.toFixed(0)
    },
  },
  watch: {
    percentageChanged() {
      this.setViewerPercentageChange()
    },

    fpsRate() {
      const { fpsVisible, bindFPS, unbindFps } = this
      if (fpsVisible) {
        unbindFps && unbindFps()
        bindFPS()
      } else {
        unbindFps && unbindFps()
      }
    },

    cameraLocationVisible(val) {
      if (!val) {
        return
      }
      const { bindCameraLocation, unbindCameraLocation } = this
      if (val) {
        unbindCameraLocation && unbindCameraLocation()
        bindCameraLocation()
      } else {
        unbindCameraLocation && unbindCameraLocation()
      }
    },

    mouseLocationVisible(val) {
      if (!val) {
        return
      }
      const { bindMouseLocation, unbindMouseLocation } = this
      if (val) {
        unbindMouseLocation && unbindMouseLocation()
        bindMouseLocation()
      } else {
        unbindMouseLocation && unbindMouseLocation()
      }
    },

    fpsVisible(val) {
      if (!val) {
        return
      }
      const { bindFPS, unbindFps } = this

      if (val) {
        unbindFps && unbindFps()
        bindFPS()
      } else {
        unbindFps && unbindFps()
      }
    },
  },
  created() {},
  mounted() {
    this.bindAll()
  },
  unmounted() {
    this.unbindAll()
  },
  setup() {},
  methods: {
    setViewerPercentageChange() {
      if (!this.$cv.viewer) {
        return
      }
      setPercentageChange(this.$cv.viewer, this.percentageChanged)
    },

    bindCameraLocation() {
      const viewer = this.$cv.viewer
      if (!viewer) {
        return
      }
      this.setViewerPercentageChange()
      const self = this
      this.unbindCameraLocation = viewer.camera.changed.addEventListener(
        function () {
          const pos = viewer.camera.positionCartographic
          self.cameraLocation.height = viewer.camera.positionCartographic.height
          self.cameraLocation.longitude = Cesium.Math.toDegrees(pos.longitude)
          self.cameraLocation.latitude = Cesium.Math.toDegrees(pos.latitude)
        }
      )
    },

    bindMouseLocation() {
      const viewer = this.$cv.viewer
      if (!viewer) {
        return
      }
      const self = this
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
      const hasDepthTest = viewer.scene.globe.depthTestAgainstTerrain
      handler.setInputAction(function (e) {
        let position
        if (hasDepthTest) {
          position = viewer.scene.pickPosition(e.endPosition)
        } else {
          position = viewer.scene.camera.pickEllipsoid(
            e.endPosition,
            viewer.scene.globe.ellipsoid
          )
        }

        if (!position || !Cesium.defined(position)) {
          return
        }
        const cartographic = Cesium.Cartographic.fromCartesian(position)
        self.mouseLocation.longitude = Cesium.Math.toDegrees(
          cartographic.longitude
        )
        self.mouseLocation.latitude = Cesium.Math.toDegrees(
          cartographic.latitude
        )
        self.mouseLocation.height = cartographic.height
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

      this.unbindMouseLocation = () => {
        handler.destroy()
      }
    },

    bindFPS() {
      const viewer = this.$cv.viewer
      if (!viewer) {
        return
      }
      const frameRateMonitor = Cesium.FrameRateMonitor.fromScene(viewer.scene)
      const self = this
      this.fps = frameRateMonitor.lastFramesPerSecond || 0

      const intervalId = setInterval(() => {
        self.fps = frameRateMonitor.lastFramesPerSecond || 0
      }, this.fpsRate)

      this.unbindFps = () => {
        clearInterval(intervalId)
        frameRateMonitor.destroy()
      }
    },

    bindAll() {
      const {
        cameraLocationVisible,
        mouseLocationVisible,
        fpsVisible,
        bindCameraLocation,
        bindMouseLocation,
        bindFPS,
      } = this
      cameraLocationVisible && bindCameraLocation()
      mouseLocationVisible && bindMouseLocation()
      fpsVisible && bindFPS()
    },

    unbindAll() {
      const { unbindCameraLocation, unbindMouseLocation, unbindFps } = this
      unbindCameraLocation && unbindCameraLocation()
      unbindMouseLocation && unbindMouseLocation()
      unbindFps && unbindFps()
    },
  },
})
</script>

<style scoped lang="scss">
.type {
  @apply flex justify-center items-center py-1.5 px-1;
  span {
    @apply inline-block whitespace-nowrap;
  }
  .item {
    @apply mx-0.5 my-0.5;
  }
}
</style>
