<template>
  <div ref="el" class="tool-bar-group-item">
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
import {
  defineComponent,
  PropType,
  computed,
  ref,
  inject,
  onMounted,
} from 'vue'
import { CesiumRef } from '@/@types/shims-cesium-ref'
import { mapActions, useStore } from 'vuex'

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
  setup(props) {
    const el = ref<HTMLElement | null>(null)
    const icon = ref<HTMLElement | null>(null)

    const active = computed((): boolean => {
      const { item } = props
      return !!item.active && item.active()
    })

    const dropdown = computed(() => {
      return Store.state.jtCesiumVue.toolbar.dropdown
    })

    const dropdownActive = computed((): boolean => {
      const { item } = props
      if (item.dropdown) {
        return dropdown.value.componentName === item.dropdown.componentName
      }
      return false
    })

    const dropdownVisible = computed((): boolean => {
      const { item } = props
      return !!item.dropdown
    })

    const cesiumRef = inject<CesiumRef>('cesiumRef')

    const itemClicked = () => {
      const { item } = props
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      const option: ClickHandlerOption = {
        viewer: viewer,
        item: item,
      }
      const result = item.clickHandler && item.clickHandler(option)
      item.clickHandlerResult = result
    }

    const dropdownClicked = () => {
      const { item } = props
      if (!item || !item.dropdown) {
        return
      }
      const left = (el.value! as HTMLElement).offsetLeft
      const val: DropdownState = {
        ...dropdown.value,
        show: true,
        left,
        componentName: item.dropdown.componentName,
        iconEl: icon.value! as HTMLElement,
      }
      Store.dispatch(
        `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_DROP_DOWN}`,
        val
      )
    }

    onMounted(() => {
      const { item } = props
      const { viewer } = cesiumRef || {}
      const option: OnMountedOption = {
        viewer: viewer,
        iconEl: icon.value as HTMLElement,
      }
      item.onMounted && item.onMounted(option)
    })

    return {
      el,
      icon,
      active,
      dropdown,
      dropdownActive,
      dropdownVisible,
      itemClicked,
      dropdownClicked,
    }
  },
})
</script>
