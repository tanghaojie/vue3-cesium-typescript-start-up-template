<template>
  <div class="w-40">
    <div class="name">采样率(越小越精确)</div>
    <el-slider
      v-model="value"
      :min="0"
      :max="0.5"
      :step="0.001"
      :show-tooltip="false"
      :format-tooltip="
        (val) => {
          return ((0.5 - val) * 200).toFixed(0) + '%'
        }
      "
      @change="afterChage"
    ></el-slider>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import {
  getPercentageChange,
  setPercentageChange,
} from '@/libs/cesium/libs/percentage-change'

import { ElSlider } from 'element-plus'

export default defineComponent({
  name: 'camera-percentage-change-rate',
  components: { ElSlider },
  props: {},
  data() {
    return {}
  },
  computed: {},
  watch: {},
  created() {},
  setup() {
    const value = ref<number>(0)
    return {
      value,
    }
  },
  mounted() {
    const { viewer } = this.$cv
    if (viewer) {
      this.value = getPercentageChange(viewer)
    }
  },
  methods: {
    afterChage(val: number) {
      console.log(val)
      const { viewer } = this.$cv
      if (viewer) {
        setPercentageChange(viewer, val)
      }
    },
  },
})
</script>

<style scoped lang="scss"></style>
