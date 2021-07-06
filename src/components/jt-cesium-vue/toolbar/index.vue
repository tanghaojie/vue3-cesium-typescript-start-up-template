<template>
  <div
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
import { defineComponent } from 'vue'
import { mapActions } from 'vuex'

import store from '@/store'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'
import type { DropdownState } from '@/store/modules/jt-cesium-vue/modules/toolbar/state'

import toolbarConfig from './config'

import group from './components/group.vue'
import item from './components/item.vue'
import menus from './components/menus.vue'
import groups from './components/groups.vue'

// dropdown components
import cameraPercentageChangeRate from './dropdown/camera-percentage-change-rate/index.vue'
import earthSurfaceColorPicker from './dropdown/earth-surface-color-picker/index.vue'
import elevationContourSetting from './dropdown/elevation-contour-setting/index.vue'

export default defineComponent({
  name: '',
  components: {
    group,
    item,
    menus,
    groups,
    cameraPercentageChangeRate,
    earthSurfaceColorPicker,
    elevationContourSetting,
  },
  props: {},
  data() {
    return {
      currentSelectIndex: 0,
    }
  },
  computed: {
    toolbarConfig() {
      return toolbarConfig
    },

    dropdown() {
      return store.state.jtCesiumVue.toolbar.dropdown
    },
  },
  mounted() {
    const val: DropdownState = {
      ...this.dropdown,
      top: this.$el.offsetHeight,
    }
    this[ToolbarActionTypes.SET_DROP_DOWN](val)
  },
  methods: {
    selectChange(val: number) {
      this.currentSelectIndex = val
    },

    clearDropdown() {
      const val: DropdownState = {
        ...this.dropdown,
        show: false,
        componentName: '',
        iconEl: undefined,
      }
      this[ToolbarActionTypes.SET_DROP_DOWN](val)
    },

    ...mapActions('jtCesiumVue/toolbar', [ToolbarActionTypes.SET_DROP_DOWN]),
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
