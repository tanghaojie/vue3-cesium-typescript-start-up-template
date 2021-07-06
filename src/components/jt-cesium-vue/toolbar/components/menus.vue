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
import { defineComponent, PropType } from 'vue'
import type { Content } from '@/components/jt-cesium-vue/toolbar/config/contents/Types'

export default defineComponent({
  name: '',
  props: {
    contents: {
      type: Object as PropType<Array<Content>[]>,
      required: true,
    },
  },
  data() {
    return {
      currentIndex: 0,
    }
  },
  watch: {
    currentIndex() {
      this.$emit('selectChange', this.currentIndex)
    },
  },
  methods: {
    setCurrent(index: number, content: Content) {
      if (!!content.invisible || !!content.disable) {
        return
      }
      this.currentIndex = index
    },
  },
})
</script>

<style scoped lang="scss"></style>
