import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  CustomShader,
  DynamicEnvironmentMapManager,
  Ellipsoid,
  JulianDate,
  Matrix4,
  Model,
  ShadowMode,
  UniformType,
  type Cesium3DTileset,
  type Viewer,
} from 'cesium'
import type { GeoRenderMode } from '../../core/render-performance'
import { smoothstep, solarHeightDegrees, sunPositionFixed } from './solar-lighting'

export interface GeoModelRenderingRegistration {
  update(): void
  dispose(): void
}

export interface GeoModelRenderingManager {
  register(model: Model): GeoModelRenderingRegistration
  registerTileset(tileset: Cesium3DTileset, position: Cartesian3): GeoModelRenderingRegistration
  registerEnvironment(resource: GeoEnvironmentResource): { dispose(): void }
  setMode(mode: GeoRenderMode): void
  getFocusPosition(): Cartesian3 | undefined
  dispose(): void
}

type GeoEnvironmentResource = Pick<
  Model,
  'environmentMapManager' | 'imageBasedLighting' | 'isDestroyed'
>

interface ManagedEnvironment {
  readonly resource: GeoEnvironmentResource
  readonly enabled: boolean
  readonly secondsDifference: number
  readonly coefficients: Cartesian3[] | undefined
  readonly fallbackCoefficients: Cartesian3[]
}

function setEnvironmentCoefficients(
  resource: GeoEnvironmentResource,
  coefficients: Cartesian3[] | undefined,
): void {
  // Cesium's public setter accepts undefined to restore automatic IBL; its declaration omits it.
  const lighting = resource.imageBasedLighting as unknown as {
    sphericalHarmonicCoefficients: Cartesian3[] | undefined
  }
  lighting.sphericalHarmonicCoefficients = coefficients
}

interface ManagedModel {
  readonly model: Model | Cesium3DTileset
  readonly origin: () => Cartesian3
  readonly quality?: {
    readonly tileset: Cesium3DTileset
    readonly shadows: ShadowMode
    readonly error: number
    readonly cache: number
    readonly overflow: number
  }
  readonly shader: ReturnType<typeof createModelShader>
  readonly originalShader: Model['customShader'] | undefined
  readonly originalLightColor: Cartesian3 | undefined
  baseLightColor: Cartesian3
  readonly usesSceneLight: boolean
  readonly originalIblFactor: Cartesian2
  readonly environment: { dispose(): void }
  dirty: boolean
  disposed: boolean
  lastNightFactor: number | undefined
  lastDirectFactor: number | undefined
  lastSceneLight: SceneLightSnapshot | undefined
}

interface SceneLightSnapshot {
  readonly red: number
  readonly green: number
  readonly blue: number
  readonly intensity: number
}

const DAYLIGHT_HEIGHT_DEGREES = 2
const NIGHT_HEIGHT_DEGREES = -6
const modelCartographicScratch = new Cartographic()
const NIGHT_AMBIENT_COLOR = new Cartesian3(0.02, 0.03, 0.05)

function createModelShader() {
  return new CustomShader({
    fragmentShaderText: `
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        #ifdef LIGHTING_PBR
          material.emissive *= u_nightFactor;
          material.emissive += material.diffuse * u_nightAmbient * u_nightFactor;
        #endif
      }
    `,
    uniforms: {
      u_nightFactor: {
        type: UniformType.FLOAT,
        value: 0.0,
      },
      u_nightAmbient: {
        type: UniformType.VEC3,
        value: new Cartesian3(0.02, 0.03, 0.05),
      },
    },
  })
}

function resolveOrigin(model: Model): Cartesian3 {
  const origin = Matrix4.getTranslation(model.modelMatrix, new Cartesian3())
  if (!Cartesian3.equalsEpsilon(origin, Cartesian3.ZERO, 1e-6, 1e-6)) {
    const cartographic = Cartographic.fromCartesian(
      origin,
      Ellipsoid.WGS84,
      modelCartographicScratch,
    )
    if (
      cartographic &&
      Number.isFinite(cartographic.longitude) &&
      Number.isFinite(cartographic.latitude) &&
      Number.isFinite(cartographic.height)
    ) {
      return origin
    }
  }
  throw new Error('外部模型的 WGS84 定位无效，无法启用昼夜渲染')
}

function sceneLightSnapshot(viewer: Viewer): SceneLightSnapshot {
  const sceneLight = viewer.scene.light
  return {
    red: sceneLight.color.red,
    green: sceneLight.color.green,
    blue: sceneLight.color.blue,
    intensity: sceneLight.intensity,
  }
}

function sceneBaseLightColor(viewer: Viewer): Cartesian3 {
  const sceneLight = sceneLightSnapshot(viewer)
  return Cartesian3.fromElements(
    sceneLight.red * sceneLight.intensity,
    sceneLight.green * sceneLight.intensity,
    sceneLight.blue * sceneLight.intensity,
    new Cartesian3(),
  )
}

function sceneLightChanged(item: ManagedModel, viewer: Viewer): boolean {
  if (!item.usesSceneLight || !item.lastSceneLight) {
    return item.usesSceneLight
  }
  const current = sceneLightSnapshot(viewer)
  return (
    current.red !== item.lastSceneLight.red ||
    current.green !== item.lastSceneLight.green ||
    current.blue !== item.lastSceneLight.blue ||
    current.intensity !== item.lastSceneLight.intensity
  )
}

export function createGeoModelRenderingManager(viewer: Viewer): GeoModelRenderingManager {
  const registrations = new Set<ManagedModel>()
  const environments = new Set<ManagedEnvironment>()
  let mode: GeoRenderMode = 'balanced'
  let disposed = false
  let lastTime: JulianDate | undefined

  function applyEnvironment(item: ManagedEnvironment): void {
    if (item.resource.isDestroyed()) {
      return
    }
    const dynamic = mode !== 'compatible'
    item.resource.environmentMapManager.enabled = dynamic && item.enabled
    const timeBudget = mode === 'performance' ? 0.25 : 0.5
    item.resource.environmentMapManager.maximumSecondsDifference = Math.max(
      300,
      viewer.clock.shouldAnimate ? Math.abs(viewer.clock.multiplier) * timeBudget : 300,
    )
    const coefficients = dynamic
      ? item.coefficients
      : (item.coefficients ?? item.fallbackCoefficients)
    if (item.resource.imageBasedLighting.sphericalHarmonicCoefficients !== coefficients) {
      setEnvironmentCoefficients(item.resource, coefficients)
    }
  }

  function registerEnvironment(resource: GeoEnvironmentResource): { dispose(): void } {
    if (disposed) {
      throw new Error('Geo model rendering manager has been disposed')
    }
    const item: ManagedEnvironment = {
      resource,
      enabled: resource.environmentMapManager.enabled,
      secondsDifference: resource.environmentMapManager.maximumSecondsDifference,
      coefficients: resource.imageBasedLighting.sphericalHarmonicCoefficients,
      fallbackCoefficients:
        DynamicEnvironmentMapManager.DEFAULT_SPHERICAL_HARMONIC_COEFFICIENTS.map((coefficient) =>
          Cartesian3.clone(coefficient),
        ),
    }
    environments.add(item)
    applyEnvironment(item)
    return {
      dispose() {
        if (!environments.delete(item) || resource.isDestroyed()) {
          return
        }
        resource.environmentMapManager.enabled = item.enabled
        resource.environmentMapManager.maximumSecondsDifference = item.secondsDifference
        setEnvironmentCoefficients(resource, item.coefficients)
      },
    }
  }

  function applyModel(item: ManagedModel, sunFixed: Cartesian3): boolean {
    if (item.disposed || item.model.isDestroyed()) {
      return false
    }
    const origin = item.origin()
    const altitude = solarHeightDegrees(origin, sunFixed)
    const nightFactor = 1 - smoothstep(NIGHT_HEIGHT_DEGREES, DAYLIGHT_HEIGHT_DEGREES, altitude)
    const directFactor = smoothstep(0, 6, altitude)
    if (item.usesSceneLight) {
      item.baseLightColor = sceneBaseLightColor(viewer)
      item.lastSceneLight = sceneLightSnapshot(viewer)
    }
    const diffuseFactor = 1 - 0.6 * nightFactor
    const specularFactor = mode === 'compatible' ? 0 : 1 - 0.4 * nightFactor
    const nextIbl = Cartesian2.fromElements(
      item.originalIblFactor.x * diffuseFactor,
      item.originalIblFactor.y * specularFactor,
    )
    const currentIbl = item.model.imageBasedLighting.imageBasedLightingFactor
    const nextLight = Cartesian3.multiplyByScalar(
      item.baseLightColor,
      directFactor,
      new Cartesian3(),
    )
    const warmth = 1 - smoothstep(2, 18, altitude)
    nextLight.y *= 1 - 0.22 * warmth
    nextLight.z *= 1 - 0.4 * warmth
    const currentLight = (item.model as Model & { lightColor?: Cartesian3 }).lightColor
    const changed =
      item.lastNightFactor !== nightFactor ||
      item.lastDirectFactor !== directFactor ||
      !Cartesian2.equalsEpsilon(currentIbl, nextIbl, 1e-7, 1e-7) ||
      !currentLight ||
      !Cartesian3.equalsEpsilon(currentLight, nextLight, 1e-7, 1e-7)
    item.shader.setUniform('u_nightFactor', nightFactor)
    item.shader.setUniform(
      'u_nightAmbient',
      mode === 'compatible' ? Cartesian3.ZERO : NIGHT_AMBIENT_COLOR,
    )
    item.model.imageBasedLighting.imageBasedLightingFactor = nextIbl
    ;(item.model as Model & { lightColor?: Cartesian3 }).lightColor = nextLight
    item.dirty = false
    item.lastNightFactor = nightFactor
    item.lastDirectFactor = directFactor
    return changed
  }

  function updateModels(time: JulianDate): void {
    if (disposed) {
      return
    }
    environments.forEach(applyEnvironment)
    if (registrations.size === 0) {
      return
    }
    const timeChanged = !lastTime || !JulianDate.equals(lastTime, time)
    const sceneLightChangedNow = [...registrations].some((item) => sceneLightChanged(item, viewer))
    if (!timeChanged && !sceneLightChangedNow && ![...registrations].some((item) => item.dirty)) {
      return
    }
    let sunFixed: Cartesian3 | undefined
    try {
      sunFixed = sunPositionFixed(time)
    } catch {
      return
    }
    if (!sunFixed) {
      return
    }
    lastTime = JulianDate.clone(time, lastTime)
    registrations.forEach(function updateModel(item) {
      if (item.disposed || (!timeChanged && !item.dirty && !sceneLightChanged(item, viewer))) {
        return
      }
      try {
        const changed = applyModel(item, sunFixed)
        if (changed) {
          viewer.scene.requestRender()
        }
      } catch {
        // A preUpdate listener must not stop Cesium's frame. Direct registration
        // updates still throw so the Data integration can report the failure.
        item.dirty = false
      }
    })
  }

  const removePreUpdateListener = viewer.scene.preUpdate.addEventListener(function onPreUpdate() {
    updateModels(viewer.clock.currentTime)
  })

  function applyQuality(item: ManagedModel): void {
    const tileset = item.quality?.tileset
    if (!tileset || tileset.isDestroyed()) {
      return
    }
    tileset.maximumScreenSpaceError = mode === 'performance' ? 5 : mode === 'balanced' ? 12 : 28
    tileset.cacheBytes = (mode === 'performance' ? 256 : mode === 'balanced' ? 128 : 48) * 1024 ** 2
    tileset.maximumCacheOverflowBytes =
      (mode === 'performance' ? 64 : mode === 'balanced' ? 32 : 16) * 1024 ** 2
    tileset.shadows = mode === 'compatible' ? ShadowMode.DISABLED : ShadowMode.ENABLED
  }

  function restoreQuality(item: ManagedModel): void {
    const quality = item.quality
    if (!quality || quality.tileset.isDestroyed()) {
      return
    }
    quality.tileset.maximumScreenSpaceError = quality.error
    quality.tileset.cacheBytes = quality.cache
    quality.tileset.maximumCacheOverflowBytes = quality.overflow
    quality.tileset.shadows = quality.shadows
  }

  function registerResource(
    model: Model | Cesium3DTileset,
    origin: () => Cartesian3,
    tileset?: Cesium3DTileset,
  ): GeoModelRenderingRegistration {
    if (disposed) {
      throw new Error('Geo model rendering manager has been disposed')
    }
    if (model.isDestroyed()) {
      throw new Error('无法为已销毁的模型启用昼夜渲染')
    }
    if ([...registrations].some((item) => item.model === model && !item.disposed)) {
      throw new Error('模型已经注册统一昼夜渲染')
    }
    origin()
    const currentTime = viewer.clock.currentTime
    const sunFixed = sunPositionFixed(currentTime)
    if (!sunFixed) {
      throw new Error('无法根据当前仿真时间计算太阳位置')
    }
    const shader = createModelShader()
    const configuredLightColor = (model as Model & { lightColor?: Cartesian3 }).lightColor
    const managed: ManagedModel = {
      model,
      origin,
      quality: tileset
        ? {
            tileset,
            shadows: tileset.shadows,
            error: tileset.maximumScreenSpaceError,
            cache: tileset.cacheBytes,
            overflow: tileset.maximumCacheOverflowBytes,
          }
        : undefined,
      shader,
      originalShader: model.customShader,
      originalLightColor: configuredLightColor
        ? Cartesian3.clone(configuredLightColor, new Cartesian3())
        : undefined,
      baseLightColor: configuredLightColor
        ? Cartesian3.clone(configuredLightColor, new Cartesian3())
        : sceneBaseLightColor(viewer),
      usesSceneLight: !configuredLightColor,
      originalIblFactor: Cartesian2.clone(model.imageBasedLighting.imageBasedLightingFactor),
      environment: registerEnvironment(model),
      dirty: true,
      disposed: false,
      lastNightFactor: undefined,
      lastDirectFactor: undefined,
      lastSceneLight: undefined,
    }
    try {
      model.customShader = shader
      registrations.add(managed)
      applyQuality(managed)
      const changed = applyModel(managed, sunFixed)
      if (changed) {
        viewer.scene.requestRender()
      }
      return {
        update() {
          if (!managed.disposed) {
            managed.dirty = true
            const sunFixed = sunPositionFixed(viewer.clock.currentTime)
            if (!sunFixed) {
              throw new Error('无法根据当前仿真时间计算太阳位置')
            }
            if (applyModel(managed, sunFixed)) {
              viewer.scene.requestRender()
            }
          }
        },
        dispose() {
          if (managed.disposed) {
            return
          }
          managed.disposed = true
          registrations.delete(managed)
          try {
            if (!model.isDestroyed()) {
              restoreQuality(managed)
              model.customShader = managed.originalShader
              model.imageBasedLighting.imageBasedLightingFactor = managed.originalIblFactor
              ;(model as unknown as { lightColor: Cartesian3 | undefined }).lightColor =
                managed.originalLightColor
            }
          } finally {
            managed.environment.dispose()
            shader.destroy()
          }
        },
      }
    } catch (error) {
      registrations.delete(managed)
      try {
        if (!model.isDestroyed()) {
          restoreQuality(managed)
          model.customShader = managed.originalShader
          model.imageBasedLighting.imageBasedLightingFactor = managed.originalIblFactor
          ;(model as unknown as { lightColor: Cartesian3 | undefined }).lightColor =
            managed.originalLightColor
        }
      } finally {
        managed.environment.dispose()
        shader.destroy()
      }
      throw error
    }
  }

  function register(model: Model): GeoModelRenderingRegistration {
    return registerResource(model, function modelOrigin() {
      return resolveOrigin(model)
    })
  }

  function registerTileset(
    tileset: Cesium3DTileset,
    position: Cartesian3,
  ): GeoModelRenderingRegistration {
    if (tileset.style || tileset.customShader) {
      throw new Error('瓦片已有样式，无法同时启用地标街区昼夜材质。')
    }
    const origin = Cartesian3.clone(position)
    const location = Cartographic.fromCartesian(origin)
    if (!location || !Number.isFinite(location.height)) {
      throw new Error('街区的 WGS84 锚点无效。')
    }
    return registerResource(
      tileset,
      function contextOrigin() {
        return origin
      },
      tileset,
    )
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    removePreUpdateListener()
    registrations.forEach(function disposeModel(item) {
      item.disposed = true
      try {
        if (!item.model.isDestroyed()) {
          restoreQuality(item)
          item.model.customShader = item.originalShader
          item.model.imageBasedLighting.imageBasedLightingFactor = item.originalIblFactor
          ;(item.model as unknown as { lightColor: Cartesian3 | undefined }).lightColor =
            item.originalLightColor
        }
      } catch {
        // Continue restoring and destroying the remaining model registrations.
      } finally {
        item.environment.dispose()
        try {
          item.shader.destroy()
        } catch {
          // Continue cleaning up the remaining registrations.
        }
      }
    })
    registrations.clear()
    environments.forEach(function restoreEnvironment(item) {
      if (!item.resource.isDestroyed()) {
        item.resource.environmentMapManager.enabled = item.enabled
        item.resource.environmentMapManager.maximumSecondsDifference = item.secondsDifference
        setEnvironmentCoefficients(item.resource, item.coefficients)
      }
    })
    environments.clear()
  }

  return {
    register,
    registerTileset,
    registerEnvironment,
    setMode(nextMode) {
      if (disposed) {
        return
      }
      mode = nextMode
      registrations.forEach(function markDirty(item) {
        item.dirty = true
        applyQuality(item)
      })
      lastTime = undefined
      updateModels(viewer.clock.currentTime)
      viewer.scene.requestRender()
    },
    getFocusPosition() {
      let position: Cartesian3 | undefined
      for (const item of registrations) {
        if (item.disposed || !item.model.show || item.model.isDestroyed()) {
          continue
        }
        try {
          position = item.origin()
        } catch {
          // One invalid placement must not stop the scene's environment updates.
        }
      }
      return position
    },
    dispose,
  }
}
