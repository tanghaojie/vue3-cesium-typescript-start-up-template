<template>
  <div class="w-full">
    <div class="w-full flex flex-col px-16 rounded-lg" @click.stop>
      <div class="alpha my-2">
        <div class="text-gray-800">alpha：</div>
        <el-slider
          v-model="alpha"
          :min="0"
          :max="1"
          :step="0.05"
          @change="(val) => afterChange('alpha', val)"
        />
      </div>
      <div class="brightness my-2">
        <div class="text-gray-800">亮度：</div>
        <el-slider
          v-model="brightness"
          :min="0"
          :max="6"
          :step="0.05"
          @change="(val) => afterChange('brightness', val)"
        />
      </div>
      <div class="contrast my-2">
        <div class="text-gray-800">对比度：</div>
        <el-slider
          v-model="contrast"
          :min="0"
          :max="6"
          :step="0.05"
          @change="(val) => afterChange('contrast', val)"
        />
      </div>
      <div class="hue my-2">
        <div class="text-gray-800">色调：</div>
        <el-slider
          v-model="hue"
          :min="0"
          :max="12"
          :step="0.05"
          @change="(val) => afterChange('hue', val)"
        />
      </div>
      <div class="saturation my-2">
        <div class="text-gray-800">饱和度：</div>
        <el-slider
          v-model="saturation"
          :min="0"
          :max="12"
          :step="0.05"
          @change="(val) => afterChange('saturation', val)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ElSlider } from 'element-plus'

export default defineComponent({
  name: '',
  components: { ElSlider },
  props: {
    a: Number,
    b: Number,
    c: Number,
    h: Number,
    s: Number,
    cb: Function,
  },
  data() {
    return {
      alpha: 0,
      brightness: 0,
      contrast: 0,
      hue: 0,
      saturation: 0,
    }
  },
  mounted() {
    this.alpha = this.a || 0
    this.brightness = this.b || 0
    this.contrast = this.c || 0
    this.hue = this.h || 0
    this.saturation = this.s || 0
  },
  methods: {
    afterChange(key: string, val: number) {
      this.$emit('change', key, val)
    },
  },
})
</script>
