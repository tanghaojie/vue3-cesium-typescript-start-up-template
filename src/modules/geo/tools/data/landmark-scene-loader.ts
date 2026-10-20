import { Cartesian3, Credit, type Viewer } from 'cesium'
import type { GeoDataBrowser, GeoModelTransform } from './data-browser'
import type { GeoModelCoordinates, GeoModelCoordinateSource } from './model-asset'
import { landmarkPlacementNotice, loadLandmarkScene, type GeoLandmarkScene } from './landmark-scene'

export interface GeoLandmarkSceneSnapshot {
  readonly id: string
  readonly label: string
  readonly status: 'loading' | 'ready' | 'partial' | 'incompatible'
  readonly notice?: string
  readonly error?: string
  readonly modelId?: string
  readonly contextId?: string
}

export interface GeoLandmarkSceneLoader {
  readonly loading?: string
  load(url: string): Promise<void>
  retry(id: string): Promise<void>
  cancel(): void
  remove(id: string): void
  removeResource(id: string): boolean
  setResourceVisible(id: string, show: boolean): void
  sync(): readonly GeoLandmarkSceneSnapshot[]
  dispose(): void
}

interface SceneEntry {
  readonly id: string
  readonly scene: GeoLandmarkScene
  readonly credits: readonly Credit[]
  modelId?: string
  contextId?: string
  contextVisible: boolean
  creditsVisible: boolean
  status: GeoLandmarkSceneSnapshot['status']
  notice?: string
  error?: string
}

function escaped(value: string): string {
  return value.replace(/[&<>"']/g, function escapeCharacter(character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!
  })
}

export function createGeoLandmarkSceneLoader(
  viewer: Viewer,
  browser: GeoDataBrowser,
  options: {
    readonly signal?: AbortSignal
    readonly onChange: () => void
    readonly chooseCoordinates: (
      coordinates: GeoModelCoordinates,
      input: GeoModelTransform,
      signal: AbortSignal,
    ) => Promise<GeoModelCoordinateSource>
  },
): GeoLandmarkSceneLoader {
  const entries = new Map<string, SceneEntry>()
  let active: AbortController | undefined
  let activeEntryId: string | undefined
  let loading: string | undefined
  let sequence = 0
  let disposed = false

  function notify(): void {
    if (!disposed) {
      options.onChange()
    }
  }

  function stage(value: string | undefined): void {
    loading = value
    notify()
  }

  function check(signal?: AbortSignal): void {
    if (disposed || viewer.isDestroyed() || signal?.aborted || options.signal?.aborted) {
      throw new DOMException('场景加载已取消', 'AbortError')
    }
  }

  function credits(entry: SceneEntry, visible: boolean): void {
    if (entry.creditsVisible === visible || viewer.isDestroyed()) {
      return
    }
    entry.creditsVisible = visible
    entry.credits.forEach(function updateCredit(credit) {
      if (visible) {
        viewer.creditDisplay.addStaticCredit(credit)
      } else {
        viewer.creditDisplay.removeStaticCredit(credit)
      }
    })
    viewer.scene.requestRender()
  }

  function remove(id: string, announce = true): void {
    const entry = entries.get(id)
    if (!entry) {
      return
    }
    entries.delete(id)
    if (activeEntryId === id) {
      cancel()
    }
    credits(entry, false)
    if (!disposed && !viewer.isDestroyed()) {
      if (entry.contextId) {
        browser.remove(entry.contextId)
      }
      if (entry.modelId) {
        browser.remove(entry.modelId)
      }
    }
    if (announce) {
      notify()
    }
  }

  function sync(): readonly GeoLandmarkSceneSnapshot[] {
    if (disposed || viewer.isDestroyed()) {
      return []
    }
    const resources = browser.list()
    for (const entry of entries.values()) {
      const model = resources.find((item) => item.id === entry.modelId)
      const context = resources.find((item) => item.id === entry.contextId)
      if (entry.modelId && !model) {
        remove(entry.id, false)
        continue
      }
      if (!model) {
        continue
      }
      const notice = landmarkPlacementNotice(
        entry.scene,
        model.modelTransform,
        browser.getTerrain().id,
      )
      if (notice) {
        entry.status = 'incompatible'
        entry.notice = notice
      } else if (context?.status === 'failed') {
        entry.status = 'partial'
        entry.error = context.error ?? '周边瓦片加载失败，请重试。'
      } else if (context) {
        entry.status = 'ready'
        entry.notice = entry.scene.notice
        entry.error = undefined
      } else if (entry.status === 'incompatible') {
        entry.status = 'partial'
        entry.notice = entry.scene.notice
        entry.error = '位置和地形已符合要求，请重试连接周边。'
      }
      const show = !notice && context?.status !== 'failed' && model.show && entry.contextVisible
      if (context && context.show !== show) {
        browser.setVisible(context.id, show)
      }
      credits(entry, Boolean(context && show))
    }
    return [...entries.values()].map(function snapshot(entry) {
      return {
        id: entry.id,
        label: entry.scene.label,
        status: entry.status,
        notice: entry.notice,
        error: entry.error,
        modelId: entry.modelId,
        contextId: entry.contextId,
      }
    })
  }

  async function context(entry: SceneEntry, signal: AbortSignal): Promise<void> {
    check(signal)
    const model = browser.list().find((item) => item.id === entry.modelId)
    const notice = landmarkPlacementNotice(
      entry.scene,
      model?.modelTransform,
      browser.getTerrain().id,
    )
    if (notice) {
      entry.status = 'incompatible'
      entry.notice = notice
      notify()
      return
    }
    if (entry.contextId) {
      browser.remove(entry.contextId)
      entry.contextId = undefined
    }
    credits(entry, false)
    entry.status = 'loading'
    entry.error = undefined
    stage('正在连接周边街区…')
    const resource = await browser.loadTileset({
      id: `${entry.id}-context`,
      label: `${entry.scene.label} · 周边`,
      url: entry.scene.contextUrl,
      signal,
      dayNightPosition: Cartesian3.fromDegrees(
        entry.scene.anchor.longitude,
        entry.scene.anchor.latitude,
      ),
    })
    entry.contextId = resource.id
    check(signal)
    entry.status = 'ready'
    entry.notice = entry.scene.notice
    notify()
  }

  function begin(): AbortController {
    check()
    if (active) {
      throw new Error('请先完成或取消当前场景加载。')
    }
    const task = new AbortController()
    active = task
    options.signal?.addEventListener('abort', cancel, { once: true })
    return task
  }

  function finish(task: AbortController): void {
    if (active === task) {
      active = undefined
      activeEntryId = undefined
      options.signal?.removeEventListener('abort', cancel)
      stage(undefined)
    }
  }

  function cancel(): void {
    active?.abort()
    if (!viewer.isDestroyed()) {
      viewer.camera.cancelFlight()
    }
  }

  async function load(url: string): Promise<void> {
    const task = begin()
    let entry: SceneEntry | undefined
    try {
      stage('正在读取场景索引…')
      const scene = await loadLandmarkScene(url, task.signal)
      check(task.signal)
      if ([...entries.values()].some((item) => item.scene.id === scene.id)) {
        throw new Error('此场景已加载；请移除后重新加载，或重试现有周边。')
      }
      const id = `landmark-${++sequence}-${Date.now().toString(36)}`
      entry = {
        id,
        scene,
        contextVisible: true,
        creditsVisible: false,
        status: 'loading',
        credits: scene.attribution.map(function sceneCredit(credit) {
          return new Credit(
            `<a href="${escaped(credit.url)}" target="_blank" rel="noopener noreferrer">${escaped(credit.text)}</a>`,
            true,
          )
        }),
      }
      entries.set(id, entry)
      activeEntryId = id
      stage('正在加载地标模型…')
      const transform: GeoModelTransform = {
        ...scene.anchor,
        height: 0,
        scale: 1,
        heading: 0,
        pitch: 0,
        roll: 0,
      }
      const model = await browser.loadModel({
        id: `${id}-model`,
        label: scene.label,
        url: scene.modelUrl,
        transform,
        signal: task.signal,
        chooseCoordinates(coordinates) {
          return options.chooseCoordinates(coordinates, transform, task.signal)
        },
      })
      entry.modelId = model.id
      check(task.signal)
      await context(entry, task.signal)
      check(task.signal)
      await browser.flyTo(model.id)
      check(task.signal)
    } catch (error) {
      if (entry && !disposed) {
        if (
          task.signal.aborted ||
          !entry.modelId ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          remove(entry.id)
        } else {
          entry.status = 'partial'
          entry.error = error instanceof Error ? error.message : '周边加载失败，主体已保留。'
          notify()
          // A failed environment must not leave the successful hero off screen.
          void browser.flyTo(entry.modelId).catch(function ignoreCancelledFlight() {})
        }
      }
      throw error
    } finally {
      finish(task)
    }
  }

  async function retry(id: string): Promise<void> {
    const entry = entries.get(id)
    if (!entry?.modelId) {
      throw new Error('场景主体不存在，请重新加载场景。')
    }
    const task = begin()
    activeEntryId = entry.id
    try {
      await context(entry, task.signal)
    } catch (error) {
      if (!disposed) {
        if (task.signal.aborted && entry.contextId) {
          browser.remove(entry.contextId)
          entry.contextId = undefined
          credits(entry, false)
        }
        entry.status = 'partial'
        entry.error = task.signal.aborted
          ? '周边加载已取消，主体已保留。'
          : error instanceof Error
            ? error.message
            : '周边加载失败。'
        notify()
      }
      throw error
    } finally {
      finish(task)
    }
  }

  return {
    get loading() {
      return loading
    },
    load,
    retry,
    cancel,
    remove,
    sync,
    removeResource(id) {
      const entry = [...entries.values()].find(
        (item) => item.modelId === id || item.contextId === id,
      )
      if (!entry) {
        return false
      }
      if (entry.modelId === id) {
        remove(entry.id)
      } else {
        browser.remove(id)
        entry.contextId = undefined
        entry.status = 'partial'
        entry.error = '周边已移除，可重新连接。'
        credits(entry, false)
        notify()
      }
      return true
    },
    setResourceVisible(id, show) {
      const entry = [...entries.values()].find((item) => item.contextId === id)
      if (entry) {
        entry.contextVisible = show
      }
    },
    dispose() {
      cancel()
      options.signal?.removeEventListener('abort', cancel)
      for (const entry of entries.values()) {
        credits(entry, false)
      }
      entries.clear()
      disposed = true
    },
  }
}
