import { Group, ClickHandlerOption, ActiveOption } from '../../../Types'
import * as Cesium from 'cesium'
import { Tool3DTileActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/tool3DTile/action-types'

const YIN_TAI_IN_99_ID: string = 'YIN_TAI_IN_99_ID'
const YIN_TAI_IN_99_COORDINATE: number[] = [
  104.06607868945336, 30.588192, 104.0683440681217, 30.58827,
  104.06841111937335, 30.5863615, 104.06604908806952, 30.58633698,
]

const YIN_TAI_IN_99_CLASSIFICATION_PRIMITIVES = [
  {
    polygon: new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 20,
      extrudedHeight: 0,
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_20',
  },
  {
    polygon: new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 40,
      extrudedHeight: 20,
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_40',
  },
  {
    polygon: new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 60,
      extrudedHeight: 40,
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_60',
  },
  {
    polygon: new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 80,
      extrudedHeight: 60,
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_80',
  },
  {
    polygon: new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 100,
      extrudedHeight: 80,
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_100',
  },
  {
    polygon: new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 120,
      extrudedHeight: 100,
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_120',
  },
  {
    polygon: new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 140,
      extrudedHeight: 120,
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_140',
  },
  {
    polygon: new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 160,
      extrudedHeight: 140,
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_160',
  },
]

const addYinTaiIn99ClassificationPrimitive = function (viewer: Cesium.Viewer) {
  YIN_TAI_IN_99_CLASSIFICATION_PRIMITIVES.forEach((item) => {
    viewer.jt?.classification.add3DTileClassificationPrimitive({
      id: item.id,
      geometry: item.polygon,
    })
  })
}

const removeYinTaiIn99ClassificationPrimitive = function (
  viewer: Cesium.Viewer
) {
  YIN_TAI_IN_99_CLASSIFICATION_PRIMITIVES.forEach((item) => {
    viewer.jt?.classification.remove3DTileClassificationPrimitive({
      id: item.id,
    })
  })
}

const view: Group = {
  name: '3DTiles',
  items: [
    {
      name: '高亮',
      icon: 'classification',
      clickHandler: (option: ClickHandlerOption): any => {
        if (!option || !option.viewer || !option.viewer.jt) {
          return
        }
        const { item } = option
        if (
          option.store.state.jtCesiumVue.toolbar.tool3DTile
            .highlight3DTileFeatureActive ||
          (item && item.clickHandlerResult)
        ) {
          // stop
          option.viewer.jt.highlight.removeAll()
          if (item && item.clickHandlerResult) {
            item.clickHandlerResult.destroy()
            item.clickHandlerResult = undefined
          }
          option.store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_HIGHLIGHT_3DTILE_FEATURE_ACTIVE}`,
            false
          )
          return
        } else {
          option.store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_HIGHLIGHT_3DTILE_FEATURE_ACTIVE}`,
            true
          )
          return option.viewer.jt.highlight.highlight3DTileFeature({
            color: Cesium.Color.YELLOW.withAlpha(0.5),
          })
        }
      },
      active: (option: ActiveOption): boolean => {
        return option.store.state.jtCesiumVue.toolbar.tool3DTile
          .highlight3DTileFeatureActive
      },
    },
    {
      name: '分类(滑动)',
      icon: 'move',
      clickHandler: (option: ClickHandlerOption): any => {
        if (!option || !option.viewer || !option.viewer.jt) {
          return
        }
        const { item } = option
        if (
          option.store.state.jtCesiumVue.toolbar.tool3DTile
            .hoverClassificationActive ||
          (item && item.clickHandlerResult)
        ) {
          // stop
          option.viewer.jt.classification.removeClassification()
          if (item && item.clickHandlerResult) {
            item.clickHandlerResult.destroy()
            item.clickHandlerResult = undefined
          }
          option.store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_HOVER_CLASSIFICATION_ACTIVE}`,
            false
          )
          removeYinTaiIn99ClassificationPrimitive(option.viewer)
          return
        } else {
          option.store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_HOVER_CLASSIFICATION_ACTIVE}`,
            true
          )
          addYinTaiIn99ClassificationPrimitive(option.viewer)
          option.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(104.06722, 30.582, 400),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-30),
              roll: 0.0,
            },
            duration: 1,
          })
          return option.viewer.jt.classification.addClassification({
            color: [255, 0, 0, 128],
          })
        }
      },
      active: (option: ActiveOption): boolean => {
        return option.store.state.jtCesiumVue.toolbar.tool3DTile
          .hoverClassificationActive
      },
    },
    {
      name: '分类(点击)',
      icon: 'select',
      clickHandler: (option: ClickHandlerOption): any => {
        if (!option || !option.viewer || !option.viewer.jt) {
          return
        }
        const { item } = option
        if (
          option.store.state.jtCesiumVue.toolbar.tool3DTile
            .clickClassificationActive ||
          (item && item.clickHandlerResult)
        ) {
          // stop
          option.viewer.jt.classification.removeInvertClassification()
          if (item && item.clickHandlerResult) {
            item.clickHandlerResult.destroy()
            item.clickHandlerResult = undefined
          }
          option.store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_CLICK_CLASSIFICATION_ACTIVE}`,
            false
          )
          removeYinTaiIn99ClassificationPrimitive(option.viewer)
          return
        } else {
          // start
          option.store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_CLICK_CLASSIFICATION_ACTIVE}`,
            true
          )
          addYinTaiIn99ClassificationPrimitive(option.viewer)
          option.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(104.06722, 30.582, 400),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-30),
              roll: 0.0,
            },
            duration: 1,
          })
          return option.viewer.jt.classification.addInvertClassification()
        }
      },
      active: (option: ActiveOption): boolean => {
        return option.store.state.jtCesiumVue.toolbar.tool3DTile
          .clickClassificationActive
      },
    },
  ],
}

export default view
