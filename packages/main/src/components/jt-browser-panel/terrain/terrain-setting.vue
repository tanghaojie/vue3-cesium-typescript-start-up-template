<template>
  <overlay :positionMode="'fixed'" :top="toolbarHeight" v-if="visible">
    <jtDraggableResizable
      v-model="visible"
      :resizable="false"
      :w="384"
      :h="120"
      :initialPosition="'tr'"
      class="pointer-events-auto"
    >
      <template v-slot:title>
        {{ t('browserPanel.terrain.terrainSetting', '地形设置') }}
      </template>
      <div class="w-96 p-3 flex flex-row flex-wrap bg-gray-800 bg-opacity-70" @click.stop>
        <div class="text-gray-100">
          {{ t('browserPanel.terrain.terrainScale', '地形缩放') }}
        </div>
        <div class="w-96">
          <el-slider
            :min="0"
            :max="10"
            :step="0.01"
            v-model="exaggeration"
            show-input
            @change="exaggerationValueChange"
          >
          </el-slider>
        </div>
      </div>
    </jtDraggableResizable>
  </overlay>
</template>

<script lang="ts">
const UPDATE_MODEL_EVENT = 'update:modelValue'
const CHANGE = 'change'

import { defineComponent, ref, onMounted, computed, watch, watchEffect, PropType } from 'vue'
import { ElSlider } from 'element-plus'
import overlay from '@/components/jt-overlay/index.vue'
import { useStore } from '@/store'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import { useI18n } from 'vue-i18n'
import { Arrayable } from 'element-plus/es/utils'

export default defineComponent({
  name: 'terrain-setting',
  components: { ElSlider, overlay, jtDraggableResizable },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    initExaggeration: {
      type: Number,
      default: 0,
    },
  },
  setup(props, context) {
    const store = useStore()
    const visible = ref(props.modelValue)
    const exaggeration = ref(props.initExaggeration)

    const toolbarHeight = computed((): string => {
      const h = store.state.jtCesiumVue.layout.toolbarHeight
      return `${h}px`
    })

    watch(
      () => props.modelValue,
      (val) => {
        visible.value = val
      }
    )

    watch(visible, (val) => {
      context.emit(UPDATE_MODEL_EVENT, val)
    })

    const exaggerationValueChange = (val: Arrayable<number>): void => {
      if (Array.isArray(val)) {
        return
      }
      context.emit(CHANGE, val)
    }

    const { t } = useI18n()

    return {
      visible,
      toolbarHeight,
      exaggeration,
      exaggerationValueChange,
      t,
    }
  },
  emits: {
    [UPDATE_MODEL_EVENT]: null,
    [CHANGE]: null,
  },
})
</script>
