<template>
  <vue3DraggableResizable
    v-if="modelValue"
    ref="v3dr"
    class="v3dr-container"
    :dragHandle="'.header'"
    :parent="true"
    :w="'auto'"
    :h="'auto'"
    :minHeight="200"
    :minWidth="200"
    :resizable="false"
    :initialPosition="'mm'"
    v-bind="$attrs"
  >
    <div
      class="header flex flex-row bg-gray-700 w-full text-white cursor-default"
    >
      <div class="flex justify-center items-center opacity-0">
        <div class="px-3 py-1">X</div>
      </div>
      <div class="flex-auto flex justify-center items-center text-center">
        <slot name="title"></slot>
      </div>
      <div class="flex justify-center items-center cursor-pointer">
        <div class="px-3 py-1" @click="onClose">
          <el-icon><close /></el-icon>
        </div>
      </div>
    </div>
    <div class="content">
      <slot></slot>
    </div>
  </vue3DraggableResizable>
</template>

<script lang="ts">
const UPDATE_MODEL_EVENT = 'update:modelValue'

import {
  defineComponent,
  ref,
  reactive,
  computed,
  watch,
  nextTick,
  onMounted,
  ComponentPublicInstance,
} from 'vue'
import { useStore } from '@/store'
import vue3DraggableResizable from './vue3-draggable-resizable.vue'
import { ElIcon } from 'element-plus'
import { Close } from '@element-plus/icons-vue'

export default defineComponent({
  inheritAttrs: true,
  name: 'JtDraggableResizable',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  components: { vue3DraggableResizable, ElIcon, Close },
  setup(props, context) {
    const store = useStore()
    const v3dr = ref<ComponentPublicInstance | null>(null)

    const onClose = () => {
      context.emit(UPDATE_MODEL_EVENT, false)
    }

    const parentResized = () => {
      v3dr.value && (v3dr.value as any).checkParentSize()
    }

    watch(
      () => {
        return store.state.jtCesiumVue.layout.toolbarHeight
      },
      () => {
        nextTick(() => {
          parentResized()
        })
      }
    )

    return {
      v3dr,
      onClose,
      parentResized,
    }
  },
  emits: {
    [UPDATE_MODEL_EVENT](val: boolean) {
      return true
    },
  },
})
</script>

<style scoped lang="scss">
.v3dr-container {
  --header-height: 2rem;
  .header {
    height: var(--header-height);
  }

  .content {
    height: calc(100% - var(--header-height));
  }
}
</style>
