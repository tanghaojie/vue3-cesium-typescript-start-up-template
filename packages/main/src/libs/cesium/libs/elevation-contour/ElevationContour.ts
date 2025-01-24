import { Viewer, Material } from 'cesium'

class ElevationContour {
  private viewer: Viewer

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  public show(): void {
    const { viewer } = this
    viewer.scene.globe.material = Material.fromType('ElevationContour')
  }

  public remove(): void {
    const { viewer } = this
    ;(viewer.scene.globe.material as any) = undefined
  }
}

export default ElevationContour
