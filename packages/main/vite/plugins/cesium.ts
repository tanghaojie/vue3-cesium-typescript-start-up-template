import { viteStaticCopy } from 'vite-plugin-static-copy'

const CESIUM_SOURCE = 'node_modules/cesium/Build/Cesium'
export const CESIUM_STATIC = 'cesiumStatic'

export default function cesium() {
  return viteStaticCopy({
    targets: [
      { src: `${CESIUM_SOURCE}/ThirdParty`, dest: CESIUM_STATIC },
      { src: `${CESIUM_SOURCE}/Workers`, dest: CESIUM_STATIC },
      { src: `${CESIUM_SOURCE}/Assets`, dest: CESIUM_STATIC },
      { src: `${CESIUM_SOURCE}/Widgets`, dest: CESIUM_STATIC },
    ],
  })
}
