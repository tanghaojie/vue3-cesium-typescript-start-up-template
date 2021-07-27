<template>
  <div>
    <div class="pb-4">
      <div class="text-lg text-white flex flex-row">
        <div class="flex-1">地形管理</div>
        <div class="flex flex-row flex-grow-0 flex-shrink-0"></div>
      </div>

      <div class="py-2">
        <el-select
          v-model="currentTerrainName"
          size="medium"
          class="w-full"
          @change="selectChange"
        >
          <el-option
            v-for="t in terrains"
            :key="t.name"
            :label="t.name"
            :value="t.name"
          >
          </el-option>
        </el-select>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, inject } from 'vue'
import { CesiumRef } from '@/@types/shims-cesium-ref'
import * as Cesium from 'cesium'
import sampleData from '@/resources/sample-data'

import { ElSelect, ElOption } from 'element-plus'

export default defineComponent({
  name: '',
  components: { ElSelect, ElOption },
  setup() {
    const terrains = reactive([
      {
        name: '无地形',
        terrainProviderName: 'EllipsoidTerrainProvider',
        options: {
          tilingScheme: new Cesium.GeographicTilingScheme(),
        },
      },
      {
        name: '全球简略地形',
        terrainProvider: Cesium.createWorldTerrain({
          // required for water effects
          requestWaterMask: true,
          // required for terrain lighting
          requestVertexNormals: true,
        }),
      },
      {
        name: '测试001-地形(12m)',
        terrainProviderName: 'CesiumTerrainProvider',
        options: {
          url: sampleData.terrain,
        },
        afterReady: function (viewer: Cesium.Viewer, success: boolean) {
          if (viewer && success) {
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(107.55, 33.6, 20000),
              orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-30),
                roll: 0.0,
              },
            })
          }
        },
      },
    ])

    const currentTerrainName = ref<string>('无地形')

    const cesiumRef = inject<CesiumRef>('cesiumRef')

    const selectChange = (val: string): void => {
      const terrain = terrains.find((x) => x.name === val)
      if (!terrain) {
        return
      }
      const { viewer } = cesiumRef || {}
      if (!viewer) {
        return
      }
      if (terrain.terrainProvider) {
        viewer.terrainProvider = terrain.terrainProvider
      } else if (terrain.terrainProviderName) {
        const provider: Cesium.TerrainProvider = new (Cesium as any)[
          terrain.terrainProviderName
        ]({
          ...terrain.options,
        })
        if (terrain.afterReady) {
          provider.readyPromise.then((success) => {
            terrain.afterReady(viewer, success)
          })
        }
        viewer.terrainProvider = provider
      }
      currentTerrainName.value = terrain.name || '<Unknown>'
    }

    return {
      terrains,
      currentTerrainName,
      selectChange,
    }
  },
})
</script>
