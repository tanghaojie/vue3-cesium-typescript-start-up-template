<template>
  <jtDraggableResizable
    v-model="visible"
    :resizable="false"
    :w="280"
    :h="'auto'"
    :initialPosition="'tr'"
    class="pointer-events-auto"
  >
    <template v-slot:title>模型剖分</template>
    <div class="w-full bg-gray-800 bg-opacity-70">
      <div class="w-full flex flex-col px-8 rounded-lg" @click.stop>
        <div class="my-0">123</div>
      </div>
    </div>
  </jtDraggableResizable>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  reactive,
  ref,
  inject,
  watch,
  onMounted,
} from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { ElCheckbox, ElCheckboxGroup } from 'element-plus'
import store from '@/store'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'

export default defineComponent({
  name: 'jt-primitive-clipping-plane',
  components: { ElCheckbox, ElCheckboxGroup, jtDraggableResizable },
  setup() {
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const visible = computed({
      get(): boolean {
        return true
      },
      set(val: boolean): void {
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.REMOVE_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          'jt-primitive-clipping-plane'
        )
      },
    })

    onMounted(() => {})

    return {
      visible,
    }
  },
})
</script>
