<template>
  <div
    ref="el"
    class="tool-bar relative bg-gray-500 pointer-events-auto"
    :style="{
      '--dropdown-panel-p-left': dropdown.left + 'px',
      '--dropdown-panel-p-top': dropdown.top + 'px',
    }"
    @click="clearDropdown"
  >
    <jt-menus :contents="toolbarConfig" @selectChange="selectChange" />

    <jt-groups
      :key="currentSelectIndex"
      :groups="toolbarConfig[currentSelectIndex].groups"
    />

    <div
      v-if="dropdown.show"
      @click.stop
      class="dropdown-panel bg-gray-600 bg-opacity-50 text-white p-4 absolute border-2 border-t-0 border-gray-900 rounded-b z-50"
    >
      <component :is="dropdown.componentName"></component>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  shallowRef,
  computed,
  onMounted,
  watch,
} from 'vue'
import { useRoute } from 'vue-router'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'
import type { DropdownState } from '@/store/modules/jt-cesium-vue/modules/toolbar/state'
import { useStore } from '@/store'
import tbConfig from './config'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import jtMenus from './components/jt-menus.vue'
import jtGroups from './components/jt-groups.vue'
import UrlQuery from '@/utils/url-query'

// dropdown components
import dropdowns from './dropdown'

export default defineComponent({
  name: 'jt-toolbar',
  components: {
    jtMenus,
    jtGroups,
    ...dropdowns,
  },
  setup() {
    const store = useStore()

    const el = shallowRef<HTMLElement | null>(null)

    const toolbarConfig = computed(() => {
      return tbConfig
    })

    const dropdown = computed(() => {
      return store.state.jtCesiumVue.toolbar.dropdown
    })

    const currentSelectIndex = ref(0)
    const selectChange = (val: number) => {
      currentSelectIndex.value = val
    }

    const clearDropdown = () => {
      const val: DropdownState = {
        ...dropdown.value,
        show: false,
        componentName: '',
        iconEl: undefined,
      }
      store.dispatch(
        `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_DROP_DOWN}`,
        val
      )
    }

    onMounted(() => {
      const val: DropdownState = {
        ...dropdown.value,
        top: (el.value as HTMLElement).offsetHeight,
      }
      store.dispatch(
        `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_DROP_DOWN}`,
        val
      )

      const route = useRoute()
      const hideToolbar = route.query[UrlQuery.HideToolbar]
      if (hideToolbar) {
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_TOOLBAR}`,
          false
        )
      }
    })

    return {
      currentSelectIndex,
      el,
      toolbarConfig,
      dropdown,
      selectChange,
      clearDropdown,
    }
  },
})
</script>

<style scoped lang="scss">
.tool-bar {
  .dropdown-panel {
    left: var(--dropdown-panel-p-left);
    top: var(--dropdown-panel-p-top);
  }
}
</style>
