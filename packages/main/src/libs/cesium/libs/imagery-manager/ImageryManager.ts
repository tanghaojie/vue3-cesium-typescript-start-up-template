import { Viewer, ImageryLayer } from 'cesium'
import * as Cesium from 'cesium'
import ImageryLayerCoordinateTransform, {
  CoordinateType,
} from '@/libs/cesium/libs/imagery-layer-coordinate-transform/ImageryLayerCoordinateTransform'
import uuid from '@/libs/utils/uuid'

export type ImagerySource = {
  name: string
  iconImageUrl: string
  providerName: string
  afterReady?: (viewer: Viewer, success: boolean) => void
  options?: any
  coordinateType?: CoordinateType
}

export type Imagery = {
  name: string
  uuid: string
  providerName: string
  show: boolean
  cesiumLayerIndex: number
}

class ImageryManager {
  private viewer: Viewer

  public imageries: Imagery[] = []

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  public syncImageries(): Imagery[] {
    const { viewer } = this

    this.imageries.splice(0, this.imageries.length)

    const ils = viewer.imageryLayers
    const len = ils.length
    for (let i = len - 1; i >= 0; --i) {
      const layer: ImageryLayer = ils.get(i)
      this.imageries.push({
        name: layer.name || '<Unknown>',
        uuid: layer.uuid || '<Unknown>',
        providerName: layer.imageryProvider.constructor.name,
        show: layer.show,
        cesiumLayerIndex: i,
      })
    }
    return this.imageries
  }

  public addImagery(item: ImagerySource): ImageryLayer | undefined {
    const { viewer } = this
    const provider = new (Cesium as any)[item.providerName]({
      ...(item.options || {}),
    })

    provider.readyPromise.then((success: boolean): void => {
      if (item.coordinateType) {
        layer.coordinateTransform = new ImageryLayerCoordinateTransform(
          layer,
          item.coordinateType,
          true
        )
      }

      item.afterReady && item.afterReady(viewer, success)
    })
    const layer = new ImageryLayer(provider)
    layer.name = item.name
    layer.uuid = uuid()

    const ils = viewer.imageryLayers
    ils.add(layer)
    this.syncImageries()
    return layer
  }

  public getLayer(index: number): ImageryLayer {
    this.syncImageries()
    return this.viewer.imageryLayers.get(this.imageries[index].cesiumLayerIndex)
  }

  public removeLayer(index: number): void {
    this.viewer.imageryLayers.remove(this.getLayer(index))
    this.syncImageries()
  }

  public removeAll(): void {
    this.viewer.imageryLayers.removeAll()
    this.syncImageries()
  }
}

export default ImageryManager
