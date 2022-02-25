import {
  Viewer,
  Cartesian3,
  Entity,
  Color,
  HeightReference,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  CallbackProperty,
  Cartographic,
  sampleTerrainMostDetailed,
} from 'cesium'
import * as Cesium from 'cesium'

type sampleData = {
  index: number
  height: number
}

class TerrainSampling {
  private static SAMPLE_ENTITY_NAME = '_SAMPLE_ENTITY_NAME'
  private activeShapePoints: Cartesian3[] = []
  private activeShape: Entity | undefined
  private mousePoint: Entity | undefined

  private viewer: Viewer

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  private createLine(positions: any): Entity {
    const model = this.viewer.entities.add({
      polyline: {
        positions: positions,
        clampToGround: true,
        width: 8,
        material: Color.DODGERBLUE,
      },
    })
    model.name = TerrainSampling.SAMPLE_ENTITY_NAME
    return model
  }

  private createPoint(position: any): Entity {
    const model = this.viewer.entities.add({
      position: position,
      point: {
        color: Color.INDIANRED,
        pixelSize: 10,
        heightReference: HeightReference.CLAMP_TO_GROUND,
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
      const handler = new ScreenSpaceEventHandler(scene.canvas)
      handler.setInputAction(function (event) {
        const position = scene.camera.pickEllipsoid(
          event.position,
          scene.globe.ellipsoid
        )
        if (!position || !defined(position)) {
          return
        }

        if (self.activeShapePoints.length === 0) {
          self.mousePoint = self.createPoint(position)
          self.activeShapePoints.push(position)
          self.activeShape = self.createLine(
            new CallbackProperty(() => {
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
      }, ScreenSpaceEventType.LEFT_CLICK)

      handler.setInputAction(function (event) {
        const newPosition = scene.camera.pickEllipsoid(
          event.endPosition,
          scene.globe.ellipsoid
        )
        if (
          !self.mousePoint ||
          !newPosition ||
          !defined(self.mousePoint) ||
          !defined(newPosition)
        ) {
          return
        }
        ;(self.mousePoint.position as any).setValue(newPosition)
        self.activeShapePoints.pop()
        self.activeShapePoints.push(newPosition)
      }, ScreenSpaceEventType.MOUSE_MOVE)

      handler.setInputAction(function (event) {
        self.removeAll()
        handler.destroy()
      }, ScreenSpaceEventType.RIGHT_CLICK)
    })
  }

  private updateData(points: Cartesian3[]): Promise<sampleData[]> {
    const start = points[0].clone()
    const end = points[1].clone()

    const positions = [Cartographic.fromCartesian(start)]
    const count = 99
    for (let i = 1; i < count; i++) {
      positions.push(
        Cartographic.fromCartesian(
          Cartesian3.lerp(start, end, i / count, new Cartesian3())
        )
      )
    }
    positions.push(Cartographic.fromCartesian(end))
    const promise = sampleTerrainMostDetailed(
      this.viewer.terrainProvider,
      positions
    )

    return new Promise((resolve, reject) => {
      ;(Cesium as any).when(
        promise,
        function (updatedPositions: Cartographic[]) {
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
    if (mousePoint && defined(mousePoint)) {
      viewer.entities.remove(mousePoint)
    }
    if (activeShape && defined(activeShape)) {
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
