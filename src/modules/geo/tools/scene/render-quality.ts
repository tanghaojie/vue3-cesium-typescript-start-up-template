import {
  Cartesian2,
  Cartesian3,
  DynamicAtmosphereLightingType,
  JulianDate,
  PostProcessStage,
  PostProcessStageComposite,
  PostProcessStageLibrary,
  PostProcessStageSampleMode,
  SceneMode,
  Tonemapper,
  type Viewer,
} from 'cesium'
import {
  createGeoRenderPerformanceController,
  type GeoRenderMode,
} from '../../core/render-performance'
import type { GeoModelRenderingManager } from './model-rendering'
import { getGeoSceneSettings, setGeoSceneSettings } from './scene-settings'
import { smoothstep, solarHeightDegrees, sunPositionFixed } from './solar-lighting'

export function createGeoRenderQuality(viewer: Viewer, models: GeoModelRenderingManager) {
  const scene = viewer.scene
  const original = getGeoSceneSettings(viewer)
  const post = scene.postProcessStages
  const originalRenderer = {
    hdr: scene.highDynamicRange,
    msaa: scene.msaaSamples,
    sunBloom: scene.sunBloom,
    dynamicLighting: scene.atmosphere.dynamicLighting,
    atmosphereFromSun: scene.globe.dynamicAtmosphereLightingFromSun,
    lightingFadeOut: scene.globe.lightingFadeOutDistance,
    lightingFadeIn: scene.globe.lightingFadeInDistance,
    nightFadeOut: scene.globe.nightFadeOutDistance,
    nightFadeIn: scene.globe.nightFadeInDistance,
    shadowSize: scene.shadowMap.size,
    shadowSoft: scene.shadowMap.softShadows,
    shadowDistance: scene.shadowMap.maximumDistance,
    exposure: post.exposure,
    tonemapper: post.tonemapper,
    aoEnabled: post.ambientOcclusion.enabled,
    aoIntensity: post.ambientOcclusion.uniforms.intensity,
    aoDirectionCount: post.ambientOcclusion.uniforms.directionCount,
    aoStepCount: post.ambientOcclusion.uniforms.stepCount,
    fxaa: post.fxaa.enabled,
    bloom: post.bloom.enabled,
  }
  const resolution = createGeoRenderPerformanceController(viewer)
  let mode: GeoRenderMode = 'balanced'
  let nightFactor = 0
  let lastTime: JulianDate | undefined
  let lastPosition: Cartesian3 | undefined
  let disposed = false

  const highlights = new PostProcessStage({
    name: 'geo_showcase_highlights',
    textureScale: 0.5,
    sampleMode: PostProcessStageSampleMode.LINEAR,
    fragmentShader: `
      uniform sampler2D colorTexture;
      in vec2 v_textureCoordinates;
      void main() {
        vec3 color = texture(colorTexture, v_textureCoordinates).rgb;
        float brightness = max(max(color.r, color.g), color.b);
        float weight = smoothstep(0.82, 0.98, brightness);
        out_FragColor = vec4(color * weight, 1.0);
      }
    `,
  })
  const blend = new PostProcessStage({
    name: 'geo_showcase_glow_blend',
    sampleMode: PostProcessStageSampleMode.LINEAR,
    uniforms: {
      highlightsTexture: highlights.name,
      strength: () => nightFactor * 0.12,
      texelStep: () =>
        new Cartesian2(4 / Math.max(scene.canvas.width, 1), 4 / Math.max(scene.canvas.height, 1)),
    },
    fragmentShader: `
      uniform sampler2D colorTexture;
      uniform sampler2D highlightsTexture;
      uniform vec2 texelStep;
      uniform float strength;
      in vec2 v_textureCoordinates;
      void main() {
        vec2 uv = v_textureCoordinates;
        vec3 glow = texture(highlightsTexture, uv).rgb * 0.25;
        glow += texture(highlightsTexture, uv + vec2(texelStep.x, 0.0)).rgb * 0.125;
        glow += texture(highlightsTexture, uv - vec2(texelStep.x, 0.0)).rgb * 0.125;
        glow += texture(highlightsTexture, uv + vec2(0.0, texelStep.y)).rgb * 0.125;
        glow += texture(highlightsTexture, uv - vec2(0.0, texelStep.y)).rgb * 0.125;
        glow += texture(highlightsTexture, uv + texelStep).rgb * 0.0625;
        glow += texture(highlightsTexture, uv - texelStep).rgb * 0.0625;
        glow += texture(highlightsTexture, uv + vec2(texelStep.x, -texelStep.y)).rgb * 0.0625;
        glow += texture(highlightsTexture, uv + vec2(-texelStep.x, texelStep.y)).rgb * 0.0625;
        vec4 base = texture(colorTexture, uv);
        out_FragColor = vec4(base.rgb + glow * strength, base.a);
      }
    `,
  })
  const glow = post.add(
    new PostProcessStageComposite({
      name: 'geo_showcase_glow',
      stages: [highlights, blend],
      inputPreviousStageTexture: false,
    }),
  )
  glow.enabled = false

  function update(): void {
    if (disposed || viewer.isDestroyed()) {
      return
    }
    const in3D = scene.mode === SceneMode.SCENE3D
    scene.globe.lightingFadeOutDistance = in3D ? 0 : originalRenderer.lightingFadeOut
    scene.globe.lightingFadeInDistance = in3D ? 1 : originalRenderer.lightingFadeIn
    scene.globe.nightFadeOutDistance = in3D ? 0 : originalRenderer.nightFadeOut
    scene.globe.nightFadeInDistance = in3D ? 1 : originalRenderer.nightFadeIn
    post.ambientOcclusion.enabled =
      mode === 'performance' && in3D && PostProcessStageLibrary.isAmbientOcclusionSupported(scene)
    const position = models.getFocusPosition() ?? viewer.camera.positionWC
    const time = viewer.clock.currentTime
    if (
      in3D &&
      (!lastTime ||
        !JulianDate.equals(lastTime, time) ||
        !lastPosition ||
        !Cartesian3.equalsEpsilon(lastPosition, position, 1e-7, 0.1))
    ) {
      try {
        const sun = sunPositionFixed(time)
        if (sun) {
          nightFactor = 1 - smoothstep(-6, 2, solarHeightDegrees(position, sun))
          lastTime = JulianDate.clone(time, lastTime)
          lastPosition = Cartesian3.clone(position, lastPosition)
        }
      } catch {
        // Keep the last exposure if a transient camera/time value cannot be evaluated.
        // A preUpdate listener must not interrupt Cesium's frame.
      }
    }
    post.exposure =
      mode === 'compatible' || !in3D ? originalRenderer.exposure : 1 + nightFactor * 0.08
    glow.enabled = mode === 'performance' && in3D && nightFactor > 0.001
  }

  function setMode(nextMode: GeoRenderMode): void {
    if (disposed) {
      return
    }
    mode = nextMode
    const compatible = mode === 'compatible'
    resolution.setMode(mode)
    scene.highDynamicRange = !compatible && scene.highDynamicRangeSupported
    scene.msaaSamples = mode === 'performance' ? 4 : mode === 'balanced' ? 2 : 1
    scene.sunBloom = !compatible
    scene.atmosphere.dynamicLighting = compatible
      ? DynamicAtmosphereLightingType.NONE
      : DynamicAtmosphereLightingType.SUNLIGHT
    scene.globe.dynamicAtmosphereLightingFromSun = true
    scene.shadowMap.size = mode === 'performance' ? 4096 : 2048
    scene.shadowMap.softShadows = !compatible
    scene.shadowMap.maximumDistance = 3000
    post.tonemapper = Tonemapper.PBR_NEUTRAL
    post.bloom.enabled = false
    post.fxaa.enabled = false
    post.ambientOcclusion.uniforms.intensity = 0.8
    post.ambientOcclusion.uniforms.directionCount = 4
    post.ambientOcclusion.uniforms.stepCount = 8
    setGeoSceneSettings(viewer, {
      sun: !compatible,
      moon: !compatible,
      atmosphere: !compatible,
      groundAtmosphere: !compatible,
      lighting: true,
      shadows: !compatible,
      depthTestAgainstTerrain: true,
      shadowDarkness: 0.28,
      sunGlowFactor: compatible ? 0 : 0.35,
    })
    models.setMode(mode)
    update()
    scene.requestRender()
  }

  const removeUpdate = scene.preUpdate.addEventListener(update)
  setMode('balanced')

  return {
    acquireFixedResolution: resolution.acquireFixedResolution,
    setMode,
    dispose() {
      if (disposed) {
        return
      }
      disposed = true
      removeUpdate()
      resolution.dispose()
      if (viewer.isDestroyed()) {
        return
      }
      post.remove(glow)
      scene.highDynamicRange = originalRenderer.hdr
      scene.msaaSamples = originalRenderer.msaa
      scene.sunBloom = originalRenderer.sunBloom
      scene.atmosphere.dynamicLighting = originalRenderer.dynamicLighting
      scene.globe.dynamicAtmosphereLightingFromSun = originalRenderer.atmosphereFromSun
      scene.globe.lightingFadeOutDistance = originalRenderer.lightingFadeOut
      scene.globe.lightingFadeInDistance = originalRenderer.lightingFadeIn
      scene.globe.nightFadeOutDistance = originalRenderer.nightFadeOut
      scene.globe.nightFadeInDistance = originalRenderer.nightFadeIn
      scene.shadowMap.size = originalRenderer.shadowSize
      scene.shadowMap.softShadows = originalRenderer.shadowSoft
      scene.shadowMap.maximumDistance = originalRenderer.shadowDistance
      post.tonemapper = originalRenderer.tonemapper
      post.exposure = originalRenderer.exposure
      post.ambientOcclusion.enabled = originalRenderer.aoEnabled
      post.ambientOcclusion.uniforms.intensity = originalRenderer.aoIntensity
      post.ambientOcclusion.uniforms.directionCount = originalRenderer.aoDirectionCount
      post.ambientOcclusion.uniforms.stepCount = originalRenderer.aoStepCount
      post.fxaa.enabled = originalRenderer.fxaa
      post.bloom.enabled = originalRenderer.bloom
      setGeoSceneSettings(viewer, {
        sun: original.sun,
        moon: original.moon,
        atmosphere: original.atmosphere,
        groundAtmosphere: original.groundAtmosphere,
        lighting: original.lighting,
        shadows: original.shadows,
        depthTestAgainstTerrain: original.depthTestAgainstTerrain,
        shadowDarkness: original.shadowDarkness,
        sunGlowFactor: original.sunGlowFactor,
      })
    },
  }
}
