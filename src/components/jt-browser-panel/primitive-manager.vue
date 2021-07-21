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
import { defineComponent } from 'vue'
import * as Cesium from 'cesium'
import { ElIcon, ElCheckbox, ElDialog, ElInput, ElButton } from 'element-plus'
import calculatePrimitiveCenter from '@/libs/cesium/libs/calculate-primitive-center'
import sampleData from '@/resources/sample-data'
import {
  PRIMITIVE_MANAGER_FLAG_VALUE,
  PRIMITIVE_MANAGER_FLAG_KEY,
} from './common'
import uuid from '@/libs/utils/uuid'

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
  data() {
    let primitives: Primitive[] = []
    return {
      primitives,
      add3DTilesetDialog: {
        dialogVisible: false,
        name: '',
        url: '',
      },
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {
    this.init()
  },
  setup() {},
  methods: {
    syncPrimitives(): void {
      this.primitives.splice(0, this.primitives.length)
      const { viewer } = this.$cv
      if (!viewer) {
        return
      }
      const pris = viewer.scene.primitives
      const len = pris.length
      for (let i = len - 1; i >= 0; --i) {
        const model = pris.get(i)
        const flag = model[PRIMITIVE_MANAGER_FLAG_KEY]
        if (
          this.inManagedPrimitiveOnly &&
          flag !== PRIMITIVE_MANAGER_FLAG_VALUE
        ) {
          continue
        }
        this.primitives.push({
          name: model.name || '<NoneName>',
          uuid: model.uuid || '<NoneUuid>',
          show: model.show,
          cesiumPrimitiveIndex: i,
        })
      }
    },

    changePrimitiveVisible(index: number, show: boolean): void {
      const { viewer } = this.$cv
      if (!viewer) {
        return
      }
      const { primitives } = this

      primitives[index].show = viewer.scene.primitives.get(
        primitives[index].cesiumPrimitiveIndex
      ).show = show
    },

    showAdd3DTilesetDialog(): void {
      this.add3DTilesetDialog.dialogVisible = true
    },

    add3DTilsetConfirm() {
      const { add3DTilesetDialog, add3DTileset } = this

      add3DTileset({
        name: add3DTilesetDialog.name,
        url: add3DTilesetDialog.url,
      })

      add3DTilesetDialog.dialogVisible = false
      add3DTilesetDialog.name = ''
      add3DTilesetDialog.url = ''
    },

    add3DTilsetDialogClose() {
      const { add3DTilesetDialog } = this
      add3DTilesetDialog.dialogVisible = false
      add3DTilesetDialog.name = ''
      add3DTilesetDialog.url = ''
    },

    add3DTileset(option: any): void {
      const { viewer } = this.$cv
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
      this.syncPrimitives()
    },

    addGltf(option: any): void {
      const { viewer } = this.$cv
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
      this.syncPrimitives()
    },

    removePrimitive(index: number): void {
      const { viewer } = this.$cv
      if (!viewer) {
        return
      }

      const primitives = viewer.scene.primitives
      const pri = primitives.get(this.primitives[index].cesiumPrimitiveIndex)
      primitives.remove(pri)
      this.syncPrimitives()
    },

    primitiveNameDoubleClick(index: number): void {
      const { viewer } = this.$cv
      if (!viewer) {
        return
      }
      const primitives = viewer.scene.primitives
      const pri = primitives.get(this.primitives[index].cesiumPrimitiveIndex)
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
    },

    init(): void {
      const { viewer } = this.$cv
      if (!viewer) {
        return
      }

      viewer.scene.primitives.removeAll()

      this.addGltf({
        name: '精模(适配全球地形)',
        url: sampleData.rc,
        modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(
          Cesium.Cartesian3.fromDegrees(103.6144, 30.95525207451468, 665.0),
          new Cesium.HeadingPitchRoll(Cesium.Math.PI_OVER_TWO, 0, 0)
        ),
        show: false,
      })

      // this.add3DTileset({
      //   name: '倾斜摄影模型',
      //   url: 'http://117.139.247.104:60001/models/3dtiles/yingxiu/tileset.json',
      //   show: false,
      // })

      this.add3DTileset({
        name: 'iPad Pro Lidar(point cloud)',
        url: sampleData['my-home'],
        show: false,
      })

      this.add3DTileset({
        name: '成都建筑群',
        url: sampleData['cd-buildings'],
        show: true,
        // debugColorizeTiles: true,
        // debugWireframe: true,
        // debugShowBoundingVolume: true,
        // debugShowGeometricError: true,
        // debugShowContentBoundingVolume: true,
        // debugShowViewerRequestVolume: true,
        // debugShowMemoryUsage: true,
      })

      this.add3DTileset({
        name: '简模001(适配全球地形)',
        url: sampleData['shp-factory'],
      })

      this.add3DTileset({
        name: '简模002(适配全球地形)',
        url: sampleData.apartment,
      })
    },
  },
})
</script>
