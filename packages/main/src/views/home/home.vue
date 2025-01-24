<template>
  <div>
    <div class="h-screen bg-green-200">
      <jt-toolBar v-show="toolbarShow" ref="toolbar" />

      <div class="relative" :style="jtCesiumVueContainerStyle">
        <overlay v-if="cesiumLoaded">
          <router-view></router-view>

          <jtTerrainSampleChart class="z-50" />

          <template v-for="view in overlayDynamicViews" :key="view.uuid">
            <component :is="view.name" class="z-50"></component>
          </template>

          <jtSideCollapse
            v-show="browserPanelShow"
            ref="browserPanel"
            :default-pin="true"
            width="300px"
          >
            <jtBrowserPanel />
          </jtSideCollapse>

          <div
            v-if="settingButtonShow"
            class="absolute top-8 right-8 bg-gray-700 w-10 h-10 rounded-lg flex justify-center items-center border pointer-events-auto"
            @click.stop="openSetting()"
          >
            <jt-icon name="setting" class="text-3xl text-gray-300" />
          </div>

          <jt-locationbar v-if="cesiumLoaded && locationBarShow" />
        </overlay>

        <jt-cesium-vue @loaded="loaded" :depthTestAgainstTerrain="true" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  shallowRef,
  computed,
  watch,
  ComponentPublicInstance,
  onMounted,
  nextTick,
} from 'vue'
import { useStore } from '@/store'
import overlay from '@/components/jt-overlay/index.vue'
import { useRouter, useRoute } from 'vue-router'
import jtCesiumVue from '@/components/jt-cesium-vue/index.vue'
import jtLocationbar from '@/components/jt-locationbar/index.vue'
import jtToolBar from '@/components/jt-toolbar/index.vue'
import jtSideCollapse from '@/components/jt-side-collapse/index.vue'
import jtBrowserPanel from '@/components/jt-browser-panel/index.vue'
import jtTerrainSampleChart from '@/components/jt-terrain-sample-chart/index.vue'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'

import { LocationBarGetterTypes } from '@/store/modules/jt-cesium-vue/modules/locationbar/getter-types'

export default defineComponent({
  name: 'jt-home',
  components: {
    jtCesiumVue,
    jtToolBar,
    overlay,
    jtLocationbar,
    jtSideCollapse,
    jtBrowserPanel,
    jtTerrainSampleChart,
    jtDraggableResizable,
  },
  setup() {
    const store = useStore()
    const cesiumLoaded = ref<boolean>(false)

    const locationBarShow = computed((): boolean => {
      return store.getters[`jtCesiumVue/locationbar/${LocationBarGetterTypes.ALL_SHOW}`]
    })

    const browserPanel = ref<ComponentPublicInstance | null>(null)
    const browserPanelShow = computed({
      get(): boolean {
        return store.state.jtCesiumVue.layout.showBrowserPanel
      },
      set(val: boolean): void {
        store.dispatch(`jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_BROWSER_PANEL}`, val)
      },
    })

    const toolbar = shallowRef<ComponentPublicInstance | null>(null)
    const toolbarShow = computed({
      get(): boolean {
        return store.state.jtCesiumVue.layout.showToolbar
      },
      set(val: boolean): void {
        store.dispatch(`jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_TOOLBAR}`, val)
      },
    })
    watch(toolbar, () => {
      calcToolbarHeight()
    })
    watch(toolbarShow, () => {
      nextTick(() => {
        calcToolbarHeight()
      })
    })
    const calcToolbarHeight = () => {
      const oldH = store.state.jtCesiumVue.layout.toolbarHeight
      const h = toolbar.value
        ? ((toolbar.value as ComponentPublicInstance).$el as HTMLElement).clientHeight
        : 0
      if (oldH !== h) {
        store.dispatch(`jtCesiumVue/layout/${LayoutActionTypes.SET_TOOLBAR_HEIGHT}`, h)
      }
    }

    const settingButtonShow = computed({
      get(): boolean {
        return store.state.jtCesiumVue.layout.showSettingButton
      },
      set(val: boolean): void {
        store.dispatch(`jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_SETTING_BUTTON}`, val)
      },
    })

    const jtCesiumVueContainerStyle = computed(() => {
      return {
        height: `calc(100% - ${store.state.jtCesiumVue.layout.toolbarHeight}px)`,
      }
    })

    const overlayDynamicViews = computed(() => {
      {
        return store.state.jtCesiumVue.layout.overlayDynamicViews
      }
    })

    const loaded = (): void => {
      cesiumLoaded.value = true
    }

    const openSetting = () => {
      store.dispatch(
        `jtCesiumVue/layout/${LayoutActionTypes.ADD_UNIQUE_NAME_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
        'jt-setting'
      )
    }

    onMounted(() => {
      init()
    })

    const init = () => {
      nextTick(() => {
        calcToolbarHeight()
      })
    }

    return {
      cesiumLoaded,
      loaded,
      locationBarShow,
      browserPanelShow,
      toolbarShow,
      jtCesiumVueContainerStyle,
      openSetting,
      overlayDynamicViews,
      toolbar,
      browserPanel,
      calcToolbarHeight,
      init,
      settingButtonShow,
    }
  },
})
</script>
