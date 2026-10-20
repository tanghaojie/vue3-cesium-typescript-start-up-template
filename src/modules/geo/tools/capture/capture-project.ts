import { Cartesian3, Cartographic, Math as CesiumMath, Matrix4, Transforms } from 'cesium'

export type CaptureVector = [number, number, number]
export interface CapturePose {
  position: CaptureVector
  target: CaptureVector
  /** Vertical field of view, in degrees. */
  fov: number
}
export interface CaptureShot {
  id: string
  name: string
  kind: 'orbit' | 'move' | 'hold'
  duration: number
  start: CapturePose
  end: CapturePose
  arc: number
  easing: 'smooth' | 'linear'
  sceneRate: number
  animation?: { clip: string; start: number; end: number }
}
export interface CaptureSubject {
  id: string
  label: string
  url?: string
  anchor: CaptureVector
  radius: number
  clips: readonly { label: string; duration: number; index: number }[]
}
export interface CaptureProject {
  version: 1
  name: string
  subject?: { label: string; url?: string; anchor: CaptureVector; radius: number }
  aspect: 'landscape' | 'portrait'
  resolution: '1080p' | '4k'
  fps: 24 | 25 | 30 | 60
  handles: number
  startTime: string
  shots: CaptureShot[]
}
export type CaptureTemplate = 'tower' | 'wide' | 'group' | 'assembly'
export const CAPTURE_TEMPLATES: readonly { id: CaptureTemplate; label: string }[] = [
  { id: 'tower', label: '高楼 · 环绕与升起' },
  { id: 'wide', label: '宽体建筑 · 横移与俯瞰' },
  { id: 'group', label: '建筑群 · 展开与巡览' },
  { id: 'assembly', label: '拼装 · 稳定全景' },
]

export function captureId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function createCaptureProject(): CaptureProject {
  return {
    version: 1,
    name: 'AI建模世界 · 新拍摄',
    aspect: 'landscape',
    resolution: '1080p',
    fps: 30,
    handles: 0.5,
    startTime: new Date().toISOString(),
    shots: [],
  }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('工程数据格式不正确。')
  }
  return value as Record<string, unknown>
}

function number(value: unknown, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`工程数值必须在 ${minimum} 到 ${maximum} 之间。`)
  }
  return value
}

function label(value: unknown, maximum = 120): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum) {
    throw new Error('请输入有效名称。')
  }
  return value.trim()
}

function vector(value: unknown): CaptureVector {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new Error('机位坐标必须包含三个数值。')
  }
  return value.map((item) => number(item, -50_000_000, 50_000_000)) as CaptureVector
}

function pose(value: unknown): CapturePose {
  const item = object(value)
  const position = vector(item.position)
  const target = vector(item.target)
  if (Math.hypot(...position.map((axis, index) => axis - target[index])) < 0.1) {
    throw new Error('机位与注视点至少需要相距 0.1 米。')
  }
  return { position, target, fov: number(item.fov, 10, 100) }
}

export function capturePoseDistance(pose: {
  position: readonly number[]
  target: readonly number[]
}): number {
  return Math.hypot(...pose.position.map((axis, index) => axis - pose.target[index]))
}

export function withCapturePoseDistance(pose: CapturePose, distance: number): CapturePose {
  const ratio = number(distance, 0.1, 50_000_000) / capturePoseDistance(pose)
  return {
    position: pose.position.map(
      (axis, index) => pose.target[index] + (axis - pose.target[index]) * ratio,
    ) as CaptureVector,
    target: [...pose.target],
    fov: pose.fov,
  }
}

export function parseCaptureProject(value: unknown): CaptureProject {
  const item = object(value)
  if (
    item.version !== 1 ||
    !['landscape', 'portrait'].includes(String(item.aspect)) ||
    !['1080p', '4k'].includes(String(item.resolution)) ||
    ![24, 25, 30, 60].includes(Number(item.fps)) ||
    typeof item.fps !== 'number'
  ) {
    throw new Error('不支持的拍摄工程版本、画幅或帧率。')
  }
  const epoch = typeof item.startTime === 'string' ? Date.parse(item.startTime) : NaN
  if (!Number.isFinite(epoch) || epoch < Date.UTC(1900, 0, 1) || epoch > Date.UTC(2200, 0, 1)) {
    throw new Error('场景日期必须在 1900 到 2200 年之间。')
  }
  if (!Array.isArray(item.shots) || item.shots.length > 100) {
    throw new Error('一个工程最多包含 100 个镜头。')
  }
  const ids = new Set<string>()
  const shots = item.shots.map(function readShot(value): CaptureShot {
    const shot = object(value)
    const id = label(shot.id)
    if (ids.has(id) || !['orbit', 'move', 'hold'].includes(String(shot.kind))) {
      throw new Error('镜头编号重复或镜头类型不正确。')
    }
    ids.add(id)
    if (shot.easing !== 'linear' && shot.easing !== 'smooth') {
      throw new Error('不支持的镜头速度曲线。')
    }
    const animation = shot.animation === undefined ? undefined : object(shot.animation)
    return {
      id,
      name: label(shot.name),
      kind: shot.kind as CaptureShot['kind'],
      duration: number(shot.duration, 0.5, 120),
      start: pose(shot.start),
      end: pose(shot.end),
      arc: number(shot.arc, -720, 720),
      easing: shot.easing === 'linear' ? 'linear' : 'smooth',
      sceneRate: number(shot.sceneRate, -86400, 86400),
      animation: animation
        ? {
            clip: label(animation.clip, 256),
            start: number(animation.start, 0, 86400),
            end: number(animation.end, 0, 86400),
          }
        : undefined,
    }
  })
  if (shots.reduce((total, shot) => total + shot.duration, 0) > 1800) {
    throw new Error('一个工程的总时长最多为 30 分钟。')
  }
  let subject: CaptureProject['subject']
  if (item.subject !== undefined) {
    const source = object(item.subject)
    const anchor = vector(source.anchor)
    number(anchor[0], -180, 180)
    number(anchor[1], -90, 90)
    number(anchor[2], -10000, 100000)
    subject = {
      label: label(source.label),
      url: typeof source.url === 'string' ? source.url.slice(0, 4096) : undefined,
      anchor,
      radius: number(source.radius, 0.1, 1_000_000),
    }
  }
  if (shots.length && !subject) {
    throw new Error('含镜头的工程必须记录拍摄主体。')
  }
  return {
    version: 1,
    name: label(item.name),
    subject,
    aspect: item.aspect as CaptureProject['aspect'],
    resolution: item.resolution as CaptureProject['resolution'],
    fps: item.fps as CaptureProject['fps'],
    handles: item.handles === undefined ? 0.5 : number(item.handles, 0, 5),
    startTime: new Date(epoch).toISOString(),
    shots,
  }
}

export function captureDimensions(project: CaptureProject): { width: number; height: number } {
  const long = project.resolution === '4k' ? 3840 : 1920
  const short = project.resolution === '4k' ? 2160 : 1080
  return project.aspect === 'landscape'
    ? { width: long, height: short }
    : { width: short, height: long }
}

export function captureDuration(project: Pick<CaptureProject, 'shots'>): number {
  return project.shots.reduce((seconds, shot) => seconds + shot.duration, 0)
}

export function captureAnchor(anchor: CaptureVector): Matrix4 {
  return Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(...anchor))
}

export function captureGeographic(position: Cartesian3): CaptureVector {
  const point = Cartographic.fromCartesian(position)
  return [CesiumMath.toDegrees(point.longitude), CesiumMath.toDegrees(point.latitude), point.height]
}

export function makeCaptureShot(
  name: string,
  start: CapturePose,
  end: CapturePose = start,
  kind: CaptureShot['kind'] = 'move',
  duration = 6,
): CaptureShot {
  return {
    id: captureId(),
    name,
    start: structuredClone(start),
    end: structuredClone(end),
    kind,
    duration,
    arc: kind === 'orbit' ? 45 : 0,
    easing: 'smooth',
    sceneRate: 0,
  }
}

export function createCaptureTemplate(
  template: CaptureTemplate,
  subject: CaptureSubject,
  project: CaptureProject,
): CaptureShot[] {
  const ratio = project.aspect === 'landscape' ? 16 / 9 : 9 / 16
  const fov = 38
  const minimumFov = Math.min(
    (fov * Math.PI) / 180,
    2 * Math.atan(Math.tan((fov * Math.PI) / 360) * ratio),
  )
  const distance = Math.max(10, (subject.radius / Math.sin(minimumFov / 2)) * 1.2)
  function view(x: number, y: number, z: number, targetZ = 0): CapturePose {
    return {
      position: [x * distance, y * distance, z * distance],
      target: [0, 0, targetZ * subject.radius],
      fov,
    }
  }
  const hero = view(0.65, -0.85, 0.32)
  const orbit = makeCaptureShot('体量 · 小弧环绕', hero, hero, 'orbit', 6)
  const rise = makeCaptureShot(
    '高度 · 缓慢升起',
    view(0.45, -1, -0.08),
    view(0.45, -1, 0.5),
    'move',
    5,
  )
  const detail = makeCaptureShot(
    '细节 · 横移',
    view(-0.16, -0.7, -0.08),
    view(0.16, -0.7, -0.08),
    'move',
    4,
  )
  const night = makeCaptureShot('光影 · 日夜过渡', hero, hero, 'hold', 8)
  night.sceneRate = 3600
  const ending = makeCaptureShot('夜景 · 后拉收尾', hero, view(0.85, -1.1, 0.5), 'move', 4)
  if (template === 'assembly') {
    const clip = subject.clips.find((item) => /assembly/i.test(item.label)) ?? subject.clips[0]
    if (!clip) {
      throw new Error('请选择包含内嵌动画的模型后使用拼装模板。')
    }
    const assembly = makeCaptureShot(
      '建造 · 构件拼装',
      view(0.95, -1.3, 0.5),
      undefined,
      'hold',
      Math.min(120, Math.max(1, clip.duration)),
    )
    assembly.animation = { clip: `${clip.index}:${clip.label}`, start: 0, end: clip.duration }
    orbit.animation = {
      clip: `${clip.index}:${clip.label}`,
      start: clip.duration,
      end: clip.duration,
    }
    ending.animation = { ...orbit.animation }
    return [assembly, orbit, ending]
  }
  if (template === 'wide') {
    orbit.arc = 25
    rise.name = '屋盖 · 抬升俯瞰'
    rise.start = view(-0.65, -0.9, 0.3)
    rise.end = view(0.25, -0.65, 0.95)
    detail.start = view(-0.5, -0.9, 0.12)
    detail.end = view(0.5, -0.9, 0.12)
  } else if (template === 'group') {
    orbit.arc = 65
    rise.name = '组团 · 高位展开'
    rise.start = view(-0.8, -1, 0.6)
    rise.end = view(0.8, -1, 0.6)
  }
  return [
    makeCaptureShot('开场 · 建筑全貌', view(0.72, -0.95, 0.36), hero, 'move', 3),
    orbit,
    rise,
    detail,
    night,
    ending,
  ]
}

function mix(left: number, right: number, amount: number): number {
  return left + (right - left) * amount
}

export function evaluateCaptureShot(shot: CaptureShot, seconds: number): CapturePose {
  const progress = Math.max(0, Math.min(seconds / shot.duration, 1))
  const t =
    shot.easing === 'linear' ? progress : progress ** 3 * (10 - 15 * progress + 6 * progress ** 2)
  if (shot.kind === 'hold') {
    return structuredClone(shot.start)
  }
  const target = shot.start.target.map((value, index) =>
    mix(value, shot.end.target[index], t),
  ) as CaptureVector
  let position = shot.start.position.map((value, index) =>
    mix(value, shot.end.position[index], t),
  ) as CaptureVector
  if (shot.kind === 'orbit') {
    const start = shot.start.position.map((value, index) => value - shot.start.target[index])
    const end = shot.end.position.map((value, index) => value - shot.end.target[index])
    const radius = mix(Math.hypot(start[0], start[1]), Math.hypot(end[0], end[1]), t)
    const angle = Math.atan2(start[1], start[0]) + ((shot.arc * Math.PI) / 180) * t
    position = [
      target[0] + Math.cos(angle) * radius,
      target[1] + Math.sin(angle) * radius,
      target[2] + mix(start[2], end[2], t),
    ]
  }
  return { position, target, fov: mix(shot.start.fov, shot.end.fov, t) }
}

export function locateCaptureTime(project: CaptureProject, seconds: number, shotId?: string) {
  let elapsed = 0
  let sceneSeconds = 0
  for (const [index, shot] of project.shots.entries()) {
    // An explicit shot keeps its exact endpoint on this shot at a cut boundary.
    if (
      shotId
        ? shot.id === shotId
        : seconds < elapsed + shot.duration || index === project.shots.length - 1
    ) {
      const local = Math.max(0, Math.min(shot.duration, seconds - elapsed))
      return { shot, index, local, sceneSeconds: sceneSeconds + local * shot.sceneRate }
    }
    elapsed += shot.duration
    sceneSeconds += shot.duration * shot.sceneRate
  }
  throw new Error('请先添加拍摄镜头。')
}
