import {
  Viewer,
  Color,
  Cartesian3,
  Entity,
  Cartographic,
  CallbackProperty,
} from 'cesium'
import Draw from '../draw/Draw'
import { DrawMode } from '../draw/Draw'

export type DrawFloodAnalysisUserCallBackOption = {
  stoped?: () => void
}

export type FloodAnimateOption = {
  totalMilliseconds?: number
  totalFrame?: number
  currentHeightChange?: (val: number) => void
}

class FloodAnalysis extends Draw {
  private static FLOOD_ANALYSIS_DRAWED_POLYGON_NAME_ADDITION =
    '_FOR_FLOOD_ANALYSIS'

  public static FLOOD_ANALYSIS_MAX_HEIGHT_LIMIT = 10000
  public static FLOOD_ANALYSIS_MIN_HEIGHT_LIMIT = 0

  private _minHeight = 0
  private _maxHeight = 9999

  private intervalId = -1

  get minHeight(): number {
    return this._minHeight
  }
  set minHeight(val: number) {
    if (val < FloodAnalysis.FLOOD_ANALYSIS_MIN_HEIGHT_LIMIT) {
      val = FloodAnalysis.FLOOD_ANALYSIS_MIN_HEIGHT_LIMIT
    }
    if (val > this.maxHeight) {
      val = this.maxHeight - 0.01
    }

    this._minHeight = val
  }

  get maxHeight(): number {
    return this._maxHeight
  }
  set maxHeight(val: number) {
    if (val > FloodAnalysis.FLOOD_ANALYSIS_MAX_HEIGHT_LIMIT) {
      val = FloodAnalysis.FLOOD_ANALYSIS_MAX_HEIGHT_LIMIT
    }
    if (val < this.minHeight) {
      val = this.minHeight + 0.01
    }
    this._maxHeight = val
  }

  constructor(viewer: Viewer) {
    super(viewer)
  }

  public drawFloodArea(option?: DrawFloodAnalysisUserCallBackOption): void {
    this.stopFloodAnimate()
    this.viewer.scene.globe.depthTestAgainstTerrain = true
    this.removeDrawedFloodArea()
    const self = this
    this.drawPolygon({
      nameAddition: FloodAnalysis.FLOOD_ANALYSIS_DRAWED_POLYGON_NAME_ADDITION,
      color: Color.YELLOW,
      material: Color.fromCssColorString('#6191daa1'),
      stoped: () => {
        option && option.stoped && option.stoped()
      },
      beforeStop: (ps) => self.calcFloodAreaMinMaxHeight(ps),
    })
  }

  public removeDrawedFloodArea(): void {
    this.stopFloodAnimate()
    this.removeDrawedPolygon(
      FloodAnalysis.FLOOD_ANALYSIS_DRAWED_POLYGON_NAME_ADDITION
    )
  }

  private currentFloodArea(): Entity | undefined {
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

  private calcFloodAreaMinMaxHeight(points: Cartesian3[]): void {
    if (!points) {
      return
    }

    // calculate from ellipsoid
    // const ellipsoid = this.viewer.scene.globe.ellipsoid
    // const calcHeight = (cartesian3: Cesium.Cartesian3) => {
    //   return (
    //     viewer.scene.globe.getHeight(
    //       ellipsoid.cartesianToCartographic(cartesian3)
    //     ) || 0
    //   )
    // }

    // calculate from pick position
    const calcHeight = (cartesian3: Cartesian3) => {
      return Cartographic.fromCartesian(cartesian3).height
    }

    let minH = calcHeight(points[0])
    let maxH = minH
    const len = points.length
    for (let i = 1; i < len; i++) {
      const h = calcHeight(points[i])
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

  public setCurrentHeight(val: number, isConstant: boolean = true): void {
    const floodArea = this.currentFloodArea()
    if (!floodArea || !floodArea.polygon) {
      return
    }
    this.stopFloodAnimate()
    floodArea.polygon.extrudedHeight = new CallbackProperty(() => {
      return val
    }, isConstant)
  }

  public startFloodAnimate(option?: FloodAnimateOption): void {
    this.stopFloodAnimate()
    const floodArea = this.currentFloodArea()
    if (!floodArea) {
      return
    }
    const { currentHeightChange } = option || {}
    let { totalMilliseconds = 3000, totalFrame = 60 } = option || {}
    if (totalMilliseconds < 300) {
      totalMilliseconds = 300
    }
    if (totalMilliseconds / totalFrame < 10) {
      totalFrame = totalMilliseconds / 10
    }

    const { maxHeight, minHeight } = this

    const timespan = totalMilliseconds / totalFrame // timespan per frame
    const heightDiff = maxHeight - minHeight
    const heightGrow = heightDiff / totalFrame

    let index = 0
    const self = this
    this.intervalId = window.setInterval(() => {
      if (!floodArea || !floodArea.polygon) {
        return
      }
      const currentHeight = minHeight + heightGrow * index
      floodArea.polygon.extrudedHeight = new CallbackProperty(() => {
        return currentHeight
      }, false)
      currentHeightChange && currentHeightChange(currentHeight)
      index++

      // const nowH = floodArea.polygon.extrudedHeight.getValue(
      //   self.viewer.clock.currentTime
      // )
      if (currentHeight > maxHeight) {
        self.stopFloodAnimate()
      }
    }, timespan)
  }

  public stopFloodAnimate(): void {
    clearInterval(this.intervalId)
  }
}

export default FloodAnalysis
