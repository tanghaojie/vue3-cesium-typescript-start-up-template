<template>
  <div>
    <div class="pb-4">
      <div class="text-lg text-white flex flex-row">
        <div class="flex-1">
          {{ t('browserPanel.imagery.imageryManage', '影像管理') }}
        </div>
        <div class="flex flex-row flex-grow-0 flex-shrink-0">
          <div class="cursor-pointer" @click="plusImageries">
            <el-icon><circle-plus /></el-icon>
          </div>
          <div class="cursor-pointer ml-3" @click="syncUIList">
            <el-icon><refresh /></el-icon>
          </div>
        </div>
      </div>

      <div>
        <div
          v-for="(imagery, index) in imageries"
          :key="index"
          class="flex flex-row justify-center items-center text-white py-2 select-none"
        >
          <el-checkbox
            :size="'default'"
            v-model="imagery.show"
            @change="(checked) => changeImageryShow(index, checked)"
          >
          </el-checkbox>
          <div class="mx-3 flex-1 cursor-default" :class="imagery.show ? '' : 'text-gray-400'">
            {{ imagery.name }}
          </div>
          <div class="cursor-pointer" @click="settingImagery(index)">
            <el-icon><setting /></el-icon>
          </div>
          <div class="cursor-pointer ml-2" @click="removeImagery(index)">
            <el-icon><close /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <imageryLayerOperate
      :a="imageryLayerOperate.props.alpha"
      :b="imageryLayerOperate.props.brightness"
      :c="imageryLayerOperate.props.contrast"
      :h="imageryLayerOperate.props.hue"
      :s="imageryLayerOperate.props.saturation"
      :imageryLayerName="imageryLayerOperate.imageryLayerName"
      v-model="imageryLayerOperate.dialogVisible"
      @propertyChange="imageryLayerPropertyChange"
    />

    <imagerySelect
      :imagerySources="imagerySources"
      v-model="addImageryDialogVisible"
      @imagerySourceSelected="addImagery"
    >
    </imagerySelect>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  reactive,
  shallowReactive,
  ref,
  inject,
  computed,
  onMounted,
  watch,
} from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { ElIcon, ElCheckbox, ElDialog } from 'element-plus'
import { CirclePlus, Refresh, Setting, Close } from '@element-plus/icons-vue'
import imageryLayerOperate from './imagery-layer-operate.vue'
import imagerySelect from './imagery-select.vue'
import * as Cesium from 'cesium'
import overlay from '@/components/jt-overlay/index.vue'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import { ImagerySource, Imagery } from '@/libs/cesium/libs/imagery-manager/ImageryManager'
import imagerySourcesList from '@/libs/cesium/libs/imagery-manager/imagery-sources'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'ImageryManager',
  components: {
    ElIcon,
    ElCheckbox,
    ElDialog,
    CirclePlus,
    Refresh,
    Setting,
    Close,
    imageryLayerOperate,
    imagerySelect,
    overlay,
    jtDraggableResizable,
  },
  setup() {
    const imageries: Imagery[] = reactive([])

    const imagerySources: (ImagerySource | ImagerySource[])[] = shallowReactive(imagerySourcesList)

    const addImageryDialogVisible = ref(false)

    const imageryLayerOperate = reactive({
      dialogVisible: false,
      props: {
        alpha: 0,
        brightness: 0,
        contrast: 0,
        hue: 0,
        saturation: 0,
      },
      imageryLayerName: '',
      index: -1,
    })

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const syncUIList = (): void => {
      imageries.splice(0, imageries.length)
      const igs = (cesiumRef || {}).viewer?.jt?.imageryManager.syncImageries()
      igs && imageries.push(...igs)
    }

    const changeImageryShow = (index: number, show: boolean | string | number): void => {
      const viewer = (cesiumRef || {}).viewer
      const layer = viewer?.jt?.imageryManager.getLayer(index)
      if (!viewer || !layer) {
        return
      }

      viewer.jt!.imageryManager.imageries[index].show = layer.show = !!show
    }

    const plusImageries = (): void => {
      addImageryDialogVisible.value = true
    }

    const addImagery = (item: ImagerySource): Cesium.ImageryLayer | undefined => {
      const layer = (cesiumRef || {}).viewer?.jt?.imageryManager.addImagery(item)
      syncUIList()
      return layer
    }

    const removeImagery = (index: number): void => {
      ;(cesiumRef || {}).viewer?.jt?.imageryManager?.removeLayer(index)
      syncUIList()
    }

    const settingImagery = (index: number): void => {
      const layer = (cesiumRef || {}).viewer?.jt?.imageryManager.getLayer(index)
      if (!layer) {
        return
      }
      imageryLayerOperate.index = index
      imageryLayerOperate.props.alpha = layer.alpha
      imageryLayerOperate.props.brightness = layer.brightness
      imageryLayerOperate.props.contrast = layer.contrast
      imageryLayerOperate.props.hue = layer.hue
      imageryLayerOperate.props.saturation = layer.saturation
      imageryLayerOperate.imageryLayerName = layer.name
      imageryLayerOperate.dialogVisible = true
    }

    const init = (): void => {
      ;(cesiumRef || {}).viewer?.jt?.imageryManager.removeAll()
      const im = (cesiumRef || {}).viewer?.jt?.imageryManager
      if (!im) {
        return
      }
      // const tiandituSatellite = im.addImagery(
      //   (imagerySources[0] as ImagerySource[])[0]
      // )

      // const tiandituLabel = im.addImagery(
      //   (imagerySources[0] as ImagerySource[])[1]
      // )

      const amapSatellite = im.addImagery((imagerySources[1] as ImagerySource[])[0])

      const amapLabel = im.addImagery((imagerySources[1] as ImagerySource[])[1])

      // const googleSatellite = im.addImagery(
      //   (imagerySources[2] as ImagerySource[])[0]
      // )

      syncUIList()
    }

    const imageryLayerPropertyChange = (key: string, val: number): void => {
      const layer = (cesiumRef || {}).viewer?.jt?.imageryManager.getLayer(imageryLayerOperate.index)
      if (!layer) {
        return
      }
      ;(layer as any)[key] = val
    }

    watch(
      () => imageryLayerOperate.dialogVisible,
      (val) => {
        if (!val) {
          imageryLayerOperate.index = -1
        }
      }
    )

    const { t } = useI18n()

    onMounted(() => {
      init()
    })

    return {
      imageries,
      imagerySources,
      addImageryDialogVisible,
      imageryLayerOperate,

      syncUIList,
      changeImageryShow,
      plusImageries,
      addImagery,
      removeImagery,
      settingImagery,
      init,
      imageryLayerPropertyChange,
      t,
    }
  },
})
</script>
