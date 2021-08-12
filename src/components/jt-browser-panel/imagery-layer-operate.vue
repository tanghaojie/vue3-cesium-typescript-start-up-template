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
const CHANGE_EVENT = 'change'

import { defineComponent, ref, onMounted } from 'vue'
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
  setup(props, context) {
    const alpha = ref(0)
    const brightness = ref(0)
    const contrast = ref(0)
    const hue = ref(0)
    const saturation = ref(0)

    const afterChange = (key: string, val: number): void => {
      context.emit(CHANGE_EVENT, key, val)
    }

    onMounted(() => {
      alpha.value = props.a || 0
      brightness.value = props.b || 0
      contrast.value = props.c || 0
      hue.value = props.h || 0
      saturation.value = props.s || 0
    })

    return {
      alpha,
      brightness,
      contrast,
      hue,
      saturation,
      afterChange,
    }
  },
  emits: {
    [CHANGE_EVENT](key: string, val: number) {
      return true
    },
  },
})
</script>
