import * as Cesium from 'cesium'

type Highlighted3DTileFeature = {
  feature: Cesium.Cesium3DTileFeature | undefined
  originalColor: Cesium.Color
  labelPoint?: Cesium.Entity
}

const highlighted3DTileFeature: Highlighted3DTileFeature = {
  feature: undefined,
  originalColor: new Cesium.Color(),
  labelPoint: undefined,
}

type Highlight3DTileFeatureOption = {
  viewer: Cesium.Viewer
  color?: Cesium.Color
}

const removeAll = (viewer: Cesium.Viewer): void => {
  removeHighlighted3DTileFeature()
  removeHighlightLabelPointDataSource(viewer)
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

const HIGHLIGHT_LABEL_POINTS_DATASOURCE_NAME =
  '_HIGHLIGHT_LABEL_POINTS_DATASOURCE_NAME'

const highlightLabelPointDataSources = (
  viewer: Cesium.Viewer
): Cesium.DataSource => {
  const ds = viewer.dataSources
  const len = ds.length
  for (let i = 0; i < len; i++) {
    const d = ds.get(i)
    if (d && d.name === HIGHLIGHT_LABEL_POINTS_DATASOURCE_NAME) {
      return d
    }
  }
  const pds = new Cesium.CustomDataSource(
    HIGHLIGHT_LABEL_POINTS_DATASOURCE_NAME
  )
  viewer.dataSources.add(pds)
  return pds
}

const removeHighlightLabelPointDataSource = (viewer: Cesium.Viewer): void => {
  const ds = viewer.dataSources
  const len = ds.length
  for (let i = 0; i < len; i++) {
    const d = ds.get(i)
    if (d && d.name === HIGHLIGHT_LABEL_POINTS_DATASOURCE_NAME) {
      ds.remove(d)
    }
  }
}

const createLabelPoint = (
  ds: Cesium.DataSource,
  position: any = undefined
): Cesium.Entity => {
  return ds.entities.add({
    position: position || Cesium.Cartesian3.fromDegrees(0, 0, 0),
    label: {
      text: '',
      font: '16px Source Han Sans CN',
      fillColor: Cesium.Color.WHITE,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 8,
      outlineColor: Cesium.Color.BLACK,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(0, -10),
    },
  })
}

function setLabelPointProperty(
  point?: Cesium.Entity,
  position: Cesium.Cartesian3 | undefined = undefined,
  text: string | undefined = undefined
): void {
  if (!point) {
    return
  }
  if (position && point.position) {
    ;(point.position as Cesium.ConstantPositionProperty).setValue(position)
  }
  if (text && point.label) {
    ;(point.label.text as any) = text
  }
}

const highlight3DTileFeature = function (
  option: Highlight3DTileFeatureOption
): Cesium.ScreenSpaceEventHandler {
  const { viewer, color } = option
  const { scene } = viewer

  const toColor = color || Cesium.Color.YELLOW.withAlpha(0.5)

  if (!highlighted3DTileFeature.labelPoint) {
    highlighted3DTileFeature.labelPoint = createLabelPoint(
      highlightLabelPointDataSources(viewer)
    )
  }

  const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
  handler.setInputAction(function (movement) {
    if (scene.pickPositionSupported) {
      const cartesian = scene.pickPosition(movement.endPosition)
      if (cartesian && Cesium.defined(cartesian)) {
        setLabelPointProperty(highlighted3DTileFeature.labelPoint, cartesian)
      }
    }

    const pickedObject = scene.pick(movement.endPosition)
    if (
      !pickedObject ||
      !Cesium.defined(pickedObject) ||
      !(pickedObject instanceof Cesium.Cesium3DTileFeature) ||
      pickedObject === highlighted3DTileFeature.feature
    ) {
      return
    }
    removeHighlighted3DTileFeature()
    highlighted3DTileFeature.feature = pickedObject
    Cesium.Color.clone(
      pickedObject.color,
      highlighted3DTileFeature.originalColor
    )
    pickedObject.color = toColor

    const HIEGHT_PROPERTY_NAME = 'height'
    if (pickedObject.hasProperty(HIEGHT_PROPERTY_NAME)) {
      const height = pickedObject.getProperty(HIEGHT_PROPERTY_NAME)
      setLabelPointProperty(
        highlighted3DTileFeature.labelPoint,
        undefined,
        `${height} m`
      )
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

  return handler
}

export { highlight3DTileFeature, removeAll }
