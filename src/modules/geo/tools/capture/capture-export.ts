import { Zip, ZipPassThrough, strToU8 } from 'fflate'
import type { Viewer } from 'cesium'
import type { GeoCaptureSubjects } from '../data/capture-subject'
import { captureDimensions, locateCaptureTime, type CaptureProject } from './capture-project'
import { createCaptureSession } from './capture-session'

export type CaptureExportFormat = 'mp4' | 'png'
export interface CaptureWritable {
  write(data: { type: 'write'; position: number; data: Uint8Array<ArrayBuffer> }): Promise<void>
  close(): Promise<void>
  abort(): Promise<void>
}
export interface CaptureFileHandle {
  createWritable(): Promise<CaptureWritable>
}
export interface CaptureDirectoryHandle {
  getFileHandle(name: string, options: { create: boolean }): Promise<CaptureFileHandle>
}
interface CaptureFilePickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName: string
    types: { description: string; accept: Record<string, string[]> }[]
  }) => Promise<CaptureFileHandle>
  showDirectoryPicker?: (options: { mode: 'readwrite' }) => Promise<CaptureDirectoryHandle>
}
export interface CaptureExportRange {
  name: string
  offset: number
  duration: number
  handles?: number
}
export interface CaptureExportProgress {
  frame: number
  total: number
  phase: string
}

const MEMORY_LIMIT = 256 * 1024 ** 2
const ZIP_LIMIT = 3 * 1024 ** 3

export function captureFileName(value: string): string {
  return (
    value
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
      .replace(/[. ]+$/, '')
      .slice(0, 100) || 'Sight-capture'
  )
}

export function downloadCaptureBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Invoke directly from the user's click, before encoding or other awaits. */
export async function chooseCaptureDestination(
  name: string,
  format: CaptureExportFormat,
  batch: boolean,
) {
  const picker = window as unknown as CaptureFilePickerWindow
  if (batch && picker.showDirectoryPicker) {
    return { directory: await picker.showDirectoryPicker({ mode: 'readwrite' }) }
  }
  if (!batch && picker.showSaveFilePicker) {
    const extension = format === 'mp4' ? '.mp4' : '.zip'
    const handle = await picker.showSaveFilePicker({
      suggestedName: captureFileName(name) + extension,
      types: [
        {
          description: format === 'mp4' ? 'MP4 视频' : 'PNG 图片序列 ZIP',
          accept: { [format === 'mp4' ? 'video/mp4' : 'application/zip']: [extension] },
        },
      ],
    })
    return { file: handle }
  }
  return {}
}

async function createCaptureSink(
  handle: CaptureFileHandle | undefined,
  name: string,
  mime: string,
) {
  const writable = await handle?.createWritable()
  let chunks: { data: Uint8Array<ArrayBuffer>; position: number }[] = []
  let bytes = 0
  let length = 0
  let finished = false
  return {
    async write(data: Uint8Array, position: number): Promise<void> {
      if (finished) {
        throw new Error('输出文件已关闭。')
      }
      bytes += data.byteLength
      length = Math.max(length, position + data.byteLength)
      if (!writable && Math.max(bytes, length) > MEMORY_LIMIT) {
        throw new Error('下载缓冲超过 256 MB。请缩短镜头，或使用支持文件写入的浏览器流式导出。')
      }
      const copy = Uint8Array.from(data)
      if (writable) {
        await writable.write({ type: 'write', position, data: copy })
      } else {
        chunks.push({ data: copy, position })
      }
    },
    async finish(): Promise<void> {
      if (finished) {
        return
      }
      if (writable) {
        await writable.close()
      } else {
        const result = new Uint8Array(length)
        chunks.forEach((chunk) => result.set(chunk.data, chunk.position))
        chunks = []
        downloadCaptureBlob(new Blob([result], { type: mime }), name)
      }
      finished = true
    },
    async abort(): Promise<void> {
      if (finished) {
        return
      }
      finished = true
      chunks = []
      if (writable) {
        await writable.abort().catch(() => {})
      }
    },
  }
}

function checkAbort(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException('拍摄已取消。', 'AbortError')
  }
}

async function yieldCapture(signal: AbortSignal): Promise<void> {
  checkAbort(signal)
  await new Promise<void>(function yieldBrowser(resolve, reject) {
    const timer = setTimeout(done, 0)
    function done(): void {
      signal.removeEventListener('abort', abort)
      resolve()
    }
    function abort(): void {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      reject(new DOMException('拍摄已取消。', 'AbortError'))
    }
    signal.addEventListener('abort', abort, { once: true })
  })
}

async function waitForForeground(signal: AbortSignal): Promise<number> {
  checkAbort(signal)
  if (!document.hidden) {
    return 0
  }
  const started = performance.now()
  await new Promise<void>(function waitVisible(resolve, reject) {
    function clear(): void {
      document.removeEventListener('visibilitychange', visible)
      signal.removeEventListener('abort', abort)
    }
    function visible(): void {
      if (!document.hidden) {
        clear()
        resolve()
      }
    }
    function abort(): void {
      clear()
      reject(new DOMException('拍摄已取消。', 'AbortError'))
    }
    document.addEventListener('visibilitychange', visible)
    signal.addEventListener('abort', abort, { once: true })
  })
  return performance.now() - started
}

function pngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise(function encodePng(resolve, reject) {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('PNG 采集失败，请检查画布权限与浏览器内存。')),
      'image/png',
    )
  })
}

export interface CaptureExportOptions {
  readonly viewer: Viewer
  readonly project: CaptureProject
  readonly subjectId: string
  readonly subjects: GeoCaptureSubjects
  readonly quality: { acquireFixedResolution(): { dispose(): void } }
  readonly range: CaptureExportRange
  readonly format: CaptureExportFormat
  readonly file?: CaptureFileHandle
  readonly signal: AbortSignal
  readonly onProgress: (progress: CaptureExportProgress) => void
}

export async function exportCapture(options: CaptureExportOptions): Promise<void> {
  const { viewer, project, range, format, signal, subjects, quality } = options
  checkAbort(signal)
  const { width, height } = captureDimensions(project)
  const handles = range.handles ?? 0
  const total = Math.max(1, Math.round((range.duration + 2 * handles) * project.fps))
  const bitrate =
    (project.resolution === '4k' ? 40_000_000 : 12_000_000) * (project.fps === 60 ? 1.5 : 1)
  const media = format === 'mp4' ? await import('mediabunny') : undefined
  if (
    media &&
    !(await media.canEncodeVideo('avc', { width, height, bitrate, frameRate: project.fps }))
  ) {
    throw new Error(
      '此浏览器不支持当前尺寸的 H.264 编码。请尝试 1080p / 30 fps，或导出 PNG 图片序列。',
    )
  }
  checkAbort(signal)
  const sink = await createCaptureSink(
    options.file,
    captureFileName(range.name) + (format === 'mp4' ? '.mp4' : '.zip'),
    format === 'mp4' ? 'video/mp4' : 'application/zip',
  )
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) {
    await sink.abort()
    throw new Error('浏览器无法创建输出画布。')
  }
  const renderCanvas = viewer.scene.canvas
  const original = {
    loop: viewer.useDefaultRenderLoop,
    requestRenderMode: viewer.scene.requestRenderMode,
    rethrowRenderErrors: viewer.scene.rethrowRenderErrors,
    resolutionScale: viewer.resolutionScale,
    browserResolution: viewer.useBrowserRecommendedResolution,
    targetFrameRate: viewer.targetFrameRate,
    canvasStyle: renderCanvas.style.cssText,
  }
  let session: ReturnType<typeof createCaptureSession> | undefined
  let resolutionLease: { dispose(): void } | undefined
  let output: InstanceType<NonNullable<typeof media>['Output']> | undefined
  let source: InstanceType<NonNullable<typeof media>['CanvasSource']> | undefined
  let zip: Zip | undefined
  let zipPosition = 0
  let pendingZip: Promise<void> = Promise.resolve()
  let zipError: unknown
  let finalizedZip = false
  let cancelOutput: Promise<void> | undefined
  function abortOutput(): void {
    if (output && output.state !== 'finalized' && output.state !== 'canceled') {
      cancelOutput = output.cancel().catch(() => {})
    }
  }
  signal.addEventListener('abort', abortOutput, { once: true })
  try {
    checkAbort(signal)
    session = createCaptureSession(viewer, project, options.subjectId, subjects)
    viewer.useDefaultRenderLoop = false
    viewer.scene.requestRenderMode = false
    viewer.scene.rethrowRenderErrors = true
    resolutionLease = quality.acquireFixedResolution()
    // Cesium sizes its drawing buffer from the canvas, not the Vue-owned map host.
    Object.assign(renderCanvas.style, {
      width: `${width}px`,
      height: `${height}px`,
      maxWidth: 'none',
      maxHeight: 'none',
    })
    viewer.forceResize()
    if (media) {
      const target = new media.StreamTarget(
        new WritableStream({
          write(chunk) {
            return sink.write(chunk.data, chunk.position)
          },
        }),
        { chunked: true, chunkSize: 1024 ** 2 },
      )
      output = new media.Output({
        format: new media.Mp4OutputFormat({ fastStart: 'fragmented' }),
        target,
      })
      source = new media.CanvasSource(canvas, { codec: 'avc', bitrate, keyFrameInterval: 2 })
      output.addVideoTrack(source, { frameRate: project.fps })
      await output.start()
    } else {
      zip = new Zip(function writeZip(error, data, final) {
        if (error) {
          zipError = error
          return
        }
        const position = zipPosition
        zipPosition += data.byteLength
        if (zipPosition > ZIP_LIMIT) {
          zipError = new Error('图片序列超过 3 GB，请按镜头分别导出。')
          return
        }
        pendingZip = pendingZip
          .then(() => sink.write(data, position))
          .catch((reason) => {
            zipError = reason
          })
        if (final) {
          finalizedZip = true
        }
      })
      function addText(name: string, text: string): void {
        const file = new ZipPassThrough(name)
        zip!.add(file)
        file.push(strToU8(text), true)
      }
      addText(
        'capture.json',
        JSON.stringify({ project, range, frames: total, width, height, fps: project.fps }, null, 2),
      )
      addText(
        'README.txt',
        `Sight PNG sequence\n${width}x${height}, ${project.fps} fps, ${total} frames\nffmpeg -framerate ${project.fps} -i frame-%06d.png -c:v libx264 -pix_fmt yuv420p output.mp4\n`,
      )
    }
    let previousShot = ''
    for (let frame = 0; frame < total; frame += 1) {
      checkAbort(signal)
      const clipTime = frame / project.fps - handles
      const time = range.offset + Math.max(0, Math.min(range.duration - 0.000001, clipTime))
      const shotId = locateCaptureTime(project, time).shot.id
      const warmupSteps = shotId !== previousShot ? 16 : 3
      previousShot = shotId
      session.apply(time)
      let stable = 0
      let steps = 0
      let started = performance.now()
      // Public render steps warm progressive GPU resources without advancing scene time.
      while (true) {
        started += await waitForForeground(signal)
        checkAbort(signal)
        if (viewer.isDestroyed()) {
          throw new Error('三维场景已关闭。')
        }
        viewer.resize()
        viewer.scene.requestRender()
        viewer.render()
        steps += 1
        stable = viewer.scene.globe.tilesLoaded && subjects.ready() ? stable + 1 : 0
        if (steps >= warmupSteps && stable >= 3) {
          const { drawingBufferWidth, drawingBufferHeight } = viewer.scene
          if (
            renderCanvas.width !== width ||
            renderCanvas.height !== height ||
            drawingBufferWidth !== width ||
            drawingBufferHeight !== height
          ) {
            throw new Error(
              `输出分辨率不匹配：目标 ${width}×${height}，画布 ${renderCanvas.width}×${renderCanvas.height}，绘图缓冲 ${drawingBufferWidth}×${drawingBufferHeight}。请降低分辨率后重试。`,
            )
          }
          // Copy synchronously before yielding; WebGL does not preserve its default drawing buffer.
          context.drawImage(renderCanvas, 0, 0)
          const credits = viewer.container
            .querySelector('.cesium-credit-textContainer')
            ?.textContent?.replace(/\s+/g, ' ')
            .trim()
          context.font = `${Math.max(11, Math.round(width / 160))}px sans-serif`
          const text = ['CesiumJS', credits].filter(Boolean).join(' · ').slice(0, 350)
          const textWidth = Math.min(width - 24, context.measureText(text).width + 12)
          context.fillStyle = 'rgba(0,0,0,0.5)'
          context.fillRect(8, height - 30, textWidth, 22)
          context.fillStyle = '#ffffff'
          context.fillText(text, 14, height - 14, width - 36)
          break
        }
        options.onProgress({ frame, total, phase: '等待地形、影像和模型加载' })
        if (performance.now() - started > 30_000) {
          throw new Error('当前镜头的场景资源加载超过 30 秒，请检查网络、资源或调整镜头。')
        }
        await yieldCapture(signal)
      }
      checkAbort(signal)
      if (source) {
        const timestamp = Math.round((frame * 1_000_000) / project.fps) / 1_000_000
        const stop = Math.round(((frame + 1) * 1_000_000) / project.fps) / 1_000_000
        await source.add(timestamp, stop - timestamp, { keyFrame: frame % (project.fps * 2) === 0 })
      } else {
        const blob = await pngBlob(canvas)
        checkAbort(signal)
        const file = new ZipPassThrough(`frame-${String(frame).padStart(6, '0')}.png`)
        zip!.add(file)
        file.push(new Uint8Array(await blob.arrayBuffer()), true)
        await pendingZip
        if (zipError) {
          throw zipError
        }
      }
      options.onProgress({
        frame: frame + 1,
        total,
        phase: format === 'mp4' ? '逐帧编码 MP4' : '写入 PNG 图片序列',
      })
      await yieldCapture(signal)
    }
    checkAbort(signal)
    options.onProgress({ frame: total, total, phase: '正在封装输出文件' })
    if (output) {
      source!.close()
      await output.finalize()
    } else {
      zip!.end()
      await pendingZip
      if (zipError) {
        throw zipError
      }
      if (!finalizedZip) {
        throw new Error('图片序列封装未完成。')
      }
    }
    checkAbort(signal)
    await sink.finish()
  } catch (error) {
    await cancelOutput
    if (output && output.state !== 'finalized' && output.state !== 'canceled') {
      await output.cancel().catch(() => {})
    }
    zip?.terminate()
    await pendingZip
    await sink.abort()
    checkAbort(signal)
    if (error instanceof DOMException && error.name === 'SecurityError') {
      throw new Error('画面采集被跨域权限限制，请检查当前影像和模型资源的 CORS 配置。')
    }
    throw error
  } finally {
    signal.removeEventListener('abort', abortOutput)
    try {
      session?.dispose()
    } finally {
      if (!viewer.isDestroyed()) {
        renderCanvas.style.cssText = original.canvasStyle
        resolutionLease?.dispose()
        viewer.useBrowserRecommendedResolution = original.browserResolution
        viewer.resolutionScale = original.resolutionScale
        viewer.targetFrameRate = original.targetFrameRate
        viewer.scene.requestRenderMode = original.requestRenderMode
        viewer.scene.rethrowRenderErrors = original.rethrowRenderErrors
        viewer.forceResize()
        viewer.useDefaultRenderLoop = original.loop
        viewer.scene.requestRender()
      }
      canvas.width = 0
      canvas.height = 0
    }
  }
}
