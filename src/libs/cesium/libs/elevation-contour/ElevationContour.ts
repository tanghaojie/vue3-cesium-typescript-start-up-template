import * as Cesium from 'cesium'

class ElevationContour {
  private viewer: Cesium.Viewer

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  public show(): void {
    const { viewer } = this
    viewer.scene.globe.material = Cesium.Material.fromType('ElevationContour')
  }

  public remove(): void {
    const { viewer } = this
    ;(viewer.scene.globe.material as any) = undefined
  }
}

export default ElevationContour
