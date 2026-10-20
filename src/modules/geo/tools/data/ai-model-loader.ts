import { Cartesian3 } from 'cesium'
import type { GeoDataBrowser } from './data-browser'
import {
  loadAiModelManifest,
  resolveAiModelSelection,
  type AiModelCatalogItem,
  type AiModelManifest,
  type AiModelSelection,
} from './ai-model-catalog'

export interface AiModelGroupSnapshot {
  readonly id: string
  readonly label: string
  readonly modeId: AiModelSelection['modeId']
  readonly modeLabel: string
  readonly variantId: string
  readonly variantLabel: string
  readonly modelId: string
  readonly resourceIds: readonly string[]
  readonly status: 'ready' | 'partial'
  readonly notice: string
  readonly attribution: AiModelManifest['attribution']
  readonly show: boolean
  readonly terrainHidden: boolean
}

interface Group {
  manifest: AiModelManifest
  snapshot: AiModelGroupSnapshot
}

export function createAiModelLoader(
  browser: GeoDataBrowser,
  options: {
    readonly signal?: AbortSignal
    readonly onChange: () => void
  },
) {
  const groups = new Map<string, Group>()
  let active: AbortController | undefined
  let disposed = false
  let sequence = 0
  let loadingId: string | undefined
  let progress: string | undefined

  function check(signal: AbortSignal): void {
    if (disposed || signal.aborted || options.signal?.aborted) {
      throw new DOMException('AI 模型加载已取消', 'AbortError')
    }
  }

  function publish(message?: string): void {
    progress = message
    if (!disposed) {
      options.onChange()
    }
  }

  function find(resourceId: string): Group | undefined {
    return [...groups.values()].find((group) => group.snapshot.resourceIds.includes(resourceId))
  }

  function remove(id: string): boolean {
    const group = groups.get(id) ?? find(id)
    if (!group) {
      return false
    }
    groups.delete(group.snapshot.id)
    group.snapshot.resourceIds.forEach((resourceId) => browser.remove(resourceId))
    return true
  }

  function list(): readonly AiModelGroupSnapshot[] {
    const available = new Set(browser.list().map((resource) => resource.id))
    groups.forEach(function sync(group, id) {
      if (!available.has(group.snapshot.modelId)) {
        remove(id)
        return
      }
      const terrain = browser.getTerrain()
      const hidden =
        group.manifest.placement.terrain === 'ellipsoid' &&
        (terrain.id !== 'ellipsoid' || terrain.status !== 'ready')
      if (hidden !== group.snapshot.terrainHidden) {
        group.snapshot = { ...group.snapshot, terrainHidden: hidden }
        group.snapshot.resourceIds.forEach((resourceId) =>
          browser.setVisible(resourceId, !hidden && group.snapshot.show),
        )
      }
    })
    return [...groups.values()].map((group) => ({
      ...group.snapshot,
      resourceIds: [...group.snapshot.resourceIds],
    }))
  }

  function setVisible(resourceId: string, show: boolean): boolean {
    const group = groups.get(resourceId) ?? find(resourceId)
    if (!group) {
      return false
    }
    group.snapshot = { ...group.snapshot, show }
    group.snapshot.resourceIds.forEach((id) =>
      browser.setVisible(id, show && !group.snapshot.terrainHidden),
    )
    return true
  }

  function assertTransformEditable(resourceId: string): void {
    const group = find(resourceId)
    if (group && group.manifest.resources.length) {
      throw new Error('该 AI 模型带有配套资源，请整体移除后重新加载，避免主体与资源错位。')
    }
  }

  function assertTerrain(manifest: AiModelManifest): void {
    const terrain = browser.getTerrain()
    if (
      manifest.placement.terrain === 'ellipsoid' &&
      (terrain.id !== 'ellipsoid' || terrain.status !== 'ready')
    ) {
      throw new Error('此模型使用椭球体展示高程，请先在“数据 → 地形”选择椭球体。')
    }
  }

  async function load(item: AiModelCatalogItem, selection?: AiModelSelection): Promise<void> {
    if (active) {
      throw new Error('请等待当前 AI 模型加载完成。')
    }
    const { modeId, variantId } = selection ?? resolveAiModelSelection(item)
    const existing = groups.get(item.id)
    if (
      existing?.snapshot.status === 'ready' &&
      existing.snapshot.modeId === modeId &&
      existing.snapshot.variantId === variantId
    ) {
      await browser.flyTo(existing.snapshot.modelId)
      return
    }
    const operation = new AbortController()
    active = operation
    loadingId = item.id
    const resourceIds: string[] = []
    let replacing = false
    function abort(): void {
      operation.abort()
    }
    options.signal?.addEventListener('abort', abort, { once: true })
    try {
      check(operation.signal)
      publish(`正在读取 ${item.label} 的发布描述…`)
      const manifest = await loadAiModelManifest(item, operation.signal)
      check(operation.signal)
      assertTerrain(manifest)
      const mode = manifest.modes.find((mode) => mode.id === modeId)
      if (!mode) {
        throw new Error('该模型没有请求的模式，请刷新目录。')
      }
      const variant = mode.variants.find((variant) => variant.id === variantId)
      const file = variantId === 'original' ? mode.model : variant
      if (!file) {
        throw new Error('该模型没有请求的模式或精细度，请刷新目录。')
      }
      remove(item.id)
      replacing = true
      const prefix = `aimodel-${item.id}-${++sequence}`
      publish(`正在加载 ${manifest.label}…`)
      const model = await browser.loadModel({
        id: `${prefix}-model`,
        label: manifest.label,
        url: file.url,
        transform: manifest.placement,
        signal: operation.signal,
        async chooseCoordinates() {
          return 'input'
        },
      })
      resourceIds.push(model.id)
      check(operation.signal)
      assertTerrain(manifest)
      const notices: string[] = []
      for (const resource of manifest.resources) {
        publish(`正在加载配套资源：${resource.label}…`)
        try {
          const id = `${prefix}-${resource.id}`
          async function loadGeoJson() {
            const response = await fetch(resource.url, { signal: operation.signal })
            if (!response.ok) {
              throw new Error(`配套 GeoJSON 读取失败（HTTP ${response.status}）。`)
            }
            const data: unknown = await response.json()
            check(operation.signal)
            if (!data || typeof data !== 'object') {
              throw new Error('配套 GeoJSON 内容无效。')
            }
            return browser.loadGeoJson({ id, label: resource.label, url: resource.url, data })
          }
          const loaded =
            resource.kind === '3d-tiles'
              ? await browser.loadTileset({
                  id,
                  label: resource.label,
                  url: resource.url,
                  signal: operation.signal,
                  dayNightPosition: resource.dayNight
                    ? Cartesian3.fromDegrees(
                        manifest.placement.longitude,
                        manifest.placement.latitude,
                        manifest.placement.height,
                      )
                    : undefined,
                })
              : await loadGeoJson()
          resourceIds.push(loaded.id)
          check(operation.signal)
        } catch (error) {
          check(operation.signal)
          if (resource.required) {
            throw error
          }
          notices.push(
            `${resource.label}未加载：${error instanceof Error ? error.message : '资源读取失败'}`,
          )
        }
      }
      check(operation.signal)
      assertTerrain(manifest)
      groups.set(item.id, {
        manifest,
        snapshot: {
          id: item.id,
          label: manifest.label,
          modeId,
          modeLabel: mode.label,
          variantId,
          variantLabel: variant?.label ?? '原始版',
          modelId: model.id,
          resourceIds: [...resourceIds],
          status: notices.length ? 'partial' : 'ready',
          notice: [manifest.placement.notice, ...notices].join(' '),
          attribution: manifest.attribution,
          show: true,
          terrainHidden: false,
        },
      })
      publish('正在定位模型…')
      await browser.flyTo(model.id)
      check(operation.signal)
    } catch (error) {
      if (replacing) {
        groups.delete(item.id)
      }
      if (!disposed) {
        resourceIds.forEach((id) => browser.remove(id))
      }
      throw error
    } finally {
      options.signal?.removeEventListener('abort', abort)
      active = undefined
      loadingId = undefined
      publish()
    }
  }

  function cancel(): void {
    active?.abort()
  }
  function dispose(): void {
    disposed = true
    cancel()
    ;[...groups.keys()].forEach(remove)
  }

  return {
    load,
    list,
    remove,
    setVisible,
    assertTransformEditable,
    cancel,
    dispose,
    get loadingId() {
      return loadingId
    },
    get progress() {
      return progress
    },
  }
}
