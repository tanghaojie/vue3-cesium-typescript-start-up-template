<template>
  <el-color-picker
    ref="colorPicker"
    v-model="color"
    show-alpha
    class="w-0 h-0 opacity-0"
    @change="earthSurfaceColorChange"
    @active-change="earthSurfaceColorChange"
  ></el-color-picker>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, inject } from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { ElColorPicker } from 'element-plus'
import { useStore } from '@/store'
import { rgbaStringToStruct } from '@/libs/utils/rgb'
import * as Cesium from 'cesium'

export default defineComponent({
  name: 'jt-earth-surface-color-picker',
  components: { ElColorPicker },
  setup() {
    const store = useStore()
    const color = ref<string>('rgba(19, 206, 102, 0.8)')

    const colorPicker = ref(null)

    const dropdown = computed(() => {
      return store.state.jtCesiumVue.toolbar.dropdown
    })

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const earthSurfaceColorChange = (val: string | null): void => {
      if (!val) {
        return
      }
      const { red, green, blue, alpha } = rgbaStringToStruct(val)
      const { viewer } = cesiumRef || {}
      if (viewer) {
        viewer.scene.globe.baseColor = new Cesium.Color(red / 255, green / 255, blue / 255, alpha)
      }
      const { iconEl } = dropdown.value
      if (iconEl) {
        iconEl.style.color = `rgba(${red},${green},${blue},${alpha})`
      }
    }

    onMounted(() => {
      const { viewer } = cesiumRef || {}
      if (viewer) {
        const c = viewer.scene.globe.baseColor
        color.value = `rgba(${c.red * 255},${c.green * 255},${c.blue * 255},${c.alpha})`
      }
      ;(colorPicker.value as any).showPicker = true
    })

    return {
      color,
      colorPicker,
      dropdown,
      earthSurfaceColorChange,
    }
  },
})
</script>
