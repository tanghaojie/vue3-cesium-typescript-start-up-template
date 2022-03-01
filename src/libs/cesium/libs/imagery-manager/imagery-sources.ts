import {
  Viewer,
  Credit,
  Math,
  GeographicTilingScheme,
  WebMercatorTilingScheme,
  Rectangle,
} from 'cesium'
import sampleData from '@/resources/sample-data'
import { CoordinateType } from '@/libs/cesium/libs/imagery-layer-coordinate-transform/ImageryLayerCoordinateTransform'

export default [
  [
    {
      iconImageUrl: 'img_c.jpg',
      name: '天地图影像底图',
      options: {
        url: 'https://{s}.tianditu.gov.cn/img_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=feff991159823907566acaa7273472ea',
        layer: 'img',
        style: 'default',
        format: 'tiles',
        tileMatrixSetID: 'c',
        tileMatrixLabels: [
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
          '7',
          '8',
          '9',
          '10',
          '11',
          '12',
          '13',
          '14',
          '15',
          '16',
          '17',
          '18',
        ],
        tilingScheme: new GeographicTilingScheme(),
        credit: new Credit('天地图全球影像服务'),
        subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
        maximumLevel: 18,
        show: true,
      },
      providerName: 'WebMapTileServiceImageryProvider',
    },
    {
      iconImageUrl: 'cia_c.png',
      name: '天地图影像注记',
      options: {
        url: 'https://{s}.tianditu.gov.cn/cia_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=feff991159823907566acaa7273472ea',
        layer: 'img',
        style: 'default',
        format: 'tiles',
        tileMatrixSetID: 'c',
        tileMatrixLabels: [
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
          '7',
          '8',
          '9',
          '10',
          '11',
          '12',
          '13',
          '14',
          '15',
          '16',
          '17',
          '18',
        ],
        tilingScheme: new GeographicTilingScheme(),
        credit: new Credit('天地图全球影像服务'),
        subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
        maximumLevel: 18,
        show: true,
      },
      providerName: 'WebMapTileServiceImageryProvider',
    },
    {
      iconImageUrl: 'vec_c.jpg',
      name: '天地图矢量底图',
      options: {
        url: 'https://{s}.tianditu.gov.cn/vec_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=feff991159823907566acaa7273472ea',
        layer: 'vec',
        style: 'default',
        format: 'image/jpeg',
        tileMatrixSetID: 'c',
        tileMatrixLabels: [
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
          '7',
          '8',
          '9',
          '10',
          '11',
          '12',
          '13',
          '14',
          '15',
          '16',
          '17',
          '18',
        ],
        tilingScheme: new GeographicTilingScheme(),
        credit: new Credit('天地图全球影像服务'),
        subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
        maximumLevel: 18,
        show: true,
      },
      providerName: 'WebMapTileServiceImageryProvider',
    },
    {
      iconImageUrl: 'cva_c.png',
      name: '天地图矢量注记',
      options: {
        url: 'https://{s}.tianditu.gov.cn/cva_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=feff991159823907566acaa7273472ea',
        layer: 'vec',
        style: 'default',
        format: 'image/jpeg',
        tileMatrixSetID: 'c',
        tileMatrixLabels: [
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
          '7',
          '8',
          '9',
          '10',
          '11',
          '12',
          '13',
          '14',
          '15',
          '16',
          '17',
          '18',
        ],
        tilingScheme: new GeographicTilingScheme(),
        credit: new Credit('天地图全球影像服务'),
        subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
        maximumLevel: 18,
        show: true,
      },
      providerName: 'WebMapTileServiceImageryProvider',
    },
  ],
  [
    {
      iconImageUrl: 'amap_img.png',
      name: '高德影像底图',
      options: {
        url: 'https://webst{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        subdomains: ['01', '02', '03', '04'],
      },
      providerName: 'UrlTemplateImageryProvider',
      coordinateType: CoordinateType.Gcj02,
    },
    {
      iconImageUrl: 'amap_img.png',
      name: '高德影像注记',
      options: {
        url: 'https://webst{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
        subdomains: ['01', '02', '03', '04'],
      },
      providerName: 'UrlTemplateImageryProvider',
      coordinateType: CoordinateType.Gcj02,
    },
    {
      iconImageUrl: 'amap_img.png',
      name: '高德矢量',
      options: {
        url: 'https://webrd{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        subdomains: ['01', '02', '03', '04'],
      },
      providerName: 'UrlTemplateImageryProvider',
      coordinateType: CoordinateType.Gcj02,
    },
  ],
  [
    {
      iconImageUrl: 'google_hybrid.jpg',
      name: 'google混合',
      options: {
        url: 'https://mt1.google.cn/vt/lyrs=y&hl=zh-CN&x={x}&y={y}&z={z}',
      },
      providerName: 'UrlTemplateImageryProvider',
    },
    {
      iconImageUrl: 'google_satellite.jpg',
      name: 'google影像',
      options: {
        url: 'https://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}',
      },
      providerName: 'UrlTemplateImageryProvider',
    },
    {
      iconImageUrl: 'google_label.png',
      name: 'google注记',
      options: {
        url: 'https://mt1.google.cn/vt/lyrs=h&hl=zh-CN&x={x}&y={y}&z={z}',
      },
      providerName: 'UrlTemplateImageryProvider',
    },
    {
      iconImageUrl: 'google_road.jpg',
      name: 'google道路',
      options: {
        url: 'https://mt1.google.com/vt/lyrs=m&hl=zh-CN&x={x}&y={y}&z={z}',
      },
      providerName: 'UrlTemplateImageryProvider',
    },
    {
      iconImageUrl: 'google_terrain.jpg',
      name: 'google地形',
      options: {
        url: 'https://mt1.google.com/vt/lyrs=p&hl=zh-CN&x={x}&y={y}&z={z}',
      },
      providerName: 'UrlTemplateImageryProvider',
    },
  ],
  {
    iconImageUrl: 'img_c.jpg',
    name: '测试001-影像',
    options: {
      url: sampleData.satellite,
      fileExtension: 'png',
      rectangle: Rectangle.fromRadians(
        1.8735054237781372,
        0.5907873200661897,
        1.8824726243189496,
        0.5956433152060476
      ),
    },
    providerName: 'UrlTemplateImageryProvider',
    afterReady: function (viewer: Viewer, success: boolean): void {
      const rect = Rectangle.fromRadians(
        1.8735054237781372,
        0.5907873200661897,
        1.8824726243189496,
        0.5956433152060476
      )
      if (viewer && success) {
        viewer.camera.flyTo({
          destination: rect,
          orientation: {
            heading: Math.toRadians(0),
            pitch: Math.toRadians(-90),
            roll: 0.0,
          },
        })
      }
    },
  },
  [
    {
      iconImageUrl: 'tile_coordinates.jpg',
      name: 'WGS84切片网',
      providerName: 'TileCoordinatesImageryProvider',
    },
    {
      iconImageUrl: 'tile_coordinates.jpg',
      name: 'Web Mercator切片网',
      options: {
        tilingScheme: new WebMercatorTilingScheme(),
      },
      providerName: 'TileCoordinatesImageryProvider',
    },
    {
      iconImageUrl: 'tile.jpg',
      name: 'Web Mercator网',
      options: {
        tilingScheme: new WebMercatorTilingScheme(),
      },
      providerName: 'GridImageryProvider',
    },
    {
      iconImageUrl: 'tile.jpg',
      name: 'WGS84网',
      providerName: 'GridImageryProvider',
    },
  ],
  // [
  //   {
  //     iconImageUrl: 'tile.jpg',
  //     name: '生态林',
  //     providerName: 'ArcGisMapServerImageryProvider',
  //     options: {
  //       // url: 'http://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer',
  //       url: 'http://192.168.0.171/ArcGIS/rest/services/stl/MapServer',
  //     },
  //   },

  //   {
  //     iconImageUrl: 'tile.jpg',
  //     name: '行政区乡镇',
  //     providerName: 'ArcGisMapServerImageryProvider',
  //     options: {
  //       // url: 'http://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer',
  //       url: 'http://192.168.0.171/ArcGIS/rest/services/xzqxz/MapServer',
  //     },
  //   },

  //   {
  //     iconImageUrl: 'tile.jpg',
  //     name: '行政区村',
  //     providerName: 'ArcGisMapServerImageryProvider',
  //     options: {
  //       // url: 'http://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer',
  //       url: 'http://192.168.0.171/ArcGIS/rest/services/xzqc/MapServer',
  //     },
  //   },
  // ],
]
