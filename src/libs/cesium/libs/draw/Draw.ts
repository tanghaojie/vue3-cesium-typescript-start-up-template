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

class Draw {
  private static DRAWED_POINTS_FLAG = '_DRAWED_POINTS_FLAG'
  private static DRAWED_SHAPES_FLAG = '_DRAWED_SHAPES_FLAG'
  private static DRAWED_SHAPES_POLYLINE_FLAG = '_POLYLINE'
  private static DRAWED_SHAPES_POLYGON_FLAG = '_POLYGON'

  protected viewer: Viewer

  private activeShapePoints: Cartesian3[] = []
  private drawShapePickedPositions: Cartesian3[] = []
  private activeShape: Entity | undefined
  private mousePoint: Entity | undefined

  constructor(viewer: Viewer) {
    this.viewer = viewer
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

    const hasDepthTest = scene.globe.depthTestAgainstTerrain
    const handler = new ScreenSpaceEventHandler(scene.canvas)
    handler.setInputAction(function (e) {
      let cartesian
      if (hasDepthTest) {
        cartesian = scene.pickPosition(e.position)
      } else {
        cartesian = scene.camera.pickEllipsoid(
          e.position,
          scene.globe.ellipsoid
        )
      }

      pointPrimitives.add({
        position: cartesian,
        pixelSize,
        color,
      })
    }, ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction(function (movement) {
      handler.destroy()
      stoped && stoped()
    }, ScreenSpaceEventType.RIGHT_CLICK)

    started && started()
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

  private createShapeActivePoint(
    position: any,
    option: ShapeActivePointOption
  ): Entity {
    const {
      color = Color.YELLOW,
      pixelSize = 10,
      heightReference = HeightReference.CLAMP_TO_GROUND,
    } = option
    const { viewer } = this
    return viewer.entities.add({
      position: position,
      point: {
        color,
        pixelSize,
        heightReference,
      },
    })
  }

  private buildShape(
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
      mousePoint,
      activeShape,
      drawShapeEntityName,
    } = this
    activeShapePoints.pop()

    option && option.beforeStop && option.beforeStop(drawShapePickedPositions)

    const entity = this.buildShape(drawMode, activeShapePoints, option)
    if (!entity) {
      return
    }

    entity.name = drawShapeEntityName(drawMode, option.nameAddition)

    if (mousePoint) {
      viewer.entities.remove(mousePoint)
    }

    if (activeShape) {
      viewer.entities.remove(activeShape)
    }

    this.mousePoint = undefined
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
    const { viewer } = this
    const { scene } = viewer
    const self = this

    if (!scene.pickPositionSupported) {
      window.alert('This browser does not support pickPosition.')
      return
    }

    const hasDepthTest = scene.globe.depthTestAgainstTerrain
    const handler = new ScreenSpaceEventHandler(scene.canvas)
    handler.setInputAction(function (event) {
      let position: Cartesian3 | undefined
      if (hasDepthTest) {
        position = scene.pickPosition(event.position)
      } else {
        position = scene.camera.pickEllipsoid(
          event.position,
          scene.globe.ellipsoid
        )
      }
      if (!position || !defined(position)) {
        return
      }

      if (self.activeShapePoints.length === 0) {
        self.mousePoint = self.createShapeActivePoint(position, option)
        self.activeShapePoints.push(position)
        self.activeShape = self.buildShape(
          drawMode,
          new CallbackProperty(() => {
            if (drawMode === DrawMode.Polygon) {
              return new PolygonHierarchy(self.activeShapePoints)
            }
            return self.activeShapePoints
          }, false),
          option
        )
      }
      self.activeShapePoints.push(position)
      self.drawShapePickedPositions.push(clone(position))
      // createShapeActivePoint(position, option)
    }, ScreenSpaceEventType.LEFT_CLICK)

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
      const { mousePoint } = self
      if (
        !mousePoint ||
        !newPosition ||
        !defined(mousePoint) ||
        !defined(newPosition)
      ) {
        return
      }

      if (mousePoint.position) {
        ;(mousePoint.position as ConstantPositionProperty).setValue(newPosition)
      }

      self.activeShapePoints.pop()
      self.activeShapePoints.push(newPosition)
    }, ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction(function (event) {
      self.terminateShape(drawMode, option)
      handler.destroy()
      stoped && stoped()
    }, ScreenSpaceEventType.RIGHT_CLICK)

    started && started()
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
