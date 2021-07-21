<template>
  <div>
    <div class="pb-4">
      <div class="text-lg text-white flex flex-row">
        <div class="flex-1">影像管理</div>
        <div class="flex flex-row flex-grow-0 flex-shrink-0">
          <div class="cursor-pointer" @click="plusImageries">
            <i class="el-icon-circle-plus-outline"></i>
          </div>
          <div class="cursor-pointer ml-3" @click="syncImageries">
            <i class="el-icon-refresh"></i>
          </div>
        </div>
      </div>

      <div>
        <div
          v-for="(imagery, index) in imageries"
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
            v-model="imagery.show"
            @change="(checked, e) => changeImageryShow(index, checked)"
          >
          </el-checkbox>
          <div
            class="mx-3 flex-1 cursor-default"
            :class="imagery.show ? '' : 'text-gray-400'"
          >
            {{ imagery.name }}
          </div>
          <div class="cursor-pointer" @click="settingImagery(index)">
            <i class="el-icon-setting"></i>
          </div>
          <div class="cursor-pointer ml-2" @click="removeImagery(index)">
            <i class="el-icon-close"></i>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      title="影像配置"
      v-model="imageryLayerOperate.dialogVisible"
      width="600px"
      destroy-on-close
      @close="imageryLayerOperateClose"
    >
      <imageryLayerOperate
        :a="imageryLayerOperate.props.alpha"
        :b="imageryLayerOperate.props.brightness"
        :c="imageryLayerOperate.props.contrast"
        :h="imageryLayerOperate.props.hue"
        :s="imageryLayerOperate.props.saturation"
        @change="imageryLayerChange"
      />
    </el-dialog>

    <el-dialog
      title="添加影像"
      v-model="addImageryDialogVisible"
      width="500px"
      destroy-on-close
    >
      <div>
        <div
          v-for="(imagerySource, index) in imagerySources"
          :key="index"
          :class="Array.isArray(imagerySource) ? 'px-5' : 'p-2 w-20'"
        >
          <div
            v-if="Array.isArray(imagerySource)"
            class="flex flex-row flex-wrap justify-around items-center"
          >
            <div
              v-for="(sub, index) in imagerySource"
              :key="index"
              class="px-2 py-3 w-20"
              @dblclick="addImagery(sub)"
            >
              <div
                class="
                  w-16
                  h-16
                  overflow-hidden
                  rounded-xl
                  shadow-2xl
                  border-solid border border-gray-200
                "
              >
                <img
                  :src="'./static/imgs/' + sub.iconImageUrl"
                  width="64"
                  height="64"
                  class="w-full h-full"
                />
              </div>
              <div
                class="font-sans text-center align-middle text-black text-sm"
              >
                {{ sub.name }}
              </div>
            </div>
          </div>
          <div v-else @dblclick="addImagery(imagerySource)">
            <div
              class="
                w-16
                h-16
                overflow-hidden
                rounded-xl
                shadow-2xl
                border-solid border border-gray-200
              "
            >
              <img
                :src="'./static/imgs/' + imagerySource.iconImageUrl"
                width="64"
                height="64"
                class="w-full h-full"
              />
            </div>
            <div class="font-sans text-center align-middle text-black text-sm">
              {{ imagerySource.name }}
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { ElIcon, ElCheckbox, ElDialog } from 'element-plus'
import imageryLayerOperate from './imagery-layer-operate.vue'
import sampleData from '@/resources/sample-data'
import * as Cesium from 'cesium'
import uuid from '@/libs/utils/uuid'

type Imagery = {
  name: string
  uuid: string
  providerName: string
  show: boolean
  cesiumLayerIndex: number
}

type ImagerySource = {
  name: string
  iconImageUrl: string
  providerName: string
  afterReady?: (viewer: Cesium.Viewer, success: boolean) => void
  options?: any
}

export default defineComponent({
  name: '',
  components: {
    ElIcon,
    ElCheckbox,
    ElDialog,
    imageryLayerOperate,
  },
  data() {
    let imageries: Imagery[] = []
    let imagerySources: (ImagerySource | ImagerySource[])[] = [
      [
        {
          iconImageUrl: 'img_c.jpg',
          name: '天地图影像底图',
          options: {
            url: 'https://{s}.tianditu.gov.cn/img_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=feff991159823907566acaa7273472ea',
            layer: 'img',
            style: 'default',
            format: 'tiles',
            tileMatrixSetID: 'c',
            tileMatrixLabels: [
              '1',
              '2',
              '3',
              '4',
              '5',
              '6',
              '7',
              '8',
              '9',
              '10',
              '11',
              '12',
              '13',
              '14',
              '15',
              '16',
              '17',
              '18',
            ],
            tilingScheme: new Cesium.GeographicTilingScheme(),
            credit: new Cesium.Credit('天地图全球影像服务'),
            subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
            maximumLevel: 18,
            show: true,
          },
          providerName: 'WebMapTileServiceImageryProvider',
        },
        {
          iconImageUrl: 'cia_c.png',
          name: '天地图影像注记',
          options: {
            url: 'https://{s}.tianditu.gov.cn/cia_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=feff991159823907566acaa7273472ea',
            layer: 'img',
            style: 'default',
            format: 'tiles',
            tileMatrixSetID: 'c',
            tileMatrixLabels: [
              '1',
              '2',
              '3',
              '4',
              '5',
              '6',
              '7',
              '8',
              '9',
              '10',
              '11',
              '12',
              '13',
              '14',
              '15',
              '16',
              '17',
              '18',
            ],
            tilingScheme: new Cesium.GeographicTilingScheme(),
            credit: new Cesium.Credit('天地图全球影像服务'),
            subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
            maximumLevel: 18,
            show: true,
          },
          providerName: 'WebMapTileServiceImageryProvider',
        },
        {
          iconImageUrl: 'vec_c.jpg',
          name: '天地图矢量底图',
          options: {
            url: 'https://{s}.tianditu.gov.cn/vec_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=feff991159823907566acaa7273472ea',
            layer: 'vec',
            style: 'default',
            format: 'image/jpeg',
            tileMatrixSetID: 'c',
            tileMatrixLabels: [
              '1',
              '2',
              '3',
              '4',
              '5',
              '6',
              '7',
              '8',
              '9',
              '10',
              '11',
              '12',
              '13',
              '14',
              '15',
              '16',
              '17',
              '18',
            ],
            tilingScheme: new Cesium.GeographicTilingScheme(),
            credit: new Cesium.Credit('天地图全球影像服务'),
            subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
            maximumLevel: 18,
            show: true,
          },
          providerName: 'WebMapTileServiceImageryProvider',
        },
        {
          iconImageUrl: 'cva_c.png',
          name: '天地图矢量注记',
          options: {
            url: 'https://{s}.tianditu.gov.cn/cva_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=feff991159823907566acaa7273472ea',
            layer: 'vec',
            style: 'default',
            format: 'image/jpeg',
            tileMatrixSetID: 'c',
            tileMatrixLabels: [
              '1',
              '2',
              '3',
              '4',
              '5',
              '6',
              '7',
              '8',
              '9',
              '10',
              '11',
              '12',
              '13',
              '14',
              '15',
              '16',
              '17',
              '18',
            ],
            tilingScheme: new Cesium.GeographicTilingScheme(),
            credit: new Cesium.Credit('天地图全球影像服务'),
            subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
            maximumLevel: 18,
            show: true,
          },
          providerName: 'WebMapTileServiceImageryProvider',
        },
      ],
      [
        {
          iconImageUrl: 'amap_img.png',
          name: '高德影像底图',
          options: {
            url: 'https://webst{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
            subdomains: ['01', '02', '03', '04'],
          },
          providerName: 'UrlTemplateImageryProvider',
        },
        {
          iconImageUrl: 'amap_img.png',
          name: '高德影像注记',
          options: {
            url: 'https://webst{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
            subdomains: ['01', '02', '03', '04'],
          },
          providerName: 'UrlTemplateImageryProvider',
        },
        {
          iconImageUrl: 'amap_img.png',
          name: '高德矢量',
          options: {
            url: 'https://webrd{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
            subdomains: ['01', '02', '03', '04'],
          },
          providerName: 'UrlTemplateImageryProvider',
        },
      ],
      [
        {
          iconImageUrl: 'google_hybrid.jpg',
          name: 'google混合',
          options: {
            url: 'https://mt1.google.cn/vt/lyrs=y&hl=zh-CN&x={x}&y={y}&z={z}',
          },
          providerName: 'UrlTemplateImageryProvider',
        },
        {
          iconImageUrl: 'google_satellite.jpg',
          name: 'google影像',
          options: {
            url: 'https://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}',
          },
          providerName: 'UrlTemplateImageryProvider',
        },
        {
          iconImageUrl: 'google_label.png',
          name: 'google注记',
          options: {
            url: 'https://mt1.google.cn/vt/lyrs=h&hl=zh-CN&x={x}&y={y}&z={z}',
          },
          providerName: 'UrlTemplateImageryProvider',
        },
        {
          iconImageUrl: 'google_road.jpg',
          name: 'google道路',
          options: {
            url: 'https://mt1.google.com/vt/lyrs=m&hl=zh-CN&x={x}&y={y}&z={z}',
          },
          providerName: 'UrlTemplateImageryProvider',
        },
        {
          iconImageUrl: 'google_terrain.jpg',
          name: 'google地形',
          options: {
            url: 'https://mt1.google.com/vt/lyrs=p&hl=zh-CN&x={x}&y={y}&z={z}',
          },
          providerName: 'UrlTemplateImageryProvider',
        },
      ],
      {
        iconImageUrl: 'img_c.jpg',
        name: '测试001-影像',
        options: {
          url: sampleData.satellite,
          fileExtension: 'png',
          rectangle: Cesium.Rectangle.fromRadians(
            1.8735054237781372,
            0.5907873200661897,
            1.8824726243189496,
            0.5956433152060476
          ),
        },
        providerName: 'UrlTemplateImageryProvider',
        afterReady: function (viewer: Cesium.Viewer, success: boolean) {
          const rect = Cesium.Rectangle.fromRadians(
            1.8735054237781372,
            0.5907873200661897,
            1.8824726243189496,
            0.5956433152060476
          )
          if (viewer && success) {
            viewer.camera.flyTo({
              destination: rect,
              orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-90),
                roll: 0.0,
              },
            })
          }
        },
      },
    ]
    return {
      imageries,
      addImageryDialogVisible: false,
      imagerySources,
      imageryLayerOperate: {
        dialogVisible: false,
        props: {
          alpha: 0,
          brightness: 0,
          contrast: 0,
          hue: 0,
          saturation: 0,
        },
        cesiumLayerIndex: -1,
      },
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    syncImageries() {
      this.imageries.splice(0, this.imageries.length)
      const { viewer } = this.$cv
      if (!viewer) {
        return
      }
      const ils = viewer.imageryLayers
      const len = ils.length
      for (let i = len - 1; i >= 0; --i) {
        const layer: Cesium.ImageryLayer = ils.get(i)
        this.imageries.push({
          name: layer.name || '<Unknown>',
          uuid: layer.uuid || '<Unknown>',
          providerName: layer.imageryProvider.constructor.name,
          show: layer.show,
          cesiumLayerIndex: i,
        })
      }
    },

    changeImageryShow(index: number, show: boolean) {
      const { viewer } = this.$cv
      if (!viewer) {
        return
      }
      this.imageries[index].show = viewer.imageryLayers.get(
        this.imageries[index].cesiumLayerIndex
      ).show = show
    },

    plusImageries() {
      this.addImageryDialogVisible = true
    },

    addImagery(item: ImagerySource): Cesium.ImageryLayer | undefined {
      const { viewer } = this.$cv
      if (!viewer) {
        return undefined
      }
      const provider = new (Cesium as any)[item.providerName]({
        ...item.options,
      })
      provider.readyPromise.then((success: boolean): void => {
        item.afterReady && item.afterReady(viewer, success)
      })
      const layer = new Cesium.ImageryLayer(provider)
      layer.name = item.name
      layer.uuid = uuid()

      const ils = viewer.imageryLayers
      ils.add(layer)
      this.syncImageries()
      return layer
    },

    removeImagery(index: number) {
      const { viewer } = this.$cv
      if (!viewer) {
        return
      }
      const ils = viewer.imageryLayers
      const layer = ils.get(this.imageries[index].cesiumLayerIndex)
      ils.remove(layer)
      this.syncImageries()
    },

    settingImagery(index: number) {
      const { viewer } = this.$cv
      if (!viewer) {
        return
      }
      const ils = viewer.imageryLayers
      const cesiumLayerIndex = this.imageries[index].cesiumLayerIndex
      const layer = ils.get(cesiumLayerIndex)
      this.imageryLayerOperate.cesiumLayerIndex = cesiumLayerIndex
      this.imageryLayerOperate.props.alpha = layer.alpha
      this.imageryLayerOperate.props.brightness = layer.brightness
      this.imageryLayerOperate.props.contrast = layer.contrast
      this.imageryLayerOperate.props.hue = layer.hue
      this.imageryLayerOperate.props.saturation = layer.saturation
      this.imageryLayerOperate.dialogVisible = true
    },

    init() {
      const { viewer } = this.$cv
      if (!viewer) {
        return
      }
      const ils = viewer.imageryLayers
      ils.removeAll()
      this.addImagery((this.imagerySources[0] as ImagerySource[])[0])
      this.addImagery((this.imagerySources[0] as ImagerySource[])[1])
      this.syncImageries()
    },

    imageryLayerChange(key: string, val: number) {
      const cesiumLayerIndex = this.imageryLayerOperate.cesiumLayerIndex
      if (cesiumLayerIndex < 0) {
        return
      }
      const { viewer } = this.$cv
      if (!viewer) {
        return
      }
      const layer = viewer.imageryLayers.get(cesiumLayerIndex)
      ;(layer as any)[key] = val
    },

    imageryLayerOperateClose() {
      this.imageryLayerOperate.cesiumLayerIndex = -1
      this.imageryLayerOperate.dialogVisible = false
    },
  },
})
</script>
