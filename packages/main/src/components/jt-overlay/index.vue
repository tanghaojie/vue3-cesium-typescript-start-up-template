<template>
  <div
    class="overlay inset-0"
    :class="acceptPointerEvents ? 'pointer-events-auto' : 'pointer-events-none'"
    :style="{ ...style }"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'jt-overlay',
  props: {
    zIndex: {
      type: Number,
      default: 1,
      required: false,
    },
    acceptPointerEvents: {
      type: Boolean,
      default: false,
    },
    positionMode: {
      type: String,
      default: 'absolute',
    },
    left: {
      type: [Number, String],
      default: 0,
    },
    top: {
      type: [Number, String],
      default: 0,
    },
  },
  computed: {
    style(): any {
      const { zIndex, positionMode, left, top } = this
      return {
        'z-index': zIndex,
        position: positionMode,
        left: left,
        top: top,
      }
    },
  },
})
</script>
