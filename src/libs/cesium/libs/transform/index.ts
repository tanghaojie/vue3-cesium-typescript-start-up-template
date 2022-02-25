import {
  Cartesian3,
  Cartographic,
  Matrix4,
  Transforms,
  Math,
  Matrix3,
  Cesium3DTileset,
} from 'cesium'

const transform = function (
  longitude: number,
  latitude: number,
  height: number,
  rotateX: number = 0,
  rotateY: number = 0,
  rotateZ: number = 0,
  scale: number = 0
): Matrix4 {
  // positon
  const position = Cartesian3.fromDegrees(longitude, latitude, height)
  const matrix4 = Transforms.eastNorthUpToFixedFrame(position)

  // rotate
  const matrix3X = Matrix3.fromRotationX(Math.toRadians(rotateX))
  const matrix3Y = Matrix3.fromRotationY(Math.toRadians(rotateY))
  const matrix3Z = Matrix3.fromRotationZ(Math.toRadians(rotateZ))
  Matrix4.multiply(matrix4, matrix3X, matrix4)
  Matrix4.multiply(matrix4, matrix3Y, matrix4)
  Matrix4.multiply(matrix4, matrix3Z, matrix4)

  // scale
  const matrix4Scale = Matrix4.fromUniformScale(scale)
  Matrix4.multiply(matrix4, matrix4Scale, matrix4)

  return matrix4
}

const calculate3DTilesetTransform = function (
  tileset: Cesium3DTileset,
  toLongitude: number | undefined = undefined,
  toLatitude: number | undefined = undefined,
  toHeight: number | undefined = undefined,
  rotateX: number = 0,
  rotateY: number = 0,
  rotateZ: number = 0,
  scale: number = 0
): void {
  tileset.readyPromise.then((self) => {
    console.log('ready', self.root.transform)

    // original coordinate
    const cartographic = Cartographic.fromCartesian(self.boundingSphere.center)
    const longitude = toLongitude || Math.toDegrees(cartographic.longitude)
    const latitude = toLatitude || Math.toDegrees(cartographic.latitude)
    const height = toHeight || cartographic.height

    // if move needs: change longitude/latitude/height to new position
    const matrix = transform(
      longitude,
      latitude,
      height,
      rotateX,
      rotateY,
      rotateZ,
      scale
    )

    self.root.transform = matrix

    // you can change root 'tileset.json' file: transform value, to define transform in 3d tile file.
    console.log('changed', self.root.transform)
  })
}

const change3DTilesetHeight = function (
  tileset: Cesium3DTileset,
  heightOffset: number
): void {
  tileset.readyPromise.then((self) => {
    const cartographic = Cartographic.fromCartesian(self.boundingSphere.center)
    const surface = Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      0.0
    )
    const offset = Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      heightOffset
    )
    const translation = Cartesian3.subtract(offset, surface, new Cartesian3())
    self.modelMatrix = Matrix4.fromTranslation(translation)
  })
}

export { transform, calculate3DTilesetTransform, change3DTilesetHeight }
