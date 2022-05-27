<template>
  <div>
    <div class="pb-4">
      <div class="text-lg text-white flex flex-row">
        <div class="flex-1">
          {{ t('browserPanel.primitive.primitiveManage', '模型管理') }}
        </div>
        <div class="flex flex-row flex-grow-0 flex-shrink-0">
          <div class="plus cursor-pointer" @click="showAdd3DTilesetDialog">
            <el-icon><circle-plus /></el-icon>
          </div>
          <div class="cursor-pointer ml-3" @click="syncJTPrimitive">
            <el-icon><refresh /></el-icon>
          </div>
        </div>
      </div>
      <div>
        <div
          v-for="(jPri, index) in jtPrimitives"
          :key="index"
          class="flex flex-row justify-center items-center text-white py-2 select-none"
        >
          <el-checkbox
            :size="'default'"
            v-model="jPri.show"
            @change="(checked:any) => changePrimitiveVisible(index, checked)"
          >
          </el-checkbox>
          <div
            class="mx-3 flex-1 cursor-default"
            :class="jPri.show ? '' : 'text-gray-400'"
            @dblclick="primitiveNameDoubleClick(index)"
          >
            {{ jPri.name }}
          </div>
          <div class="cursor-default" @click="removePrimitive(index)">
            <el-icon><close /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="add3DTilesetDialog.dialogVisible"
      :title="add3DTilsetDialogTitle"
      destroyOnClose
      @close="add3DTilsetDialogClose"
    >
      <div>
        <div>
          {{ t('browserPanel.primitive.addPrimitiveName', '名称') }}:
          <el-input v-model="add3DTilesetDialog.name"> </el-input>
        </div>
        <div class="mt-4">
          Url:
          <el-input v-model="add3DTilesetDialog.url"> </el-input>
        </div>
      </div>
      <el-button class="mt-4" type="primary" @click="add3DTilsetConfirm">
        {{ t('browserPanel.primitive.confirm', '确定') }}</el-button
      >
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, inject, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from '@/store'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import * as Cesium from 'cesium'
import { ElIcon, ElCheckbox, ElDialog, ElInput, ElButton } from 'element-plus'
import { CirclePlus, Refresh, Close } from '@element-plus/icons-vue'
import calculatePrimitiveCenter from '@/libs/cesium/libs/calculate-primitive-center'
import sampleData from '@/resources/sample-data'
import UrlQuery from '@/utils/url-query'
import {
  calculate3DTilesetTransform,
  transform,
  change3DTilesetHeight,
} from '@/libs/cesium/libs/transform'
import { JTPrimitiveActionTypes } from '@/store/modules/jt-cesium-vue/modules/cesium-data/modules/jt-primitive/action-types'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'PrimitiveManager',
  components: {
    ElIcon,
    ElCheckbox,
    ElDialog,
    ElInput,
    ElButton,
    CirclePlus,
    Refresh,
    Close,
  },
  props: {
    inManagedPrimitiveOnly: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const store = useStore()
    const route = useRoute()
    const add3DTilesetDialog = reactive({
      dialogVisible: false,
      name: '',
      url: '',
    })

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const jtPrimitives = computed(() => {
      return store.state.jtCesiumVue.cesiumData.jtPrimitive.jtPrimitives
    })

    const syncJTPrimitive = (): void => {
      store.dispatch(
        `jtCesiumVue/cesiumData/jtPrimitive/${JTPrimitiveActionTypes.SYNC_JTPRIMITIVES}`,
        cesiumRef?.viewer
      )
    }

    const changePrimitiveVisible = (index: number, show: boolean): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }

      jtPrimitives.value[index].show = viewer.scene.primitives.get(
        jtPrimitives.value[index].cesiumPrimitiveIndex
      ).show = show
    }

    const showAdd3DTilesetDialog = (): void => {
      add3DTilesetDialog.dialogVisible = true
    }

    const add3DTilsetConfirm = (): void => {
      add3DTileset({
        name: add3DTilesetDialog.name,
        url: add3DTilesetDialog.url,
      })

      add3DTilesetDialog.dialogVisible = false
      add3DTilesetDialog.name = ''
      add3DTilesetDialog.url = ''
    }

    const add3DTilsetDialogClose = (): void => {
      add3DTilesetDialog.dialogVisible = false
      add3DTilesetDialog.name = ''
      add3DTilesetDialog.url = ''
    }

    const add3DTileset = (option: any): Cesium.Cesium3DTileset | undefined => {
      const c3Dtileset = (cesiumRef || {}).viewer?.jt?.primitiveManager.add3DTileset(option)

      syncJTPrimitive()
      return c3Dtileset
    }

    const addGltf = (option: any): void => {
      const gltf = (cesiumRef || {}).viewer?.jt?.primitiveManager.addGltf(option)
      syncJTPrimitive()
    }

    const removePrimitive = (index: number): void => {
      ;(cesiumRef || {}).viewer?.jt?.primitiveManager.removePrimitive(index)
      syncJTPrimitive()
    }

    const primitiveNameDoubleClick = (index: number): void => {
      const pri = (cesiumRef || {}).viewer?.jt?.primitiveManager.getPrimitiveByJTPrimitiveIndex(
        index
      )
      const location = calculatePrimitiveCenter(pri)

      ;(cesiumRef || {}).viewer?.camera.flyTo({
        duration: 1,
        destination: Cesium.Cartesian3.fromDegrees(
          location.longitude,
          location.latitude - 0.001,
          location.height + 500
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-78),
          roll: 0.0,
        },
      })
    }

    const init = (): void => {
      ;(cesiumRef || {}).viewer?.jt?.primitiveManager.removeAll()

      if (route.query[UrlQuery.DemoMode]) {
        initDemoMode()
      } else {
        initDefaultData()
      }
    }

    const initDemoMode = (): void => {
      const pm = (cesiumRef || {}).viewer?.jt?.primitiveManager
      if (!pm) {
        return
      }
      const w = pm.add3DTileset({
        name: '白水寺',
        url: 'https://tanghaojie.dynv6.net:60450/GisData/models/wenwu/BaiShuiSi_3dt/tileset.json',
        show: true,
      })
      change3DTilesetHeight(w as Cesium.Cesium3DTileset, -422)

      const r = pm.add3DTileset({
        name: '清音溪摩崖造像',
        url: 'https://tanghaojie.dynv6.net:60450/GisData/models/wenwu/QingYinXiMoYaZaoXiang_3dt/tileset.json',
        show: true,
      })
      change3DTilesetHeight(r as Cesium.Cesium3DTileset, -557)

      syncJTPrimitive()
    }

    const initDefaultData = (): void => {
      const pm = (cesiumRef || {}).viewer?.jt?.primitiveManager
      if (!pm) {
        return
      }
      pm.addGltf({
        name: '精模',
        url: sampleData.rc,
        modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(
          Cesium.Cartesian3.fromDegrees(103.6144, 30.95525207451468, 0.0),
          new Cesium.HeadingPitchRoll(Cesium.Math.PI_OVER_TWO, 0, 0)
        ),
        show: false,
      })

      pm.add3DTileset({
        name: 'iPad Pro Lidar(point cloud)',
        url: sampleData['my-home'],
        show: false,
      })

      pm.add3DTileset({
        name: '成都建筑群',
        url: sampleData['cd-buildings'],
        show: false,
        // debugColorizeTiles: true,
        // debugWireframe: true,
        // debugShowBoundingVolume: true,
        // debugShowGeometricError: true,
        // debugShowContentBoundingVolume: true,
        // debugShowViewerRequestVolume: true,
        // debugShowMemoryUsage: true,
      })

      const w = pm.add3DTileset({
        name: '简模001',
        url: sampleData['shp-factory'],
      })
      change3DTilesetHeight(w as Cesium.Cesium3DTileset, -673)

      const e = pm.add3DTileset({
        name: '简模002',
        url: sampleData.apartment,
      })
      change3DTilesetHeight(e as Cesium.Cesium3DTileset, -670)

      syncJTPrimitive()
    }

    onMounted(() => {
      init()
    })

    const { t } = useI18n()

    const add3DTilsetDialogTitle = computed(() => {
      return t('browserPanel.primitive.add3DTilePrimitive', '添加 3D Tileset 模型')
    })

    return {
      jtPrimitives,
      add3DTilesetDialog,
      syncJTPrimitive,
      changePrimitiveVisible,
      showAdd3DTilesetDialog,
      add3DTilsetConfirm,
      add3DTilsetDialogClose,
      add3DTileset,
      addGltf,
      removePrimitive,
      primitiveNameDoubleClick,
      init,
      initDefaultData,
      initDemoMode,
      t,
      add3DTilsetDialogTitle,
    }
  },
})
</script>
