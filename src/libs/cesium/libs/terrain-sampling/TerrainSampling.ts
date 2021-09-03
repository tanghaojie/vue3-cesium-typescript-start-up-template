import * as Cesium from 'cesium'

type sampleData = {
  index: number
  height: number
}

class TerrainSampling {
  private static SAMPLE_ENTITY_NAME = '_SAMPLE_ENTITY_NAME'
  private activeShapePoints: Cesium.Cartesian3[] = []
  private activeShape: Cesium.Entity | undefined
  private mousePoint: Cesium.Entity | undefined

  private viewer: Cesium.Viewer

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  private createLine(positions: any): Cesium.Entity {
    const model = this.viewer.entities.add({
      polyline: {
        positions: positions,
        clampToGround: true,
        width: 8,
        material: Cesium.Color.DODGERBLUE,
      },
    })
    model.name = TerrainSampling.SAMPLE_ENTITY_NAME
    return model
  }

  private createPoint(position: any): Cesium.Entity {
    const model = this.viewer.entities.add({
      position: position,
      point: {
        color: Cesium.Color.INDIANRED,
        pixelSize: 10,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    })
    model.name = TerrainSampling.SAMPLE_ENTITY_NAME
    return model
  }

  public sampling(): Promise<sampleData[]> {
    const { scene } = this.viewer
    this.removeAll()

    if (!scene.pickPositionSupported) {
      const errorStr = 'This browser does not support pickPosition.'
      window.alert(errorStr)
      return Promise.reject(errorStr)
    }

    const self = this

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

        if (self.activeShapePoints.length === 0) {
          self.mousePoint = self.createPoint(position)
          self.activeShapePoints.push(position)
          self.activeShape = self.createLine(
            new Cesium.CallbackProperty(() => {
              return self.activeShapePoints
            }, false)
          )
        }

        if (self.activeShapePoints.length === 2) {
          self.createPoint(position)
          self.createLine(self.activeShapePoints)
          self.mousePoint && self.viewer.entities.remove(self.mousePoint)
          self.activeShape && self.viewer.entities.remove(self.activeShape)

          self.updateData(self.activeShapePoints).then((sampleDatas) => {
            resolve(sampleDatas)

            self.mousePoint = undefined
            self.activeShape = undefined
            self.activeShapePoints = []
          })

          self.mousePoint = undefined
          self.activeShape = undefined
          self.activeShapePoints = []
          handler.destroy()
          return
        }
        self.activeShapePoints.push(position)
        self.createPoint(position)
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

      handler.setInputAction(function (event) {
        const newPosition = scene.camera.pickEllipsoid(
          event.endPosition,
          scene.globe.ellipsoid
        )
        if (
          !self.mousePoint ||
          !newPosition ||
          !Cesium.defined(self.mousePoint) ||
          !Cesium.defined(newPosition)
        ) {
          return
        }
        ;(self.mousePoint.position as any).setValue(newPosition)
        self.activeShapePoints.pop()
        self.activeShapePoints.push(newPosition)
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

      handler.setInputAction(function (event) {
        self.removeAll()
        handler.destroy()
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    })
  }

  private updateData(points: Cesium.Cartesian3[]): Promise<sampleData[]> {
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
      this.viewer.terrainProvider,
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

  public removeAll(): void {
    const { viewer, mousePoint, activeShape } = this
    const entities = viewer.entities.values
    if (mousePoint && Cesium.defined(mousePoint)) {
      viewer.entities.remove(mousePoint)
    }
    if (activeShape && Cesium.defined(activeShape)) {
      viewer.entities.remove(activeShape)
    }
    this.mousePoint = undefined
    this.activeShape = undefined
    this.activeShapePoints = []

    let index = 0
    while (index < entities.length) {
      const model = entities[index]
      if (model.name === TerrainSampling.SAMPLE_ENTITY_NAME) {
        viewer.entities.remove(model)
      } else {
        index++
      }
    }
  }
}

export default TerrainSampling
