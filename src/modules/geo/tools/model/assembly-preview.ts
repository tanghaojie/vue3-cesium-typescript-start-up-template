import {
  BoundingSphere,
  Cartesian3,
  Cartographic,
  CustomShader,
  EllipsoidTerrainProvider,
  HeadingPitchRange,
  JulianDate,
  LightingModel,
  Model,
  ShadowMode,
  Transforms,
  sampleTerrain,
  sampleTerrainMostDetailed,
  type Viewer,
} from 'cesium'
import { prepareGeoModelAsset } from '../data/model-asset'
import { restoreAssemblyViewportColors } from './assembly-preview-materials'
import type {
  GeoModelRenderingManager,
  GeoModelRenderingRegistration,
} from '../scene/model-rendering'

export const ASSEMBLY_PREVIEW_URL = 'https://jt-ai-models.vercel.app/tmp/building_assembly.glb'

export interface AssemblyPreviewState {
  lighting: 'studio' | 'scene'
  loading: boolean
  loaded: boolean
  playing: boolean
  current: number
  duration: number
  count: number
  error?: string
}

function waitUntilReady(model: Model, viewer: Viewer, signal: AbortSignal): Promise<void> {
  return new Promise(function wait(resolve, reject) {
    function finish(error?: Error): void {
      clearTimeout(timeout)
      removeReady()
      removeError()
      signal.removeEventListener('abort', abort)
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    }
    function abort(): void {
      finish(new DOMException('预览已取消', 'AbortError'))
    }
    const removeReady = model.readyEvent.addEventListener(() => finish())
    const removeError = viewer.scene.renderError.addEventListener(() =>
      finish(new Error('场景渲染失败，请移除预览后重试。')),
    )
    const timeout = setTimeout(() => finish(new Error('模型就绪超时，请重试。')), 30_000)
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) {
      abort()
    } else if (model.ready) {
      finish()
    } else {
      viewer.scene.requestRender()
    }
  })
}

export function createAssemblyPreview(
  viewer: Viewer,
  rendering: GeoModelRenderingManager,
  onChange: (state: AssemblyPreviewState) => void,
) {
  const state: AssemblyPreviewState = {
    lighting: 'studio',
    loading: false,
    loaded: false,
    playing: false,
    current: 0,
    duration: 0,
    count: 0,
  }
  let model: Model | undefined
  let registration: GeoModelRenderingRegistration | undefined
  let studioShader: CustomShader | undefined
  let pending: AbortController | undefined
  let disposed = false
  let previous = performance.now()
  let cancelFlight: (() => void) | undefined

  function publish(): void {
    if (!disposed) {
      onChange({ ...state })
    }
  }

  function redraw(): void {
    if (!viewer.isDestroyed()) {
      viewer.scene.requestRender()
    }
    publish()
  }

  function pause(): void {
    state.playing = false
    redraw()
  }

  function setLighting(lighting: AssemblyPreviewState['lighting']): void {
    state.lighting = lighting
    registration?.dispose()
    registration = undefined
    if (model && !model.isDestroyed()) {
      // Cesium supports clearing the shader; the public declaration omits undefined.
      ;(model as unknown as { customShader: CustomShader | undefined }).customShader = undefined
    }
    studioShader?.destroy()
    studioShader = undefined
    if (model && !model.isDestroyed()) {
      if (lighting === 'scene') {
        model.shadows = ShadowMode.ENABLED
        registration = rendering.register(model)
      } else {
        model.shadows = ShadowMode.DISABLED
        studioShader = new CustomShader({
          lightingModel: LightingModel.UNLIT,
          fragmentShaderText: `
            void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
              vec3 normal = normalize(fsInput.attributes.normalEC);
              float key = max(dot(normal, normalize(vec3(-0.4, 0.7, 0.8))), 0.0);
              float fill = max(dot(normal, normalize(vec3(0.8, 0.1, 0.5))), 0.0);
              material.diffuse *= 0.35 + 0.55 * key + 0.15 * fill;
            }
          `,
        })
        model.customShader = studioShader
      }
    }
    redraw()
  }

  function seek(seconds: number): void {
    if (!state.loaded || !Number.isFinite(seconds)) {
      return
    }
    state.current = Math.max(0, Math.min(state.duration, seconds))
    previous = performance.now()
    redraw()
  }

  function play(restart = false): void {
    if (!state.loaded) {
      return
    }
    if (restart || state.current >= state.duration) {
      state.current = 0
    }
    previous = performance.now()
    state.playing = true
    redraw()
  }

  function clear(): void {
    pending?.abort()
    pending = undefined
    cancelFlight?.()
    cancelFlight = undefined
    registration?.dispose()
    registration = undefined
    if (model && !model.isDestroyed()) {
      ;(model as unknown as { customShader: CustomShader | undefined }).customShader = undefined
    }
    studioShader?.destroy()
    studioShader = undefined
    if (model && !model.isDestroyed()) {
      if (viewer.isDestroyed() || !viewer.scene.primitives.remove(model)) {
        model.destroy()
      }
    }
    model = undefined
    Object.assign(state, {
      loading: false,
      loaded: false,
      playing: false,
      current: 0,
      duration: 0,
      count: 0,
      error: undefined,
    })
    redraw()
  }

  const removeUpdate = viewer.scene.preUpdate.addEventListener(function update() {
    if (!state.playing || !state.loaded) {
      return
    }
    const now = performance.now()
    state.current = Math.min(state.duration, state.current + (now - previous) / 1000)
    previous = now
    if (state.current >= state.duration) {
      state.playing = false
    }
    redraw()
  })
  const removeRenderError = viewer.scene.renderError.addEventListener(function failed() {
    if (!state.loaded) {
      return
    }
    state.playing = false
    state.error = '场景渲染失败，请移除预览后重试。'
    publish()
  })

  async function load(): Promise<void> {
    if (disposed || viewer.isDestroyed()) {
      return
    }
    clear()
    const operation = new AbortController()
    pending = operation
    state.loading = true
    publish()
    let prepared: Awaited<ReturnType<typeof prepareGeoModelAsset>> | undefined
    let resource: Model | undefined
    let correctedUrl: string | undefined
    function check(): void {
      if (operation.signal.aborted || disposed || viewer.isDestroyed()) {
        throw new DOMException('预览已取消', 'AbortError')
      }
    }
    try {
      const response = await fetch(ASSEMBLY_PREVIEW_URL, { signal: operation.signal })
      if (!response.ok) {
        throw new Error(`预览模型下载失败（HTTP ${response.status}）`)
      }
      const corrected = restoreAssemblyViewportColors(await response.arrayBuffer())
      check()
      correctedUrl = URL.createObjectURL(new Blob([corrected], { type: 'model/gltf-binary' }))
      prepared = await prepareGeoModelAsset(correctedUrl, operation.signal)
      check()
      // Demonstration coordinates only; sample the current terrain before placement.
      const provider = viewer.terrainProvider
      const points = [Cartographic.fromDegrees(104.0668, 30.5728)]
      if (!(provider instanceof EllipsoidTerrainProvider)) {
        await (provider.availability
          ? sampleTerrainMostDetailed(provider, points, true)
          : sampleTerrain(provider, 12, points, true))
        check()
        if (provider !== viewer.terrainProvider) {
          throw new Error('地形已变化，请重新加载预览。')
        }
      }
      const height = points[0].height
      if (!Number.isFinite(height)) {
        throw new Error('无法确定地形高度，请重试。')
      }
      const position = Cartesian3.fromDegrees(104.0668, 30.5728, height + 0.5)
      resource = await Model.fromGltfAsync({
        url: prepared.url,
        modelMatrix: Transforms.eastNorthUpToFixedFrame(position),
        gltfCallback(gltf: unknown) {
          if (operation.signal.aborted || disposed) {
            return
          }
          const asset = gltf as {
            animations?: { samplers: { input: number }[] }[]
            accessors?: { max?: number[] }[]
          }
          state.duration = Math.max(
            0,
            ...(asset.animations ?? []).flatMap((animation) =>
              animation.samplers.map((sampler) => asset.accessors?.[sampler.input]?.max?.[0] ?? 0),
            ),
          )
        },
      })
      check()
      model = resource
      viewer.scene.primitives.add(resource)
      await waitUntilReady(resource, viewer, operation.signal)
      check()
      setLighting(state.lighting)
      resource.activeAnimations.animateWhilePaused = true
      const animations = resource.activeAnimations.addAll({
        // Fixed early epoch allows seeking the scene Clock backwards without stopping the preview.
        startTime: JulianDate.fromIso8601('0001-01-01T00:00:00Z'),
        animationTime(duration: number): number {
          return duration > 0 ? Math.min(state.current / duration, 1) : 1
        },
      })
      if (!animations.length || state.duration <= 0) {
        throw new Error('模型未包含有效的可播放动画。')
      }
      state.count = animations.length
      state.loaded = true
      redraw()
      await new Promise<void>(function fly(resolve) {
        cancelFlight = function cancel() {
          if (!viewer.isDestroyed()) {
            viewer.camera.cancelFlight()
          }
          resolve()
        }
        viewer.camera.flyToBoundingSphere(
          new BoundingSphere(Cartesian3.fromDegrees(104.0668, 30.5728, height + 8), 26),
          {
            duration: 1.4,
            offset: new HeadingPitchRange(0.6, -0.45, 85),
            complete: resolve,
            cancel: resolve,
          },
        )
      })
      cancelFlight = undefined
      check()
      state.loading = false
      play(true)
    } catch (error) {
      if (!operation.signal.aborted && !disposed) {
        clear()
        state.error = error instanceof Error ? error.message : '预览加载失败'
        publish()
      }
      if (resource && !resource.isDestroyed() && resource !== model) {
        resource.destroy()
      }
    } finally {
      prepared?.dispose()
      if (correctedUrl) {
        URL.revokeObjectURL(correctedUrl)
      }
      if (pending === operation) {
        pending = undefined
      }
    }
  }

  function dispose(): void {
    disposed = true
    clear()
    removeUpdate()
    removeRenderError()
  }

  publish()
  return { load, play, pause, seek, setLighting, clear, dispose }
}
