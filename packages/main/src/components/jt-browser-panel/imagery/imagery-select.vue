<template>
  <overlay :positionMode="'fixed'" :top="toolbarHeight" v-if="visible">
    <jtDraggableResizable
      v-model="visible"
      :resizable="false"
      :w="666"
      :h="450"
      :y="30"
      :initialPosition="'tm'"
      class="pointer-events-auto"
    >
      <template v-slot:title>
        {{ t('browserPanel.imagery.addImagery', '添加影像') }}
      </template>
      <div
        class="w-full p-3 flex flex-row flex-wrap bg-gray-800 bg-opacity-70"
        @click.stop
      >
        <div
          v-for="(imagerySource, index) in imagerySources"
          :key="index"
          :class="Array.isArray(imagerySource) ? 'mx-2' : 'mx-2 px-2 py-1 w-20'"
        >
          <div
            v-if="Array.isArray(imagerySource)"
            class="flex flex-row flex-wrap items-center"
          >
            <div
              v-for="(sub, index) in imagerySource"
              :key="index"
              class="px-2 py-1 w-20"
              @dblclick="imagerySourceDblClick(sub)"
            >
              <div
                class="w-16 h-16 overflow-hidden rounded-xl shadow-2xl border-solid border border-gray-200"
              >
                <img
                  :src="'./static/imgs/' + sub.iconImageUrl"
                  width="64"
                  height="64"
                  class="w-full h-full"
                />
              </div>
              <div
                class="font-sans h-14 text-center align-middle text-gray-200 text-sm"
              >
                {{ sub.name }}
              </div>
            </div>
          </div>
          <div v-else @dblclick="imagerySourceDblClick(imagerySource)">
            <div
              class="w-16 h-16 overflow-hidden rounded-xl shadow-2xl border-solid border border-gray-200"
            >
              <img
                :src="'./static/imgs/' + imagerySource.iconImageUrl"
                width="64"
                height="64"
                class="w-full h-full"
              />
            </div>
            <div
              class="font-sans h-14 text-center align-middle text-gray-200 text-sm"
            >
              {{ imagerySource.name }}
            </div>
          </div>
        </div>
      </div>
    </jtDraggableResizable>
  </overlay>
</template>

<script lang="ts">
const UPDATE_MODEL_EVENT = 'update:modelValue'
const IMAGERY_SOURCE_SELECTED = 'imagerySourceSelected'

import {
  defineComponent,
  ref,
  onMounted,
  computed,
  watch,
  watchEffect,
  PropType,
} from 'vue'
import { ElSlider } from 'element-plus'
import overlay from '@/components/jt-overlay/index.vue'
import { useStore } from '@/store'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import ImageryManager, {
  ImagerySource,
  Imagery,
} from '@/libs/cesium/libs/imagery-manager/ImageryManager'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'ImagerySelect',
  components: { ElSlider, overlay, jtDraggableResizable },
  props: {
    imagerySources: {
      type: Object as PropType<(ImagerySource | ImagerySource[])[]>,
      required: true,
    },
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, context) {
    const store = useStore()
    const visible = ref(props.modelValue)

    const imagerySourceDblClick = (imagerySource: ImagerySource): void => {
      context.emit(IMAGERY_SOURCE_SELECTED, imagerySource)
    }

    const toolbarHeight = computed((): string => {
      const h = store.state.jtCesiumVue.layout.toolbarHeight
      return `${h}px`
    })

    watch(
      () => props.modelValue,
      (val) => {
        visible.value = val
      }
    )

    watch(visible, (val) => {
      context.emit(UPDATE_MODEL_EVENT, val)
    })

    const { t } = useI18n()

    return {
      visible,
      imagerySourceDblClick,
      toolbarHeight,
      t,
    }
  },
  emits: {
    [UPDATE_MODEL_EVENT](val: boolean) {
      return true
    },

    [IMAGERY_SOURCE_SELECTED](imagerySource: ImagerySource) {
      return true
    },
  },
})
</script>
