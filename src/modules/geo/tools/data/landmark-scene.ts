import { Cartesian3 } from 'cesium'
import type { GeoModelTransform } from './data-browser'

export interface GeoLandmarkScene {
  readonly version: 1
  readonly id: string
  readonly label: string
  readonly anchor: { readonly longitude: number; readonly latitude: number }
  readonly modelUrl: string
  readonly contextUrl: string
  readonly maximumAnchorDistance: number
  readonly attribution: readonly { readonly text: string; readonly url: string }[]
  readonly notice?: string
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`场景索引的${label}无效。`)
  }
  return value as Record<string, unknown>
}

function text(value: unknown, label: string, maximum = 500): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum) {
    throw new Error(`场景索引的${label}无效。`)
  }
  return value.trim()
}

function number(value: unknown, label: string, low: number, high: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high) {
    throw new Error(`场景索引的${label}超出有效范围。`)
  }
  return value
}

export function landmarkResourceUrl(value: unknown, base: string): string {
  const url = new URL(text(value, '资源地址', 4000), base)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('场景资源必须使用不含登录信息的 HTTP 或 HTTPS 地址。')
  }
  return url.href
}

export async function loadLandmarkScene(
  url: string,
  signal: AbortSignal,
): Promise<GeoLandmarkScene> {
  const source = landmarkResourceUrl(url, window.location.href)
  const response = await fetch(source, { signal })
  if (!response.ok) {
    throw new Error(`场景索引下载失败（HTTP ${response.status}）。`)
  }
  const body = await response.text()
  if (body.length > 128_000) {
    throw new Error('场景索引过大；建筑数据应通过独立资源加载。')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    throw new Error('场景索引不是有效的 JSON。')
  }
  const root = object(parsed, '内容')
  if (root.version !== 1) {
    throw new Error('暂不支持这个场景索引版本。')
  }
  const anchor = object(root.anchor, '锚点')
  const model = object(root.model, '主体模型')
  const context = object(root.context, '周边街区')
  if (context.terrain !== 'ellipsoid') {
    throw new Error('第一版周边街区仅支持椭球体地形。')
  }
  if (!Array.isArray(root.attribution) || root.attribution.length > 12) {
    throw new Error('场景索引缺少有效的数据署名。')
  }
  const base = response.url || source
  return {
    version: 1,
    id: text(root.id, '标识', 100),
    label: text(root.label, '名称', 200),
    anchor: {
      longitude: number(anchor.longitude_wgs84, '经度', -180, 180),
      latitude: number(anchor.latitude_wgs84, '纬度', -90, 90),
    },
    modelUrl: landmarkResourceUrl(model.url, base),
    contextUrl: landmarkResourceUrl(context.url, base),
    maximumAnchorDistance: number(context.maximum_anchor_distance_m ?? 5, '定位容差', 0, 100),
    attribution: root.attribution.map(function parseCredit(item) {
      const credit = object(item, '署名')
      return {
        text: text(credit.text, '署名文字'),
        url: landmarkResourceUrl(credit.url, base),
      }
    }),
    notice: root.notice === undefined ? undefined : text(root.notice, '说明', 2000),
  }
}

export function landmarkPlacementNotice(
  scene: GeoLandmarkScene,
  transform: GeoModelTransform | undefined,
  terrain: string,
): string | undefined {
  if (!transform) {
    return '主体缺少可核对的位置，暂未显示周边。'
  }
  const anchor = Cartesian3.fromDegrees(scene.anchor.longitude, scene.anchor.latitude)
  const position = Cartesian3.fromDegrees(transform.longitude, transform.latitude)
  if (Cartesian3.distance(anchor, position) > scene.maximumAnchorDistance) {
    return '主体位置与预生成街区不匹配，请恢复场景坐标或选择对应区域的场景。'
  }
  const upright = [transform.heading, transform.pitch, transform.roll].every(
    function isZero(value) {
      return Math.abs(value % 360) < 1e-6
    },
  )
  if (Math.abs(transform.scale - 1) > 1e-6 || !upright || Math.abs(transform.height) > 0.1) {
    return '主体的高度、缩放或姿态与预生成街区不匹配，暂未显示周边。'
  }
  if (terrain !== 'ellipsoid') {
    return '此街区按椭球体地形生成；请切回椭球体地形以显示周边。'
  }
  return undefined
}
