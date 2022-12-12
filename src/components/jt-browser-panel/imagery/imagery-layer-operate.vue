<template>
  <jt-main-area-dialog
    v-model="visible"
    :resizable="false"
    :w="400"
    :h="120"
    :initialPosition="'tr'"
    :title="title"
  >
    <div class="my-0">
      <div class="text-gray-50">{{ t('browserPanel.imagery.alpha', 'Alpha') }}:</div>
      <el-slider
        v-model="alpha"
        :min="0"
        :max="1"
        :step="0.05"
        @change="(val) => afterChange('alpha', val)"
      />
    </div>
    <div class="my-0">
      <div class="text-gray-50">{{ t('browserPanel.imagery.brightness', '亮度') }}:</div>
      <el-slider
        v-model="brightness"
        :min="0"
        :max="6"
        :step="0.05"
        @change="(val) => afterChange('brightness', val)"
      />
    </div>
    <div class="my-0">
      <div class="text-gray-50">{{ t('browserPanel.imagery.contrast', '对比度') }}:</div>
      <el-slider
        v-model="contrast"
        :min="0"
        :max="6"
        :step="0.05"
        @change="(val) => afterChange('contrast', val)"
      />
    </div>
    <div class="my-0">
      <div class="text-gray-50">{{ t('browserPanel.imagery.hue', '色调') }}:</div>
      <el-slider
        v-model="hue"
        :min="0"
        :max="12"
        :step="0.05"
        @change="(val) => afterChange('hue', val)"
      />
    </div>
    <div class="my-0">
      <div class="text-gray-50">{{ t('browserPanel.imagery.saturation', '饱和度') }}:</div>
      <el-slider
        v-model="saturation"
        :min="0"
        :max="12"
        :step="0.05"
        @change="(val) => afterChange('saturation', val)"
      />
    </div>
  </jt-main-area-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, watchEffect } from 'vue'
import { ElSlider } from 'element-plus'
import { PROPERTY_CHANGE_EVENT, UPDATE_MODEL_EVENT } from '@/libs/utils/vue-const'
import { useI18n } from 'vue-i18n'
import { Arrayable } from 'element-plus/es/utils'

export default defineComponent({
  name: 'imagery-layer-operate',
  components: { ElSlider },
  props: {
    a: Number,
    b: Number,
    c: Number,
    h: Number,
    s: Number,
    imageryLayerName: {
      type: String,
      default: '',
    },
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, context) {
    const alpha = ref(props.a)
    const brightness = ref(props.b)
    const contrast = ref(props.c)
    const hue = ref(props.h)
    const saturation = ref(props.s)
    const visible = ref(props.modelValue)
    const title = ref(`影像配置-${props.imageryLayerName}`)

    const afterChange = (key: string, val: Arrayable<number>): void => {
      if (Array.isArray(val)) {
        return
      }
      context.emit(PROPERTY_CHANGE_EVENT, key, val)
    }

    watch(
      () => props.modelValue,
      (val) => {
        visible.value = val
      }
    )

    watch(
      () => props.imageryLayerName,
      (val) => {
        title.value = `影像配置-${val}`
      }
    )

    watch(visible, (val) => {
      context.emit(UPDATE_MODEL_EVENT, val)
    })

    watchEffect(() => {
      alpha.value = props.a
      brightness.value = props.b
      contrast.value = props.c
      hue.value = props.h
      saturation.value = props.s
    })

    onMounted(() => {
      alpha.value = props.a || 0
      brightness.value = props.b || 0
      contrast.value = props.c || 0
      hue.value = props.h || 0
      saturation.value = props.s || 0
    })

    const { t } = useI18n()

    return {
      alpha,
      brightness,
      contrast,
      hue,
      saturation,
      visible,
      afterChange,
      title,
      t,
    }
  },
  emits: {
    [PROPERTY_CHANGE_EVENT](key: string, val: number) {
      return true
    },

    [UPDATE_MODEL_EVENT](val: boolean) {
      return true
    },
  },
})
</script>
