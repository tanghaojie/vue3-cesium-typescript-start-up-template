<template>
  <div class="tabs">
    <div class="titles flex m-0 p-0 w-full bg-gray-700 list-none">
      <template v-for="(content, index) in contents" :key="index">
        <div
          class="wrapper"
          :class="{
            'cursor-not-allowed': !!content.disable || !!content.invisible,
          }"
        >
          <div
            v-if="!content.invisible"
            class="
              text-white
              py-1
              px-6
              list-none
              text-sm
              font-bold
              cursor-pointer
              hover:bg-gray-500
            "
            :class="{
              'bg-gray-500': index === currentIndex,
              'pointer-events-none': !!content.disable || !!content.invisible,
            }"
            @click="setCurrent(index, content)"
          >
            {{ content.name }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
const SELECTCHANGE_EVENT = 'selectChange'
import { defineComponent, PropType, ref, watch } from 'vue'
import type { Content } from '@/components/jt-cesium-vue/toolbar/config/contents/Types'

export default defineComponent({
  name: '',
  props: {
    contents: {
      type: Object as PropType<Array<Content>[]>,
      required: true,
    },
  },
  setup(props, context) {
    const currentIndex = ref(0)

    watch(currentIndex, () => {
      context.emit(SELECTCHANGE_EVENT, currentIndex.value)
    })

    const setCurrent = (index: number, content: Content) => {
      if (!!content.invisible || !!content.disable) {
        return
      }
      currentIndex.value = index
    }

    return {
      currentIndex,
      setCurrent,
    }
  },
  emits: {
    [SELECTCHANGE_EVENT](index: number) {
      return true
    },
  },
})
</script>
