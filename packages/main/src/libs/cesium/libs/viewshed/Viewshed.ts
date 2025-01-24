import {
  Viewer,
  Camera,
  Math as CesiumMath,
  PerspectiveFrustum,
  OrthographicFrustum,
  ShadowMap,
  Color,
  PostProcessStage,
  PostProcessStageComposite,
  Cartesian2,
  Cartesian3,
  Cartesian4,
  Matrix3,
  Matrix4,
  Quaternion,
  GeometryInstance,
  FrustumOutlineGeometry,
  ColorGeometryInstanceAttribute,
  ShowGeometryInstanceAttribute,
  PerInstanceColorAppearance,
  Primitive,
  Entity,
  Transforms,
  HeadingPitchRoll,
  CallbackProperty,
  ConstantProperty,
} from 'cesium'
import glsl from './glsl'

export type Option = {
  // 观察点位置
  viewPosition: Cartesian3
  // 观察距离（米，默认100）
  viewDistance?: number
  // 水平夹角（度，默认90）
  horizontalViewAngle?: number
  // 垂直夹角（度，默认60）
  verticalViewAngle?: number
  // 航向角（度，默认0）
  viewHeading?: number
  // 俯仰角（度，默认0）
  viewPitch?: number
  // 可视区颜色（默认绿色）
  visibleAreaColor?: Color
  // 不可视区颜色（默认红色）
  invisibleAreaColor?: Color
  // 阴影贴图是否可用
  enabled?: boolean
  // 柔和阴影是否可用
  softShadows?: boolean
  // 每个阴影贴图的大小(默认2048)
  size?: number
}

class Viewshed {
  private viewer: Viewer
  // option
  private viewPosition!: Cartesian3
  private viewDistance!: number
  private horizontalViewAngle!: number
  private verticalViewAngle!: number
  private viewHeading!: number
  private viewPitch!: number
  private visibleAreaColor!: Color
  private invisibleAreaColor!: Color
  private enabled!: boolean
  private softShadows!: boolean
  private size!: number

  private lightCamera!: Camera
  private shadowMap!: ShadowMap
  private postStage!: PostProcessStage | PostProcessStageComposite | null
  private frustumOutline!: Primitive | null
  private sketch!: Entity | null

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  public start({
    viewPosition,
    viewDistance = 500,
    horizontalViewAngle = 90,
    verticalViewAngle = 60,
    viewHeading = 0,
    viewPitch = 0,
    visibleAreaColor = Color.GREEN,
    invisibleAreaColor = Color.RED,
    enabled = true,
    softShadows = true,
    size = 2048,
  }: Option): void {
    this.viewPosition = viewPosition
    this.viewDistance = viewDistance
    this.horizontalViewAngle = horizontalViewAngle
    this.verticalViewAngle = verticalViewAngle
    this.viewHeading = viewHeading
    this.viewPitch = viewPitch
    this.visibleAreaColor = visibleAreaColor
    this.invisibleAreaColor = invisibleAreaColor
    this.enabled = enabled
    this.softShadows = softShadows
    this.size = size

    this.update()
  }

  public add(): void {
    this.lightCamera = this.createLightCamera()

    this.shadowMap = this.createShadowMap()
    this.viewer.scene.shadowMap = this.shadowMap

    const postStage = this.createPostStage()
    this.postStage = this.viewer.scene.postProcessStages.add(postStage)

    const frustumOutline = this.drawFrustumOutline()
    this.frustumOutline = this.viewer.scene.primitives.add(frustumOutline)

    const sketch = this.drawSketch()
    this.sketch = this.viewer.entities.add(sketch)
  }

  public update(): void {
    this.clear()
    this.add()
  }

  public clear(): void {
    if (this.sketch) {
      this.viewer.entities.removeById(this.sketch.id)
      this.sketch = null
    }
    if (this.frustumOutline) {
      this.viewer.scene.primitives.remove(this.frustumOutline)
      !this.frustumOutline.isDestroyed && this.frustumOutline.destroy()
      this.frustumOutline = null
    }
    if (this.postStage) {
      this.viewer.scene.postProcessStages.remove(this.postStage)
      this.postStage = null
    }
  }

  // 创建相机
  private createLightCamera(): Camera {
    const camera = new Camera(this.viewer.scene)
    camera.position = this.viewPosition
    // if (this.viewPositionEnd) {
    //     let direction = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(this.viewPositionEnd, this.viewPosition, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    //     this.lightCamera.direction = direction; // direction是相机面向的方向
    // }
    camera.frustum.near = this.viewDistance * 0.001
    camera.frustum.far = this.viewDistance
    const hr = CesiumMath.toRadians(this.horizontalViewAngle)
    const vr = CesiumMath.toRadians(this.verticalViewAngle)
    const aspectRatio =
      (this.viewDistance * Math.tan(hr / 2) * 2) /
      (this.viewDistance * Math.tan(vr / 2) * 2)

    const frustum = camera.frustum as PerspectiveFrustum

    frustum.aspectRatio = aspectRatio
    frustum.fov = hr > vr ? hr : vr

    camera.setView({
      destination: this.viewPosition,
      orientation: {
        heading: CesiumMath.toRadians(this.viewHeading || 0),
        pitch: CesiumMath.toRadians(this.viewPitch || 0),
        roll: 0,
      },
    })

    return camera
  }

  // 创建Shadow map
  private createShadowMap(): ShadowMap {
    // Cesium ShadowMap 参数类型声明错误，只能转any
    const shadowMap = new (ShadowMap as any)({
      context: (this.viewer.scene as any).context,
      lightCamera: this.lightCamera,
      enabled: this.enabled,
      isPointLight: true,
      pointLightRadius: this.viewDistance,
      cascadesEnabled: false,
      size: this.size,
      softShadows: this.softShadows,
      normalOffset: false,
      fromLightSource: false,
    })
    return shadowMap
  }

  // 创建PostStage
  private createPostStage(): PostProcessStage {
    const fs = glsl
    const postStage = new PostProcessStage({
      fragmentShader: fs,
      uniforms: {
        shadowMap_textureCube: () => {
          ;(this.shadowMap as any).update(
            Reflect.get(this.viewer.scene, '_frameState')
          )
          return Reflect.get(this.shadowMap, '_shadowMapTexture')
        },
        shadowMap_matrix: () => {
          ;(this.shadowMap as any).update(
            Reflect.get(this.viewer.scene, '_frameState')
          )
          return Reflect.get(this.shadowMap, '_shadowMapMatrix')
        },
        shadowMap_lightPositionEC: () => {
          ;(this.shadowMap as any).update(
            Reflect.get(this.viewer.scene, '_frameState')
          )
          return Reflect.get(this.shadowMap, '_lightPositionEC')
        },
        shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: () => {
          ;(this.shadowMap as any).update(
            Reflect.get(this.viewer.scene, '_frameState')
          )
          const bias = (this.shadowMap as any)._pointBias
          return Cartesian4.fromElements(
            bias.normalOffsetScale,
            (this.shadowMap as any)._distance,
            this.shadowMap.maximumDistance,
            0.0,
            new Cartesian4()
          )
        },
        shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: () => {
          ;(this.shadowMap as any).update(
            Reflect.get(this.viewer.scene, '_frameState')
          )
          const bias = (this.shadowMap as any)._pointBias
          const scratchTexelStepSize = new Cartesian2()
          const texelStepSize = scratchTexelStepSize
          texelStepSize.x = 1.0 / (this.shadowMap as any)._textureSize.x
          texelStepSize.y = 1.0 / (this.shadowMap as any)._textureSize.y

          return Cartesian4.fromElements(
            texelStepSize.x,
            texelStepSize.y,
            bias.depthBias,
            bias.normalShadingSmooth,
            new Cartesian4()
          )
        },
        camera_projection_matrix: this.lightCamera.frustum.projectionMatrix,
        camera_view_matrix: this.lightCamera.viewMatrix,
        helsing_viewDistance: () => {
          return this.viewDistance
        },
        helsing_visibleAreaColor: this.visibleAreaColor,
        helsing_invisibleAreaColor: this.invisibleAreaColor,
      },
    })
    return postStage
  }

  // 创建视锥线
  private drawFrustumOutline(): Primitive {
    const scratchRight = new Cartesian3()
    const scratchRotation = new Matrix3()
    const scratchOrientation = new Quaternion()
    // const position = this.lightCamera.positionWC
    const direction = this.lightCamera.directionWC
    const up = this.lightCamera.upWC
    let right = this.lightCamera.rightWC
    right = Cartesian3.negate(right, scratchRight)
    const rotation = scratchRotation
    Matrix3.setColumn(rotation, 0, right, rotation)
    Matrix3.setColumn(rotation, 1, up, rotation)
    Matrix3.setColumn(rotation, 2, direction, rotation)
    const orientation = Quaternion.fromRotationMatrix(
      rotation,
      scratchOrientation
    )

    const instance = new GeometryInstance({
      geometry: new FrustumOutlineGeometry({
        frustum: this.lightCamera.frustum as PerspectiveFrustum,
        origin: this.viewPosition,
        orientation: orientation,
      }),
      id: Math.random().toString(36).substring(2),
      attributes: {
        color: ColorGeometryInstanceAttribute.fromColor(Color.YELLOWGREEN),
        show: new ShowGeometryInstanceAttribute(true),
      },
    })

    const frustumOutline = new Primitive({
      geometryInstances: [instance],
      appearance: new PerInstanceColorAppearance({
        flat: true,
        translucent: false,
      }),
    })

    return frustumOutline
  }

  // 创建视网
  private drawSketch(): Entity | Entity.ConstructorOptions {
    const halfHorizontalAngle = this.horizontalViewAngle / 2
    const halfVerticalAngle = this.verticalViewAngle / 2
    const entity = {
      name: 'sketch',
      position: this.viewPosition,
      orientation: new ConstantProperty(
        Transforms.headingPitchRollQuaternion(
          this.viewPosition,
          HeadingPitchRoll.fromDegrees(
            this.viewHeading - this.horizontalViewAngle,
            this.viewPitch,
            0.0
          )
        )
      ),
      ellipsoid: {
        radii: new Cartesian3(
          this.viewDistance,
          this.viewDistance,
          this.viewDistance
        ),
        // innerRadii: new Cesium.Cartesian3(2.0, 2.0, 2.0),
        minimumClock: CesiumMath.toRadians(-halfHorizontalAngle),
        maximumClock: CesiumMath.toRadians(halfHorizontalAngle),
        minimumCone: CesiumMath.toRadians(90 - halfVerticalAngle),
        maximumCone: CesiumMath.toRadians(90 + halfVerticalAngle),
        fill: false,
        outline: true,
        subdivisions: 256,
        stackPartitions: 64,
        slicePartitions: 64,
        outlineColor: Color.YELLOWGREEN,
      },
    }
    return entity
  }

  // 获得偏航角
  private getHeading(fromPosition: Cartesian3, toPosition: Cartesian3) {
    const finalPosition = new Cartesian3()
    const matrix4 = Transforms.eastNorthUpToFixedFrame(fromPosition)
    Matrix4.inverse(matrix4, matrix4)
    Matrix4.multiplyByPoint(matrix4, toPosition, finalPosition)
    Cartesian3.normalize(finalPosition, finalPosition)
    return CesiumMath.toDegrees(Math.atan2(finalPosition.x, finalPosition.y))
  }

  // 获得俯仰角
  private getPitch(fromPosition: Cartesian3, toPosition: Cartesian3) {
    const finalPosition = new Cartesian3()
    const matrix4 = Transforms.eastNorthUpToFixedFrame(fromPosition)
    Matrix4.inverse(matrix4, matrix4)
    Matrix4.multiplyByPoint(matrix4, toPosition, finalPosition)
    Cartesian3.normalize(finalPosition, finalPosition)
    return CesiumMath.toDegrees(Math.asin(finalPosition.z))
  }
}

export default Viewshed
