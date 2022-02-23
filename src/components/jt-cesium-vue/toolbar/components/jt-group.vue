<template>
  <div class="tool-bar-group">
    <div
      class="group flex flex-col justify-center items-center px-6 border-r-2 border-gray-700"
    >
      <div class="group-container flex">
        <slot></slot>
      </div>

      <div
        class="group-name text-white text-xs mt-1 rounded py-0.5 px-4 bg-gray-700 cursor-default"
      >
        <slot name="name">组</slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'jt-group',
})
</script>
