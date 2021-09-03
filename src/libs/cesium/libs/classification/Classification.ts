import * as Cesium from 'cesium'

type Classified = {
  id: string | undefined
  primitive: Cesium.Primitive | undefined
  color: Cesium.Color | undefined
}

type AddClassificationOption = {
  color?: number[]
}

type InvertClassificationOption = {
  invert: boolean
}

type Add3DTileClassificationPrimitiveOption = {
  id: string
  geometry: Cesium.Geometry | Cesium.GeometryFactory
}

type remove3DTileClassificationPrimitiveOption = {
  id: string
}

class Classification {
  private viewer: Cesium.Viewer

  private classified: Classified = {
    id: undefined,
    primitive: undefined,
    color: undefined,
  }

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  public removeClassification(): void {
    const { primitive, color, id } = this.classified
    if (
      primitive &&
      Cesium.defined(primitive) &&
      Cesium.defined(primitive.getGeometryInstanceAttributes)
    ) {
      const attributes = primitive.getGeometryInstanceAttributes(id)
      attributes.color = color
      this.classified.id = undefined
      this.classified.primitive = undefined
      this.classified.color = undefined
    }
  }

  public addClassification(
    option: AddClassificationOption
  ): Cesium.ScreenSpaceEventHandler | undefined {
    const { color } = option
    const { scene } = this.viewer
    const self = this
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
    handler.setInputAction(function (movement) {
      const pickedObject = scene.pick(movement.endPosition)
      if (
        pickedObject &&
        Cesium.defined(pickedObject) &&
        Cesium.defined(pickedObject.id)
      ) {
        if (pickedObject.id === self.classified.id) {
          return
        }
        if (self.classified.id && Cesium.defined(self.classified.id)) {
          self.removeClassification()
        }
      }

      if (
        Cesium.defined(pickedObject) &&
        Cesium.defined(pickedObject.primitive) &&
        Cesium.defined(pickedObject.id) &&
        Cesium.defined(pickedObject.primitive.getGeometryInstanceAttributes)
      ) {
        self.classified.id = pickedObject.id
        self.classified.primitive = pickedObject.primitive
        if (self.classified.primitive) {
          const attributes =
            self.classified.primitive.getGeometryInstanceAttributes(
              self.classified.id
            )
          self.classified.color = attributes.color
          attributes.color = color || [0, 255, 0, 128]
        }
      } else if (Cesium.defined(self.classified.id)) {
        self.removeClassification()
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    return handler
  }

  private invertClassification(option: InvertClassificationOption): void {
    const { invert } = option
    const { scene } = this.viewer
    scene.invertClassification = invert
    scene.invertClassificationColor = new Cesium.Color(0.1, 0.1, 0.1, 0)
  }

  public addInvertClassification(): Cesium.ScreenSpaceEventHandler {
    const { scene } = this.viewer
    const self = this
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
    handler.setInputAction(function (movement) {
      const pickedObject = scene.pick(movement.position)
      if (
        pickedObject &&
        Cesium.defined(pickedObject) &&
        Cesium.defined(pickedObject.primitive) &&
        Cesium.defined(pickedObject.id) &&
        Cesium.defined(pickedObject.primitive.getGeometryInstanceAttributes)
      ) {
        const toValue = !scene.invertClassification
        self.invertClassification({ invert: toValue })
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    return handler
  }

  public removeInvertClassification(): void {
    this.invertClassification({ invert: false })
  }

  public add3DTileClassificationPrimitive(
    option: Add3DTileClassificationPrimitiveOption
  ): void {
    const { id, geometry } = option
    const { scene } = this.viewer

    scene.primitives.add(
      new Cesium.ClassificationPrimitive({
        geometryInstances: new Cesium.GeometryInstance({
          id: id,
          geometry: geometry,
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
              new Cesium.Color(1.0, 0.0, 0.0, 0)
            ),
          },
        }),
        classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
      })
    )
  }

  public remove3DTileClassificationPrimitive(
    option: remove3DTileClassificationPrimitiveOption
  ): void {
    const { id } = option
    const { primitives } = this.viewer.scene
    const len = primitives.length
    for (let i = 0; i < len; i++) {
      const p = primitives.get(i)
      if (!(p instanceof Cesium.ClassificationPrimitive)) {
        continue
      }
      if (id.indexOf((p as any)._primitive._instanceIds) !== -1) {
        primitives.remove(p)
      }
    }
  }
}

export default Classification
