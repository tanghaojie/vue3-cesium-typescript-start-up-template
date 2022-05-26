<template>
  <div ref="el">
    <div class="flex justify-center items-center mx-1 px-2">
      <div
        @click="itemClicked"
        class="flex flex-col justify-center items-center cursor-pointer hover:text-blue-400"
        :class="active ? 'text-blue-400' : ''"
      >
        <div ref="icon" class="text-4xl">
          <jt-icon :name="item.icon" />
        </div>
        <div class="text-sm text-white select-none">
          <slot></slot>
        </div>
      </div>

      <div
        v-if="dropdownVisible"
        :class="dropdownActive ? 'text-blue-400' : ''"
        @click.stop="dropdownClicked"
        class="flex justify-center items-center ml-2 h-full hover:text-blue-400"
      >
        <jt-icon name="arrow-down" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, shallowRef, inject, onMounted } from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { mapActions } from 'vuex'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'
import type { DropdownState } from '@/store/modules/jt-cesium-vue/modules/toolbar/state'
import type {
  Item,
  Content,
  Group,
  ActiveOption,
  ClickHandlerOption,
  OnMounted,
  OnMountedOption,
} from '@/components/jt-toolbar/config/contents/Types'

export default defineComponent({
  name: 'jt-item',
  props: {
    item: {
      type: Object as PropType<Item>,
      required: true,
    },
  },
  setup(props) {
    const store = useStore()
    const router = useRouter()
    const el = shallowRef<HTMLElement | null>(null)
    const icon = shallowRef<HTMLElement | null>(null)

    const active = computed((): boolean => {
      const { item } = props
      const option: ActiveOption = {
        store,
      }
      return !!item.active && item.active(option)
    })

    const dropdown = computed(() => {
      return store.state.jtCesiumVue.toolbar.dropdown
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
      return item.dropdownOnClick ? false : !!item.dropdown
    })

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

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
      store.dispatch(`jtCesiumVue/toolbar/${ToolbarActionTypes.SET_DROP_DOWN}`, val)
    }

    const itemClicked = (e: MouseEvent) => {
      const { item } = props
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      if (item.dropdownOnClick) {
        dropdownClicked()
        e.stopPropagation()
        return
      }
      const option: ClickHandlerOption = {
        viewer: viewer,
        item: item,
        store,
        router,
      }
      const result = item.clickHandler && item.clickHandler(option)
      item.clickHandlerResult = result
    }

    onMounted(() => {
      const { item } = props
      const { viewer } = cesiumRef || {}
      const option: OnMountedOption = {
        viewer: viewer,
        iconEl: icon.value as HTMLElement,
        store,
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
