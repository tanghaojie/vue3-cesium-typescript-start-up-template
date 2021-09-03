import * as Cesium from 'cesium'

type Highlighted3DTileFeature = {
  feature: Cesium.Cesium3DTileFeature | undefined
  originalColor: Cesium.Color
  labelPoint?: Cesium.Entity
}

type Highlight3DTileFeatureOption = {
  color?: Cesium.Color
}

class Highlight {
  private static HIGHLIGHT_LABEL_POINTS_DATASOURCE_NAME =
    '_HIGHLIGHT_LABEL_POINTS_DATASOURCE_NAME'

  private viewer: Cesium.Viewer

  private highlighted3DTileFeature: Highlighted3DTileFeature = {
    feature: undefined,
    originalColor: new Cesium.Color(),
    labelPoint: undefined,
  }

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  private createLabelPoint(
    ds: Cesium.DataSource,
    position: any = undefined
  ): Cesium.Entity {
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

  private setLabelPointProperty(
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

  public highlight3DTileFeature(
    option: Highlight3DTileFeatureOption
  ): Cesium.ScreenSpaceEventHandler {
    const { viewer } = this
    const { color } = option
    const { scene } = viewer

    const toColor = color || Cesium.Color.YELLOW.withAlpha(0.5)

    if (!this.highlighted3DTileFeature.labelPoint) {
      this.highlighted3DTileFeature.labelPoint = this.createLabelPoint(
        this.highlightLabelPointDataSources()
      )
    }

    const self = this
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
    handler.setInputAction(function (movement) {
      if (scene.pickPositionSupported) {
        const cartesian = scene.pickPosition(movement.endPosition)
        if (cartesian && Cesium.defined(cartesian)) {
          self.setLabelPointProperty(
            self.highlighted3DTileFeature.labelPoint,
            cartesian
          )
        }
      }

      const pickedObject = scene.pick(movement.endPosition)
      if (
        !pickedObject ||
        !Cesium.defined(pickedObject) ||
        !(pickedObject instanceof Cesium.Cesium3DTileFeature) ||
        pickedObject === self.highlighted3DTileFeature.feature
      ) {
        return
      }
      self.removeHighlighted3DTileFeature()
      self.highlighted3DTileFeature.feature = pickedObject
      Cesium.Color.clone(
        pickedObject.color,
        self.highlighted3DTileFeature.originalColor
      )
      pickedObject.color = toColor

      const HIEGHT_PROPERTY_NAME = 'height'
      if (pickedObject.hasProperty(HIEGHT_PROPERTY_NAME)) {
        const height = pickedObject.getProperty(HIEGHT_PROPERTY_NAME)
        self.setLabelPointProperty(
          self.highlighted3DTileFeature.labelPoint,
          undefined,
          `${height} m`
        )
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    return handler
  }

  public removeHighlightLabelPointDataSource = (): void => {
    const ds = this.viewer.dataSources
    const len = ds.length
    for (let i = 0; i < len; i++) {
      const d = ds.get(i)
      if (d && d.name === Highlight.HIGHLIGHT_LABEL_POINTS_DATASOURCE_NAME) {
        ds.remove(d)
      }
    }
  }

  private highlightLabelPointDataSources(): Cesium.DataSource {
    const ds = this.viewer.dataSources
    const len = ds.length
    for (let i = 0; i < len; i++) {
      const d = ds.get(i)
      if (d && d.name === Highlight.HIGHLIGHT_LABEL_POINTS_DATASOURCE_NAME) {
        return d
      }
    }
    const pds = new Cesium.CustomDataSource(
      Highlight.HIGHLIGHT_LABEL_POINTS_DATASOURCE_NAME
    )
    this.viewer.dataSources.add(pds)
    return pds
  }

  public removeHighlighted3DTileFeature(): void {
    const { feature, originalColor } = this.highlighted3DTileFeature
    if (feature && Cesium.defined(feature)) {
      try {
        feature.color = originalColor
      } catch (err) {
        console.error(err)
      } finally {
        this.highlighted3DTileFeature.feature = undefined
      }
    }
  }

  public removeAll(): void {
    this.removeHighlighted3DTileFeature()
    this.removeHighlightLabelPointDataSource()
  }
}

export default Highlight
