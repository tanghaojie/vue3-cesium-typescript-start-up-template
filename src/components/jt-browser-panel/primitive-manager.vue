<template>
  <div>
    <div class="pb-4">
      <div class="text-lg text-white flex flex-row">
        <div class="flex-1">模型管理</div>
        <div class="flex flex-row flex-grow-0 flex-shrink-0">
          <div class="plus cursor-pointer" @click="showAdd3DTilesetDialog">
            <i class="el-icon-circle-plus-outline"></i>
          </div>
          <div class="cursor-pointer ml-3" @click="syncUIList">
            <i class="el-icon-refresh"></i>
          </div>
        </div>
      </div>
      <div>
        <div
          v-for="(primitive, index) in primitives"
          :key="index"
          class="
            flex flex-row
            justify-center
            items-center
            text-white
            py-2
            select-none
          "
        >
          <el-checkbox
            size="medium"
            v-model="primitive.show"
            @change="(checked, e) => changePrimitiveVisible(index, checked)"
          >
          </el-checkbox>
          <div
            class="mx-3 flex-1 cursor-default"
            :class="primitive.show ? '' : 'text-gray-400'"
            @dblclick="primitiveNameDoubleClick(index)"
          >
            {{ primitive.name }}
          </div>
          <div class="cursor-default" @click="removePrimitive(index)">
            <i class="el-icon-close"></i>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="add3DTilesetDialog.dialogVisible"
      title="添加 3D Tileset 模型"
      destroyOnClose
      @close="add3DTilsetDialogClose"
    >
      <div>
        <div>
          名称：
          <el-input v-model="add3DTilesetDialog.name"> </el-input>
        </div>
        <div class="mt-4">
          Url:
          <el-input v-model="add3DTilesetDialog.url"> </el-input>
        </div>
      </div>
      <el-button class="mt-4" type="primary" @click="add3DTilsetConfirm"
        >确定</el-button
      >
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, inject, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import * as Cesium from 'cesium'
import { ElIcon, ElCheckbox, ElDialog, ElInput, ElButton } from 'element-plus'
import calculatePrimitiveCenter from '@/libs/cesium/libs/calculate-primitive-center'
import sampleData from '@/resources/sample-data'
import {
  PRIMITIVE_MANAGER_FLAG_VALUE,
  PRIMITIVE_MANAGER_FLAG_KEY,
} from './common'
import uuid from '@/libs/utils/uuid'
import UrlQuery from '@/utils/url-query'
import {
  calculate3DTilesetTransform,
  transform,
  change3DTilesetHeight,
} from '@/libs/cesium/libs/transform'
import { Primitive } from '@/libs/cesium/libs/primitive-manager/PrimitiveManager'

export default defineComponent({
  name: '',
  components: { ElIcon, ElCheckbox, ElDialog, ElInput, ElButton },
  props: {
    inManagedPrimitiveOnly: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const primitives = reactive<Primitive[]>([])
    const add3DTilesetDialog = reactive({
      dialogVisible: false,
      name: '',
      url: '',
    })

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const route = useRoute()

    const syncUIList = (): void => {
      primitives.splice(0, primitives.length)
      const pris = (
        cesiumRef || {}
      ).viewer?.jt?.primitiveManager.syncPrimitives(
        props.inManagedPrimitiveOnly
      )
      pris && primitives.push(...pris)
    }

    const changePrimitiveVisible = (index: number, show: boolean): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }

      primitives[index].show = viewer.scene.primitives.get(
        primitives[index].cesiumPrimitiveIndex
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

    const add3DTileset = (option: any): any => {
      const c3DtilesetObj = (
        cesiumRef || {}
      ).viewer?.jt?.primitiveManager.add3DTileset(option)

      syncUIList()
      return c3DtilesetObj
    }

    const addGltf = (option: any): void => {
      const gltfObj = (cesiumRef || {}).viewer?.jt?.primitiveManager.addGltf(
        option
      )
      syncUIList()
    }

    const removePrimitive = (index: number): void => {
      ;(cesiumRef || {}).viewer?.jt?.primitiveManager.removePrimitive(index)
      syncUIList()
    }

    const primitiveNameDoubleClick = (index: number): void => {
      const pri = (cesiumRef || {}).viewer?.jt?.primitiveManager.getPrimitive(
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

    // const getPrimitiveIndex = (url: string): number => {
    //   syncUIList()
    //   const { viewer } = cesiumRef || {}
    //   if (!viewer) {
    //     return -1
    //   }
    //   const pris = viewer.scene.primitives
    //   const len = primitives.length
    //   for (let i = 0; i < len; i++) {
    //     const model = pris.get(primitives[i].cesiumPrimitiveIndex)
    //     if (url === model._url || model.basePath) {
    //       return i
    //     }
    //   }
    //   return -1
    // }

    const init = (): void => {
      ;(cesiumRef || {}).viewer?.jt?.primitiveManager.removeAll()

      if (route.query[UrlQuery.DemoMode]) {
        initDemoMode()
      } else {
        initDefaultData()
      }

      initQuery()
    }

    const initDemoMode = (): void => {
      const pm = (cesiumRef || {}).viewer?.jt?.primitiveManager
      if (!pm) {
        return
      }
      const w = pm.add3DTileset({
        name: '白水寺',
        url: 'http://tanghaojie.dynv6.net:60090/GisData/models/wenwu/BaiShuiSi_3dt/tileset.json',
        show: true,
      })
      change3DTilesetHeight(w as Cesium.Cesium3DTileset, -422)

      // const e = pm.add3DTileset({
      //   name: '永利桥',
      //   url: 'http://tanghaojie.dynv6.net:60090/GisData/models/wenwu/YongLiQiao_3dt/tileset.json',
      //   show: true,
      // })
      // change3DTilesetHeight(e as Cesium.Cesium3DTileset, -487)

      // const q = pm.add3DTileset({
      //   name: '刘氏宗祠',
      //   url: 'http://tanghaojie.dynv6.net:60090/GisData/models/wenwu/LiuShiZongCi_3dt/tileset.json',
      //   show: true,
      // })
      // change3DTilesetHeight(q as Cesium.Cesium3DTileset, -426)

      // const a = pm.add3DTileset({
      //   name: '五凤关圣宫',
      //   url: 'http://tanghaojie.dynv6.net:60090/GisData/models/wenwu/WuFengGuanShengGong_3dt/tileset.json',
      //   show: true,
      // })
      // change3DTilesetHeight(a as Cesium.Cesium3DTileset, -325)

      const r = pm.add3DTileset({
        name: '清音溪摩崖造像',
        url: 'http://tanghaojie.dynv6.net:60090/GisData/models/wenwu/QingYinXiMoYaZaoXiang_3dt/tileset.json',
        show: true,
      })
      change3DTilesetHeight(r as Cesium.Cesium3DTileset, -557)

      syncUIList()
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

      syncUIList()
    }

    const initQuery = (): void => {
      const tile3DUrl = route.query[UrlQuery.Addition3DTile]
      if (tile3DUrl) {
        add3DTileset({
          url: tile3DUrl,
          show: true,
        })

        const flyToTile3D = route.query[UrlQuery.FlyToAddition3DTile]
        if (flyToTile3D && tile3DUrl) {
          syncUIList()
          const { viewer } = cesiumRef || {}
          if (!viewer) {
            return
          }
          const pris = viewer.scene.primitives
          const len = primitives.length
          for (let i = 0; i < len; i++) {
            const model = pris.get(primitives[i].cesiumPrimitiveIndex)
            if (tile3DUrl === model._url || model.basePath) {
              if (model.readyPromise) {
                model.readyPromise.then((pri: any) => {
                  const location = calculatePrimitiveCenter(pri)
                  viewer.camera.flyTo({
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
                })
              }
              return
            }
          }
          return
        }
      }
    }

    onMounted(() => {
      init()
    })

    return {
      primitives,
      add3DTilesetDialog,

      syncUIList,
      changePrimitiveVisible,
      showAdd3DTilesetDialog,
      add3DTilsetConfirm,
      add3DTilsetDialogClose,
      add3DTileset,
      addGltf,
      removePrimitive,
      primitiveNameDoubleClick,
      init,
      initQuery,
      initDefaultData,
      initDemoMode,
      // getPrimitiveIndex,
    }
  },
})
</script>
