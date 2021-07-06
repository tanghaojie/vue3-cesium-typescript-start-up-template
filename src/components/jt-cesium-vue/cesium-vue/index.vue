<template>
  <div ref="jtVueCesium" class="jt-vue-cesium w-full h-full m-0 p-0">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import logMousePositionMixin from '@/libs/cesium/mixins/logMousePositionMixin'

export default defineComponent({
  name: 'jt-vue-cesium',
  props: {
    animation: {
      type: Boolean,
      default: false,
    },
    baseLayerPicker: {
      type: Boolean,
      default: false,
    },
    fullscreenButton: {
      type: Boolean,
      default: false,
    },
    geocoder: {
      type: Boolean,
      default: false,
    },
    homeButton: {
      type: Boolean,
      default: false,
    },
    infoBox: {
      type: Boolean,
      default: false,
    },
    sceneModePicker: {
      type: Boolean,
      default: false,
    },
    selectionIndicator: {
      type: Boolean,
      default: false,
    },
    timeline: {
      type: Boolean,
      default: false,
    },
    navigationHelpButton: {
      type: Boolean,
      default: false,
    },
    scene3DOnly: {
      type: Boolean,
      default: true,
    },
    useDefaultRenderLoop: {
      type: Boolean,
      default: true,
    },
    showRenderLoopErrors: {
      type: Boolean,
      default: true,
    },
    automaticallyTrackDataSourceClocks: {
      type: Boolean,
      default: true,
    },
    sceneMode: {
      type: Number,
      default: Cesium.SceneMode.SCENE3D,
    },
    globalViewerMountOnWindow: {
      type: Boolean,
      default: true,
      required: false,
    },
    cesiumToken: {
      type: String,
      default: '',
    },
    depthTestAgainstTerrain: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {}
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {
    const viewer = this.init()
    this.$emit('loaded', { viewer })
  },
  unmounted() {
    this.$cv.viewer = undefined
    const { globalViewerMountOnWindow } = this
    globalViewerMountOnWindow && (window.viewer = undefined)
  },
  setup() {},
  methods: {
    initializeCesiumDefault() {
      const west = 94
      const south = 26.5
      const east = 112
      const north = 33.5
      const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north)
      Cesium.Camera.DEFAULT_VIEW_FACTOR = 0
      Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle
      const { cesiumToken } = this
      if (cesiumToken) {
        Cesium.Ion.defaultAccessToken = cesiumToken
      }
    },

    initializeCesium(options = {}) {
      const DEFAULT_OPT = {
        animation: this.animation, // 是否创建动画小器件，左下角仪表
        baseLayerPicker: this.baseLayerPicker, // 是否显示图层选择器
        fullscreenButton: this.fullscreenButton, // 是否显示全屏按钮
        geocoder: this.geocoder, // 是否显示geocoder小器件，右上角查询按钮
        homeButton: this.homeButton, // 是否显示Home按钮
        infoBox: this.infoBox, // 是否显示信息框
        sceneModePicker: this.sceneModePicker, // 是否显示3D/2D选择器
        selectionIndicator: this.sceneModePicker, // 是否显示选取指示器组件
        timeline: this.timeline, // 是否显示时间轴
        navigationHelpButton: this.navigationHelpButton, // 是否显示右上角的帮助按钮
        scene3DOnly: this.scene3DOnly, // 如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
        // clock: new Cesium.Clock(), // 用于控制当前时间的时钟对象
        // selectedImageryProviderViewModel: undefined, // 当前图像图层的显示模型，仅baseLayerPicker设为true有意义
        // imageryProviderViewModels: Cesium.createDefaultImageryProviderViewModels(), // 可供BaseLayerPicker选择的图像图层ProviderViewModel数组
        // selectedTerrainProviderViewModel: undefined, // 当前地形图层的显示模型，仅baseLayerPicker设为true有意义
        // terrainProviderViewModels: Cesium.createDefaultTerrainProviderViewModels(), // 可供BaseLayerPicker选择的地形图层ProviderViewModel数组
        // imageryProvider: new Cesium.IonImageryProvider({ assetId: 3954 }), // 图像图层提供者，仅baseLayerPicker设为false有意义
        terrainProvider: undefined, // 地形图层提供者，仅baseLayerPicker设为false有意义
        // skyBox: new Cesium.SkyBox({
        //   sources: {
        //     positiveX: 'Cesium-1.7.1/Skybox/px.jpg',
        //     negativeX: 'Cesium-1.7.1/Skybox/mx.jpg',
        //     positiveY: 'Cesium-1.7.1/Skybox/py.jpg',
        //     negativeY: 'Cesium-1.7.1/Skybox/my.jpg',
        //     positiveZ: 'Cesium-1.7.1/Skybox/pz.jpg',
        //     negativeZ: 'Cesium-1.7.1/Skybox/mz.jpg'
        //   }
        // }), // 用于渲染星空的SkyBox对象
        // fullscreenElement: document.body, // 全屏时渲染的HTML元素,
        useDefaultRenderLoop: this.useDefaultRenderLoop, // 如果需要控制渲染循环，则设为true
        // targetFrameRate: undefined, // 使用默认render loop时的帧率
        showRenderLoopErrors: this.showRenderLoopErrors, // 如果设为true，将在一个HTML面板中显示错误信息
        // automaticallyTrackDataSourceClocks: true, // 自动追踪最近添加的数据源的时钟设置
        // contextOptions: undefined, // 传递给Scene对象的上下文参数（scene.options）
        sceneMode: this.sceneMode, // 初始场景模式
        // mapProjection: new Cesium.WebMercatorProjection(), //地 图投影体系
        // dataSources: new Cesium.DataSourceCollection() // 需要进行可视化的数据源的集合
      }

      const el = this.$refs.jtVueCesium as HTMLElement
      const viewer = new Cesium.Viewer(el, {
        ...DEFAULT_OPT,
        ...options,
      })

      viewer.scene.globe.depthTestAgainstTerrain = this.depthTestAgainstTerrain

      viewer.scene.primitives.removeAll()
      //eslint-disable-next-line
      ;(viewer.cesiumWidget.creditContainer as any).style.display = 'none'

      this.$cv.viewer = viewer
      // eslint-disable-next-line
      this.$cv.viewerContainer = (viewer as any)._element

      const { globalViewerMountOnWindow } = this
      globalViewerMountOnWindow && (window.viewer = viewer)
      return viewer
    },

    init() {
      this.initializeCesiumDefault()

      const viewer = this.initializeCesium('cesiumContainer')
      viewer.extend(logMousePositionMixin, { withHeight: true })
      // viewer.extend(Cesium.viewerCesiumInspectorMixin)

      return viewer
    },
  },
})
</script>
