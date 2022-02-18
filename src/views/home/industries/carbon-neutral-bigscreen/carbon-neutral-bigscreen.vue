<template>
  <div
    class="cnb fixed top-0 bottom-0 left-0 right-0 overflow-hidden flex flex-col bg-gray-400 bg-opacity-30"
  >
    <div
      class="header px-6 h-20 flex-grow-0 flex-shrink-0 pointer-events-auto flex flex-row items-center justify-between"
    >
      <div class="title text-white font-bold text-2xl">
        XXX市“碳中和”建控指挥平台
      </div>
      <nowDate class="text-white" />
    </div>
    <div class="content flex-grow flex flex-row">
      <input type="checkbox" id="left-checkBox" class="hidden" />
      <div class="left bg-red-200 pointer-events-auto">
        <!-- <label class="handler" for="left-checkBox">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </label> -->
      </div>
      <div class="center flex-grow flex flex-col-reverse">
        <div class="center-bottom bg-gray-700"></div>
      </div>
      <div class="right bg-red-200"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted } from 'vue'
import useLayoutControl from '../useLayoutControl'
import { useStore } from '@/store'

import nowDate from './now-date.vue'

export default defineComponent({
  name: 'carbon-neutral-bigscreen',
  components: { nowDate },
  props: {},
  setup(props, context) {
    const store = useStore()
    const layoutControl = useLayoutControl()

    onMounted(() => {
      layoutControl.hideAllLayout(store)
    })
  },
})
</script>

<style scoped lang="scss">
.cnb {
  .header {
    background-color: rgba(1, 6, 17, 0.8);
  }
  .content {
    .left,
    .right {
      width: 20%;
      min-width: 260px;
    }
    #left-checkBox:checked + div {
      background-color: green !important;
      transform: translateX(calc(-1 * calc(100%) + 12px));
      min-width: 0 !important;
    }
    .left {
      position: relative;

      .handler {
        // total width 12px
        background-color: black;
        position: absolute;
        top: 49%;
        right: 0;
        padding: 3px;
        display: flex;
        flex-direction: column;
        cursor: pointer;
        .dot {
          width: 6px;
          height: 6px;
          display: inline-block;
          border-radius: 3px;
          background-color: red;
          margin: 1px 0px;
          cursor: inherit;
        }
      }
    }
    .center {
      .center-bottom {
        width: 100%;
        height: 168px;
      }
    }
    .right {
    }
  }
}
</style>
