import { Viewer, SceneMode } from 'cesium'

export default function (viewer: Viewer, mode: SceneMode, duration?: number) {
  switch (mode) {
    case SceneMode.SCENE2D:
      viewer.scene.morphTo2D(duration)
      break
    case SceneMode.SCENE3D:
      viewer.scene.morphTo3D(duration)
      break
    case SceneMode.COLUMBUS_VIEW:
      viewer.scene.morphToColumbusView(duration)
      break
    default:
      break
  }
}
