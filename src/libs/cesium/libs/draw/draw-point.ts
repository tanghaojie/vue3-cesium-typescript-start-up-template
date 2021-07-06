import * as Cesium from 'cesium'

const DRAWED_POINTS_FLAG = '_DRAWED_POINTS_FLAG'

export type DrawPointOption = {
  viewer: Cesium.Viewer
  started?: () => void
  stoped?: () => void
}

const drawPoint = function (option: DrawPointOption): void {
  const { viewer, started, stoped } = option
  const { scene } = viewer

  const pointPrimitives = new Cesium.PointPrimitiveCollection({
    blendOption: Cesium.BlendOption.TRANSLUCENT,
  })
  ;(pointPrimitives as any).name = DRAWED_POINTS_FLAG
  scene.primitives.add(pointPrimitives)

  const hasDepthTest = scene.globe.depthTestAgainstTerrain
  const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
  handler.setInputAction(function (e) {
    let cartesian
    if (hasDepthTest) {
      cartesian = scene.pickPosition(e.position)
    } else {
      cartesian = scene.camera.pickEllipsoid(e.position, scene.globe.ellipsoid)
    }

    pointPrimitives.add({
      position: cartesian,
      pixelSize: 10,
      color: Cesium.Color.RED,
    })
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  handler.setInputAction(function (movement) {
    handler.destroy()
    stoped && stoped()
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

  started && started()
}

const removeDrawedPoints = function (viewer: Cesium.Viewer): void {
  const { scene } = viewer
  const pris = scene.primitives

  let index = 0
  while (index < pris.length) {
    const pri = pris.get(index)
    if (pri.name === DRAWED_POINTS_FLAG) {
      pris.remove(pri)
    } else {
      index++
    }
  }
}

export default drawPoint
export { removeDrawedPoints, DRAWED_POINTS_FLAG }
