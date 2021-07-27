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
import { defineComponent, reactive, ref, inject, onMounted } from 'vue'
import { CesiumRef } from '@/@types/shims-cesium-ref'
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
  setup() {
    const imageries: Imagery[] = reactive([])
    const imagerySources: (ImagerySource | ImagerySource[])[] = reactive([
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
    ])
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
      cesiumLayerIndex: -1,
    })

    const cesiumRef = inject<CesiumRef>('cesiumRef')

    const syncImageries = (): void => {
      imageries.splice(0, imageries.length)
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      const ils = viewer.imageryLayers
      const len = ils.length
      for (let i = len - 1; i >= 0; --i) {
        const layer: Cesium.ImageryLayer = ils.get(i)
        imageries.push({
          name: layer.name || '<Unknown>',
          uuid: layer.uuid || '<Unknown>',
          providerName: layer.imageryProvider.constructor.name,
          show: layer.show,
          cesiumLayerIndex: i,
        })
      }
    }

    const changeImageryShow = (index: number, show: boolean): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      imageries[index].show = viewer.imageryLayers.get(
        imageries[index].cesiumLayerIndex
      ).show = show
    }

    const plusImageries = (): void => {
      addImageryDialogVisible.value = true
    }

    const addImagery = (
      item: ImagerySource
    ): Cesium.ImageryLayer | undefined => {
      const { viewer } = cesiumRef || {}
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
      syncImageries()
      return layer
    }

    const removeImagery = (index: number): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      const ils = viewer.imageryLayers
      const layer = ils.get(imageries[index].cesiumLayerIndex)
      ils.remove(layer)
      syncImageries()
    }

    const settingImagery = (index: number): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      const ils = viewer.imageryLayers
      const cesiumLayerIndex = imageries[index].cesiumLayerIndex
      const layer = ils.get(cesiumLayerIndex)
      imageryLayerOperate.cesiumLayerIndex = cesiumLayerIndex
      imageryLayerOperate.props.alpha = layer.alpha
      imageryLayerOperate.props.brightness = layer.brightness
      imageryLayerOperate.props.contrast = layer.contrast
      imageryLayerOperate.props.hue = layer.hue
      imageryLayerOperate.props.saturation = layer.saturation
      imageryLayerOperate.dialogVisible = true
    }

    const init = (): void => {
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      const ils = viewer.imageryLayers
      ils.removeAll()
      addImagery((imagerySources[0] as ImagerySource[])[0])
      addImagery((imagerySources[0] as ImagerySource[])[1])
      syncImageries()
    }

    const imageryLayerChange = (key: string, val: number): void => {
      const cesiumLayerIndex = imageryLayerOperate.cesiumLayerIndex
      if (cesiumLayerIndex < 0) {
        return
      }
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      const layer = viewer.imageryLayers.get(cesiumLayerIndex)
      ;(layer as any)[key] = val
    }

    const imageryLayerOperateClose = (): void => {
      imageryLayerOperate.cesiumLayerIndex = -1
      imageryLayerOperate.dialogVisible = false
    }

    onMounted(() => {
      init()
    })

    return {
      imageries,
      imagerySources,
      addImageryDialogVisible,
      imageryLayerOperate,

      syncImageries,
      changeImageryShow,
      plusImageries,
      addImagery,
      removeImagery,
      settingImagery,
      init,
      imageryLayerChange,
      imageryLayerOperateClose,
    }
  },
})
</script>
