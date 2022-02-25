import { Cartesian3, Cartographic, Math, ImageryLayer } from 'cesium'
import CoordinateTransform from '@/libs/utils/CoordinateTransform'

export enum CoordinateType {
  Wgs84,
  Gcj02,
  Bd09,
}

class ImageryLayerCoordinateTransform {
  protected layer: ImageryLayer

  private projectionTransform: (x: number, y: number) => [number, number]
  private unprojectionTransform: (x: number, y: number) => [number, number]

  private static OLD_PROJECT_PROPERTY_NAME = 'old_project'
  private static OLD_UNPROJECT_PROPERTY_NAME = 'old_unproject'

  private _coordinateType: CoordinateType
  public get coordinateType(): CoordinateType {
    return this._coordinateType
  }

  private _correctOffset: boolean = false
  public get correctOffset(): boolean {
    return this._correctOffset
  }
  public set correctOffset(val: boolean) {
    if (this._correctOffset === val) {
      return
    }
    this._correctOffset = val
    const { layer } = this
    const provider = layer.imageryProvider
    if (val) {
      const webMercatorTilingScheme = provider.tilingScheme
      const projection = (webMercatorTilingScheme as any).projection

      const { projectionTransform, unprojectionTransform } = this

      ;(projection as any)[
        ImageryLayerCoordinateTransform.OLD_PROJECT_PROPERTY_NAME
      ] = projection.project
      projection.project = function (cartographic: Cartographic) {
        const point = projectionTransform(
          Math.toDegrees(cartographic.longitude),
          Math.toDegrees(cartographic.latitude)
        )
        return (projection as any)[
          ImageryLayerCoordinateTransform.OLD_PROJECT_PROPERTY_NAME
        ](new Cartographic(Math.toRadians(point[0]), Math.toRadians(point[1])))
      }
      ;(projection as any)[
        ImageryLayerCoordinateTransform.OLD_UNPROJECT_PROPERTY_NAME
      ] = projection.unproject
      projection.unproject = function (cartesian: Cartesian3) {
        const cartographic = (projection as any)[
          ImageryLayerCoordinateTransform.OLD_UNPROJECT_PROPERTY_NAME
        ](cartesian)
        const point = unprojectionTransform(
          Math.toDegrees(cartographic.longitude),
          Math.toDegrees(cartographic.latitude)
        )
        return new Cartographic(
          Math.toRadians(point[0]),
          Math.toRadians(point[1])
        )
      }
    } else {
      const webMercatorTilingScheme = provider.tilingScheme
      const projection = webMercatorTilingScheme.projection
      const oldProject = (projection as any)[
        ImageryLayerCoordinateTransform.OLD_PROJECT_PROPERTY_NAME
      ]
      if (oldProject) {
        projection.project = oldProject
      }

      const oldUnproject = (projection as any)[
        ImageryLayerCoordinateTransform.OLD_UNPROJECT_PROPERTY_NAME
      ]
      if (oldUnproject) {
        projection.unproject = oldUnproject
      }
    }
  }

  constructor(
    layer: ImageryLayer,
    coordinateType: CoordinateType,
    defaultCorrentOffset: boolean = false
  ) {
    this.layer = layer
    this._coordinateType = coordinateType
    if (coordinateType === CoordinateType.Gcj02) {
      this.projectionTransform = CoordinateTransform.wgs84togcj02
      this.unprojectionTransform = CoordinateTransform.gcj02towgs84
    } else if (coordinateType === CoordinateType.Bd09) {
      this.projectionTransform = (x, y) => {
        const [xx, yy] = CoordinateTransform.wgs84togcj02(x, y)
        return CoordinateTransform.gcj02tobd09(xx, yy)
      }
      this.unprojectionTransform = (x, y) => {
        const [xx, yy] = CoordinateTransform.bd09togcj02(x, y)
        return CoordinateTransform.gcj02towgs84(xx, yy)
      }
    } else {
      this.projectionTransform = (x, y) => [x, y]
      this.unprojectionTransform = (x, y) => [x, y]
    }

    if (defaultCorrentOffset) {
      this.correctOffset = defaultCorrentOffset
    }
  }
}

export default ImageryLayerCoordinateTransform
