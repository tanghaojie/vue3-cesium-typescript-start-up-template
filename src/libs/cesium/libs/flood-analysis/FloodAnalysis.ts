import * as Cesium from 'cesium'
import Draw from '../draw/Draw'
import { DrawMode } from '../draw/Draw'

export type DrawFloodAnalysisUserCallBackOption = {
  stoped?: () => void
}

export type FloodAnimateOption = {
  totalMilliseconds?: number
  totalFrame?: number
}

class FloodAnalysis extends Draw {
  private static FLOOD_ANALYSIS_DRAWED_POLYGON_NAME_ADDITION =
    '_FOR_FLOOD_ANALYSIS'

  private _minHeight = 0
  private _maxHeight = 9999

  get minHeight(): number {
    return this._minHeight
  }
  set minHeight(val: number) {
    this._minHeight = val
  }

  get maxHeight(): number {
    return this._maxHeight
  }
  set maxHeight(val: number) {
    this._maxHeight = val
  }

  constructor(viewer: Cesium.Viewer) {
    super(viewer)
  }

  public drawFloodArea(option?: DrawFloodAnalysisUserCallBackOption): void {
    this.viewer.scene.globe.depthTestAgainstTerrain = true
    this.removeDrawedPolygon(
      FloodAnalysis.FLOOD_ANALYSIS_DRAWED_POLYGON_NAME_ADDITION
    )
    const self = this
    this.drawPolygon({
      nameAddition: FloodAnalysis.FLOOD_ANALYSIS_DRAWED_POLYGON_NAME_ADDITION,
      color: Cesium.Color.YELLOW,
      material: Cesium.Color.fromCssColorString('#6191daa1'),
      stoped: () => {
        self.calcFloodAreaMinMaxHeightPoint()
        option && option.stoped && option.stoped()
      },
    })
  }

  private currentFloodArea(): Cesium.Entity | undefined {
    const { viewer, drawShapeEntityName } = this
    const entities = viewer.entities.values
    let index = 0
    const entityName = drawShapeEntityName(
      DrawMode.Polygon,
      FloodAnalysis.FLOOD_ANALYSIS_DRAWED_POLYGON_NAME_ADDITION
    )
    while (index < entities.length) {
      const model = entities[index]
      if (model.name === entityName) {
        return model
      } else {
        index++
      }
    }
    return undefined
  }

  private calcFloodAreaMinMaxHeightPoint(): void {
    const entity = this.currentFloodArea()
    if (!entity) {
      return
    }
    const points = entity.polygon?.hierarchy?.getValue(
      this.viewer.clock.currentTime
    )
    if (!points || !points.positions) {
      return
    }
    const viewer = this.viewer
    const ellipsoid = this.viewer.scene.globe.ellipsoid
    const calcHeight = (cartesian3: Cesium.Cartesian3) => {
      return (
        viewer.scene.globe.getHeight(
          ellipsoid.cartesianToCartographic(cartesian3)
        ) || 0
      )
    }

    const ps = points.positions as Cesium.Cartesian3[]
    let minH = calcHeight(ps[0])
    let maxH = minH
    const len = ps.length
    for (let i = 1; i < len; i++) {
      const h = calcHeight(ps[i])
      if (h > maxH) {
        maxH = h
      }
      if (h < minH) {
        minH = h
      }
    }
    this.minHeight = minH
    this.maxHeight = maxH
  }

  public startFloodAnimate(option?: FloodAnimateOption): void {
    const floodArea = this.currentFloodArea()
    if (!floodArea) {
      return
    }
    const { totalMilliseconds = 3000, totalFrame = 60 } = option || {}
    const { maxHeight, minHeight } = this

    const timespan = totalMilliseconds / totalFrame // 单次时间间隔
    const heightDiff = maxHeight - minHeight // 高度差值
    const heightGrow = heightDiff / totalFrame // 高度增幅

    let index = 0
    const self = this
    const id = setInterval(() => {
      if (!floodArea || !floodArea.polygon) {
        return
      }
      floodArea.polygon.extrudedHeight = new Cesium.CallbackProperty(() => {
        return minHeight + heightGrow * index
      }, false)
      index++

      const nowH = floodArea.polygon.extrudedHeight.getValue(
        self.viewer.clock.currentTime
      )
      if (nowH > maxHeight) {
        clearInterval(id)
      }
    }, timespan)
  }
}

export default FloodAnalysis
