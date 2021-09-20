<template>
  <div>
    <div class="pb-4">
      <div class="text-lg text-white flex flex-row">
        <div class="flex-1">模型管理</div>
        <div class="flex flex-row flex-grow-0 flex-shrink-0">
          <div class="plus cursor-pointer" @click="showAdd3DTilesetDialog">
            <i class="el-icon-circle-plus-outline"></i>
          </div>
          <div class="cursor-pointer ml-3" @click="syncPrimitives">
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

type Primitive = {
  name: string
  uuid: string
  show: boolean
  cesiumPrimitiveIndex: number
}

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

    const syncPrimitives = (): void => {
      primitives.splice(0, primitives.length)
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      const pris = viewer.scene.primitives
      const len = pris.length
      for (let i = len - 1; i >= 0; --i) {
        const model = pris.get(i)
        const flag = model[PRIMITIVE_MANAGER_FLAG_KEY]
        if (
          props.inManagedPrimitiveOnly &&
          flag !== PRIMITIVE_MANAGER_FLAG_VALUE
        ) {
          continue
        }
        primitives.push({
          name: model.name || '<NoneName>',
          uuid: model.uuid || '<NoneUuid>',
          show: model.show,
          cesiumPrimitiveIndex: i,
        })
      }
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
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }

      const c3Dtileset = new Cesium.Cesium3DTileset({
        ...option,
      })

      const c3DtilesetObj = c3Dtileset as any
      c3DtilesetObj[PRIMITIVE_MANAGER_FLAG_KEY] = PRIMITIVE_MANAGER_FLAG_VALUE
      c3DtilesetObj.name = option.name
      c3DtilesetObj.uuid = uuid()
      c3Dtileset.show = option.show

      viewer.scene.primitives.add(c3Dtileset)
      syncPrimitives()

      return c3DtilesetObj
    }

    const addGltf = (option: any): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }

      const gltf = Cesium.Model.fromGltf({
        ...option,
      })
      const gltfObj = gltf as any
      gltfObj[PRIMITIVE_MANAGER_FLAG_KEY] = PRIMITIVE_MANAGER_FLAG_VALUE
      gltfObj.name = option.name
      gltfObj.uuid = uuid()
      gltf.show = option.show
      viewer.scene.primitives.add(gltf)
      syncPrimitives()
    }

    const removePrimitive = (index: number): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }

      const ps = viewer.scene.primitives
      const pri = ps.get(primitives[index].cesiumPrimitiveIndex)
      ps.remove(pri)
      syncPrimitives()
    }

    const primitiveNameDoubleClick = (index: number): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      const ps = viewer.scene.primitives
      const pri = ps.get(primitives[index].cesiumPrimitiveIndex)
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
    }

    const getPrimitiveIndex = (url: string): number => {
      syncPrimitives()
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return -1
      }
      const pris = viewer.scene.primitives
      const len = primitives.length
      for (let i = 0; i < len; i++) {
        const model = pris.get(primitives[i].cesiumPrimitiveIndex)
        if (url === model._url || model.basePath) {
          return i
        }
      }
      return -1
    }

    const init = (): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }

      viewer.scene.primitives.removeAll()

      if (route.query[UrlQuery.DemoMode]) {
        initDemoMode()
      } else {
        initDefaultData()
      }

      initQuery()
    }

    const initDemoMode = (): void => {
      const w = add3DTileset({
        name: '张家跳蹲桥',
        url: 'http://117.139.247.104:60090/GisData/models/ZhangJiaTiaoDunQiao/ZhangJiaTiaoDunQiao/tileset.json',
        show: true,
      })
      change3DTilesetHeight(w as Cesium.Cesium3DTileset, -516)

      const d = add3DTileset({
        name: '永寿桥',
        url: 'http://117.139.247.104:60090/GisData/models/yongshouqiao_3dtiles/tileset.json',
        show: true,
      })
      change3DTilesetHeight(d as Cesium.Cesium3DTileset, -494)

      const q = add3DTileset({
        name: '高家碉楼',
        url: 'http://117.139.247.104:60090/GisData/models/gaojiadiaolou_3dtiles/tileset.json',
        show: true,
      })
      change3DTilesetHeight(q as Cesium.Cesium3DTileset, -540.5)

      const a = add3DTileset({
        name: '杨世安墓',
        url: 'http://117.139.247.104:60090/GisData/models/YangShiAnMu/YangShiAnMu/tileset.json',
        show: true,
      })
      change3DTilesetHeight(a as Cesium.Cesium3DTileset, -568)
    }

    const initDefaultData = (): void => {
      addGltf({
        name: '精模(适配全球地形)',
        url: sampleData.rc,
        modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(
          Cesium.Cartesian3.fromDegrees(103.6144, 30.95525207451468, 665.0),
          new Cesium.HeadingPitchRoll(Cesium.Math.PI_OVER_TWO, 0, 0)
        ),
        show: false,
      })

      add3DTileset({
        name: 'iPad Pro Lidar(point cloud)',
        url: sampleData['my-home'],
        show: false,
      })

      add3DTileset({
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

      add3DTileset({
        name: '简模001(适配全球地形)',
        url: sampleData['shp-factory'],
      })

      add3DTileset({
        name: '简模002(适配全球地形)',
        url: sampleData.apartment,
      })
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
          syncPrimitives()
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

      syncPrimitives,
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
      getPrimitiveIndex,
    }
  },
})
</script>
