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
  components: {},
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
  data() {
    return {}
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  setup() {},
  methods: {},
})
</script>

<style scoped lang="scss"></style>
