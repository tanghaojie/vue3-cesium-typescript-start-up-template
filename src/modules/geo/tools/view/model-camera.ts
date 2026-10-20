import {
  BoundingSphere,
  HeadingPitchRange,
  Math as CesiumMath,
  PerspectiveFrustum,
  type Viewer,
} from 'cesium'

export function modelCameraOffset(viewer: Viewer, sphere: BoundingSphere): HeadingPitchRange {
  const frustum = viewer.camera.frustum
  let minimumFov = CesiumMath.toRadians(35)
  if (frustum instanceof PerspectiveFrustum) {
    const verticalFov = frustum.fovy ?? minimumFov
    const aspectRatio =
      frustum.aspectRatio ??
      viewer.scene.canvas.clientWidth / Math.max(viewer.scene.canvas.clientHeight, 1)
    if (
      Number.isFinite(verticalFov) &&
      verticalFov > 0 &&
      verticalFov < Math.PI &&
      Number.isFinite(aspectRatio) &&
      aspectRatio > 0
    ) {
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspectRatio)
      minimumFov = Math.min(verticalFov, horizontalFov)
    }
  }
  const range = Math.max((sphere.radius / Math.sin(minimumFov / 2)) * 1.18, 10)
  return new HeadingPitchRange(CesiumMath.toRadians(35), CesiumMath.toRadians(-18), range)
}
