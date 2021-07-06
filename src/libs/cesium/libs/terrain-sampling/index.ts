import * as Cesium from 'cesium'

type sampleData = {
  index: number
  height: number
}

type terrainSamplingOption = {
  viewer: Cesium.Viewer
}

const SAMPLE_ENTITY_NAME = '_SAMPLE_ENTITY_NAME'

let activeShapePoints: Cesium.Cartesian3[] = []
let activeShape: Cesium.Entity | undefined
let mousePoint: Cesium.Entity | undefined

function createLine(viewer: Cesium.Viewer, positions: any): Cesium.Entity {
  const model = viewer.entities.add({
    polyline: {
      positions: positions,
      clampToGround: true,
      width: 8,
      material: Cesium.Color.DODGERBLUE,
    },
  })
  model.name = SAMPLE_ENTITY_NAME
  return model
}

function createPoint(viewer: Cesium.Viewer, position: any): Cesium.Entity {
  const model = viewer.entities.add({
    position: position,
    point: {
      color: Cesium.Color.INDIANRED,
      pixelSize: 10,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  })
  model.name = SAMPLE_ENTITY_NAME
  return model
}

const terrainSampling = function (
  option: terrainSamplingOption
): Promise<sampleData[]> {
  const { viewer } = option
  const { scene } = viewer
  removeAll(viewer)

  if (!scene.pickPositionSupported) {
    const errorStr = 'This browser does not support pickPosition.'
    window.alert(errorStr)
    return Promise.reject(errorStr)
  }

  return new Promise((resolve, reject) => {
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
    handler.setInputAction(function (event) {
      const position = scene.camera.pickEllipsoid(
        event.position,
        scene.globe.ellipsoid
      )
      if (!position || !Cesium.defined(position)) {
        return
      }

      if (activeShapePoints.length === 0) {
        mousePoint = createPoint(viewer, position)
        activeShapePoints.push(position)
        activeShape = createLine(
          viewer,
          new Cesium.CallbackProperty(() => {
            return activeShapePoints
          }, false)
        )
      }

      if (activeShapePoints.length === 2) {
        createPoint(viewer, position)
        createLine(viewer, activeShapePoints)
        mousePoint && viewer.entities.remove(mousePoint)
        activeShape && viewer.entities.remove(activeShape)

        updateData(viewer, activeShapePoints).then((sampleDatas) => {
          resolve(sampleDatas)

          mousePoint = undefined
          activeShape = undefined
          activeShapePoints = []
        })

        mousePoint = undefined
        activeShape = undefined
        activeShapePoints = []
        handler.destroy()
        return
      }
      activeShapePoints.push(position)
      createPoint(viewer, position)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction(function (event) {
      const newPosition = scene.camera.pickEllipsoid(
        event.endPosition,
        scene.globe.ellipsoid
      )
      if (
        !mousePoint ||
        !newPosition ||
        !Cesium.defined(mousePoint) ||
        !Cesium.defined(newPosition)
      ) {
        return
      }
      ;(mousePoint.position as any).setValue(newPosition)
      activeShapePoints.pop()
      activeShapePoints.push(newPosition)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction(function (event) {
      removeAll(viewer)
      handler.destroy()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  })
}

function updateData(
  viewer: Cesium.Viewer,
  points: Cesium.Cartesian3[]
): Promise<sampleData[]> {
  const start = points[0].clone()
  const end = points[1].clone()

  const positions = [Cesium.Cartographic.fromCartesian(start)]
  const count = 99
  for (let i = 1; i < count; i++) {
    positions.push(
      Cesium.Cartographic.fromCartesian(
        Cesium.Cartesian3.lerp(start, end, i / count, new Cesium.Cartesian3())
      )
    )
  }
  positions.push(Cesium.Cartographic.fromCartesian(end))
  const promise = Cesium.sampleTerrainMostDetailed(
    viewer.terrainProvider,
    positions
  )

  return new Promise((resolve, reject) => {
    ;(Cesium as any).when(
      promise,
      function (updatedPositions: Cesium.Cartographic[]) {
        const datas: sampleData[] = []
        for (let i = 0; i < updatedPositions.length; i++) {
          datas.push({
            index: i,
            height: parseFloat(updatedPositions[i].height.toFixed(2)),
          })
        }
        resolve(datas)
      }
    )
  })
}

const removeAll = (viewer: Cesium.Viewer): void => {
  const entities = viewer.entities.values
  if (mousePoint && Cesium.defined(mousePoint)) {
    viewer.entities.remove(mousePoint)
  }
  if (activeShape && Cesium.defined(activeShape)) {
    viewer.entities.remove(activeShape)
  }
  mousePoint = undefined
  activeShape = undefined
  activeShapePoints = []

  let index = 0
  while (index < entities.length) {
    const model = entities[index]
    if (model.name === SAMPLE_ENTITY_NAME) {
      viewer.entities.remove(model)
    } else {
      index++
    }
  }
}

export default terrainSampling
export { removeAll }
