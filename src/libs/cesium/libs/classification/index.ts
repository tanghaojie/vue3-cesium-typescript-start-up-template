import * as Cesium from 'cesium'

type Classified = {
  id: string | undefined
  primitive: Cesium.Primitive | undefined
  color: Cesium.Color | undefined
}

const classified: Classified = {
  id: undefined,
  primitive: undefined,
  color: undefined,
}

type AddClassificationOption = {
  viewer: Cesium.Viewer
  color?: number[]
}

type InvertClassificationOption = {
  viewer: Cesium.Viewer
  invert: boolean
}

type AddInvertClassificationOption = {
  viewer: Cesium.Viewer
}

type RemoveInvertClassificationOption = {
  viewer: Cesium.Viewer
}

type Add3DTileClassificationPrimitiveOption = {
  viewer: Cesium.Viewer
  id: string
  geometry: Cesium.Geometry | Cesium.GeometryFactory
}

type remove3DTileClassificationPrimitiveOption = {
  viewer: Cesium.Viewer
  id: string
}

const removeClassification = function (): void {
  const { primitive, color, id } = classified
  if (
    primitive &&
    Cesium.defined(primitive) &&
    Cesium.defined(primitive.getGeometryInstanceAttributes)
  ) {
    const attributes = primitive.getGeometryInstanceAttributes(id)
    attributes.color = color
    classified.id = undefined
    classified.primitive = undefined
    classified.color = undefined
  }
}

const addClassification = function (
  option: AddClassificationOption
): Cesium.ScreenSpaceEventHandler | undefined {
  const { viewer, color } = option
  const { scene } = viewer

  const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
  handler.setInputAction(function (movement) {
    const pickedObject = scene.pick(movement.endPosition)
    if (
      pickedObject &&
      Cesium.defined(pickedObject) &&
      Cesium.defined(pickedObject.id)
    ) {
      if (pickedObject.id === classified.id) {
        return
      }
      if (classified.id && Cesium.defined(classified.id)) {
        removeClassification()
      }
    }

    if (
      Cesium.defined(pickedObject) &&
      Cesium.defined(pickedObject.primitive) &&
      Cesium.defined(pickedObject.id) &&
      Cesium.defined(pickedObject.primitive.getGeometryInstanceAttributes)
    ) {
      classified.id = pickedObject.id
      classified.primitive = pickedObject.primitive
      if (classified.primitive) {
        const attributes = classified.primitive.getGeometryInstanceAttributes(
          classified.id
        )
        classified.color = attributes.color
        attributes.color = color || [0, 255, 0, 128]
      }
    } else if (Cesium.defined(classified.id)) {
      removeClassification()
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

  return handler
}

const invertClassification = function (
  option: InvertClassificationOption
): void {
  const { viewer, invert } = option
  const { scene } = viewer
  scene.invertClassification = invert
  scene.invertClassificationColor = new Cesium.Color(0.1, 0.1, 0.1, 0)
}

const addInvertClassification = function (
  option: AddInvertClassificationOption
): Cesium.ScreenSpaceEventHandler {
  const { viewer } = option
  const { scene } = viewer

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
      invertClassification({ viewer, invert: toValue })
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  return handler
}

const removeInvertClassification = function (
  option: RemoveInvertClassificationOption
): void {
  invertClassification({ viewer: option.viewer, invert: false })
}

const add3DTileClassificationPrimitive = function (
  option: Add3DTileClassificationPrimitiveOption
): void {
  const { viewer, id, geometry } = option
  const { scene } = viewer

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

const remove3DTileClassificationPrimitive = function (
  option: remove3DTileClassificationPrimitiveOption
): void {
  const { viewer, id } = option
  const { primitives } = viewer.scene
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

export {
  addClassification,
  removeClassification,
  addInvertClassification,
  removeInvertClassification,
  add3DTileClassificationPrimitive,
  remove3DTileClassificationPrimitive,
}
