import * as Cesium from 'cesium'

export const PRIMITIVE_MANAGER_FLAG_VALUE = '__JT_PRI_F'
export const PRIMITIVE_MANAGER_FLAG_KEY = '_j_p_m_flag'

export type ImagerySource = {
  name: string
  iconImageUrl: string
  providerName: string
  afterReady?: (viewer: Cesium.Viewer, success: boolean) => void
  options?: any
}
