<template>
  <div class="home">
    <overlay v-if="cesiumLoaded">
      <div class="flex flex-col h-full">
        <div v-if="toolbarShow">
          <toolBar />
        </div>

        <div v-if="browserPanelShow" class="relative flex-grow">
          <jtSideCollapse :default-pin="true" width="300px">
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
    </overlay>

    <overlay
      v-if="cesiumLoaded && locationBarShow"
      position-mode="fixed"
      class="over flex flex-col"
    >
      <locationbar />
    </overlay>

    <overlay
      v-if="cesiumLoaded && terrianSampleChartShow"
      position-mode="fixed"
      class="over flex flex-col"
    >
      <jtTerrainSampleChart />
    </overlay>

    <div class="h-screen">
      <jt-vue-cesium @loaded="loaded" />
    </div>

    <el-dialog
      title="设置"
      v-model="settingShow"
      width="600px"
      destroy-on-close
    >
      <setting />
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import store from '@/store'
import overlay from '../components/jt-overlay/index.vue'

import jtVueCesium from '../components/jt-cesium-vue/cesium-vue/index.vue'
import locationbar from '../components/jt-cesium-vue/locationbar/index.vue'
import toolBar from '../components/jt-cesium-vue/toolbar/index.vue'
import setting from '../components/jt-cesium-vue/setting/index.vue'
import jtSideCollapse from '../components/jt-side-collapse/index.vue'
import jtBrowserPanel from '../components/jt-browser-panel/index.vue'
import jtTerrainSampleChart from '../components/jt-terrain-sample-chart/index.vue'

import { LocationBarGetterTypes } from '@/store/modules/jt-cesium-vue/modules/locationbar/getter-types'

import { SettingActionTypes } from '@/store/modules/jt-cesium-vue/modules/setting/action-types'

import { ElDialog } from 'element-plus'

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
    ElDialog,
  },
  setup() {
    const locationBarShow = computed((): boolean => {
      return store.getters[
        `jtCesiumVue/locationbar/${LocationBarGetterTypes.ALL_SHOW}`
      ]
    })

    const terrianSampleChartShow = computed((): boolean => {
      return store.state.jtCesiumVue.toolbar.terrainSampling.show
    })

    const browserPanelShow = computed((): boolean => {
      return store.state.jtCesiumVue.setting.showBrowserPanel
    })

    const toolbarShow = computed((): boolean => {
      return store.state.jtCesiumVue.setting.showToolbar
    })

    const settingShow = computed({
      get(): boolean {
        return store.state.jtCesiumVue.setting.showSetting
      },
      set(val: boolean): void {
        store.dispatch(
          `jtCesiumVue/setting/${SettingActionTypes.SET_SHOW_SETTING}`,
          val
        )
      },
    })

    const cesiumLoaded = ref<boolean>(false)

    const loaded = (): void => {
      cesiumLoaded.value = true
    }

    return {
      cesiumLoaded,
      loaded,
      locationBarShow,
      terrianSampleChartShow,
      browserPanelShow,
      toolbarShow,
      settingShow,
    }
  },
})
</script>
