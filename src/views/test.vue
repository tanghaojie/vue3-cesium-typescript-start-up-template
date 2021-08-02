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
      >
        <jtDraggerResizable
          :parent="true"
          :z="99"
          style="background-color: red"
        >
          <!-- <div
            class="drag-handle"
            style="background-color: black; color: white"
          >
            Drag Only Here
          </div> -->
          123
        </jtDraggerResizable>
      </div>
    </overlay>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted } from 'vue'
import jtDraggerResizable from '@/components/jt-draggable-resizable/index.vue'
import overlay from '@/components/jt-overlay/index.vue'

export default defineComponent({
  name: '',
  components: { jtDraggerResizable, overlay },
  props: {},
  setup(props, context) {},
})
</script>

<style scoped lang="scss"></style>
