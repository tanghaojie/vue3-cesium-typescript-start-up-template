import * as Cesium from 'cesium'

const DRAWED_SHAPES_FLAG = '_DRAWED_SHAPES_FLAG'

export enum DrawMode {
  Polyline,
  Polygon,
}

export type DrawShapeOption = {
  viewer: Cesium.Viewer
  drawMode: DrawMode
  started?: () => void
  stoped?: () => void
}

function createPoint(viewer: Cesium.Viewer, position: any): Cesium.Entity {
  return viewer.entities.add({
    position: position,
    point: {
      color: Cesium.Color.YELLOW,
      pixelSize: 10,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  })
}

function buildShape(
  viewer: Cesium.Viewer,
  drawMode: DrawMode,
  data: any
): Cesium.Entity | undefined {
  if (drawMode === DrawMode.Polyline) {
    return viewer.entities.add({
      polyline: {
        positions: data,
        clampToGround: true,
        width: 5,
        material: Cesium.Color.RED,
      },
    })
  } else if (drawMode === DrawMode.Polygon) {
    return viewer.entities.add({
      polygon: {
        hierarchy: data,
        material: new Cesium.ColorMaterialProperty(
          Cesium.Color.RED.withAlpha(0.7)
        ),
      },
    })
  }
}

function terminateShape(viewer: Cesium.Viewer, drawMode: DrawMode): void {
  activeShapePoints.pop()
  const entity = buildShape(viewer, drawMode, activeShapePoints)
  if (!entity) {
    return
  }
  entity.name = DRAWED_SHAPES_FLAG
  if (mousePoint) {
    viewer.entities.remove(mousePoint)
  }
  if (activeShape) {
    viewer.entities.remove(activeShape)
  }
  mousePoint = undefined
  activeShape = undefined
  activeShapePoints = []
}

let activeShapePoints: Cesium.Cartesian3[] = []
let activeShape: Cesium.Entity | undefined
let mousePoint: Cesium.Entity | undefined

const drawShape = function (option: DrawShapeOption): void {
  const { viewer, started, stoped, drawMode } = option
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
      mousePoint = createPoint(viewer, position)
      activeShapePoints.push(position)
      activeShape = buildShape(
        viewer,
        drawMode,
        new Cesium.CallbackProperty(() => {
          if (drawMode === DrawMode.Polygon) {
            return new Cesium.PolygonHierarchy(activeShapePoints)
          }
          return activeShapePoints
        }, false)
      )
    }
    activeShapePoints.push(position)
    // createPoint(viewer, position)
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  handler.setInputAction(function (event) {
    let newPosition
    if (hasDepthTest) {
      newPosition = viewer.scene.pickPosition(event.endPosition)
    } else {
      newPosition = viewer.scene.camera.pickEllipsoid(
        event.endPosition,
        viewer.scene.globe.ellipsoid
      )
    }
    if (
      !mousePoint ||
      !newPosition ||
      !Cesium.defined(mousePoint) ||
      !Cesium.defined(newPosition)
    ) {
      return
    }

    if (mousePoint.position) {
      ;(mousePoint.position as Cesium.ConstantPositionProperty).setValue(
        newPosition
      )
    }

    activeShapePoints.pop()
    activeShapePoints.push(newPosition)
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

  handler.setInputAction(function (event) {
    terminateShape(viewer, drawMode)
    handler.destroy()
    stoped && stoped()
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

  started && started()
}

function removeDrawedShapes(viewer: Cesium.Viewer): void {
  const entities = viewer.entities.values
  let index = 0
  while (index < entities.length) {
    const model = entities[index]
    if (model.name === DRAWED_SHAPES_FLAG) {
      viewer.entities.remove(model)
    } else {
      index++
    }
  }
}

export default drawShape
export { removeDrawedShapes }
