<template>
  <div class="">
    <el-radio-group v-model="currentLightType" @change="lightTypeChange">
      <el-radio-button
        v-for="(item, index) in lightTypes"
        :key="index"
        :label="item.name"
      ></el-radio-button>
    </el-radio-group>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  inject,
} from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { ElSlider, ElRadioGroup, ElRadioButton } from 'element-plus'
import {
  getSunLight,
  getMoonLight,
  getFlashLight,
  getMoonDirection,
  updateFlashLightListener,
  updateMoonLightListener,
} from '@/libs/cesium/libs/light'
import * as Cesium from 'cesium'
import terrainManagerVue from '@/components/jt-browser-panel/terrain-manager.vue'
import TrustedServers from 'cesium/Source/Core/TrustedServers'

export default defineComponent({
  name: 'earth-light-setting',
  components: { ElRadioGroup, ElRadioButton },
  props: {},
  setup(props, context) {
    const currentLightType = ref('')

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const { viewer } = cesiumRef || {}
    if (!viewer) {
      throw new Error('Viewer not loaded.')
    }

    const sunLight = getSunLight()
    const flashLight = getFlashLight(viewer.scene)
    const moonLight = getMoonLight(viewer.clock.currentTime)

    const lightTypes = reactive([
      {
        name: '太阳光',
        set: () => {
          resetLight()
        },
      },
      {
        name: '月光',
        set: () => {
          resetLight()
          const { viewer } = cesiumRef || {}
          if (!viewer) {
            return
          }
          const scene = viewer.scene
          scene.light = moonLight
          scene.globe.dynamicAtmosphereLightingFromSun = false
          scene.preRender.addEventListener(updateMoonLightListener)
        },
      },
      {
        name: '视角光',
        set: () => {
          resetLight()
          const { viewer } = cesiumRef || {}
          if (!viewer) {
            return
          }
          const scene = viewer.scene
          scene.light = flashLight
          scene.globe.dynamicAtmosphereLighting = false
          scene.preRender.addEventListener(updateFlashLightListener)
        },
      },
    ])

    const resetLight = (): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      const scene = viewer.scene
      scene.light = sunLight
      scene.preRender.removeEventListener(updateFlashLightListener)
      scene.preRender.removeEventListener(updateMoonLightListener)
      scene.globe.dynamicAtmosphereLighting = true
      scene.globe.dynamicAtmosphereLightingFromSun = false
    }

    const lightTypeChange = (val: string): void => {
      lightTypes.forEach((lightType) => {
        if (lightType.name === val) {
          lightType.set && lightType.set()
          return
        }
      })
    }

    return {
      currentLightType,
      lightTypeChange,
      resetLight,
      lightTypes,
    }
  },
})
</script>
