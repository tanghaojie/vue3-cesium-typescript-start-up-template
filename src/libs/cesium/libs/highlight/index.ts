import * as Cesium from 'cesium'

type Highlighted3DTileFeature = {
  feature: Cesium.Cesium3DTileFeature | undefined
  originalColor: Cesium.Color
}

const highlighted3DTileFeature: Highlighted3DTileFeature = {
  feature: undefined,
  originalColor: new Cesium.Color(),
}

type Highlight3DTileFeatureOption = {
  viewer: Cesium.Viewer
  color?: Cesium.Color
}

const removeHighlighted3DTileFeature = function (): void {
  const { feature, originalColor } = highlighted3DTileFeature
  if (feature && Cesium.defined(feature)) {
    try {
      feature.color = originalColor
    } catch (err) {
      console.error(err)
    } finally {
      highlighted3DTileFeature.feature = undefined
    }
  }
}

const highlight3DTileFeature = function (
  option: Highlight3DTileFeatureOption
): Cesium.ScreenSpaceEventHandler {
  const { viewer, color } = option
  const { scene } = viewer

  const toColor = color || Cesium.Color.YELLOW.withAlpha(0.5)

  const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
  handler.setInputAction(function (movement) {
    const pickedObject = scene.pick(movement.endPosition)
    if (!pickedObject || !Cesium.defined(pickedObject)) {
      return
    }
    if (!(pickedObject instanceof Cesium.Cesium3DTileFeature)) {
      return
    }
    if (pickedObject === highlighted3DTileFeature.feature) {
      return
    }
    removeHighlighted3DTileFeature()
    highlighted3DTileFeature.feature = pickedObject
    Cesium.Color.clone(
      pickedObject.color,
      highlighted3DTileFeature.originalColor
    )
    pickedObject.color = toColor
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

  return handler
}

export { highlight3DTileFeature, removeHighlighted3DTileFeature }
