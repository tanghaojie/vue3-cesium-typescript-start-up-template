import { Group } from '../../../Types'
import * as Cesium from 'cesium'
import store from '@/store'
import {
  highlight3DTileFeature,
  removeHighlighted3DTileFeature,
} from '@/libs/cesium/libs/highlight'
import {
  addClassification,
  removeClassification,
  addInvertClassification,
  removeInvertClassification,
  add3DTileClassificationPrimitive,
  remove3DTileClassificationPrimitive,
} from '@/libs/cesium/libs/classification'
import {
  ClickHandlerOption,
  OnMountedOption,
} from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
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
    add3DTileClassificationPrimitive({
      viewer,
      id: item.id,
      geometry: item.polygon,
    })
  })
}

const removeYinTaiIn99ClassificationPrimitive = function (
  viewer: Cesium.Viewer
) {
  YIN_TAI_IN_99_CLASSIFICATION_PRIMITIVES.forEach((item) => {
    remove3DTileClassificationPrimitive({
      viewer,
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
      clickHandler: (option: ClickHandlerOption | undefined): any => {
        if (!option) {
          return
        }
        const { viewer, item } = option
        if (!viewer) {
          return
        }
        if (
          store.state.jtCesiumVue.toolbar.tool3DTile
            .highlight3DTileFeatureActive ||
          (item && item.clickHandlerResult)
        ) {
          // stop
          removeHighlighted3DTileFeature()
          if (item && item.clickHandlerResult) {
            item.clickHandlerResult.destroy()
            item.clickHandlerResult = undefined
          }
          store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_HIGHLIGHT_3DTILE_FEATURE_ACTIVE}`,
            false
          )
          return
        } else {
          store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_HIGHLIGHT_3DTILE_FEATURE_ACTIVE}`,
            true
          )
          return highlight3DTileFeature({
            viewer,
            color: Cesium.Color.YELLOW.withAlpha(0.5),
          })
        }
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.tool3DTile
          .highlight3DTileFeatureActive
      },
    },
    {
      name: '分类(滑动)',
      icon: 'move',
      clickHandler: (option: ClickHandlerOption | undefined): any => {
        if (!option) {
          return
        }
        const { viewer, item } = option
        if (!viewer) {
          return
        }
        if (
          store.state.jtCesiumVue.toolbar.tool3DTile
            .hoverClassificationActive ||
          (item && item.clickHandlerResult)
        ) {
          // stop
          removeClassification()
          if (item && item.clickHandlerResult) {
            item.clickHandlerResult.destroy()
            item.clickHandlerResult = undefined
          }
          store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_HOVER_CLASSIFICATION_ACTIVE}`,
            false
          )
          removeYinTaiIn99ClassificationPrimitive(viewer)
          return
        } else {
          store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_HOVER_CLASSIFICATION_ACTIVE}`,
            true
          )
          addYinTaiIn99ClassificationPrimitive(viewer)
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(104.06722, 30.582, 400),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-30),
              roll: 0.0,
            },
            duration: 1,
          })
          return addClassification({ viewer, color: [255, 0, 0, 128] })
        }
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.tool3DTile
          .hoverClassificationActive
      },
    },
    {
      name: '分类(点击)',
      icon: 'select',
      clickHandler: (option: ClickHandlerOption | undefined): any => {
        if (!option) {
          return
        }
        const { viewer, item } = option
        if (!viewer) {
          return
        }
        if (
          store.state.jtCesiumVue.toolbar.tool3DTile
            .clickClassificationActive ||
          (item && item.clickHandlerResult)
        ) {
          // stop
          removeInvertClassification({ viewer })
          if (item && item.clickHandlerResult) {
            item.clickHandlerResult.destroy()
            item.clickHandlerResult = undefined
          }
          store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_CLICK_CLASSIFICATION_ACTIVE}`,
            false
          )
          removeYinTaiIn99ClassificationPrimitive(viewer)
          return
        } else {
          // start
          store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_CLICK_CLASSIFICATION_ACTIVE}`,
            true
          )
          addYinTaiIn99ClassificationPrimitive(viewer)
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(104.06722, 30.582, 400),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-30),
              roll: 0.0,
            },
            duration: 1,
          })
          return addInvertClassification({ viewer })
        }
      },
      active: (): boolean => {
        return store.state.jtCesiumVue.toolbar.tool3DTile
          .clickClassificationActive
      },
    },
  ],
}

export default view
