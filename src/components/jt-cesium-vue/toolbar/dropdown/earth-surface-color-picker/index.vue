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
import { defineComponent } from 'vue'
import { ElColorPicker } from 'element-plus'
import store from '@/store'
import { rgbaStringToStruct } from '@/libs/utils/rgb'
import * as Cesium from 'cesium'

export default defineComponent({
  name: '',
  components: { ElColorPicker },
  props: {},
  data() {
    return {
      color: 'rgba(19, 206, 102, 0.8)',
    }
  },
  computed: {
    dropdown() {
      return store.state.jtCesiumVue.toolbar.dropdown
    },
  },
  watch: {},
  created() {},
  mounted() {
    const { viewer } = this.$cv
    if (viewer) {
      const c = viewer.scene.globe.baseColor
      this.color = `rgba(${c.red * 255},${c.green * 255},${c.blue * 255},${
        c.alpha
      })`
    }
    ;(this.$refs.colorPicker as any).showPicker = true
  },
  setup() {},
  methods: {
    earthSurfaceColorChange(val: string): void {
      const { red, green, blue, alpha } = rgbaStringToStruct(val)
      const { viewer } = this.$cv
      if (viewer) {
        viewer.scene.globe.baseColor = new Cesium.Color(
          red / 255,
          green / 255,
          blue / 255,
          alpha
        )
      }
      const { iconEl } = this.dropdown
      if (iconEl) {
        iconEl.style.color = `rgba(${red},${green},${blue},${alpha})`
      }
    },
  },
})
</script>
