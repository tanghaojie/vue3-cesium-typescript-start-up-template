import * as Cesium from 'cesium'

type Options = {
  withHeight: boolean
}

function logMousePositionMixin(
  viewer: Cesium.Viewer,
  options: Options = {
    withHeight: false,
  }
): void {
  if (!viewer || !Cesium.defined(viewer)) {
    throw new Cesium.DeveloperError('viewer is required.')
  }
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction(function (e) {
    let position: Cesium.Cartesian3 | undefined
    if (options.withHeight) {
      viewer.scene.globe.depthTestAgainstTerrain = true
      position = viewer.scene.pickPosition(e.position)
    } else {
      position = viewer.scene.camera.pickEllipsoid(
        e.position,
        viewer.scene.globe.ellipsoid
      )
    }
    if (!position) {
      return
    }
    const cartographic = Cesium.Cartographic.fromCartesian(position)
    const longitude = Cesium.Math.toDegrees(cartographic.longitude)
    const latitude = Cesium.Math.toDegrees(cartographic.latitude)
    const height = cartographic.height
    console.log(longitude, latitude, height)
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  ;(viewer as any)[additionPropertyName] = {
    handler: handler,
  }
}

const additionPropertyName = 'jtLogMousePositionMixin'
export { additionPropertyName }
export default logMousePositionMixin
