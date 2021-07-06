import * as Cesium from 'cesium'

const setPercentageChange = function (
  viewer: Cesium.Viewer,
  percentageChanged: number = 0.5
): void {
  if (percentageChanged > 1 || percentageChanged < 0) {
    percentageChanged = 0.1
  }
  viewer.camera.percentageChanged = percentageChanged
}

const getPercentageChange = function (viewer: Cesium.Viewer): number {
  return viewer.camera.percentageChanged
}

export { setPercentageChange, getPercentageChange }
