import { JulianDate, type Matrix4, type Model, type ModelAnimation, type Viewer } from 'cesium'

export interface GeoModelAnimationClip {
  readonly index: number
  readonly label: string
  readonly duration: number
}

export interface GeoModelAnimationSnapshot {
  readonly clips: readonly GeoModelAnimationClip[]
  readonly clipIndex: number
  readonly current: number
  readonly duration: number
  readonly playing: boolean
  readonly started: boolean
  readonly speed: number
  readonly loop: boolean
  readonly error?: string
}

export type GeoModelAnimationCommand =
  | { readonly type: 'play' | 'pause' | 'restart' }
  | { readonly type: 'select'; readonly index: number }
  | { readonly type: 'seek'; readonly seconds: number }
  | { readonly type: 'speed'; readonly speed: number }
  | { readonly type: 'loop'; readonly loop: boolean }

function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined
}

/** Name only the in-memory nodes so the public Model.getNode API can reset every TRS. */
export function prepareAnimationCaptureNodes(gltf: unknown): { names: string[]; trsOnly: boolean } {
  const asset = object(gltf)
  const names = new Set<string>()
  const nodes = Array.isArray(asset?.nodes) ? asset.nodes : []
  const reserved = new Set(nodes.map((value) => object(value)?.name))
  for (const [index, value] of nodes.entries()) {
    const node = object(value)
    if (!node) {
      continue
    }
    let name = typeof node.name === 'string' ? node.name : ''
    if (!name || names.has(name)) {
      name = `__sight_capture_node_${index}`
      while (reserved.has(name) || names.has(name)) {
        name += '_'
      }
    }
    node.name = name
    names.add(name)
  }
  const trsOnly = (Array.isArray(asset?.animations) ? asset.animations : []).every((value) => {
    const channels = object(value)?.channels
    return (Array.isArray(channels) ? channels : []).every((channel) =>
      ['translation', 'rotation', 'scale'].includes(String(object(object(channel)?.target)?.path)),
    )
  })
  return { names: [...names], trsOnly }
}

export function readModelAnimationClips(gltf: unknown): readonly GeoModelAnimationClip[] {
  const asset = object(gltf)
  if (!Array.isArray(asset?.animations)) {
    return []
  }
  const accessors = Array.isArray(asset.accessors) ? asset.accessors : []
  return asset.animations.map(function clip(value: unknown, index: number) {
    const animation = object(value)
    let duration = 0
    for (const value of Array.isArray(animation?.samplers) ? animation.samplers : []) {
      const input = object(value)?.input
      const accessor = typeof input === 'number' ? object(accessors[input]) : undefined
      const stop = Array.isArray(accessor?.max) ? accessor.max[0] : undefined
      if (typeof stop === 'number' && Number.isFinite(stop) && stop >= 0) {
        duration = Math.max(duration, stop)
      }
    }
    const name = animation?.name
    return {
      index,
      label:
        typeof name === 'string' && name.trim() ? name.trim().slice(0, 200) : `动画 ${index + 1}`,
      duration,
    }
  })
}

export function createModelAnimationPlayer(
  model: Model,
  viewer: Viewer,
  clips: readonly GeoModelAnimationClip[],
  onChange: () => void,
  captureNodes: { names: readonly string[]; trsOnly: boolean } = { names: [], trsOnly: false },
) {
  let clipIndex = clips[0]?.index ?? 0
  let current = 0
  let playing = false
  let started = false
  let speed = 1
  let loop = false
  let error: string | undefined
  let visible = model.show
  let disposed = false
  let frame: number | undefined
  let previous = 0
  let lastPublished = 0
  let active: ModelAnimation | undefined
  let externallyDriven = false
  const originalAnimateWhilePaused = model.activeAnimations.animateWhilePaused

  function selected(): GeoModelAnimationClip | undefined {
    return clips.find((clip) => clip.index === clipIndex)
  }

  function snapshot(): GeoModelAnimationSnapshot {
    return {
      clips,
      clipIndex,
      current,
      duration: selected()?.duration ?? 0,
      playing,
      started,
      speed,
      loop,
      error,
    }
  }

  function redraw(): void {
    if (!viewer.isDestroyed()) {
      viewer.scene.requestRender()
    }
  }

  function publish(): void {
    if (!disposed) {
      lastPublished = performance.now()
      onChange()
    }
  }

  function stopFrame(): void {
    playing = false
    if (frame !== undefined) {
      cancelAnimationFrame(frame)
      frame = undefined
    }
  }

  function fail(reason: unknown): void {
    stopFrame()
    error = reason instanceof Error ? reason.message : '模型动画播放失败'
    publish()
  }

  function activate(): void {
    if (active) {
      return
    }
    if (model.isDestroyed() || viewer.isDestroyed()) {
      throw new Error('模型已被移除，无法播放动画。')
    }
    if (!selected() || selected()!.duration <= 0) {
      throw new Error('该动画缺少有效时间范围，请检查源文件的动画时间数据。')
    }
    model.activeAnimations.animateWhilePaused = true
    active = model.activeAnimations.add({
      index: clipIndex,
      // A fixed early epoch also permits seeking the scene Clock backwards.
      startTime: JulianDate.fromIso8601('0001-01-01T00:00:00Z'),
      removeOnStop: false,
      animationTime(duration: number): number {
        return duration > 0 ? Math.max(0, Math.min(current / duration, 1)) : 1
      },
    })
    started = true
  }

  function tick(now: number): void {
    frame = undefined
    if (disposed || !playing) {
      return
    }
    if (viewer.isDestroyed() || model.isDestroyed()) {
      stopFrame()
      publish()
      return
    }
    try {
      const duration = selected()!.duration
      current += (Math.max(0, now - previous) / 1000) * speed
      previous = now
      if (current >= duration) {
        if (loop) {
          current %= duration
        } else {
          current = duration
          stopFrame()
        }
      }
      redraw()
      if (!playing || now - lastPublished >= 100) {
        publish()
      }
      if (playing) {
        frame = requestAnimationFrame(tick)
      }
    } catch (reason) {
      fail(reason)
    }
  }

  function play(restart = false): void {
    if (!visible || document.hidden) {
      throw new Error('请先显示模型，并在当前页面播放动画。')
    }
    activate()
    if (restart || current >= selected()!.duration) {
      current = 0
    }
    if (!playing) {
      previous = performance.now()
      playing = true
      frame = requestAnimationFrame(tick)
    }
  }

  function control(command: GeoModelAnimationCommand): void {
    if (disposed) {
      return
    }
    if (externallyDriven) {
      throw new Error('模型正在拍摄中，请先停止拍摄再操作独立播放器。')
    }
    error = undefined
    try {
      switch (command.type) {
        case 'play':
          play()
          break
        case 'pause':
          stopFrame()
          break
        case 'restart':
          play(true)
          break
        case 'select':
          if (!clips.some((clip) => clip.index === command.index)) {
            throw new Error('动画片段不存在。')
          }
          stopFrame()
          if (active && !model.isDestroyed()) {
            model.activeAnimations.remove(active)
          }
          active = undefined
          clipIndex = command.index
          current = 0
          started = false
          activate()
          break
        case 'seek':
          if (!Number.isFinite(command.seconds)) {
            throw new Error('动画进度必须为有效秒数。')
          }
          stopFrame()
          activate()
          current = Math.max(0, Math.min(selected()!.duration, command.seconds))
          break
        case 'speed':
          if (!Number.isFinite(command.speed) || command.speed < 0.1 || command.speed > 4) {
            throw new Error('动画速度必须在 0.1 到 4 倍之间。')
          }
          speed = command.speed
          previous = performance.now()
          break
        case 'loop':
          loop = command.loop
          break
      }
      redraw()
      publish()
    } catch (reason) {
      fail(reason)
    }
  }

  function setVisible(show: boolean): void {
    visible = show
    if (!show && playing) {
      stopFrame()
      publish()
    }
  }

  function acquireExternal() {
    if (disposed || externallyDriven) {
      throw new Error('该模型已被移除或正在拍摄中。')
    }
    const before = snapshot()
    stopFrame()
    externallyDriven = true
    function resetNodes(): void {
      if (active) {
        model.activeAnimations.remove(active)
      }
      active = undefined
      for (const name of captureNodes.names) {
        const node = model.getNode(name)
        if (node) {
          ;(node as unknown as { matrix: Matrix4 | undefined }).matrix = undefined
        }
      }
    }
    let released = false
    let sampled = false
    return {
      reset(): void {
        if (!sampled || released || disposed || model.isDestroyed()) {
          return
        }
        resetNodes()
        clipIndex = before.clipIndex
        current = before.current
        if (before.started) {
          activate()
        }
        sampled = false
        redraw()
      },
      sample(clip: string, seconds: number): void {
        if (released || disposed || model.isDestroyed()) {
          throw new Error('拍摄模型已被移除。')
        }
        if (!captureNodes.trsOnly) {
          throw new Error('拍摄动画目前仅支持节点 TRS 通道。')
        }
        const selection = clips.find((entry) => `${entry.index}:${entry.label}` === clip)
        if (!selection || !Number.isFinite(seconds)) {
          throw new Error(`模型动画不存在：${clip}`)
        }
        if (clipIndex !== selection.index || !active) {
          resetNodes()
          clipIndex = selection.index
          activate()
        }
        sampled = true
        current = Math.max(0, Math.min(selection.duration, seconds))
        redraw()
      },
      dispose(): void {
        if (released) {
          return
        }
        released = true
        externallyDriven = false
        if (disposed || model.isDestroyed()) {
          return
        }
        if (sampled) {
          resetNodes()
        }
        clipIndex = before.clipIndex
        current = before.current
        speed = before.speed
        loop = before.loop
        started = before.started
        if (before.started && sampled) {
          activate()
        }
        model.activeAnimations.animateWhilePaused = before.started
          ? true
          : originalAnimateWhilePaused
        if (before.playing && visible && !document.hidden) {
          play()
        }
        redraw()
        publish()
      },
    }
  }

  function onVisibilityChange(): void {
    if (document.hidden && playing) {
      stopFrame()
      publish()
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
  const removeRenderError = viewer.scene.renderError.addEventListener(function renderingFailed() {
    if (playing) {
      fail(new Error('场景渲染异常，动画已暂停。'))
    }
  })

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    stopFrame()
    document.removeEventListener('visibilitychange', onVisibilityChange)
    removeRenderError()
    if (!model.isDestroyed()) {
      if (active) {
        model.activeAnimations.remove(active)
      }
      model.activeAnimations.animateWhilePaused = originalAnimateWhilePaused
    }
    active = undefined
  }

  return { snapshot, control, setVisible, acquireExternal, dispose }
}

export type GeoModelAnimationPlayer = ReturnType<typeof createModelAnimationPlayer>
