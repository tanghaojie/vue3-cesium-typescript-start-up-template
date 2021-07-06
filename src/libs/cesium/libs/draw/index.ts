import * as Cesium from 'cesium'
import drawPoint, { removeDrawedPoints } from './draw-point'
import type { DrawPointOption } from './draw-point'
import drawShape, { DrawMode, removeDrawedShapes } from './draw-shape'
import type { DrawShapeOption } from './draw-shape'

const removeDrawed = function (viewer: Cesium.Viewer): void {
  removeDrawedPoints(viewer)
  removeDrawedShapes(viewer)
}

export {
  drawPoint,
  removeDrawedPoints,
  DrawPointOption,
  drawShape,
  DrawMode,
  removeDrawedShapes,
  DrawShapeOption,
  removeDrawed,
}
