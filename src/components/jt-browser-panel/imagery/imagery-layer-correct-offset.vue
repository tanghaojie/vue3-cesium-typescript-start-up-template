<template>
  <jt-main-area-dialog
    v-model="visible"
    :resizable="false"
    :w="280"
    :h="'auto'"
    :initialPosition="'tr'"
    :title="'偏移纠正'"
  >
    <div class="my-0">
      <el-checkbox-group
        v-model="imageryOffset.checked"
        @change="correctOffsetChange"
      >
        <el-checkbox
          v-for="item in imageryOffset.imageryList"
          :key="item.index"
          :label="item"
          :disabled="item.correctOffset === undefined"
        >
          {{
            item.name + (item.correctOffset === undefined ? '(无须纠正)' : '')
          }}
        </el-checkbox>
      </el-checkbox-group>
    </div>
  </jt-main-area-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  reactive,
  ref,
  inject,
  watch,
  onMounted,
} from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { ElCheckbox, ElCheckboxGroup } from 'element-plus'
import store from '@/store'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import {
  PROPERTY_CHANGE_EVENT,
  UPDATE_MODEL_EVENT,
} from '@/libs/utils/vue-const'

type ImageryOffset = {
  checked: ImageryOffsetItem[]
  imageryList: ImageryOffsetItem[]
}

type ImageryOffsetItem = {
  name: string
  correctOffset?: boolean
  index: number
}

export default defineComponent({
  name: 'imagery-layer-correct-offset',
  components: { ElCheckbox, ElCheckboxGroup, jtDraggableResizable },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, context) {
    const imageryOffset = reactive<ImageryOffset>({
      checked: [],
      imageryList: [],
    })
    const visible = ref(props.modelValue)

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const syncUIList = (): void => {
      imageryOffset.checked.splice(0, imageryOffset.imageryList.length)
      imageryOffset.imageryList.splice(0, imageryOffset.imageryList.length)
      const im = (cesiumRef || {}).viewer?.jt?.imageryManager
      if (!im) {
        return
      }
      const igs = im.syncImageries()
      igs.forEach((item, index) => {
        const co = im.getLayer(index).coordinateTransform?.correctOffset
        const data = {
          name: item.name,
          index,
          correctOffset: co,
        }
        imageryOffset.imageryList.push(data)
        if (co) {
          imageryOffset.checked.push(data)
        }
      })
    }

    const correctOffsetChange = (checked: ImageryOffsetItem[]): void => {
      imageryOffset.imageryList.forEach((item) => {
        if (item.correctOffset === undefined) {
          return
        }
        const old = item.correctOffset.valueOf()
        // both old and checked find is true, or false
        if (
          (old && checked.find((x) => x.index === item.index)) ||
          (!old && !checked.find((x) => x.index === item.index))
        ) {
          return
        }
        const layer = (cesiumRef || {}).viewer?.jt?.imageryManager.getLayer(
          item.index
        )
        if (!layer) {
          return
        }
        layer.coordinateTransform &&
          (layer.coordinateTransform.correctOffset = !old)
        if (layer.show) {
          layer.show = false
          setTimeout(() => {
            layer.show = true
          }, 20)
        }
      })
      syncUIList()
    }

    const imageryCorrectOffsetShow = computed({
      get(): boolean {
        return true
      },
      set(val: boolean): void {
        store.dispatch(
          `jtCesiumVue/layout/${LayoutActionTypes.REMOVE_OVERLAY_DYNAMIC_VIEW_BY_NAME}`,
          'jt-imagery-layer-correct-offset'
        )
      },
    })

    onMounted(() => {
      syncUIList()
    })

    return {
      imageryCorrectOffsetShow,
      imageryOffset,
      syncUIList,
      correctOffsetChange,
      visible,
    }
  },
  emits: {
    [PROPERTY_CHANGE_EVENT](key: string, val: number) {
      return true
    },

    [UPDATE_MODEL_EVENT](val: boolean) {
      return true
    },
  },
})
</script>
