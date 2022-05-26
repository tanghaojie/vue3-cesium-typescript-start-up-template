import { Group, ClickHandlerOption, OnMountedOption } from '../../../Types'
import * as Cesium from 'cesium'

const highlighted = {
  feature: undefined,
  originalColor: new Cesium.Color(),
}

const view: Group = {
  name: '测试',
  items: [
    {
      name: 'test',
      icon: 'setting',
      clickHandler: (option: ClickHandlerOption): void => {
        if (!option) {
          return
        }
        const { viewer } = option
        if (!viewer) {
          return
        }

        viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(movement: any) {
          // If a feature was previously highlighted, undo the highlight
          if (highlighted.feature && Cesium.defined(highlighted.feature)) {
            ;(highlighted.feature as any).color = highlighted.originalColor
            highlighted.feature = undefined
          }

          // Pick a new feature
          const pickedFeature = viewer.scene.pick(movement.endPosition)
          if (!Cesium.defined(pickedFeature)) {
            return
          }

          // Highlight the feature
          highlighted.feature = pickedFeature
          Cesium.Color.clone(pickedFeature.color, highlighted.originalColor)
          pickedFeature.color = Cesium.Color.YELLOW
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
      },
    },
  ],
  invisible: true,
}

export default view
