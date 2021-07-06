<template>
  <div class="tool-bar-group-item">
    <div class="item flex justify-center items-center mx-1 px-2">
      <div
        @click="itemClicked"
        class="
          item-container
          flex flex-col
          justify-center
          items-center
          cursor-pointer
          hover:text-blue-400
        "
        :class="active ? 'text-blue-400' : ''"
      >
        <div ref="icon" class="icon text-4xl">
          <jt-icon :name="item.icon" />
        </div>
        <div class="name text-sm text-white">
          <slot></slot>
        </div>
      </div>

      <div
        v-if="dropdownVisible"
        :class="dropdownActive ? 'text-blue-400' : ''"
        @click.stop="dropdownClicked"
        class="
          dropdown
          flex
          justify-center
          items-center
          ml-2
          h-full
          hover:text-blue-400
        "
      >
        <jt-icon name="arrow-down" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { mapActions } from 'vuex'

import Store from '@/store'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'
import type { DropdownState } from '@/store/modules/jt-cesium-vue/modules/toolbar/state'
import type {
  Item,
  Content,
  Group,
  ClickHandlerOption,
  OnMounted,
  OnMountedOption,
} from '@/components/jt-cesium-vue/toolbar/config/contents/Types'

export default defineComponent({
  name: '',
  props: {
    item: {
      type: Object as PropType<Item>,
      required: true,
    },
  },
  computed: {
    active(): boolean {
      const { item } = this
      return !!item.active && item.active()
    },

    dropdown() {
      return Store.state.jtCesiumVue.toolbar.dropdown
    },

    dropdownActive(): boolean {
      const { item, dropdown } = this
      if (item.dropdown) {
        return dropdown.componentName === item.dropdown.componentName
      }
      return false
    },

    dropdownVisible(): boolean {
      const { item } = this
      return !!item.dropdown
    },
  },
  mounted() {
    const { item } = this
    const option: OnMountedOption = {
      viewer: this.$cv.viewer,
      iconEl: this.$refs.icon as HTMLElement,
    }
    item.onMounted && item.onMounted(option)
  },
  methods: {
    itemClicked() {
      const { item } = this
      const option: ClickHandlerOption = {
        viewer: this.$cv.viewer,
        item: item,
      }
      const result = item.clickHandler && item.clickHandler(option)
      item.clickHandlerResult = result
    },

    dropdownClicked() {
      const { item, $el, dropdown } = this
      if (!item || !item.dropdown) {
        return
      }
      const left = $el.offsetLeft
      const val: DropdownState = {
        ...dropdown,
        show: true,
        left,
        componentName: item.dropdown.componentName,
        iconEl: this.$refs.icon as HTMLElement,
      }
      this[ToolbarActionTypes.SET_DROP_DOWN](val)
    },

    ...mapActions('jtCesiumVue/toolbar', [ToolbarActionTypes.SET_DROP_DOWN]),
  },
})
</script>
