<template>
  <div
    class="industry-panel px-5 py-2 mx-3 my-2 border border-solid border-gray-100 border-xl shadow-xl overflow-hidden break-all cursor-pointer"
  >
    <div class="title font-bold text-xl">{{ title }}</div>
    <div class="description text-base max-w-sm">{{ description }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted } from 'vue'

export default defineComponent({
  name: 'industry-panel',
  components: {},
  props: {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  setup(props, context) {},
})
</script>

<style scoped lang="scss"></style>
