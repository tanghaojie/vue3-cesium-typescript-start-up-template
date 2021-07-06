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
import { defineComponent } from 'vue'
import * as Cesium from 'cesium'

import { ElSelect, ElOption } from 'element-plus'

export default defineComponent({
  name: '',
  components: { ElSelect, ElOption },
  data() {
    return {
      terrains: [
        {
          name: '无地形',
          terrainProviderName: 'EllipsoidTerrainProvider',
          options: {
            tilingScheme: new Cesium.GeographicTilingScheme(),
          },
        },
        {
          name: '简单全球地形',
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
            url: 'http://117.139.247.104:60002/GisData/terrains/12m_terrain_lod/',
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
      ],
      currentTerrainName: '无地形',
    }
  },
  methods: {
    selectChange(val: string) {
      const terrain = this.terrains.find((x) => x.name === val)
      if (!terrain) {
        return
      }
      const { viewer } = this.$cv
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
      this.currentTerrainName = terrain.name || '<Unknown>'
    },
  },
})
</script>
