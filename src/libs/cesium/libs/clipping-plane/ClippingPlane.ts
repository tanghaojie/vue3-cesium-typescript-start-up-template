import * as Cesium from 'cesium'

class ClippingPlane {
  private viewer: Cesium.Viewer

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  public loadModel(url: string): void {
    const clippingPlanes = new Cesium.ClippingPlaneCollection({
      planes: [
        new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 0.0, -1.0), 0.0),
      ],
      edgeWidth: 1.0,
    })

    const position = Cesium.Cartesian3.fromDegrees(
      -123.0744619,
      44.0503706,
      300.0
    )
    const heading = Cesium.Math.toRadians(135.0)
    const pitch = 0.0
    const roll = 0.0
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll)
    const x = Cesium.Transforms.headingPitchRollQuaternion(position, hpr)
    const entity = this.viewer.entities.add({
      name: url,
      position: position,
      // orientation: x,
      model: {
        uri: url,
        scale: 8,
        minimumPixelSize: 100.0,
        clippingPlanes: clippingPlanes,
      },
    })

    this.viewer.trackedEntity = entity
  }
}

export default ClippingPlane
