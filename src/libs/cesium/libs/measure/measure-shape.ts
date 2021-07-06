import * as Cesium from 'cesium'

const MEASURED_POLYLINES_DATASOURCE_NAME = '_MEASURED_POLYLINES_DATASOURCE_NAME'
const MEASURED_POLYGONS_DATASOURCE_NAME = '_MEASURED_POLYGONS_DATASOURCE_NAME'

export enum MeasureMode {
  Polyline,
  Polygon,
}

export type MeasureShapeOption = {
  viewer: Cesium.Viewer
  measureMode: MeasureMode
  started?: () => void
  stoped?: () => void
}

function removeMeasuredPolylines(viewer: Cesium.Viewer): void {
  const ds = viewer.dataSources
  const len = ds.length
  for (let i = 0; i < len; i++) {
    const d = ds.get(i)
    if (d && d.name === MEASURED_POLYLINES_DATASOURCE_NAME) {
      ds.remove(d)
    }
  }
}

function removeMeasuredPolygons(viewer: Cesium.Viewer): void {
  const ds = viewer.dataSources
  const len = ds.length
  for (let i = 0; i < len; i++) {
    const d = ds.get(i)
    if (d && d.name === MEASURED_POLYGONS_DATASOURCE_NAME) {
      ds.remove(d)
    }
  }
}

function datasource(
  viewer: Cesium.Viewer,
  measureMode: MeasureMode
): Cesium.DataSource {
  let dsName: string
  if (measureMode === MeasureMode.Polyline) {
    dsName = MEASURED_POLYLINES_DATASOURCE_NAME
  } else if (measureMode === MeasureMode.Polygon) {
    dsName = MEASURED_POLYGONS_DATASOURCE_NAME
  } else {
    throw new Error('Unknown datasource name.')
  }
  const ds = viewer.dataSources
  const len = ds.length
  for (let i = 0; i < len; i++) {
    const d = ds.get(i)
    if (d.name === dsName) {
      return d
    }
  }
  const pds = new Cesium.CustomDataSource(dsName)
  viewer.dataSources.add(pds)
  return pds
}

function buildShape(
  viewer: Cesium.Viewer,
  measureMode: MeasureMode,
  data: any
): Cesium.Entity {
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
  return datasource(viewer, measureMode).entities.add(entity)
}

function createLabelPoint(
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

function setPointProperty(
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

function buildShapeLabelPoint(
  viewer: Cesium.Viewer,
  measureMode: MeasureMode,
  position: any
): Cesium.Entity {
  let entity: Cesium.Entity
  if (measureMode === MeasureMode.Polyline) {
    entity = createLabelPoint(datasource(viewer, measureMode), position)
  } else if (measureMode === MeasureMode.Polygon) {
    entity = viewer.entities.add({
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

function terminateShape(viewer: Cesium.Viewer, measureMode: MeasureMode): void {
  activeShapePoints.pop()
  const entity = buildShape(viewer, measureMode, activeShapePoints)
  if (measureMode === MeasureMode.Polygon) {
    const area = getArea(entity)
    if (mousePoint && mousePoint.position && area) {
      const areaLP = createLabelPoint(
        datasource(viewer, measureMode),
        mousePoint.position.getValue(new Cesium.JulianDate())
      )
      setPointProperty(areaLP, undefined, `${area.toFixed(3)}㎡`)
    }
  }

  const entities = viewer.entities
  if (mousePoint && entities.contains(mousePoint)) {
    entities.remove(mousePoint)
  }
  const dses = datasource(viewer, measureMode).entities
  if (activeShape && dses.contains(activeShape)) {
    dses.remove(activeShape)
  }
  if (mousePoint && dses.contains(mousePoint)) {
    dses.remove(mousePoint)
  }

  mousePoint = undefined
  activeShape = undefined
  activeShapePoints = []
}

let activeShapePoints: Cesium.Cartesian3[] = []
let activeShape: Cesium.Entity | undefined
let mousePoint: Cesium.Entity | undefined
let preMousePoint: Cesium.Entity | undefined
let firstPoint: Cesium.Entity | undefined
let sumLength = 0

const measureShape = function (option: MeasureShapeOption): void {
  const { viewer, started, stoped, measureMode } = option
  const { scene } = viewer

  if (!scene.pickPositionSupported) {
    window.alert('This browser does not support pickPosition.')
  }

  const hasDepthTest = scene.globe.depthTestAgainstTerrain
  const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
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

    if (activeShapePoints.length === 0) {
      sumLength = 0
      mousePoint = buildShapeLabelPoint(viewer, measureMode, position)
      activeShapePoints.push(position)
      activeShape = buildShape(
        viewer,
        measureMode,
        new Cesium.CallbackProperty(() => {
          if (measureMode === MeasureMode.Polygon) {
            return new Cesium.PolygonHierarchy(activeShapePoints)
          }
          return activeShapePoints
        }, false)
      )
    }

    activeShapePoints.push(position)
    if (measureMode === MeasureMode.Polyline) {
      const lp = buildShapeLabelPoint(viewer, measureMode, position)
      const jd = new Cesium.JulianDate()
      if (activeShapePoints.length === 2) {
        firstPoint = lp
      }
      if (activeShapePoints.length > 2 && preMousePoint) {
        if (preMousePoint.position && lp.position) {
          const dis = Cesium.Cartesian3.distance(
            preMousePoint.position.getValue(jd),
            lp.position.getValue(jd)
          )
          sumLength += dis
          setPointProperty(lp, undefined, `${dis.toFixed(3)}m`)
          if (firstPoint) {
            setPointProperty(
              firstPoint,
              undefined,
              `总长:${sumLength.toFixed(3)}m`
            )
          }
        }
      }
      preMousePoint = lp
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
      !mousePoint ||
      !Cesium.defined(mousePoint) ||
      !Cesium.defined(newPosition)
    ) {
      return
    }
    if (measureMode === MeasureMode.Polyline) {
      //   setLabelPoint(mousePoint, newPosition, '123')
    } else {
      mousePoint.position &&
        (mousePoint.position as Cesium.ConstantPositionProperty).setValue(
          newPosition
        )
    }
    activeShapePoints.pop()
    activeShapePoints.push(newPosition)
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

  handler.setInputAction(function (event) {
    terminateShape(viewer, measureMode)
    handler.destroy()
    stoped && stoped()
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

  started && started()
}

function getArea(theEntity: Cesium.Entity): number | undefined {
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

export default measureShape
export { removeMeasuredPolylines, removeMeasuredPolygons }
