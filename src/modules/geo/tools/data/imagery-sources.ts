import {
  buildModuleUrl,
  Color,
  GeographicTilingScheme,
  GridImageryProvider,
  TileMapServiceImageryProvider,
  UrlTemplateImageryProvider,
  WebMapTileServiceImageryProvider,
  WebMercatorTilingScheme,
  type ImageryProvider,
} from 'cesium'
import {
  correctGcj02TileCoordinates,
  resolveCoordinateCorrection,
  type GeoCoordinateCorrection,
} from './coordinate-correction'

export type GeoImagerySourceId =
  | 'natural-earth-ii'
  | 'debug-grid'
  | 'tianditu-image'
  | 'tianditu-vector'
  | 'tianditu-image-annotation'
  | 'tianditu-vector-annotation'
  | 'amap-satellite'
  | 'amap-vector'
  | 'amap-annotation'
  | 'google-hybrid'
  | 'google-satellite'
  | 'google-label'
  | 'google-road'
  | 'google-terrain'

export type GeoImageryCoordinateSystem = 'WGS84' | 'GCJ-02'

export interface GeoImagerySourceOptions {
  readonly tiandituToken?: string
  /** Automatically apply the source-specific correction when it is available. */
  readonly coordinateCorrection?: GeoCoordinateCorrection
}

export interface GeoImagerySourceDefinition {
  readonly id: GeoImagerySourceId
  readonly label: string
  readonly description: string
  readonly providerType: 'tms' | 'wmts' | 'url-template' | 'grid'
  readonly coordinateSystem: GeoImageryCoordinateSystem
  readonly role: 'base' | 'overlay' | 'candidate'
  readonly requiresTiandituToken?: boolean
  readonly supportsPicking?: boolean
  readonly createProvider: (
    options?: GeoImagerySourceOptions,
  ) => Promise<ImageryProvider> | ImageryProvider
  readonly checkAvailability: (options?: GeoImagerySourceOptions) => GeoImageryAvailability
}

export interface GeoImageryAvailability {
  readonly available: boolean
  readonly reason?: string
  readonly warning?: string
}

const TIANDITU_SUBDOMAINS = ['0', '1', '2', '3', '4', '5', '6', '7']
const WEB_MERCATOR_TILE_MATRIX_LABELS = Array.from({ length: 19 }, function tileLevel(_, index) {
  return String(index)
})

function tokenAvailability(options?: GeoImagerySourceOptions): GeoImageryAvailability {
  if (!options?.tiandituToken?.trim()) {
    return {
      available: false,
      reason: '天地图需要通过 VITE_GEO_TIANDITU_TOKEN 提供公开客户端令牌',
    }
  }
  return {
    available: true,
    warning: '令牌会暴露给浏览器用户，请仅使用允许公开的客户端令牌',
  }
}

function createTiandituProvider(
  layer: 'img' | 'vec' | 'cia' | 'cva',
  token: string,
): WebMapTileServiceImageryProvider {
  return new WebMapTileServiceImageryProvider({
    url: `https://t{s}.tianditu.gov.cn/${layer}_w/wmts`,
    layer,
    style: 'default',
    format: 'tiles',
    tileMatrixSetID: 'w',
    tileMatrixLabels: WEB_MERCATOR_TILE_MATRIX_LABELS,
    subdomains: TIANDITU_SUBDOMAINS,
    tilingScheme: new WebMercatorTilingScheme(),
    maximumLevel: 18,
    credit: '天地图',
    dimensions: { tk: token },
    enablePickFeatures: false,
  })
}

function createAmapProvider(
  url: string,
  correction: GeoCoordinateCorrection,
): UrlTemplateImageryProvider {
  const tilingScheme = new WebMercatorTilingScheme()
  const customTags:
    | Record<
        string,
        (provider: UrlTemplateImageryProvider, x: number, y: number, level: number) => number
      >
    | undefined =
    correction === 'gcj02-to-wgs84'
      ? {
          amapX(_provider, x, y, level) {
            return correctGcj02TileCoordinates(x, y, level, tilingScheme).x
          },
          amapY(_provider, x, y, level) {
            return correctGcj02TileCoordinates(x, y, level, tilingScheme).y
          },
        }
      : undefined
  return new UrlTemplateImageryProvider({
    url: url.replace('{x}', '{amapX}').replace('{y}', '{amapY}'),
    subdomains: ['1', '2', '3', '4'],
    tilingScheme,
    maximumLevel: 18,
    credit: '高德地图（GCJ-02）',
    enablePickFeatures: false,
    customTags,
  })
}

function createGoogleProvider(url: string): UrlTemplateImageryProvider {
  return new UrlTemplateImageryProvider({
    url,
    subdomains: ['0', '1', '2', '3'],
    tilingScheme: new WebMercatorTilingScheme(),
    maximumLevel: 20,
    credit: 'Google Maps',
    enablePickFeatures: false,
  })
}

function createNaturalEarthProvider(): Promise<TileMapServiceImageryProvider> {
  return TileMapServiceImageryProvider.fromUrl(buildModuleUrl('Assets/Textures/NaturalEarthII'))
}

function createDebugGridProvider(): GridImageryProvider {
  return new GridImageryProvider({
    cells: 16,
    color: Color.fromCssColorString('#54c8ff').withAlpha(0.45),
    glowColor: Color.fromCssColorString('#1e74b8').withAlpha(0.18),
    backgroundColor: Color.fromCssColorString('#06111d').withAlpha(0.72),
    tilingScheme: new GeographicTilingScheme(),
  })
}

function available(): GeoImageryAvailability {
  return { available: true }
}

function createTokenSource(
  definition: Omit<GeoImagerySourceDefinition, 'createProvider' | 'checkAvailability'>,
  layer: 'img' | 'vec' | 'cia' | 'cva',
): GeoImagerySourceDefinition {
  return {
    ...definition,
    requiresTiandituToken: true,
    createProvider(options) {
      const availability = tokenAvailability(options)
      if (!availability.available) {
        throw new Error(availability.reason)
      }
      return createTiandituProvider(layer, options?.tiandituToken as string)
    },
    checkAvailability: tokenAvailability,
  }
}

function createGcj02Source(
  definition: Omit<GeoImagerySourceDefinition, 'createProvider' | 'checkAvailability'>,
  url: string,
): GeoImagerySourceDefinition {
  return {
    ...definition,
    coordinateSystem: 'GCJ-02',
    createProvider(options) {
      const correction = resolveCoordinateCorrection(
        definition.coordinateSystem,
        options?.coordinateCorrection,
      )
      return createAmapProvider(url, correction)
    },
    checkAvailability: () => ({
      available: true,
      warning: '高德瓦片会按启动配置自动执行 GCJ-02 到 WGS84 的瓦片校正',
    }),
  }
}

/**
 * Creates the built-in imagery directory. The returned definitions contain
 * factories only; no network request is made until a user explicitly adds a
 * layer to a Viewer.
 */
export function createGeoImageryCatalog(): readonly GeoImagerySourceDefinition[] {
  return [
    {
      id: 'natural-earth-ii',
      label: 'Natural Earth II',
      description: 'Cesium 随包发布的全球离线自然地理底图',
      providerType: 'tms',
      coordinateSystem: 'WGS84',
      role: 'base',
      createProvider: createNaturalEarthProvider,
      checkAvailability: available,
    },
    {
      id: 'debug-grid',
      label: '调试网格',
      description: '本地生成的经纬网格，用于校验相机和数据定位',
      providerType: 'grid',
      coordinateSystem: 'WGS84',
      role: 'base',
      createProvider: createDebugGridProvider,
      checkAvailability: available,
    },
    createTokenSource(
      {
        id: 'tianditu-image',
        label: '天地图 · 影像',
        description: '天地图全球影像 WMTS',
        providerType: 'wmts',
        coordinateSystem: 'WGS84',
        role: 'candidate',
      },
      'img',
    ),
    createTokenSource(
      {
        id: 'tianditu-vector',
        label: '天地图 · 矢量',
        description: '天地图全球矢量 WMTS',
        providerType: 'wmts',
        coordinateSystem: 'WGS84',
        role: 'candidate',
      },
      'vec',
    ),
    createTokenSource(
      {
        id: 'tianditu-image-annotation',
        label: '天地图 · 影像注记',
        description: '叠加在天地图影像上的中文注记',
        providerType: 'wmts',
        coordinateSystem: 'WGS84',
        role: 'candidate',
      },
      'cia',
    ),
    createTokenSource(
      {
        id: 'tianditu-vector-annotation',
        label: '天地图 · 矢量注记',
        description: '叠加在天地图矢量上的中文注记',
        providerType: 'wmts',
        coordinateSystem: 'WGS84',
        role: 'candidate',
      },
      'cva',
    ),
    createGcj02Source(
      {
        id: 'amap-satellite',
        label: '高德 · 影像候选',
        description: '高德卫星影像候选源，坐标为 GCJ-02',
        providerType: 'url-template',
        coordinateSystem: 'GCJ-02',
        role: 'candidate',
      },
      'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
    ),
    createGcj02Source(
      {
        id: 'amap-vector',
        label: '高德 · 矢量候选',
        description: '高德道路矢量候选源，坐标为 GCJ-02',
        providerType: 'url-template',
        coordinateSystem: 'GCJ-02',
        role: 'candidate',
      },
      'https://webrd0{s}.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}',
    ),
    createGcj02Source(
      {
        id: 'amap-annotation',
        label: '高德 · 注记候选',
        description: '高德道路注记候选源，坐标为 GCJ-02',
        providerType: 'url-template',
        coordinateSystem: 'GCJ-02',
        role: 'candidate',
      },
      'https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
    ),
    {
      id: 'google-hybrid',
      label: 'Google · 混合底图',
      description: 'Google 影像和道路混合底图，需自行确认访问和许可',
      providerType: 'url-template',
      coordinateSystem: 'WGS84',
      role: 'base',
      createProvider: () =>
        createGoogleProvider('https://mt{s}.google.com/vt/lyrs=y&hl=zh-CN&x={x}&y={y}&z={z}'),
      checkAvailability: () => ({
        available: true,
        warning: '候选源的访问、CORS 和商业许可需要由部署方确认',
      }),
    },
    {
      id: 'google-satellite',
      label: 'Google · 影像候选',
      description: 'Google 影像候选源，需自行确认访问和许可',
      providerType: 'url-template',
      coordinateSystem: 'WGS84',
      role: 'candidate',
      createProvider: () =>
        createGoogleProvider('https://mt{s}.google.com/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}'),
      checkAvailability: () => ({
        available: true,
        warning: '候选源的访问、CORS 和商业许可需要由部署方确认',
      }),
    },
    {
      id: 'google-label',
      label: 'Google · 注记',
      description: 'Google 中文注记覆盖层，需自行确认访问和许可',
      providerType: 'url-template',
      coordinateSystem: 'WGS84',
      role: 'overlay',
      createProvider: () =>
        createGoogleProvider('https://mt{s}.google.com/vt/lyrs=h&hl=zh-CN&x={x}&y={y}&z={z}'),
      checkAvailability: () => ({
        available: true,
        warning: '候选源的访问、CORS 和商业许可需要由部署方确认',
      }),
    },
    {
      id: 'google-road',
      label: 'Google · 道路候选',
      description: 'Google 道路候选源，需自行确认访问和许可',
      providerType: 'url-template',
      coordinateSystem: 'WGS84',
      role: 'candidate',
      createProvider: () =>
        createGoogleProvider('https://mt{s}.google.com/vt/lyrs=m&hl=zh-CN&x={x}&y={y}&z={z}'),
      checkAvailability: () => ({
        available: true,
        warning: '候选源的访问、CORS 和商业许可需要由部署方确认',
      }),
    },
    {
      id: 'google-terrain',
      label: 'Google · 地形候选',
      description: 'Google 地形渲染候选源，需自行确认访问和许可',
      providerType: 'url-template',
      coordinateSystem: 'WGS84',
      role: 'candidate',
      createProvider: () =>
        createGoogleProvider('https://mt{s}.google.com/vt/lyrs=p&hl=zh-CN&x={x}&y={y}&z={z}'),
      checkAvailability: () => ({
        available: true,
        warning: '候选源的访问、CORS 和商业许可需要由部署方确认',
      }),
    },
  ]
}
