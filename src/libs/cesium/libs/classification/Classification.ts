import {
  Viewer,
  Color,
  ClassificationType,
  ScreenSpaceEventHandler,
  defined,
  ScreenSpaceEventType,
  Primitive,
  Geometry,
  GeometryFactory,
  ClassificationPrimitive,
  GeometryInstance,
  ColorGeometryInstanceAttribute,
} from 'cesium'

type Classified = {
  id: string | undefined
  primitive: Primitive | undefined
  color: Color | undefined
}

type AddClassificationOption = {
  color?: number[]
}

type InvertClassificationOption = {
  invert: boolean
}

type Add3DTileClassificationPrimitiveOption = {
  id: string
  geometry: Geometry | GeometryFactory
}

type remove3DTileClassificationPrimitiveOption = {
  id: string
}

class Classification {
  private viewer: Viewer

  private classified: Classified = {
    id: undefined,
    primitive: undefined,
    color: undefined,
  }

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  public removeClassification(): void {
    const { primitive, color, id } = this.classified
    if (
      primitive &&
      defined(primitive) &&
      defined(primitive.getGeometryInstanceAttributes)
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
  ): ScreenSpaceEventHandler | undefined {
    const { color } = option
    const { scene } = this.viewer
    const self = this
    const handler = new ScreenSpaceEventHandler(scene.canvas)
    handler.setInputAction(function (movement) {
      const pickedObject = scene.pick(movement.endPosition)
      if (pickedObject && defined(pickedObject) && defined(pickedObject.id)) {
        if (pickedObject.id === self.classified.id) {
          return
        }
        if (self.classified.id && defined(self.classified.id)) {
          self.removeClassification()
        }
      }

      if (
        defined(pickedObject) &&
        defined(pickedObject.primitive) &&
        defined(pickedObject.id) &&
        defined(pickedObject.primitive.getGeometryInstanceAttributes)
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
      } else if (defined(self.classified.id)) {
        self.removeClassification()
      }
    }, ScreenSpaceEventType.MOUSE_MOVE)

    return handler
  }

  private invertClassification(option: InvertClassificationOption): void {
    const { invert } = option
    const { scene } = this.viewer
    scene.invertClassification = invert
    scene.invertClassificationColor = new Color(0.1, 0.1, 0.1, 0)
  }

  public addInvertClassification(): ScreenSpaceEventHandler {
    const { scene } = this.viewer
    const self = this
    const handler = new ScreenSpaceEventHandler(scene.canvas)
    handler.setInputAction(function (movement) {
      const pickedObject = scene.pick(movement.position)
      if (
        pickedObject &&
        defined(pickedObject) &&
        defined(pickedObject.primitive) &&
        defined(pickedObject.id) &&
        defined(pickedObject.primitive.getGeometryInstanceAttributes)
      ) {
        const toValue = !scene.invertClassification
        self.invertClassification({ invert: toValue })
      }
    }, ScreenSpaceEventType.LEFT_CLICK)

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
      new ClassificationPrimitive({
        geometryInstances: new GeometryInstance({
          id: id,
          geometry: geometry,
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(
              new Color(1.0, 0.0, 0.0, 0)
            ),
          },
        }),
        classificationType: ClassificationType.CESIUM_3D_TILE,
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
      if (!(p instanceof ClassificationPrimitive)) {
        continue
      }
      if (id.indexOf((p as any)._primitive._instanceIds) !== -1) {
        primitives.remove(p)
      }
    }
  }
}

export default Classification
