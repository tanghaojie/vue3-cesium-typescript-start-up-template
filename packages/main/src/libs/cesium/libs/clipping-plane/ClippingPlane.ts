import {
  Viewer,
  Color,
  Cesium3DTileset,
  Model,
  ClippingPlaneCollection,
  Cartesian3,
  ClippingPlane as CesiumClippingPlane,
} from 'cesium'

class ClippingPlane {
  private viewer: Viewer

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  public createOrUpdateOnly1Plane(
    primitive: Cesium3DTileset | Model,
    x: number,
    y: number,
    z: number,
    distance: number,
    option: {
      edgeColor: Color
      edgeWidth: number
    } = {
      edgeColor: Color.RED,
      edgeWidth: 10,
    }
  ): void {
    // not has clippingPlanes
    if (!primitive.clippingPlanes || primitive.clippingPlanes.isDestroyed()) {
      primitive.clippingPlanes = new ClippingPlaneCollection({
        planes: [new CesiumClippingPlane(new Cartesian3(x, y, z), distance)],
        edgeWidth: option.edgeWidth,
        edgeColor: option.edgeColor,
      })
    } else {
      const cpLen = primitive.clippingPlanes.length
      // more than 1 clippingPlanes
      // remove and renew
      if (cpLen !== 1) {
        cpLen > 0 && primitive.clippingPlanes.removeAll()
        ;(primitive as any).clippingPlanes = undefined

        primitive.clippingPlanes = new ClippingPlaneCollection({
          planes: [new CesiumClippingPlane(new Cartesian3(x, y, z), distance)],
          edgeWidth: option.edgeWidth,
          edgeColor: option.edgeColor,
        })
      } else {
        primitive.clippingPlanes.edgeWidth !== option.edgeWidth &&
          (primitive.clippingPlanes.edgeWidth = option.edgeWidth)
        primitive.clippingPlanes.edgeColor !== option.edgeColor &&
          (primitive.clippingPlanes.edgeColor = option.edgeColor)

        const cp = primitive.clippingPlanes.get(0)
        cp.distance !== distance && (cp.distance = distance)
        cp.normal.x !== x && (cp.normal.x = x)
        cp.normal.y !== y && (cp.normal.y = y)
        cp.normal.z !== z && (cp.normal.z = z)
      }
    }
  }

  public removeAllPrimitiveClippingPlanes(
    inManagedPrimitiveOnly: boolean = true
  ): void {
    const pm = this.viewer.jt?.primitiveManager
    if (!pm) {
      return
    }
    const jtPris = pm.syncJTPrimitives(inManagedPrimitiveOnly)

    if (!jtPris) {
      return
    }
    const len = jtPris.length
    for (let i = 0; i < len; i++) {
      const primitive = pm.getPrimitiveByJTPrimitive(jtPris[i])
      if (primitive instanceof Cesium3DTileset || primitive instanceof Model) {
        if (
          primitive.clippingPlanes &&
          !primitive.clippingPlanes.isDestroyed()
        ) {
          primitive.clippingPlanes.removeAll()
        }

        ;(primitive as any).clippingPlanes = undefined
      }
    }
  }
}

export default ClippingPlane
