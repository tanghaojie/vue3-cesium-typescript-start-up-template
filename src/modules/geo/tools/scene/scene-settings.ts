import { Color, SkyBox, type Viewer } from 'cesium'

export interface GeoSceneSettings {
  readonly sun: boolean
  readonly moon: boolean
  readonly atmosphere: boolean
  readonly lighting: boolean
  readonly skyBox: boolean
  readonly shadows: boolean
  readonly depthTestAgainstTerrain: boolean
  readonly groundAtmosphere: boolean
  readonly globeBaseColor: string
  readonly sunGlowFactor: number
  readonly shadowDarkness: number
}

export type GeoSceneSettingsPatch = Partial<GeoSceneSettings>

function colorToCss(color: Color): string {
  return color.toCssColorString()
}

export function getGeoSceneSettings(viewer: Viewer): GeoSceneSettings {
  const sun = viewer.scene.sun
  const moon = viewer.scene.moon
  return {
    sun: sun?.show ?? false,
    moon: moon?.show ?? false,
    atmosphere: viewer.scene.skyAtmosphere?.show ?? false,
    lighting: viewer.scene.globe.enableLighting,
    skyBox: viewer.scene.skyBox !== undefined,
    shadows: viewer.scene.shadowMap.enabled,
    depthTestAgainstTerrain: viewer.scene.globe.depthTestAgainstTerrain,
    groundAtmosphere: viewer.scene.globe.showGroundAtmosphere,
    globeBaseColor: colorToCss(viewer.scene.globe.baseColor),
    sunGlowFactor: sun?.glowFactor ?? 0,
    shadowDarkness: viewer.scene.shadowMap.darkness,
  }
}

export function setGeoSceneSettings(
  viewer: Viewer,
  patch: GeoSceneSettingsPatch,
): GeoSceneSettings {
  if (patch.sun !== undefined && viewer.scene.sun) {
    viewer.scene.sun.show = patch.sun
  }
  if (patch.moon !== undefined && viewer.scene.moon) {
    viewer.scene.moon.show = patch.moon
  }
  if (patch.atmosphere !== undefined && viewer.scene.skyAtmosphere) {
    viewer.scene.skyAtmosphere.show = patch.atmosphere
  }
  if (patch.lighting !== undefined) {
    viewer.scene.globe.enableLighting = patch.lighting
  }
  if (patch.skyBox !== undefined) {
    if (patch.skyBox && viewer.scene.skyBox === undefined) {
      viewer.scene.skyBox = SkyBox.createEarthSkyBox()
    } else if (!patch.skyBox && viewer.scene.skyBox) {
      viewer.scene.skyBox = undefined
    }
  }
  if (patch.shadows !== undefined) {
    viewer.scene.shadowMap.enabled = patch.shadows
  }
  if (patch.depthTestAgainstTerrain !== undefined) {
    viewer.scene.globe.depthTestAgainstTerrain = patch.depthTestAgainstTerrain
  }
  if (patch.groundAtmosphere !== undefined) {
    viewer.scene.globe.showGroundAtmosphere = patch.groundAtmosphere
  }
  if (patch.globeBaseColor !== undefined) {
    viewer.scene.globe.baseColor = Color.fromCssColorString(patch.globeBaseColor)
  }
  if (patch.sunGlowFactor !== undefined && viewer.scene.sun) {
    viewer.scene.sun.glowFactor = Math.max(0, patch.sunGlowFactor)
  }
  if (patch.shadowDarkness !== undefined) {
    viewer.scene.shadowMap.darkness = Math.min(1, Math.max(0, patch.shadowDarkness))
  }
  viewer.scene.requestRender()
  return getGeoSceneSettings(viewer)
}

export function toggleGeoSceneSetting(
  viewer: Viewer,
  key: keyof Pick<
    GeoSceneSettings,
    | 'sun'
    | 'moon'
    | 'atmosphere'
    | 'lighting'
    | 'skyBox'
    | 'shadows'
    | 'depthTestAgainstTerrain'
    | 'groundAtmosphere'
  >,
): GeoSceneSettings {
  const current = getGeoSceneSettings(viewer)
  return setGeoSceneSettings(viewer, { [key]: !current[key] })
}
