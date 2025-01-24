import {
  Viewer,
  Color,
  HeightReference,
  Cesium3DTileset,
  Model,
  Resource,
  ShadowMode,
  Matrix4,
  ClippingPlaneCollection,
  ClassificationType,
  Ellipsoid,
  Cartesian2,
  Cartesian3,
  Scene,
  DistanceDisplayCondition,
  ColorBlendMode,
  Credit,
} from 'cesium'
import uuid from '@/libs/utils/uuid'

export type JTPrimitive = {
  name: string
  uuid: string
  show: boolean
  cesiumPrimitiveIndex: number
}

class PrimitiveManager {
  private viewer: Viewer

  public jtPrimitives: JTPrimitive[] = []
  public static PRIMITIVE_MANAGER_FLAG_VALUE = '__JT_PRI_F'

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  public syncJTPrimitives(
    inManagedPrimitiveOnly: boolean = true
  ): JTPrimitive[] {
    this.jtPrimitives.splice(0, this.jtPrimitives.length)
    const pris = this.viewer.scene.primitives
    const len = pris.length
    for (let i = len - 1; i >= 0; --i) {
      const model = pris.get(i)
      if (!(model instanceof Cesium3DTileset || model instanceof Model)) {
        continue
      }
      if (
        inManagedPrimitiveOnly &&
        model._PriManagFlag !== PrimitiveManager.PRIMITIVE_MANAGER_FLAG_VALUE
      ) {
        continue
      }
      this.jtPrimitives.push({
        name: model.name || '<NoneName>',
        uuid: model.uuid || '<NoneUuid>',
        show: model.show,
        cesiumPrimitiveIndex: i,
      })
    }
    return this.jtPrimitives
  }

  public add3DTileset(option: {
    name: string
    // cesium default
    url: Resource | string | Promise<Resource> | Promise<string>
    show?: boolean
    modelMatrix?: Matrix4
    shadows?: ShadowMode
    maximumScreenSpaceError?: number
    maximumMemoryUsage?: number
    cullWithChildrenBounds?: boolean
    cullRequestsWhileMoving?: boolean
    cullRequestsWhileMovingMultiplier?: number
    preloadWhenHidden?: boolean
    preloadFlightDestinations?: boolean
    preferLeaves?: boolean
    dynamicScreenSpaceError?: boolean
    dynamicScreenSpaceErrorDensity?: number
    dynamicScreenSpaceErrorFactor?: number
    dynamicScreenSpaceErrorHeightFalloff?: number
    progressiveResolutionHeightFraction?: number
    foveatedScreenSpaceError?: boolean
    foveatedConeSize?: number
    foveatedMinimumScreenSpaceErrorRelaxation?: number
    foveatedInterpolationCallback?: Cesium3DTileset.foveatedInterpolationCallback
    foveatedTimeDelay?: number
    skipLevelOfDetail?: boolean
    baseScreenSpaceError?: number
    skipScreenSpaceErrorFactor?: number
    skipLevels?: number
    immediatelyLoadDesiredLevelOfDetail?: boolean
    loadSiblings?: boolean
    clippingPlanes?: ClippingPlaneCollection
    classificationType?: ClassificationType
    ellipsoid?: Ellipsoid
    pointCloudShading?: any
    imageBasedLightingFactor?: Cartesian2
    lightColor?: Cartesian3
    luminanceAtZenith?: number
    sphericalHarmonicCoefficients?: Cartesian3[]
    specularEnvironmentMaps?: string
    backFaceCulling?: boolean
    showOutline?: boolean
    vectorClassificationOnly?: boolean
    vectorKeepDecodedPositions?: boolean
    debugHeatmapTilePropertyName?: string
    debugFreezeFrame?: boolean
    debugColorizeTiles?: boolean
    debugWireframe?: boolean
    debugShowBoundingVolume?: boolean
    debugShowContentBoundingVolume?: boolean
    debugShowViewerRequestVolume?: boolean
    debugShowGeometricError?: boolean
    debugShowRenderingStatistics?: boolean
    debugShowMemoryUsage?: boolean
    debugShowUrl?: boolean
  }): Cesium3DTileset {
    const c3Dtileset = new Cesium3DTileset({
      ...option,
    })

    c3Dtileset._PriManagFlag = PrimitiveManager.PRIMITIVE_MANAGER_FLAG_VALUE
    c3Dtileset.name = option.name
    c3Dtileset.uuid = uuid()
    c3Dtileset.show = option.show || false

    this.viewer.scene.primitives.add(c3Dtileset)

    this.syncJTPrimitives()
    return c3Dtileset
  }

  public addGltf(option: {
    name: string
    // cesium default
    url: Resource | string
    basePath?: Resource | string
    show?: boolean
    modelMatrix?: Matrix4
    scale?: number
    minimumPixelSize?: number
    maximumScale?: number
    id?: any
    allowPicking?: boolean
    incrementallyLoadTextures?: boolean
    asynchronous?: boolean
    clampAnimations?: boolean
    shadows?: ShadowMode
    debugShowBoundingVolume?: boolean
    debugWireframe?: boolean
    heightReference?: HeightReference
    scene?: Scene
    distanceDisplayCondition?: DistanceDisplayCondition
    color?: Color
    colorBlendMode?: ColorBlendMode
    colorBlendAmount?: number
    silhouetteColor?: Color
    silhouetteSize?: number
    clippingPlanes?: ClippingPlaneCollection
    dequantizeInShader?: boolean
    credit?: Credit | string
    backFaceCulling?: boolean
    showOutline?: boolean
  }): Model {
    const gltf = Model.fromGltf({
      ...option,
    })

    gltf._PriManagFlag = PrimitiveManager.PRIMITIVE_MANAGER_FLAG_VALUE
    gltf.name = option.name
    gltf.uuid = uuid()
    gltf.show = option.show || false
    this.viewer.scene.primitives.add(gltf)

    this.syncJTPrimitives()
    return gltf
  }

  public getPrimitiveByJTPrimitiveIndex(
    index: number,
    inManagedPrimitiveOnly: boolean = true
  ): any {
    this.syncJTPrimitives(inManagedPrimitiveOnly)
    return this.viewer.scene.primitives.get(
      this.jtPrimitives[index].cesiumPrimitiveIndex
    )
  }

  public getPrimitiveByJTPrimitive(jtPrimitive: JTPrimitive): any {
    return this.viewer.scene.primitives.get(jtPrimitive.cesiumPrimitiveIndex)
  }

  public removePrimitive(
    index: number,
    inManagedPrimitiveOnly: boolean = true
  ): void {
    this.viewer.scene.primitives.remove(
      this.getPrimitiveByJTPrimitiveIndex(index, inManagedPrimitiveOnly)
    )
    this.syncJTPrimitives(inManagedPrimitiveOnly)
  }

  public removeAll(inManagedPrimitiveOnly: boolean = true): void {
    let model = this.viewer.scene.primitives.get(0)

    while (model) {
      if (model instanceof Cesium3DTileset || model instanceof Model) {
        if (
          inManagedPrimitiveOnly &&
          model._PriManagFlag !== PrimitiveManager.PRIMITIVE_MANAGER_FLAG_VALUE
        ) {
          continue
        }
        this.viewer.scene.primitives.remove(model)
      }

      model = this.viewer.scene.primitives.get(0)
    }

    this.syncJTPrimitives(inManagedPrimitiveOnly)
  }
}

export default PrimitiveManager
