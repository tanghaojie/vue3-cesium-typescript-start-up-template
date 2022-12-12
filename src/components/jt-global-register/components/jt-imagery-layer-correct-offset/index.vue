<template>
  <jtDraggableResizable
    v-model="imageryCorrectOffsetShow"
    :resizable="false"
    :w="280"
    :h="'auto'"
    :initialPosition="'tr'"
    class="pointer-events-auto"
  >
    <template v-slot:title>
      {{ t('jtImageryCorrectOffset.title', '偏移纠正') }}
    </template>
    <div class="w-full bg-gray-800 bg-opacity-70">
      <div class="w-full flex flex-col px-8 rounded-lg" @click.stop>
        <div class="my-0">
          <el-checkbox-group v-model="imageryOffset.checked" @change="correctOffsetChange">
            <el-checkbox
              v-for="item in imageryOffset.imageryList"
              :key="item.index"
              :label="item.index"
              :disabled="item.correctOffset === undefined"
            >
              {{
                item.name +
                (item.correctOffset === undefined
                  ? t('jtImageryCorrectOffset.notNeed', '(无须纠正)')
                  : '')
              }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
    </div>
  </jtDraggableResizable>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, ref, inject, watch, onMounted } from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { CheckboxValueType, ElCheckbox, ElCheckboxGroup } from 'element-plus'
import { useStore } from '@/store'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import { useI18n } from 'vue-i18n'

type ImageryOffset = {
  checked: number[]
  imageryList: ImageryOffsetItem[]
}

type ImageryOffsetItem = {
  name: string
  correctOffset?: boolean
  index: number
}

export default defineComponent({
  name: 'jt-imagery-layer-correct-offset',
  components: { ElCheckbox, ElCheckboxGroup, jtDraggableResizable },
  setup() {
    const store = useStore()
    const imageryOffset = reactive<ImageryOffset>({
      checked: [],
      imageryList: [],
    })

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
          imageryOffset.checked.push(data.index)
        }
      })
    }

    const correctOffsetChange = (checked: CheckboxValueType[]): void => {
      imageryOffset.imageryList.forEach((item) => {
        if (item.correctOffset === undefined) {
          return
        }
        const old = item.correctOffset.valueOf()
        // both old and checked find is true, or false
        if (
          (old && checked.find((x) => x === item.index)) ||
          (!old && !checked.find((x) => x === item.index))
        ) {
          return
        }
        const layer = (cesiumRef || {}).viewer?.jt?.imageryManager.getLayer(item.index)
        if (!layer) {
          return
        }
        layer.coordinateTransform && (layer.coordinateTransform.correctOffset = !old)
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

    const { t } = useI18n()

    return {
      imageryCorrectOffsetShow,
      imageryOffset,
      syncUIList,
      correctOffsetChange,
      t,
    }
  },
})
</script>
