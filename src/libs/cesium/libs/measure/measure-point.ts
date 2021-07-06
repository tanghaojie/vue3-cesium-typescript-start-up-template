import * as Cesium from 'cesium'

const MEASURED_POINTS_DATASOURCE_NAME = '_MEASURED_POINTS_DATASOURCE_NAME'

export type MeasurePointOption = {
  viewer: Cesium.Viewer
  started?: () => void
  stoped?: () => void
}

function measurePointDataSources(viewer: Cesium.Viewer): Cesium.DataSource {
  const ds = viewer.dataSources
  const len = ds.length
  for (let i = 0; i < len; i++) {
    const d = ds.get(i)
    if (d && d.name === MEASURED_POINTS_DATASOURCE_NAME) {
      return d
    }
  }
  const pds = new Cesium.CustomDataSource(MEASURED_POINTS_DATASOURCE_NAME)
  viewer.dataSources.add(pds)
  return pds
}

function removeMeasuredPoints(viewer: Cesium.Viewer): void {
  const ds = viewer.dataSources
  const len = ds.length
  for (let i = 0; i < len; i++) {
    const d = ds.get(i)
    if (d && d.name === MEASURED_POINTS_DATASOURCE_NAME) {
      ds.remove(d)
    }
  }
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

function measurePointText(lon = 0, lat = 0, height = 0): string {
  return `经度:${lon.toFixed(6)}°\n纬度:${lat.toFixed(
    6
  )}°\n高度:${height.toFixed(3)}m`
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

let currentPoint: Cesium.Entity | undefined

const measurePoint = function (option: MeasurePointOption): void {
  const { viewer, started, stoped } = option
  const { scene } = viewer
  const pds = measurePointDataSources(viewer)

  const hasDepthTest = viewer.scene.globe.depthTestAgainstTerrain
  const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
  handler.setInputAction(function (e) {
    let position
    if (hasDepthTest) {
      position = viewer.scene.pickPosition(e.endPosition)
    } else {
      position = viewer.scene.camera.pickEllipsoid(
        e.endPosition,
        viewer.scene.globe.ellipsoid
      )
    }
    if (!position || !Cesium.defined(position)) {
      return
    }
    if (!currentPoint) {
      currentPoint = createLabelPoint(pds)
    }
    const cartographic = Cesium.Cartographic.fromCartesian(position)
    const lon = Cesium.Math.toDegrees(cartographic.longitude)
    const lat = Cesium.Math.toDegrees(cartographic.latitude)
    const hei = cartographic.height || 0

    setPointProperty(currentPoint, position, measurePointText(lon, lat, hei))
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

  handler.setInputAction(function (e) {
    currentPoint = undefined
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  handler.setInputAction(function (movement) {
    if (currentPoint) {
      pds.entities.remove(currentPoint)
      currentPoint = undefined
    }
    handler.destroy()
    stoped && stoped()
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  started && started()
}

export default measurePoint
export { removeMeasuredPoints }
