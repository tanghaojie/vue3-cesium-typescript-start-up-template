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
    <menus :contents="toolbarConfig" @selectChange="selectChange" />

    <groups
      :key="currentSelectIndex"
      :groups="toolbarConfig[currentSelectIndex].groups"
    />

    <div
      v-if="dropdown.show"
      @click.stop
      class="
        dropdown-panel
        bg-gray-600 bg-opacity-50
        text-white
        p-4
        absolute
        border-2 border-t-0 border-gray-900
        rounded-b
        z-50
      "
    >
      <component :is="dropdown.componentName"></component>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { mapActions } from 'vuex'

import Store from '@/store'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'
import type { DropdownState } from '@/store/modules/jt-cesium-vue/modules/toolbar/state'

import tbConfig from './config'

import menus from './components/menus.vue'
import groups from './components/groups.vue'

// dropdown components
import dropdowns from './dropdown'

export default defineComponent({
  name: '',
  components: {
    menus,
    groups,
    ...dropdowns,
  },
  setup() {
    const currentSelectIndex = ref(0)
    const el = ref<HTMLElement | null>(null)

    const toolbarConfig = computed(() => {
      return tbConfig
    })

    const dropdown = computed(() => {
      return Store.state.jtCesiumVue.toolbar.dropdown
    })

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
      Store.dispatch(
        `jtCesiumVue/toolbar/ToolbarActionTypes.SET_DROP_DOWN`,
        val
      )
    }

    onMounted(() => {
      const val: DropdownState = {
        ...dropdown.value,
        top: (el.value as HTMLElement).offsetHeight,
      }
      Store.dispatch(
        `jtCesiumVue/toolbar/ToolbarActionTypes.SET_DROP_DOWN`,
        val
      )
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
