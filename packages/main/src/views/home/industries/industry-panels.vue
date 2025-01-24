<template>
  <div class="h-full w-full pointer-events-auto bg-white">
    <div
      @click="backToHome"
      class="back-arrow inline-block px-5 py-1 cursor-pointer"
    ></div>
    <div class="flex flex-row flex-grow-0 flex-shrink-0 flex-wrap">
      <industryPanel
        :title="'碳中和大屏'"
        @click="goToCarbonNeutralBigscreen"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted } from 'vue'
import { useStore } from '@/store'
import { useRouter } from 'vue-router'
import industryPanel from './industry-panel.vue'
import useLayoutControl from './useLayoutControl'

export default defineComponent({
  name: 'industry-panels',
  components: { industryPanel },
  props: {},
  setup(props, context) {
    const store = useStore()
    const router = useRouter()
    const layoutControl = useLayoutControl()
    onMounted(() => {
      layoutControl.hideAllLayout(store)
    })

    const backToHome = (): void => {
      layoutControl.defaultLayout(store)
      router.push('/')
    }

    const goToCarbonNeutralBigscreen = (): void => {
      layoutControl.hideAllLayout(store)
      router.push('/carbon-neutral-bigscreen')
    }

    return { backToHome, goToCarbonNeutralBigscreen }
  },
})
</script>

<style scoped lang="scss">
.back-arrow::before {
  content: '';
  display: inline-block;
  -webkit-transform: rotate(45deg);
  -ms-transform: rotate(45deg);
  transform: rotate(45deg);
  height: 0.5rem;
  width: 0.5rem;
  border-width: 0 0 2px 2px;
  border-color: #666;
  border-style: solid;
  position: relative;
  top: 0;
}
</style>
