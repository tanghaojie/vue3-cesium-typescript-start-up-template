<template>
  <div
    class="overlay inset-0"
    :style="{
      'z-index': zIndex,
      'pointer-events': acceptPointerEvents ? 'all' : 'none',
      position: positionMode,
    }"
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
  },
})
</script>
