import {
  Viewer,
  Color,
  HeightReference,
  Cartesian3,
  Entity,
  ConstantPositionProperty,
  ScreenSpaceEventHandler,
  defined,
  ScreenSpaceEventType,
  ColorMaterialProperty,
  CallbackProperty,
  PolygonHierarchy,
  PointPrimitiveCollection,
  BlendOption,
  clone,
} from 'cesium'

import DrawBase from './DrawBase'
import type { DrawBaseOption } from './DrawBase'

export type DrawUserCallBackOption = {
  started?: () => void
  beforeStop?: (pickedPositions: Cartesian3[]) => void
  stoped?: () => void
}

export type DrawPointOption = DrawUserCallBackOption & {
  pixelSize?: number
  color?: Color
}

type ShapeActivePointOption = {
  pixelSize?: number
  color?: Color
  heightReference?: HeightReference
}

type DrawShapeEntityPropertyOption = {
  material?: Color | ColorMaterialProperty
  clampToGround?: boolean
  width?: number
}

type DrawShapeEntityNameAddition = {
  nameAddition?: string
}

export type DrawPolylineOption = DrawUserCallBackOption &
  ShapeActivePointOption &
  DrawShapeEntityPropertyOption &
  DrawShapeEntityNameAddition

export type DrawPolygonOption = DrawUserCallBackOption &
  ShapeActivePointOption &
  DrawShapeEntityPropertyOption &
  DrawShapeEntityNameAddition

type DrawShapeOptionBase = {
  drawMode: DrawMode
}

type DrawShapeOption = DrawShapeOptionBase &
  DrawPolylineOption &
  DrawPolygonOption

export enum DrawMode {
  Polyline,
  Polygon,
}

class Draw extends DrawBase {
  private static DRAWED_POINTS_FLAG = '_DRAWED_POINTS_FLAG'
  private static DRAWED_SHAPES_FLAG = '_DRAWED_SHAPES_FLAG'
  private static DRAWED_SHAPES_POLYLINE_FLAG = '_POLYLINE'
  private static DRAWED_SHAPES_POLYGON_FLAG = '_POLYGON'

  private activeShapePoints: Cartesian3[] = []
  private drawShapePickedPositions: Cartesian3[] = []
  private activeShape: Entity | undefined

  constructor(viewer: Viewer) {
    super(viewer)
  }

  public drawPoint(option?: DrawPointOption): void {
    const { viewer } = this
    const { started, stoped, pixelSize = 10, color = Color.RED } = option || {}
    const { scene } = viewer

    const pointPrimitives = new PointPrimitiveCollection({
      blendOption: BlendOption.TRANSLUCENT,
    })
    ;(pointPrimitives as any).name = Draw.DRAWED_POINTS_FLAG
    scene.primitives.add(pointPrimitives)

    const drawStarted = () => {
      started && started()
    }

    const drawStoped = () => {
      stoped && stoped()
    }

    const addingPosition = (position: Cartesian3) => {
      pointPrimitives.add({
        position: position,
        pixelSize,
        color,
      })
    }

    const drawBaseOption: DrawBaseOption = {
      drawStarted,
      drawStoped,
      addingPosition,
    }

    this.draw(drawBaseOption)
  }

  public removeDrawedPoints(): void {
    const { scene } = this.viewer
    const pris = scene.primitives

    let index = 0
    while (index < pris.length) {
      const pri = pris.get(index)
      if (pri.name === Draw.DRAWED_POINTS_FLAG) {
        pris.remove(pri)
      } else {
        index++
      }
    }
  }

  private generateShape(
    drawMode: DrawMode,
    data: any,
    option: DrawShapeEntityPropertyOption
  ): Entity | undefined {
    const { viewer } = this

    if (drawMode === DrawMode.Polyline) {
      const { clampToGround = true, width = 5, material = Color.RED } = option
      return viewer.entities.add({
        polyline: {
          positions: data,
          clampToGround,
          width,
          material,
        },
      })
    } else if (drawMode === DrawMode.Polygon) {
      const { material = new ColorMaterialProperty(Color.RED.withAlpha(0.7)) } =
        option
      return viewer.entities.add({
        polygon: {
          hierarchy: data,
          material,
        },
      })
    }
  }

  private terminateShape(
    drawMode: DrawMode,
    option: DrawShapeEntityPropertyOption &
      DrawShapeEntityNameAddition &
      DrawUserCallBackOption
  ): void {
    const {
      viewer,
      activeShapePoints,
      drawShapePickedPositions,
      activeShape,
      drawShapeEntityName,
    } = this
    activeShapePoints.pop()

    option && option.beforeStop && option.beforeStop(drawShapePickedPositions)

    const entity = this.generateShape(drawMode, activeShapePoints, option)
    if (!entity) {
      return
    }
    entity.name = drawShapeEntityName(drawMode, option.nameAddition)

    if (activeShape) {
      viewer.entities.remove(activeShape)
    }

    this.activeShape = undefined
    this.activeShapePoints = []
    this.drawShapePickedPositions = []
  }

  protected drawShapeEntityName(
    drawMode: DrawMode,
    nameAddition: string | undefined = undefined
  ): string {
    let entityName: string = Draw.DRAWED_SHAPES_FLAG
    if (drawMode === DrawMode.Polyline) {
      entityName += Draw.DRAWED_SHAPES_POLYLINE_FLAG + (nameAddition || '')
    } else {
      entityName += Draw.DRAWED_SHAPES_POLYGON_FLAG + (nameAddition || '')
    }
    return entityName
  }

  private drawShape(option: DrawShapeOption): void {
    const { started, stoped, drawMode } = option
    const self = this

    const drawStarted = () => {
      started && started()
    }

    const drawStoped = () => {
      self.terminateShape(drawMode, option)
      stoped && stoped()
    }

    const addingPosition = (position: Cartesian3) => {
      if (self.activeShape) {
        self.viewer.entities.remove(self.activeShape)
        self.activeShape = undefined
      }

      self.activeShapePoints.push(position)

      self.activeShape = self.generateShape(
        drawMode,
        new CallbackProperty(() => {
          if (drawMode === DrawMode.Polygon) {
            return new PolygonHierarchy(self.activeShapePoints)
          }
          return self.activeShapePoints
        }, false),
        option
      )

      self.drawShapePickedPositions.push(clone(position))
    }

    const movingPosition = (position: Cartesian3) => {
      self.activeShapePoints.pop()
      self.activeShapePoints.push(position)
    }

    const drawBaseOption: DrawBaseOption = {
      drawStarted,
      drawStoped,
      addingPosition,
      movingPosition,
      showMousePosition: false,
    }

    this.draw(drawBaseOption)
  }

  private removeDrawedShapes(
    drawMode: DrawMode,
    nameAddition: string | undefined = undefined
  ): void {
    const { viewer, drawShapeEntityName } = this
    const entities = viewer.entities.values
    let index = 0
    const entityName = drawShapeEntityName(drawMode, nameAddition)
    while (index < entities.length) {
      const model = entities[index]
      if (model.name === entityName) {
        viewer.entities.remove(model)
      } else {
        index++
      }
    }
  }

  public drawPolyline(option?: DrawPolylineOption): void {
    this.drawShape({
      drawMode: DrawMode.Polyline,
      ...(option || {}),
    })
  }

  public drawPolygon(option?: DrawPolygonOption): void {
    this.drawShape({
      drawMode: DrawMode.Polygon,
      ...(option || {}),
    })
  }

  public removeDrawedPolyline(
    nameAddition: string | undefined = undefined
  ): void {
    this.removeDrawedShapes(DrawMode.Polyline, nameAddition)
  }

  public removeDrawedPolygon(
    nameAddition: string | undefined = undefined
  ): void {
    this.removeDrawedShapes(DrawMode.Polygon, nameAddition)
  }

  public removeAllDrawed(nameAddition: string | undefined = undefined): void {
    this.removeDrawedPoints()
    this.removeDrawedPolyline(nameAddition)
    this.removeDrawedPolygon(nameAddition)
  }
}

export default Draw
