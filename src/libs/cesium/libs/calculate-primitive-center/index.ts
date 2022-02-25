import {
  Cesium3DTileset,
  Model,
  Matrix4,
  Cartesian3,
  Cartographic,
  Math,
} from 'cesium'

type CenterLocation = {
  longitude: number
  latitude: number
  height: number
}

export default function (primitive: Cesium3DTileset | Model): CenterLocation {
  let center: any
  if (primitive instanceof Cesium3DTileset) {
    center = primitive.boundingSphere.center
  }
  if (primitive instanceof Model) {
    center = Matrix4.multiplyByPoint(
      primitive.modelMatrix,
      primitive.boundingSphere.center,
      new Cartesian3()
    )
  }

  const cartographic = Cartographic.fromCartesian(center)
  const longitude = Math.toDegrees(cartographic.longitude)
  const latitude = Math.toDegrees(cartographic.latitude)
  const height = cartographic.height
  return { longitude, latitude, height }
}
