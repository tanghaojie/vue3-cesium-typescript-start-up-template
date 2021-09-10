import * as Cesium from 'cesium'

export type MeasureUserCallBackOption = {
  started?: () => void
  stoped?: () => void
}

export type MeasurePointOption = MeasureUserCallBackOption
export type MeasurePolylineOption = MeasureUserCallBackOption
export type MeasurePolygonOption = MeasureUserCallBackOption

enum MeasureMode {
  Polyline,
  Polygon,
}

type MeasureShapeOptionBase = {
  measureMode: MeasureMode
}

type MeasureShapeOption = MeasureShapeOptionBase &
  MeasurePolylineOption &
  MeasurePolygonOption

class Measure {
  private static MEASURED_POINTS_DATASOURCE_NAME =
    '_MEASURED_POINTS_DATASOURCE_NAME'
  private static MEASURED_POLYLINES_DATASOURCE_NAME =
    '_MEASURED_POLYLINES_DATASOURCE_NAME'
  private static MEASURED_POLYGONS_DATASOURCE_NAME =
    '_MEASURED_POLYGONS_DATASOURCE_NAME'

  protected viewer: Cesium.Viewer

  private currentPoint: Cesium.Entity | undefined
  private activeShapePoints: Cesium.Cartesian3[] = []
  private activeShape: Cesium.Entity | undefined
  private mousePoint: Cesium.Entity | undefined
  private preMousePoint: Cesium.Entity | undefined
  private firstPoint: Cesium.Entity | undefined
  private sumLength = 0

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  private measurePointDataSources(): Cesium.DataSource {
    const ds = this.viewer.dataSources
    const len = ds.length
    for (let i = 0; i < len; i++) {
      const d = ds.get(i)
      if (d && d.name === Measure.MEASURED_POINTS_DATASOURCE_NAME) {
        return d
      }
    }
    const pds = new Cesium.CustomDataSource(
      Measure.MEASURED_POINTS_DATASOURCE_NAME
    )
    this.viewer.dataSources.add(pds)
    return pds
  }

  private createLabelPoint(
    ds: Cesium.DataSource,
    position: any = undefined
  ): Cesium.Entity {
    return ds.entities.add({
      position: position || Cesium.Cartesian3.fromDegrees(0, 0, 0),
      point: {
        color: Cesium.Color.RED,
        pixelSize: 15,
      },
      label: {
        text: '',
        font: '16px Source Han Sans CN',
        fillColor: Cesium.Color.WHITE,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 8,
        outlineColor: Cesium.Color.BLACK,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(0, -30),
      },
    })
  }

  private measurePointText(lon = 0, lat = 0, height = 0): string {
    return `经度:${lon.toFixed(6)}°\n纬度:${lat.toFixed(
      6
    )}°\n高度:${height.toFixed(3)}m`
  }

  private setPointProperty(
    point: Cesium.Entity,
    position: Cesium.Cartesian3 | undefined = undefined,
    text: string | undefined = undefined
  ): void {
    if (position && point.position) {
      ;(point.position as Cesium.ConstantPositionProperty).setValue(position)
    }
    if (text && point.label) {
      ;(point.label.text as any) = text
    }
  }

  public measurePoint(option: MeasurePointOption): void {
    const { started, stoped } = option
    const { scene } = this.viewer
    const pds = this.measurePointDataSources()

    const hasDepthTest = this.viewer.scene.globe.depthTestAgainstTerrain
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
    const self = this
    handler.setInputAction(function (e) {
      let position
      if (hasDepthTest) {
        position = self.viewer.scene.pickPosition(e.endPosition)
      } else {
        position = self.viewer.scene.camera.pickEllipsoid(
          e.endPosition,
          self.viewer.scene.globe.ellipsoid
        )
      }
      if (!position || !Cesium.defined(position)) {
        return
      }
      if (!self.currentPoint) {
        self.currentPoint = self.createLabelPoint(pds)
      }
      const cartographic = Cesium.Cartographic.fromCartesian(position)
      const lon = Cesium.Math.toDegrees(cartographic.longitude)
      const lat = Cesium.Math.toDegrees(cartographic.latitude)
      const hei = cartographic.height || 0

      self.setPointProperty(
        self.currentPoint,
        position,
        self.measurePointText(lon, lat, hei)
      )
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction(function (e) {
      self.currentPoint = undefined
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction(function (movement) {
      if (self.currentPoint) {
        pds.entities.remove(self.currentPoint)
        self.currentPoint = undefined
      }
      handler.destroy()
      stoped && stoped()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    started && started()
  }

  public removeMeasuredPoints(): void {
    const ds = this.viewer.dataSources
    const len = ds.length
    for (let i = 0; i < len; i++) {
      const d = ds.get(i)
      if (d && d.name === Measure.MEASURED_POINTS_DATASOURCE_NAME) {
        ds.remove(d)
      }
    }
  }

  public removeMeasuredPolylines(): void {
    const ds = this.viewer.dataSources
    const len = ds.length
    for (let i = 0; i < len; i++) {
      const d = ds.get(i)
      if (d && d.name === Measure.MEASURED_POLYLINES_DATASOURCE_NAME) {
        ds.remove(d)
      }
    }
  }

  public removeMeasuredPolygons(): void {
    const ds = this.viewer.dataSources
    const len = ds.length
    for (let i = 0; i < len; i++) {
      const d = ds.get(i)
      if (d && d.name === Measure.MEASURED_POLYGONS_DATASOURCE_NAME) {
        ds.remove(d)
      }
    }
  }

  public measurePolyline(option?: MeasurePolylineOption): void {
    this.measureShape({
      measureMode: MeasureMode.Polyline,
      ...(option || {}),
    })
  }

  public measurePolygon(option?: MeasurePolygonOption): void {
    this.measureShape({
      measureMode: MeasureMode.Polygon,
      ...(option || {}),
    })
  }

  public removeAllMeasured(): void {
    this.removeMeasuredPoints()
    this.removeMeasuredPolylines()
    this.removeMeasuredPolygons()
  }

  private datasource(measureMode: MeasureMode): Cesium.DataSource {
    let dsName: string
    if (measureMode === MeasureMode.Polyline) {
      dsName = Measure.MEASURED_POLYLINES_DATASOURCE_NAME
    } else if (measureMode === MeasureMode.Polygon) {
      dsName = Measure.MEASURED_POLYGONS_DATASOURCE_NAME
    } else {
      throw new Error('Unknown datasource name.')
    }

    const ds = this.viewer.dataSources
    const len = ds.length
    for (let i = 0; i < len; i++) {
      const d = ds.get(i)
      if (d.name === dsName) {
        return d
      }
    }
    const pds = new Cesium.CustomDataSource(dsName)
    this.viewer.dataSources.add(pds)
    return pds
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  private buildShape(measureMode: MeasureMode, data: any): Cesium.Entity {
    let entity: Cesium.Entity | Cesium.Entity.ConstructorOptions
    if (measureMode === MeasureMode.Polyline) {
      entity = {
        polyline: {
          positions: data,
          clampToGround: false,
          width: 5,
          material: Cesium.Color.RED,
        },
      }
    } else if (measureMode === MeasureMode.Polygon) {
      entity = {
        polygon: {
          hierarchy: data,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.RED.withAlpha(0.7)
          ),
        },
      }
    } else {
      throw new Error('Unknown datasource name.')
    }
    return this.datasource(measureMode).entities.add(entity)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  private buildShapeLabelPoint(
    measureMode: MeasureMode,
    position: any
  ): Cesium.Entity {
    let entity: Cesium.Entity
    if (measureMode === MeasureMode.Polyline) {
      entity = this.createLabelPoint(this.datasource(measureMode), position)
    } else if (measureMode === MeasureMode.Polygon) {
      entity = this.viewer.entities.add({
        position: position,
        point: {
          color: Cesium.Color.YELLOW,
          pixelSize: 10,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      })
    } else {
      throw new Error('Unknown datasource name.')
    }
    return entity
  }

  private terminateShape(measureMode: MeasureMode): void {
    this.activeShapePoints.pop()
    const entity = this.buildShape(measureMode, this.activeShapePoints)
    if (measureMode === MeasureMode.Polygon) {
      const area = this.getArea(entity)
      if (this.mousePoint && this.mousePoint.position && area) {
        const areaLP = this.createLabelPoint(
          this.datasource(measureMode),
          this.mousePoint.position.getValue(new Cesium.JulianDate())
        )
        this.setPointProperty(areaLP, undefined, `${area.toFixed(3)}㎡`)
      }
    }

    const entities = this.viewer.entities
    if (this.mousePoint && entities.contains(this.mousePoint)) {
      entities.remove(this.mousePoint)
    }
    const dses = this.datasource(measureMode).entities
    if (this.activeShape && dses.contains(this.activeShape)) {
      dses.remove(this.activeShape)
    }
    if (this.mousePoint && dses.contains(this.mousePoint)) {
      dses.remove(this.mousePoint)
    }

    this.mousePoint = undefined
    this.activeShape = undefined
    this.activeShapePoints = []
  }

  private measureShape(option: MeasureShapeOption): void {
    const { started, stoped, measureMode } = option
    const { scene } = this.viewer

    if (!scene.pickPositionSupported) {
      window.alert('This browser does not support pickPosition.')
    }

    const hasDepthTest = scene.globe.depthTestAgainstTerrain
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
    const self = this
    handler.setInputAction(function (event) {
      let position: Cesium.Cartesian3 | undefined
      if (hasDepthTest) {
        position = scene.pickPosition(event.position)
      } else {
        position = scene.camera.pickEllipsoid(
          event.position,
          scene.globe.ellipsoid
        )
      }
      if (!position || !Cesium.defined(position)) {
        return
      }

      if (self.activeShapePoints.length === 0) {
        self.sumLength = 0
        self.mousePoint = self.buildShapeLabelPoint(measureMode, position)
        self.activeShapePoints.push(position)
        self.activeShape = self.buildShape(
          measureMode,
          new Cesium.CallbackProperty(() => {
            if (measureMode === MeasureMode.Polygon) {
              return new Cesium.PolygonHierarchy(self.activeShapePoints)
            }
            return self.activeShapePoints
          }, false)
        )
      }

      self.activeShapePoints.push(position)
      if (measureMode === MeasureMode.Polyline) {
        const lp = self.buildShapeLabelPoint(measureMode, position)
        const jd = new Cesium.JulianDate()
        if (self.activeShapePoints.length === 2) {
          self.firstPoint = lp
        }
        if (self.activeShapePoints.length > 2 && self.preMousePoint) {
          if (self.preMousePoint.position && lp.position) {
            const dis = Cesium.Cartesian3.distance(
              self.preMousePoint.position.getValue(jd),
              lp.position.getValue(jd)
            )
            self.sumLength += dis
            self.setPointProperty(lp, undefined, `${dis.toFixed(3)}m`)
            if (self.firstPoint) {
              self.setPointProperty(
                self.firstPoint,
                undefined,
                `总长:${self.sumLength.toFixed(3)}m`
              )
            }
          }
        }
        self.preMousePoint = lp
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction(function (event) {
      let newPosition: Cesium.Cartesian3 | undefined
      if (hasDepthTest) {
        newPosition = scene.pickPosition(event.endPosition)
      } else {
        newPosition = scene.camera.pickEllipsoid(
          event.endPosition,
          scene.globe.ellipsoid
        )
      }
      if (
        !newPosition ||
        !self.mousePoint ||
        !Cesium.defined(self.mousePoint) ||
        !Cesium.defined(newPosition)
      ) {
        return
      }
      if (measureMode === MeasureMode.Polyline) {
        //   setLabelPoint(mousePoint, newPosition, '123')
      } else {
        self.mousePoint.position &&
          (
            self.mousePoint.position as Cesium.ConstantPositionProperty
          ).setValue(newPosition)
      }
      self.activeShapePoints.pop()
      self.activeShapePoints.push(newPosition)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction(function (event) {
      self.terminateShape(measureMode)
      handler.destroy()
      stoped && stoped()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    started && started()
  }

  private getArea(theEntity: Cesium.Entity): number | undefined {
    const polygon = theEntity.polygon
    if (!polygon || !polygon.hierarchy) {
      return
    }
    const hierarchy = (polygon.hierarchy as any)._value
    const indices = (Cesium as any).PolygonPipeline.triangulate(
      hierarchy.positions,
      hierarchy.holes
    )

    let area = 0

    for (let i = 0; i < indices.length; i += 3) {
      const vector1 = hierarchy.positions[indices[i]]
      const vector2 = hierarchy.positions[indices[i + 1]]
      const vector3 = hierarchy.positions[indices[i + 2]]

      const vectorC = Cesium.Cartesian3.subtract(
        vector2,
        vector1,
        new Cesium.Cartesian3()
      )
      const vectorD = Cesium.Cartesian3.subtract(
        vector3,
        vector1,
        new Cesium.Cartesian3()
      )

      const areaVector = Cesium.Cartesian3.cross(
        vectorC,
        vectorD,
        new Cesium.Cartesian3()
      )

      area += Cesium.Cartesian3.magnitude(areaVector) / 2.0
    }

    return area
  }
}

export default Measure
