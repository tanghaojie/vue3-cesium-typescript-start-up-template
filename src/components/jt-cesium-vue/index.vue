<template>
  <div ref="jtCesiumVue" class="w-full h-full m-0 p-0">
    <slot />
  </div>
</template>

<script lang="ts">
const LOADED_EVENT = 'loaded'

import { defineComponent, ref, shallowRef, inject, onMounted, onUnmounted, nextTick } from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import * as Cesium from 'cesium'
import 'cesium/Source/Widgets/widgets.css'
import Jt from '@/libs/cesium/cesium-jt'

export default defineComponent({
  name: 'jt-cesium-vue',
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
    viewerMountOnWindow: {
      type: Boolean,
      default: true,
      required: false,
    },
    cesiumMountOnWindow: {
      type: Boolean,
      default: true,
      required: false,
    },
    cesiumToken: {
      type: String,
      default:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMjZjNGMyYy02ZmJlLTQ1ZGYtOWE2NC0yYTdjYmZhODUxYTgiLCJpZCI6NDMyMjgsImlhdCI6MTYxNzMzNDA5OX0.ox0okdwvueefvj7I4KVd9KNqVOEsMStSTmn8sDhoim4',
    },
    depthTestAgainstTerrain: {
      type: Boolean,
      default: false,
    },
    shadows: {
      type: Boolean,
      default: false,
    },
    terrainShadows: {
      type: Number,
      default: Cesium.ShadowMode.RECEIVE_ONLY,
    },
    // Fast Approximate Anti-Aliasing
    fxaaEnable: {
      type: Boolean,
      default: true,
    },
    // MultiSampling Anti-Aliasing, 1/2/4/8
    msaa: {
      type: Number,
      default: 1,
    },
  },
  setup(props, context) {
    const jtCesiumVue = shallowRef<HTMLElement | null>(null)

    const initializeCesiumDefault = (): void => {
      const west = 94
      const south = 26.5
      const east = 112
      const north = 33.5
      const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north)
      Cesium.Camera.DEFAULT_VIEW_FACTOR = 0
      Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle
      const { cesiumToken } = props
      if (cesiumToken) {
        Cesium.Ion.defaultAccessToken = cesiumToken
      }
    }

    const initializeCesium = (options: any = {}): Cesium.Viewer => {
      const DEFAULT_OPT: Cesium.Viewer.ConstructorOptions = {
        animation: props.animation, // 是否创建动画小器件，左下角仪表
        baseLayerPicker: props.baseLayerPicker, // 是否显示图层选择器
        fullscreenButton: props.fullscreenButton, // 是否显示全屏按钮
        geocoder: props.geocoder, // 是否显示geocoder小器件，右上角查询按钮
        homeButton: props.homeButton, // 是否显示Home按钮
        infoBox: props.infoBox, // 是否显示信息框
        sceneModePicker: props.sceneModePicker, // 是否显示3D/2D选择器
        selectionIndicator: props.selectionIndicator, // 是否显示选取指示器组件
        timeline: props.timeline, // 是否显示时间轴
        navigationHelpButton: props.navigationHelpButton, // 是否显示右上角的帮助按钮
        scene3DOnly: props.scene3DOnly, // 如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
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
        useDefaultRenderLoop: props.useDefaultRenderLoop, // 如果需要控制渲染循环，则设为true
        // targetFrameRate: undefined, // 使用默认render loop时的帧率
        showRenderLoopErrors: props.showRenderLoopErrors, // 如果设为true，将在一个HTML面板中显示错误信息
        // automaticallyTrackDataSourceClocks: true, // 自动追踪最近添加的数据源的时钟设置
        // contextOptions: undefined, // 传递给Scene对象的上下文参数（scene.options）
        sceneMode: props.sceneMode, // 初始场景模式
        // mapProjection: new Cesium.WebMercatorProjection(), //地 图投影体系
        // dataSources: new Cesium.DataSourceCollection() // 需要进行可视化的数据源的集合
        shadows: props.shadows,
        terrainShadows: props.terrainShadows,
        msaaSamples: props.msaa,
      }

      const el = jtCesiumVue.value as HTMLElement
      const viewer = new Cesium.Viewer(el, {
        ...DEFAULT_OPT,
        ...options,
      })
      viewer.scene.globe.depthTestAgainstTerrain = props.depthTestAgainstTerrain
      viewer.resolutionScale = window.devicePixelRatio
      viewer.scene.postProcessStages.fxaa.enabled = props.fxaaEnable

      viewer.scene.primitives.removeAll()

      //eslint-disable-next-line
      ;(viewer.cesiumWidget.creditContainer as any).style.display = 'none'

      const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
      if (!cesiumRef) {
        throw new Error('No cesium reference exist.')
      }
      cesiumRef.viewer = viewer
      // eslint-disable-next-line
      cesiumRef.viewerContainer = (viewer as any)._element

      const { viewerMountOnWindow, cesiumMountOnWindow } = props
      viewerMountOnWindow && (window.viewer = viewer)
      cesiumMountOnWindow && (window.Cesium = Cesium)
      return viewer
    }

    const init = (): Cesium.Viewer => {
      initializeCesiumDefault()
      const viewer = initializeCesium()
      viewer.jt = new Jt(viewer)
      return viewer
    }

    onMounted(() => {
      const viewer = init()
      context.emit(LOADED_EVENT, { viewer })
    })

    onUnmounted(() => {
      const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
      if (cesiumRef) {
        cesiumRef.viewer = undefined
      }
      const { viewerMountOnWindow, cesiumMountOnWindow } = props
      viewerMountOnWindow && (window.viewer = undefined)
      cesiumMountOnWindow && (window.Cesium = undefined)
    })

    return {
      jtCesiumVue,
      initializeCesiumDefault,
      initializeCesium,
      init,
    }
  },
  emits: {
    [LOADED_EVENT](payload: { viewer: Cesium.Viewer }) {
      return true
    },
  },
})
</script>
