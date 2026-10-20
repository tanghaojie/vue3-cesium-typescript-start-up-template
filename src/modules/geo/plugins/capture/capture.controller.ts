import { reactive, readonly } from 'vue'
import type { Viewer } from 'cesium'
import type { GeoWorkspacePresentation } from '../../core/workspace-presentation'
import type { GeoInteractionManager } from '../../core/interaction-manager'
import type { GeoCaptureSubjects, GeoCaptureSubject } from '../../tools/data/capture-subject'
import type { GeoRenderQualityCapability } from '../scene/scene.capabilities'
import {
  captureDuration,
  captureId,
  createCaptureProject,
  createCaptureTemplate,
  makeCaptureShot,
  parseCaptureProject,
  withCapturePoseDistance,
  type CaptureProject,
  type CaptureShot,
  type CaptureTemplate,
} from '../../tools/capture/capture-project'
import {
  createCapturePath,
  createCaptureSession,
  readCapturePose,
  shotStartTime,
} from '../../tools/capture/capture-session'
import {
  captureFileName,
  chooseCaptureDestination,
  downloadCaptureBlob,
  exportCapture,
  type CaptureExportFormat,
  type CaptureExportProgress,
  type CaptureExportRange,
} from '../../tools/capture/capture-export'

const CURRENT_KEY = 'cyber-sight:capture:current:v1'
const LIBRARY_KEY = 'cyber-sight:capture:library:v1'
interface SavedCapture {
  id: string
  updated: string
  project: CaptureProject
}

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
function message(error: unknown): string {
  return error instanceof Error ? error.message : '拍摄操作失败。'
}

export function createCaptureController(
  viewer: Viewer,
  subjects: GeoCaptureSubjects,
  quality: GeoRenderQualityCapability,
  presentation: GeoWorkspacePresentation,
  interactions: GeoInteractionManager,
) {
  const state = reactive({
    project: createCaptureProject(),
    subjects: [] as readonly GeoCaptureSubject[],
    subjectId: '',
    selectedShotId: '',
    current: 0,
    playing: false,
    active: false,
    busy: false,
    pathVisible: false,
    error: '',
    notice: '',
    progress: undefined as CaptureExportProgress | undefined,
    batchIndex: 0,
    batchTotal: 0,
    library: [] as SavedCapture[],
    libraryId: '',
  })
  let disposed = false
  let frame: number | undefined
  let session: ReturnType<typeof createCaptureSession> | undefined
  let path: ReturnType<typeof createCapturePath> | undefined
  let exportAbort: AbortController | undefined

  function report(error: unknown): void {
    if (!disposed) {
      state.error = message(error)
    }
  }
  function refreshSubjects(): void {
    if (!disposed) {
      state.subjects = subjects.list()
    }
  }
  function matchingSubject(): string {
    const source = state.project.subject
    if (!source) {
      return ''
    }
    return (
      state.subjects.find(
        (item) =>
          item.url === source.url &&
          item.anchor.every(
            (axis, index) => Math.abs(axis - source.anchor[index]) < (index === 2 ? 0.1 : 0.000001),
          ),
      )?.id ?? ''
    )
  }
  function loadStored(): void {
    try {
      const current = localStorage.getItem(CURRENT_KEY)
      if (current) {
        state.project = parseCaptureProject(JSON.parse(current))
      }
    } catch {
      state.notice = '上次工程读取失败，原存储已保留；可导入备份或开始新工程。'
    }
    try {
      const stored = localStorage.getItem(LIBRARY_KEY)
      const items: unknown = stored ? JSON.parse(stored) : []
      if (!Array.isArray(items) || items.length > 20) {
        throw new Error()
      }
      state.library = items.map(function readSaved(value) {
        if (!value || typeof value.id !== 'string' || typeof value.updated !== 'string') {
          throw new Error()
        }
        return { id: value.id, updated: value.updated, project: parseCaptureProject(value.project) }
      })
    } catch {
      state.notice = '本机工程库读取失败，原存储已保留；当前工程仍可使用和导出。'
    }
  }
  function persistCurrent(): void {
    try {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(state.project))
    } catch {
      state.notice = '浏览器无法自动保存，请使用“导出工程”保留当前设置。'
    }
  }
  function hidePath(): void {
    path?.dispose()
    path = undefined
    state.pathVisible = false
  }
  function pause(): void {
    if (frame !== undefined) {
      cancelAnimationFrame(frame)
    }
    frame = undefined
    state.playing = false
    session?.setInputEnabled(true)
  }
  function leavePanel(): void {
    if (!state.busy && !disposed) {
      stopPreview()
      hidePath()
    }
  }
  function stopPreview(): void {
    pause()
    try {
      session?.dispose()
    } finally {
      session = undefined
      state.active = false
      presentation.set(false)
    }
  }
  function editProject(change: (project: CaptureProject) => void): boolean {
    if (state.busy || disposed) {
      return false
    }
    state.error = ''
    try {
      const project = copy(state.project)
      change(project)
      const valid = parseCaptureProject(project)
      stopPreview()
      hidePath()
      state.project = valid
      state.current = Math.min(state.current, captureDuration(valid))
      if (!valid.shots.some((shot) => shot.id === state.selectedShotId)) {
        state.selectedShotId = valid.shots[0]?.id ?? ''
      }
      persistCurrent()
      return true
    } catch (error) {
      report(error)
      return false
    }
  }
  function patchProject(patch: Partial<CaptureProject>): void {
    editProject((project) => Object.assign(project, patch))
  }
  function bindSubject(id: string): void {
    refreshSubjects()
    const subject = state.subjects.find((item) => item.id === id)
    if (!subject) {
      state.error = '请选择已加载且显示的模型。'
      return
    }
    const bound = editProject(function bind(project) {
      const ratio = project.subject ? subject.radius / project.subject.radius : 1
      for (const shot of project.shots) {
        for (const pose of [shot.start, shot.end]) {
          pose.position = pose.position.map((axis) => axis * ratio) as typeof pose.position
          pose.target = pose.target.map((axis) => axis * ratio) as typeof pose.target
        }
        if (project.subject?.url !== subject.url) {
          shot.animation = undefined
        }
      }
      project.subject = {
        label: subject.label,
        url: subject.url,
        anchor: [...subject.anchor],
        radius: subject.radius,
      }
    })
    if (bound) {
      state.subjectId = subject.id
    }
  }
  function applyTemplate(template: CaptureTemplate): void {
    const subject = subjects.list().find((item) => item.id === state.subjectId)
    if (!subject) {
      state.error = '请先绑定拍摄主体。'
      return
    }
    editProject((project) => {
      project.shots = createCaptureTemplate(template, subject, project)
      if (template !== 'assembly') {
        const date = new Date(project.startTime)
        project.startTime = new Date(
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 14) -
            subject.anchor[0] * 240_000,
        ).toISOString()
      }
    })
    state.selectedShotId = state.project.shots[0]?.id ?? ''
    state.current = 0
  }
  function updateShot(id: string, patch: Partial<CaptureShot>): void {
    editProject((project) => {
      const shot = project.shots.find((entry) => entry.id === id)
      if (shot) {
        Object.assign(shot, patch)
      }
    })
  }
  function setShotDistance(id: string, which: 'start' | 'end', distance: number): void {
    const updated = editProject(function changeDistance(project) {
      const shot = project.shots.find((entry) => entry.id === id)
      if (!shot) {
        throw new Error('请选择要调整的镜头。')
      }
      const endpoint = shot.kind === 'hold' ? 'start' : which
      shot[endpoint] = withCapturePoseDistance(shot[endpoint], distance)
    })
    if (updated) {
      moveToShotPose(id, which)
    }
  }
  function moveToShotPose(id: string, which: 'start' | 'end'): void {
    if (state.busy || disposed) {
      return
    }
    const shot = state.project.shots.find((entry) => entry.id === id)
    if (!shot) {
      state.error = '请选择要定位的镜头。'
      return
    }
    state.selectedShotId = id
    viewer.camera.cancelFlight()
    seek(shotStartTime(state.project, id) + (which === 'end' ? shot.duration : 0), id)
  }
  function selectShot(id: string): void {
    if (state.busy) {
      return
    }
    stopPreview()
    state.selectedShotId = id
    state.current = shotStartTime(state.project, id)
  }
  function addShot(): void {
    if (!state.project.subject) {
      state.error = '请先绑定拍摄主体。'
      return
    }
    try {
      const pose = readCapturePose(viewer, state.project)
      const shot = makeCaptureShot('自定义机位', pose, pose, 'hold')
      if (editProject((project) => project.shots.push(shot))) {
        state.selectedShotId = shot.id
      }
    } catch (error) {
      report(error)
    }
  }
  function capturePose(which: 'start' | 'end'): void {
    try {
      updateShot(state.selectedShotId, { [which]: readCapturePose(viewer, state.project) })
    } catch (error) {
      report(error)
    }
  }
  function removeShot(id: string): void {
    editProject((project) => {
      project.shots = project.shots.filter((shot) => shot.id !== id)
    })
  }
  function moveShot(id: string, direction: -1 | 1): void {
    editProject((project) => {
      const index = project.shots.findIndex((shot) => shot.id === id)
      const next = index + direction
      if (index < 0 || next < 0 || next >= project.shots.length) {
        return
      }
      ;[project.shots[index], project.shots[next]] = [project.shots[next], project.shots[index]]
    })
  }
  function duplicateShot(id: string): void {
    const shot = state.project.shots.find((entry) => entry.id === id)
    if (!shot) {
      return
    }
    const duplicate = { ...copy(shot), id: captureId(), name: `${shot.name.slice(0, 110)} · 副本` }
    if (
      editProject((project) =>
        project.shots.splice(project.shots.findIndex((entry) => entry.id === id) + 1, 0, duplicate),
      )
    ) {
      state.selectedShotId = duplicate.id
    }
  }
  function validateRun(): CaptureProject {
    const project = parseCaptureProject(copy(state.project))
    if (!project.shots.length) {
      throw new Error('请先生成模板或保存一个机位。')
    }
    const subject = subjects.list().find((item) => item.id === state.subjectId)
    if (!subject) {
      throw new Error('请把工程绑定到当前已加载且显示的模型。')
    }
    for (const shot of project.shots) {
      if (!shot.animation) {
        continue
      }
      const clip = subject.clips.find(
        (item) => `${item.index}:${item.label}` === shot.animation!.clip,
      )
      if (!clip || Math.max(shot.animation.start, shot.animation.end) > clip.duration) {
        throw new Error(`“${shot.name}”的动画片段或秒数与当前模型不符。`)
      }
    }
    return project
  }
  function ensureSession(): void {
    if (session) {
      return
    }
    const project = validateRun()
    hidePath()
    interactions.cancel('switch')
    presentation.set(presentation.state.clean, project.aspect === 'landscape' ? 16 / 9 : 9 / 16)
    viewer.forceResize()
    session = createCaptureSession(viewer, project, state.subjectId, subjects)
    state.active = true
  }
  function seek(seconds: number, shotId?: string): void {
    if (state.busy || disposed || !Number.isFinite(seconds)) {
      return
    }
    state.error = ''
    pause()
    try {
      ensureSession()
      state.current = Math.max(0, Math.min(captureDuration(state.project), seconds))
      session!.apply(state.current, shotId)
      session!.setInputEnabled(true)
    } catch (error) {
      stopPreview()
      report(error)
    }
  }
  function play(): void {
    if (state.busy || disposed || state.playing) {
      return
    }
    state.error = ''
    try {
      ensureSession()
      const duration = captureDuration(state.project)
      if (state.current >= duration) {
        state.current = 0
      }
      session!.apply(state.current)
      session!.setInputEnabled(false)
      state.playing = true
      const origin = performance.now() - state.current * 1000
      function tick(now: number): void {
        frame = undefined
        if (!state.playing || disposed) {
          return
        }
        try {
          state.current = Math.min(duration, (now - origin) / 1000)
          session!.apply(state.current)
          if (state.current >= duration) {
            stopPreview()
          } else {
            frame = requestAnimationFrame(tick)
          }
        } catch (error) {
          stopPreview()
          report(error)
        }
      }
      frame = requestAnimationFrame(tick)
    } catch (error) {
      stopPreview()
      report(error)
    }
  }
  function togglePath(): void {
    if (state.busy) {
      return
    }
    if (path) {
      hidePath()
      return
    }
    stopPreview()
    try {
      path = createCapturePath(viewer, validateRun())
      state.pathVisible = true
    } catch (error) {
      report(error)
    }
  }
  function toggleClean(): void {
    if (state.busy) {
      return
    }
    presentation.set(
      !presentation.state.clean,
      !presentation.state.clean || state.active
        ? state.project.aspect === 'landscape'
          ? 16 / 9
          : 9 / 16
        : undefined,
    )
    viewer.forceResize()
  }
  function saveProject(): void {
    if (state.busy) {
      return
    }
    try {
      const project = parseCaptureProject(copy(state.project))
      const id = state.libraryId || captureId()
      const library = [
        { id, updated: new Date().toISOString(), project },
        ...copy(state.library).filter((item) => item.id !== id),
      ]
      if (library.length > 20) {
        throw new Error('本机工程库最多保存 20 项，请先删除不需要的工程或导出备份。')
      }
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(library))
      state.library = library
      state.libraryId = id
      state.notice = '工程已保存到本机。'
      persistCurrent()
    } catch (error) {
      report(error)
    }
  }
  function loadProject(id: string): void {
    if (state.busy) {
      return
    }
    const saved = state.library.find((item) => item.id === id)
    if (!saved) {
      return
    }
    stopPreview()
    hidePath()
    state.project = parseCaptureProject(copy(saved.project))
    state.libraryId = id
    state.current = 0
    state.selectedShotId = state.project.shots[0]?.id ?? ''
    refreshSubjects()
    state.subjectId = matchingSubject()
    state.error = ''
    persistCurrent()
  }
  function removeSaved(id: string): void {
    if (state.busy) {
      return
    }
    try {
      const library = copy(state.library).filter((item) => item.id !== id)
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(library))
      state.library = library
      if (state.libraryId === id) {
        state.libraryId = ''
      }
    } catch (error) {
      report(error)
    }
  }
  function newProject(): void {
    if (state.busy) {
      return
    }
    stopPreview()
    hidePath()
    state.project = createCaptureProject()
    state.libraryId = ''
    state.subjectId = ''
    state.selectedShotId = ''
    state.current = 0
    state.error = ''
    persistCurrent()
  }
  function exportProject(): void {
    downloadCaptureBlob(
      new Blob([JSON.stringify(state.project, null, 2)], { type: 'application/json' }),
      captureFileName(state.project.name) + '.json',
    )
  }
  async function importProject(file: File): Promise<void> {
    if (state.busy) {
      return
    }
    try {
      if (file.size > 2 * 1024 ** 2) {
        throw new Error('工程 JSON 不能超过 2 MB。')
      }
      const project = parseCaptureProject(JSON.parse(await file.text()))
      if (disposed || state.busy) {
        return
      }
      stopPreview()
      hidePath()
      state.project = project
      state.libraryId = ''
      state.current = 0
      state.selectedShotId = project.shots[0]?.id ?? ''
      refreshSubjects()
      state.subjectId = matchingSubject()
      state.error = ''
      state.notice = '工程已导入。请核对主体绑定；导入不会自动加载模型。'
      persistCurrent()
    } catch (error) {
      report(error)
    }
  }
  function cancelExport(): void {
    exportAbort?.abort()
  }
  async function exportMedia(
    format: CaptureExportFormat,
    scope: 'all' | 'shot' | 'batch',
  ): Promise<void> {
    if (state.busy || disposed) {
      return
    }
    state.error = ''
    state.notice = ''
    let completed = 0
    try {
      const project = validateRun()
      const selected = project.shots.find((shot) => shot.id === state.selectedShotId)
      if (scope === 'shot' && !selected) {
        throw new Error('请选择要输出的镜头。')
      }
      const ranges: CaptureExportRange[] =
        scope === 'all'
          ? [{ name: project.name, offset: 0, duration: captureDuration(project) }]
          : (scope === 'shot' ? [selected!] : project.shots).map((shot, index) => ({
              name: `${String(index + 1).padStart(2, '0')}-${shot.name}`,
              offset: shotStartTime(project, shot.id),
              duration: shot.duration,
              handles: project.handles,
            }))
      stopPreview()
      hidePath()
      interactions.cancel('switch')
      exportAbort = new AbortController()
      state.busy = true
      state.progress = undefined
      state.batchIndex = 0
      state.batchTotal = ranges.length
      const destination = await chooseCaptureDestination(ranges[0].name, format, scope === 'batch')
      if (exportAbort.signal.aborted || disposed) {
        state.notice = '导出已取消。'
        return
      }
      presentation.set(true, project.aspect === 'landscape' ? 16 / 9 : 9 / 16)
      for (const [index, range] of ranges.entries()) {
        state.batchIndex = index + 1
        const file = destination.directory
          ? await destination.directory.getFileHandle(
              captureFileName(range.name) + (format === 'mp4' ? '.mp4' : '.zip'),
              { create: true },
            )
          : destination.file
        await exportCapture({
          viewer,
          project,
          subjectId: state.subjectId,
          subjects,
          quality,
          range,
          format,
          file,
          signal: exportAbort.signal,
          onProgress(progress) {
            if (!disposed) {
              state.progress = progress
            }
          },
        })
        completed += 1
      }
      state.notice = `已完成 ${completed} 个${format === 'mp4' ? '视频' : '图片序列'}输出。`
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        state.notice = `导出已取消${completed ? `，已完成 ${completed} 个文件` : ''}。`
      } else {
        report(error)
      }
    } finally {
      exportAbort = undefined
      presentation.set(false)
      if (!disposed) {
        state.busy = false
        refreshSubjects()
      }
    }
  }
  function handleKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || (!state.active && !state.busy && !presentation.state.clean)) {
      return
    }
    event.preventDefault()
    event.stopImmediatePropagation()
    if (state.busy) {
      cancelExport()
    } else {
      stopPreview()
    }
  }
  function visibility(): void {
    if (document.hidden && state.playing) {
      stopPreview()
      state.notice = '页面进入后台，预览已暂停。逐帧导出会等待页面回到前台。'
    }
  }
  const removeRenderError = viewer.scene.renderError.addEventListener(
    function renderFailed(_scene, error) {
      cancelExport()
      stopPreview()
      report(error)
    },
  )
  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    cancelExport()
    stopPreview()
    hidePath()
    window.removeEventListener('keydown', handleKey, true)
    document.removeEventListener('visibilitychange', visibility)
    removeRenderError()
  }
  loadStored()
  refreshSubjects()
  state.subjectId = matchingSubject()
  state.selectedShotId = state.project.shots[0]?.id ?? ''
  window.addEventListener('keydown', handleKey, true)
  document.addEventListener('visibilitychange', visibility)
  return {
    state: readonly(state),
    presentation,
    refreshSubjects,
    leavePanel,
    patchProject,
    bindSubject,
    applyTemplate,
    updateShot,
    setShotDistance,
    moveToShotPose,
    selectShot,
    addShot,
    capturePose,
    removeShot,
    moveShot,
    duplicateShot,
    seek,
    play,
    pause,
    stop: stopPreview,
    togglePath,
    toggleClean,
    saveProject,
    loadProject,
    removeSaved,
    newProject,
    exportProject,
    importProject,
    exportMedia,
    cancelExport,
    dispose,
  }
}

export type CaptureController = ReturnType<typeof createCaptureController>
