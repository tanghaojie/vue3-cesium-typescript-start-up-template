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

export type DrawBaseCallBackOption = {
  addingPosition?: (position: Cartesian3) => void
  movingPosition?: (position: Cartesian3) => void
  drawStarted?: () => void
  drawStoped?: () => void
}

export type DrawBaseOption = DrawBaseCallBackOption & {
  addingEventType?: ScreenSpaceEventType
  stopEventType?: ScreenSpaceEventType
  showMousePosition?: Boolean
  mousePosPixelSize?: number
  mousePosColor?: Color
  mousePosHeightReference?: HeightReference
}

abstract class DrawBase {
  protected viewer: Viewer

  private mousePositionShape: Entity | undefined

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  public createMousePositionShape(position: any, option?: DrawBaseOption): Entity {
    const {
      mousePosColor = Color.YELLOW,
      mousePosPixelSize = 10,
      mousePosHeightReference = HeightReference.CLAMP_TO_GROUND,
    } = option || {}

    const { viewer } = this

    return viewer.entities.add({
      position: position,
      point: {
        color: mousePosColor,
        pixelSize: mousePosPixelSize,
        heightReference: mousePosHeightReference,
      },
    })
  }

  public draw(option?: DrawBaseOption): void {
    const { viewer } = this
    const { scene } = viewer

    if (!scene.pickPositionSupported) {
      window.alert('This browser does not support pickPosition.')
      return
    }

    const {
      addingPosition,
      movingPosition,
      drawStarted,
      drawStoped,
      addingEventType = ScreenSpaceEventType.LEFT_CLICK,
      stopEventType = ScreenSpaceEventType.RIGHT_CLICK,
      showMousePosition = false,
    } = option || {}

    const hasDepthTest = scene.globe.depthTestAgainstTerrain
    const handler = new ScreenSpaceEventHandler(scene.canvas)

    const self = this

    handler.setInputAction(function (e: any) {
      let position: Cartesian3 | undefined
      if (hasDepthTest) {
        position = scene.pickPosition(e.position)
      } else {
        position = scene.camera.pickEllipsoid(e.position, scene.globe.ellipsoid)
      }
      if (!position || !defined(position)) {
        return
      }

      if (showMousePosition && !self.mousePositionShape) {
        self.mousePositionShape = self.createMousePositionShape(position)
      }

      addingPosition && addingPosition(position)
    }, addingEventType)

    if (movingPosition) {
      handler.setInputAction(function (e: any) {
        let position: Cartesian3 | undefined
        if (hasDepthTest) {
          position = scene.pickPosition(e.endPosition)
        } else {
          position = scene.camera.pickEllipsoid(e.endPosition, scene.globe.ellipsoid)
        }
        if (!position || !defined(position)) {
          return
        }

        movingPosition(position)

        if (showMousePosition && self.mousePositionShape && self.mousePositionShape.position) {
          ;(self.mousePositionShape.position as ConstantPositionProperty).setValue(position)
        }
      }, ScreenSpaceEventType.MOUSE_MOVE)
    }

    handler.setInputAction(function (e: any) {
      if (self.mousePositionShape) {
        viewer.entities.remove(self.mousePositionShape)
      }
      self.mousePositionShape = undefined

      handler.destroy()
      drawStoped && drawStoped()
    }, stopEventType)

    drawStarted && drawStarted()
  }
}

export default DrawBase
