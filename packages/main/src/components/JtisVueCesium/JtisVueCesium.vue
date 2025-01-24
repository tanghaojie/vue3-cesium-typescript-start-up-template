<script lang="ts">
import { defineComponent } from 'vue'
import { CESIUM_REF_KEY, CesiumRef } from '@/libs/cesium/VueCesium'
export default defineComponent({
  name: 'jtis-vue-cesium',
  inheritAttrs: true,
})
</script>

<script setup lang="ts">
import { onMounted, shallowRef, onUnmounted, inject } from 'vue'
import { Camera, Ion, Rectangle, SceneMode, ShadowMode, Viewer } from 'cesium'
import 'cesium/Source/Widgets/widgets.css'

type CesiumConfig = {
  depthTestAgainstTerrain?: boolean
  fxaaEnable?: boolean
}

const props = withDefaults(
  defineProps<{
    cesiumToken: string
    cesiumOptions?: Viewer.ConstructorOptions
    cesiumConfig?: CesiumConfig
  }>(),
  {
    cesiumOptions: () => {
      return {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        scene3DOnly: true,
        useDefaultRenderLoop: true,
        showRenderLoopErrors: true,
        automaticallyTrackDataSourceClocks: true,
        sceneMode: SceneMode.SCENE3D,
        shadows: false,
        terrainShadows: ShadowMode.RECEIVE_ONLY,
        // MultiSampling Anti-Aliasing, 1/2/4/8
        msaa: 1,
      }
    },
    cesiumConfig: () => {
      return {
        // Fast Approximate Anti-Aliasing
        fxaaEnable: true,
        depthTestAgainstTerrain: false,
      }
    },
  }
)

const emit = defineEmits<{
  ready: [viewer: Viewer]
}>()

const jtisVueCesium = shallowRef<HTMLElement | null>(null)

function initCesiumDefault() {
  const west = 94
  const south = 26.5
  const east = 112
  const north = 33.5
  const rectangle = Rectangle.fromDegrees(west, south, east, north)
  Camera.DEFAULT_VIEW_FACTOR = 0
  Camera.DEFAULT_VIEW_RECTANGLE = rectangle
  const { cesiumToken } = props
  if (cesiumToken) {
    Ion.defaultAccessToken = cesiumToken
  }
}

function initCesiumViewer(): Viewer {
  const viewer = new Viewer(jtisVueCesium.value!, {
    ...props.cesiumOptions,
    terrainProvider: undefined,
  })
  viewer.resolutionScale = window.devicePixelRatio
  viewer.scene.globe.depthTestAgainstTerrain = props.cesiumConfig.depthTestAgainstTerrain ?? false
  viewer.scene.postProcessStages.fxaa.enabled = props.cesiumConfig.fxaaEnable ?? true
  viewer.scene.primitives.removeAll()
  //eslint-disable-next-line
  ;(viewer.cesiumWidget.creditContainer as any).style.display = 'none'
  return viewer
}

function initAllRef(viewer: Viewer) {
  const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
  if (!cesiumRef) {
    throw new Error('Cesium not initialized!')
  }
  cesiumRef.viewer = viewer
  cesiumRef.viewerContainer = (viewer as any)._element
  window.viewer = viewer
}

onMounted(function () {
  initCesiumDefault()
  const viewer = initCesiumViewer()
  initAllRef(viewer)

  emit('ready', viewer)
})

onUnmounted(function () {
  const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
  if (cesiumRef) {
    cesiumRef.viewer?.destroy()
    cesiumRef.viewer = undefined
    cesiumRef.viewerContainer = undefined
  }
  window.viewer = undefined
})
</script>

<template>
  <div ref="jtisVueCesium" class="w-full h-full overflow-hidden">
    <slot />
  </div>
</template>
