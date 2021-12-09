import * as Cesium from 'cesium'
import uuid from '@/libs/utils/uuid'

export type Primitive = {
  name: string
  uuid: string
  show: boolean
  cesiumPrimitiveIndex: number
}

class PrimitiveManager {
  private viewer: Cesium.Viewer

  public primitives: Primitive[] = []
  public static PRIMITIVE_MANAGER_FLAG_VALUE = '__JT_PRI_F'
  public static PRIMITIVE_MANAGER_FLAG_KEY = '_j_p_m_flag'

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  public syncPrimitives(inManagedPrimitiveOnly: boolean = true): Primitive[] {
    this.primitives.splice(0, this.primitives.length)
    const pris = this.viewer.scene.primitives
    const len = pris.length
    for (let i = len - 1; i >= 0; --i) {
      const model = pris.get(i)
      const flag = model[PrimitiveManager.PRIMITIVE_MANAGER_FLAG_KEY]
      if (
        inManagedPrimitiveOnly &&
        flag !== PrimitiveManager.PRIMITIVE_MANAGER_FLAG_VALUE
      ) {
        continue
      }
      this.primitives.push({
        name: model.name || '<NoneName>',
        uuid: model.uuid || '<NoneUuid>',
        show: model.show,
        cesiumPrimitiveIndex: i,
      })
    }
    return this.primitives
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public add3DTileset(option: any): any {
    const c3Dtileset = new Cesium.Cesium3DTileset({
      ...option,
    })

    const c3DtilesetObj = c3Dtileset as any
    c3DtilesetObj[PrimitiveManager.PRIMITIVE_MANAGER_FLAG_KEY] =
      PrimitiveManager.PRIMITIVE_MANAGER_FLAG_VALUE
    c3DtilesetObj.name = option.name
    c3DtilesetObj.uuid = uuid()
    c3Dtileset.show = option.show

    this.viewer.scene.primitives.add(c3Dtileset)

    this.syncPrimitives()
    return c3DtilesetObj
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public addGltf(option: any): any {
    const gltf = Cesium.Model.fromGltf({
      ...option,
    })
    const gltfObj = gltf as any
    gltfObj[PrimitiveManager.PRIMITIVE_MANAGER_FLAG_KEY] =
      PrimitiveManager.PRIMITIVE_MANAGER_FLAG_VALUE
    gltfObj.name = option.name
    gltfObj.uuid = uuid()
    gltf.show = option.show
    this.viewer.scene.primitives.add(gltf)

    this.syncPrimitives()
    return gltfObj
  }

  public getPrimitive(index: number): any {
    this.syncPrimitives()
    return this.viewer.scene.primitives.get(
      this.primitives[index].cesiumPrimitiveIndex
    )
  }

  public removePrimitive(index: number): void {
    this.viewer.scene.primitives.remove(this.getPrimitive(index))
    this.syncPrimitives()
  }

  public removeAll(): void {
    this.viewer.scene.primitives.removeAll()
    this.syncPrimitives()
  }
}

export default PrimitiveManager
