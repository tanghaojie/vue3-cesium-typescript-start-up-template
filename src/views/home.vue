<template>
  <div>
    <overlay v-if="cesiumLoaded">
      <div class="flex flex-col h-full">
        <div v-if="toolbarShow" ref="toolbar">
          <toolBar />
        </div>

        <div v-if="browserPanelShow" class="relative flex flex-row flex-grow">
          <jtSideCollapse ref="browserPanel" :default-pin="true" width="300px">
            <jtBrowserPanel />
          </jtSideCollapse>
        </div>
      </div>

      <div
        v-if="!toolbarShow"
        class="
          absolute
          top-8
          right-8
          bg-gray-700
          w-10
          h-10
          rounded-lg
          flex
          justify-center
          items-center
          border
          pointer-events-auto
        "
        @click.stop="settingShow = true"
      >
        <jt-icon name="setting" class="text-3xl text-gray-300" />
      </div>

      <locationbar v-if="cesiumLoaded && locationBarShow" />
    </overlay>

    <overlay :top="toolbarHeight">
      <setting />
      <jtTerrainSampleChart />
    </overlay>

    <div class="h-screen bg-green-200">
      <jt-vue-cesium @loaded="loaded" />
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  shallowRef,
  computed,
  ComponentPublicInstance,
} from 'vue'
import store from '@/store'
import overlay from '../components/jt-overlay/index.vue'

import jtVueCesium from '../components/jt-cesium-vue/cesium-vue/index.vue'
import locationbar from '../components/jt-cesium-vue/locationbar/index.vue'
import toolBar from '../components/jt-cesium-vue/toolbar/index.vue'
import setting from '../components/jt-cesium-vue/setting/index.vue'
import jtSideCollapse from '../components/jt-side-collapse/index.vue'
import jtBrowserPanel from '../components/jt-browser-panel/index.vue'
import jtTerrainSampleChart from '../components/jt-terrain-sample-chart/index.vue'
import jtDraggableResizable from '../components/jt-draggable-resizable/index.vue'

import { LocationBarGetterTypes } from '@/store/modules/jt-cesium-vue/modules/locationbar/getter-types'

export default defineComponent({
  name: 'Home',
  components: {
    jtVueCesium,
    toolBar,
    overlay,
    setting,
    locationbar,
    jtSideCollapse,
    jtBrowserPanel,
    jtTerrainSampleChart,
    jtDraggableResizable,
  },
  setup() {
    const cesiumLoaded = ref<boolean>(false)
    const toolbar = shallowRef<HTMLElement | null>(null)
    const browserPanel = ref<ComponentPublicInstance | null>(null)

    const locationBarShow = computed((): boolean => {
      return store.getters[
        `jtCesiumVue/locationbar/${LocationBarGetterTypes.ALL_SHOW}`
      ]
    })

    const browserPanelShow = computed((): boolean => {
      return store.state.jtCesiumVue.layout.showBrowserPanel
    })

    const toolbarShow = computed((): boolean => {
      return store.state.jtCesiumVue.layout.showToolbar
    })

    const toolbarHeight = computed((): string => {
      const h = toolbar.value ? (toolbar.value as HTMLElement).clientHeight : 0
      return `${h}px`
    })

    const loaded = (): void => {
      cesiumLoaded.value = true
    }

    return {
      cesiumLoaded,
      loaded,
      locationBarShow,
      browserPanelShow,
      toolbarShow,
      toolbarHeight,
      toolbar,
      browserPanel,
    }
  },
})
</script>
