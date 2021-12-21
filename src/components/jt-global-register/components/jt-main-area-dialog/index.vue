<template>
  <overlay :positionMode="'fixed'" :top="toolbarHeight" v-if="visible">
    <jtDraggableResizable
      v-model="visible"
      :resizable="false"
      :w="400"
      :h="120"
      :initialPosition="'tr'"
      class="pointer-events-auto"
    >
      <template v-slot:title>{{ titleText }}</template>
      <div class="w-full bg-gray-800 bg-opacity-70">
        <div class="w-full flex flex-col px-8 rounded-lg" @click.stop>
          <slot />
        </div>
      </div>
    </jtDraggableResizable>
  </overlay>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'
import { ElSlider } from 'element-plus'
import overlay from '@/components/jt-overlay/index.vue'
import { useStore } from '@/store'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import {
  PROPERTY_CHANGE_EVENT,
  UPDATE_MODEL_EVENT,
} from '@/libs/utils/vue-const'

export default defineComponent({
  name: 'jt-main-area-dialog',
  components: { ElSlider, overlay, jtDraggableResizable },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      required: false,
      default: '',
    },
    resizable: {
      type: Boolean,
      required: false,
      default: false,
    },
    w: {
      type: [Number, String],
      required: false,
      default: 400,
      validator: (val: number | string) => {
        if (typeof val === 'number') {
          return val > 0
        }
        return val === 'auto'
      },
    },
    h: {
      type: [Number, String],
      required: false,
      default: 120,
      validator: (val: number | string) => {
        if (typeof val === 'number') {
          return val > 0
        }
        return val === 'auto'
      },
    },
    initialPosition: {
      type: String,
      default: 'tr',
      validator: (val: string) =>
        ['', 'tl', 'tm', 'tr', 'ml', 'mm', 'mr', 'bl', 'bm', 'br'].includes(
          val
        ),
    },
  },
  setup(props, context) {
    const store = useStore()
    const visible = ref(props.modelValue)
    const titleText = ref(props.title)

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

    watch(
      () => props.title,
      (val) => {
        titleText.value = val
      }
    )

    watch(visible, (val) => {
      context.emit(UPDATE_MODEL_EVENT, val)
    })

    return {
      titleText,
      visible,
      toolbarHeight,
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
