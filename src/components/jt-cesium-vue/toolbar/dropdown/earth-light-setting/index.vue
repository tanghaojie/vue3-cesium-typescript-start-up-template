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
import { ElRadioGroup, ElRadioButton } from 'element-plus'
import Light from '@/libs/cesium/libs/light/Light'
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
    if (!viewer || !viewer.jt) {
      throw new Error('Viewer not loaded.')
    }

    const sunLight = viewer.jt.light.getSunLight()
    const flashLight = viewer.jt.light.getFlashLight()
    const moonLight = viewer.jt.light.getMoonLight(viewer.clock.currentTime)

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
          scene.preRender.addEventListener(Light.updateMoonLightListener)
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
          scene.preRender.addEventListener(Light.updateFlashLightListener)
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
      scene.preRender.removeEventListener(Light.updateFlashLightListener)
      scene.preRender.removeEventListener(Light.updateMoonLightListener)
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
