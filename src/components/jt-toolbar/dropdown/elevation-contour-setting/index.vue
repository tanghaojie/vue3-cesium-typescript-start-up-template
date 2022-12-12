<template>
  <div class="elevation-contour-setting" @click.stop>
    <div class="flex flex-row w-full justify-center items-center">
      <div class="flex-0 w-16">
        {{ t('toolbar.terrainTool.contourDistance', '等高距') }}
      </div>
      <div class="flex-0 w-40 ml-3">
        <el-slider
          :disabled="!elevationContourActive"
          v-model="contourDistance"
          :min="contourMinDistance"
          :max="contourMaxDistance"
          :step="10"
          :format-tooltip="
            (val) => {
              return val.toFixed(0) + '米'
            }
          "
          @change="contourDistanceChange"
          class="w-full"
        />
      </div>
      <div class="flex-0 ml-3">
        <el-input-number
          :disabled="!elevationContourActive"
          v-model="contourDistance"
          :min="contourMinDistance"
          :max="contourMaxDistance"
          size="small"
          @change="contourDistanceChange"
        />
      </div>
    </div>

    <div class="flex flex-row w-full justify-center items-center">
      <div class="flex-0 w-16">
        {{ t('toolbar.terrainTool.contourWidth', '线宽') }}
      </div>
      <div class="flex-0 w-40 ml-3">
        <el-slider
          :disabled="!elevationContourActive"
          v-model="contourWidth"
          :min="contourMinWidth"
          :max="contourMaxWidth"
          :step="1"
          @change="contourWidthChange"
          class="w-full"
        />
      </div>
      <div class="flex-0 ml-3">
        <el-input-number
          :disabled="!elevationContourActive"
          v-model="contourWidth"
          :min="contourMinWidth"
          :max="contourMaxWidth"
          size="small"
          @change="contourWidthChange"
        />
      </div>
    </div>

    <div class="flex flex-row w-full justify-center items-center">
      <div class="flex-0 w-12">
        {{ t('toolbar.terrainTool.contourColor', '颜色') }}
      </div>
      <div class="flex-1">
        <el-color-picker
          :disabled="!elevationContourActive"
          v-model="contourColor"
          @change="contourColorChange"
          color-format="rgb"
          show-alpha
        ></el-color-picker>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, inject } from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { ElSlider, ElInputNumber, ElColorPicker } from 'element-plus'
import { useStore } from '@/store'
import { rgbaStringToStruct } from '@/libs/utils/rgb'
import { useI18n } from 'vue-i18n'
import { Arrayable } from 'element-plus/es/utils'

export default defineComponent({
  name: 'jt-elevation-contour-setting',
  components: { ElSlider, ElInputNumber, ElColorPicker },
  setup() {
    const store = useStore()
    const contourDistance = ref(100)
    const contourMinDistance = ref(30)
    const contourMaxDistance = ref(1000)

    const contourWidth = ref(1)
    const contourMinWidth = ref(1)
    const contourMaxWidth = ref(10)

    const contourColor = ref('rgba(255, 0, 0, 1)')

    const elevationContourActive = computed((): boolean => {
      return store.state.jtCesiumVue.toolbar.elevationContourActive
    })

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const contourDistanceChange = (val: Arrayable<number> | undefined): void => {
      if (Array.isArray(val)) {
        return
      }
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      if (!viewer.scene.globe.material || viewer.scene.globe.material.type !== 'ElevationContour') {
        return
      }
      const uniforms = viewer.scene.globe.material.uniforms
      uniforms.spacing = contourDistance.value
    }

    const contourWidthChange = (val: Arrayable<number> | undefined): void => {
      if (Array.isArray(val)) {
        return
      }
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      if (!viewer.scene.globe.material || viewer.scene.globe.material.type !== 'ElevationContour') {
        return
      }
      const uniforms = viewer.scene.globe.material.uniforms
      uniforms.width = contourWidth.value
    }

    const contourColorChange = (val: string | null): void => {
      const { viewer } = cesiumRef || {}
      if (!val || !viewer) {
        return
      }
      if (!viewer.scene.globe.material || viewer.scene.globe.material.type !== 'ElevationContour') {
        return
      }
      const { red, green, blue, alpha } = rgbaStringToStruct(val)
      const uniforms = viewer.scene.globe.material.uniforms
      uniforms.color.red = red / 255
      uniforms.color.green = green / 255
      uniforms.color.blue = blue / 255
      //   uniforms.color.alpha = rgba.a
    }

    const { t } = useI18n()

    return {
      contourDistance,
      contourMinDistance,
      contourMaxDistance,
      contourWidth,
      contourMinWidth,
      contourMaxWidth,
      contourColor,
      elevationContourActive,
      contourDistanceChange,
      contourWidthChange,
      contourColorChange,
      t,
    }
  },
})
</script>

<style scoped lang="scss">
.elevation-contour-setting {
  :deep(.el-input-number) {
    width: 110px;
  }
}
</style>
