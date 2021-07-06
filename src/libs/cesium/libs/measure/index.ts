import * as Cesium from 'cesium'
import measurePoint, { removeMeasuredPoints } from './measure-point'
import type { MeasurePointOption } from './measure-point'
import measureShape, {
  MeasureMode,
  removeMeasuredPolylines,
  removeMeasuredPolygons,
} from './measure-shape'
import type { MeasureShapeOption } from './measure-shape'

const removeMeasured = function (viewer: Cesium.Viewer): void {
  removeMeasuredPoints(viewer)
  removeMeasuredPolylines(viewer)
  removeMeasuredPolygons(viewer)
}

export {
  measurePoint,
  removeMeasuredPoints,
  MeasurePointOption,
  measureShape,
  MeasureMode,
  removeMeasuredPolylines,
  removeMeasuredPolygons,
  MeasureShapeOption,
  removeMeasured,
}
