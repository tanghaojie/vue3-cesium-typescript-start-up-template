import * as Cesium from 'cesium'

type ShowElevationContourOption = {
  viewer: Cesium.Viewer
}

type RemoveElevationContourOption = {
  viewer: Cesium.Viewer
}

const showElevationContour = (option: ShowElevationContourOption): void => {
  const { viewer } = option
  viewer.scene.globe.material = Cesium.Material.fromType('ElevationContour')
}

const removeElevationContour = (option: RemoveElevationContourOption): void => {
  const { viewer } = option
  ;(viewer.scene.globe.material as any) = undefined
}

export { showElevationContour, removeElevationContour }
