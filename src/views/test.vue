<template>
  <div style="width: 100vw; height: 100vh; background-color: gray">
    <overlay>
      <div
        style="
          width: 500px;
          height: 500px;
          background-color: blue;
          position: relative;
        "
      ></div>
    </overlay>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted } from 'vue'
import overlay from '@/components/jt-overlay/index.vue'

export default defineComponent({
  name: 'test-component',
  components: { overlay },
  props: {},
  setup(props, context) {},
})
</script>

<style scoped lang="scss"></style>
