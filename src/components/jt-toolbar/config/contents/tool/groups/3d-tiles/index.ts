import { Group, ClickHandlerOption, ActiveOption, T } from '../../../Types'
import {
  Viewer,
  Color,
  Cartesian3,
  Math as CesiumMath,
  PolygonGeometry,
  PolygonHierarchy,
  PerInstanceColorAppearance,
} from 'cesium'
import { Tool3DTileActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/tool3DTile/action-types'
import { RootState } from '@/store'
import { Store } from 'vuex'
import { JTPrimitiveActionTypes } from '@/store/modules/jt-cesium-vue/modules/cesium-data/modules/jt-primitive/action-types'

const YIN_TAI_IN_99_ID: string = 'YIN_TAI_IN_99_ID'
const YIN_TAI_IN_99_COORDINATE: number[] = [
  104.06607868945336, 30.588192, 104.0683440681217, 30.58827,
  104.06841111937335, 30.5863615, 104.06604908806952, 30.58633698,
]

const YIN_TAI_IN_99_CLASSIFICATION_PRIMITIVES = [
  {
    polygon: new PolygonGeometry({
      polygonHierarchy: new PolygonHierarchy(
        Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 20,
      extrudedHeight: 0,
      vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_20',
  },
  {
    polygon: new PolygonGeometry({
      polygonHierarchy: new PolygonHierarchy(
        Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 40,
      extrudedHeight: 20,
      vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_40',
  },
  {
    polygon: new PolygonGeometry({
      polygonHierarchy: new PolygonHierarchy(
        Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 60,
      extrudedHeight: 40,
      vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_60',
  },
  {
    polygon: new PolygonGeometry({
      polygonHierarchy: new PolygonHierarchy(
        Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 80,
      extrudedHeight: 60,
      vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_80',
  },
  {
    polygon: new PolygonGeometry({
      polygonHierarchy: new PolygonHierarchy(
        Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 100,
      extrudedHeight: 80,
      vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_100',
  },
  {
    polygon: new PolygonGeometry({
      polygonHierarchy: new PolygonHierarchy(
        Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 120,
      extrudedHeight: 100,
      vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_120',
  },
  {
    polygon: new PolygonGeometry({
      polygonHierarchy: new PolygonHierarchy(
        Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 140,
      extrudedHeight: 120,
      vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_140',
  },
  {
    polygon: new PolygonGeometry({
      polygonHierarchy: new PolygonHierarchy(
        Cartesian3.fromDegreesArray(YIN_TAI_IN_99_COORDINATE)
      ),
      height: 160,
      extrudedHeight: 140,
      vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
    }),
    id: YIN_TAI_IN_99_ID + '_160',
  },
]

const addYinTaiIn99ClassificationPrimitive = function (viewer: Viewer) {
  YIN_TAI_IN_99_CLASSIFICATION_PRIMITIVES.forEach((item) => {
    viewer.jt?.classification.add3DTileClassificationPrimitive({
      id: item.id,
      geometry: item.polygon,
    })
  })
}

const removeYinTaiIn99ClassificationPrimitive = function (viewer: Viewer) {
  YIN_TAI_IN_99_CLASSIFICATION_PRIMITIVES.forEach((item) => {
    viewer.jt?.classification.remove3DTileClassificationPrimitive({
      id: item.id,
    })
  })
}

const loadDefault3DTiles = (viewer: Viewer, store: Store<RootState>): void => {
  const jtPrimitives =
    store.state.jtCesiumVue.cesiumData.jtPrimitive.jtPrimitives
  const len = jtPrimitives.length
  for (let i = 0; i < len; ++i) {
    const jtPri = jtPrimitives[i]
    if (jtPri.name !== '成都建筑群') {
      continue
    }

    const pri = viewer?.jt?.primitiveManager.getPrimitiveByJTPrimitiveIndex(i)
    if (!pri.show) {
      pri.show = true
      store.dispatch(
        `jtCesiumVue/cesiumData/jtPrimitive/${JTPrimitiveActionTypes.SYNC_JTPRIMITIVES}`,
        viewer
      )
    }
    break
  }
}

const view: Group = {
  name: (t: T): string => {
    return t('toolbar.tool.d3DTile', '3DTiles')
  },
  items: [
    {
      name: (t: T): string => {
        return t('toolbar.tool.highLight', '高亮')
      },
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
          // start
          loadDefault3DTiles(option.viewer, option.store)

          option.store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_HIGHLIGHT_3DTILE_FEATURE_ACTIVE}`,
            true
          )
          return option.viewer.jt.highlight.highlight3DTileFeature({
            color: Color.YELLOW.withAlpha(0.5),
          })
        }
      },
      active: (option: ActiveOption): boolean => {
        return option.store.state.jtCesiumVue.toolbar.tool3DTile
          .highlight3DTileFeatureActive
      },
    },

    {
      name: (t: T): string => {
        return t('toolbar.tool.classifyMove', '分类(滑动)')
      },
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
          // start
          loadDefault3DTiles(option.viewer, option.store)
          option.store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_HOVER_CLASSIFICATION_ACTIVE}`,
            true
          )
          addYinTaiIn99ClassificationPrimitive(option.viewer)
          option.viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(104.06722, 30.582, 400),
            orientation: {
              heading: CesiumMath.toRadians(0),
              pitch: CesiumMath.toRadians(-30),
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
      name: (t: T): string => {
        return t('toolbar.tool.classifyClick', '分类(点击)')
      },
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
          loadDefault3DTiles(option.viewer, option.store)
          option.store.dispatch(
            `jtCesiumVue/toolbar/tool3DTile/${Tool3DTileActionTypes.SET_CLICK_CLASSIFICATION_ACTIVE}`,
            true
          )
          addYinTaiIn99ClassificationPrimitive(option.viewer)
          option.viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(104.06722, 30.582, 400),
            orientation: {
              heading: CesiumMath.toRadians(0),
              pitch: CesiumMath.toRadians(-30),
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
