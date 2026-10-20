import {
  Cartesian3,
  Color,
  JulianDate,
  Matrix4,
  PerspectiveFrustum,
  SceneMode,
  type Entity,
  type Viewer,
} from 'cesium'
import type { GeoCaptureSubjects } from '../data/capture-subject'
import {
  captureAnchor,
  captureDuration,
  evaluateCaptureShot,
  locateCaptureTime,
  parseCaptureProject,
  type CapturePose,
  type CaptureProject,
  type CaptureVector,
} from './capture-project'

export function readCapturePose(viewer: Viewer, project: CaptureProject): CapturePose {
  if (!project.subject) {
    throw new Error('请先选择拍摄主体。')
  }
  const anchor = captureAnchor(project.subject.anchor)
  const inverse = Matrix4.inverseTransformation(anchor, new Matrix4())
  const position = Matrix4.multiplyByPoint(inverse, viewer.camera.positionWC, new Cartesian3())
  const direction = Matrix4.multiplyByPointAsVector(
    inverse,
    viewer.camera.directionWC,
    new Cartesian3(),
  )
  const target = Cartesian3.add(
    position,
    Cartesian3.multiplyByScalar(
      direction,
      Math.max(1, Cartesian3.magnitude(position)),
      new Cartesian3(),
    ),
    new Cartesian3(),
  )
  function vector(value: Cartesian3): CaptureVector {
    return [value.x, value.y, value.z]
  }
  const frustum = viewer.camera.frustum
  return {
    position: vector(position),
    target: vector(target),
    fov:
      frustum instanceof PerspectiveFrustum
        ? ((frustum.fovy ?? (38 * Math.PI) / 180) * 180) / Math.PI
        : 38,
  }
}

export function applyCapturePose(viewer: Viewer, project: CaptureProject, pose: CapturePose): void {
  if (!project.subject) {
    throw new Error('工程缺少拍摄主体。')
  }
  const anchor = captureAnchor(project.subject.anchor)
  const position = Matrix4.multiplyByPoint(
    anchor,
    Cartesian3.fromArray(pose.position),
    new Cartesian3(),
  )
  const target = Matrix4.multiplyByPoint(
    anchor,
    Cartesian3.fromArray(pose.target),
    new Cartesian3(),
  )
  const direction = Cartesian3.normalize(
    Cartesian3.subtract(target, position, new Cartesian3()),
    new Cartesian3(),
  )
  let up = Matrix4.multiplyByPointAsVector(anchor, Cartesian3.UNIT_Z, new Cartesian3())
  if (Math.abs(Cartesian3.dot(direction, up)) > 0.999) {
    up = Matrix4.multiplyByPointAsVector(anchor, Cartesian3.UNIT_Y, new Cartesian3())
  }
  const right = Cartesian3.normalize(
    Cartesian3.cross(direction, up, new Cartesian3()),
    new Cartesian3(),
  )
  up = Cartesian3.normalize(Cartesian3.cross(right, direction, new Cartesian3()), new Cartesian3())
  viewer.camera.setView({
    destination: position,
    orientation: { direction, up },
    endTransform: Matrix4.IDENTITY,
  })
  const frustum = viewer.camera.frustum
  if (frustum instanceof PerspectiveFrustum) {
    const vertical = (pose.fov * Math.PI) / 180
    const aspect = project.aspect === 'landscape' ? 16 / 9 : 9 / 16
    frustum.aspectRatio = aspect
    frustum.fov = aspect > 1 ? 2 * Math.atan(Math.tan(vertical / 2) * aspect) : vertical
  }
  viewer.scene.requestRender()
}

export function createCaptureSession(
  viewer: Viewer,
  projectInput: CaptureProject,
  subjectId: string,
  subjects: GeoCaptureSubjects,
) {
  const project = parseCaptureProject(projectInput)
  if (viewer.scene.mode !== SceneMode.SCENE3D) {
    throw new Error('请先切换到三维场景再开始拍摄。')
  }
  if (!subjects.list().some((subject) => subject.id === subjectId)) {
    throw new Error('请重新选择可见的已加载模型。')
  }
  const camera = viewer.camera
  const clock = viewer.clock
  const original = {
    position: Cartesian3.clone(camera.positionWC),
    direction: Cartesian3.clone(camera.directionWC),
    up: Cartesian3.clone(camera.upWC),
    transform: Matrix4.clone(camera.transform),
    frustum: camera.frustum.clone(),
    time: JulianDate.clone(clock.currentTime),
    multiplier: clock.multiplier,
    shouldAnimate: clock.shouldAnimate,
    clockStep: clock.clockStep,
    inputs: viewer.scene.screenSpaceCameraController.enableInputs,
    trackedEntity: viewer.trackedEntity,
  }
  const lease = subjects.acquire(subjectId)
  let disposed = false
  camera.cancelFlight()
  viewer.trackedEntity = undefined
  clock.shouldAnimate = false
  clock.multiplier = 1
  viewer.scene.screenSpaceCameraController.enableInputs = false
  const start = JulianDate.fromIso8601(project.startTime)
  return {
    setInputEnabled(enabled: boolean): void {
      if (!viewer.isDestroyed()) {
        viewer.scene.screenSpaceCameraController.enableInputs = enabled && original.inputs
      }
    },
    apply(seconds: number, shotId?: string): void {
      if (disposed || viewer.isDestroyed()) {
        throw new Error('拍摄会话已结束。')
      }
      if (!subjects.list().some((subject) => subject.id === subjectId)) {
        throw new Error('拍摄主体已隐藏或移除。')
      }
      const current = locateCaptureTime(project, seconds, shotId)
      clock.shouldAnimate = false
      clock.currentTime = JulianDate.addSeconds(start, current.sceneSeconds, new JulianDate())
      applyCapturePose(viewer, project, evaluateCaptureShot(current.shot, current.local))
      let animation: { clip: string; seconds: number } | undefined
      for (let index = 0; index <= current.index; index += 1) {
        const shot = project.shots[index]
        if (!shot.animation) {
          continue
        }
        const progress = index === current.index ? current.local / shot.duration : 1
        animation = {
          clip: shot.animation.clip,
          seconds: shot.animation.start + (shot.animation.end - shot.animation.start) * progress,
        }
      }
      lease.sample(animation?.clip, animation?.seconds ?? 0)
    },
    dispose(): void {
      if (disposed) {
        return
      }
      disposed = true
      try {
        lease.dispose()
      } finally {
        if (!viewer.isDestroyed()) {
          viewer.trackedEntity = original.trackedEntity
          clock.currentTime = original.time
          clock.multiplier = original.multiplier
          clock.shouldAnimate = original.shouldAnimate
          clock.clockStep = original.clockStep
          viewer.scene.screenSpaceCameraController.enableInputs = original.inputs
          camera.frustum = original.frustum
          camera.setView({
            destination: original.position,
            orientation: { direction: original.direction, up: original.up },
            endTransform: original.transform,
          })
          viewer.scene.requestRender()
        }
      }
    },
  }
}

export function createCapturePath(viewer: Viewer, project: CaptureProject) {
  const entities: Entity[] = []
  if (!project.subject) {
    return { dispose() {} }
  }
  const anchor = captureAnchor(project.subject.anchor)
  for (const shot of project.shots) {
    const positions = Array.from({ length: 41 }, (_, index) =>
      Matrix4.multiplyByPoint(
        anchor,
        Cartesian3.fromArray(evaluateCaptureShot(shot, (shot.duration * index) / 40).position),
        new Cartesian3(),
      ),
    )
    entities.push(viewer.entities.add({ polyline: { positions, width: 2, material: Color.CYAN } }))
    entities.push(
      viewer.entities.add({ position: positions[0], point: { pixelSize: 8, color: Color.WHITE } }),
    )
  }
  viewer.scene.requestRender()
  return {
    dispose(): void {
      if (viewer.isDestroyed()) {
        return
      }
      entities.forEach((entity) => viewer.entities.remove(entity))
      viewer.scene.requestRender()
    },
  }
}

export function shotStartTime(project: CaptureProject, id: string): number {
  const index = project.shots.findIndex((shot) => shot.id === id)
  return captureDuration({ shots: project.shots.slice(0, Math.max(0, index)) })
}
