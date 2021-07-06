<template>
  <div
    class="
      px-5
      py-2
      bg-gray-800 bg-opacity-70
      pointer-events-auto
      absolute
      bottom-0
      left-0
      right-0
    "
  >
    <div class="flex flex-row px-3">
      <div class="flex-auto"></div>
      <div class="flex-none">
        <div @click="close">
          <i class="el-icon-close text-white cursor-pointer" />
        </div>
      </div>
    </div>
    <div ref="sampleChart" class="" style="height: 300px"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { ElIcon } from 'element-plus'

import * as echarts from 'echarts/core'
import { GridComponent } from 'echarts/components'
import { LineChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
echarts.use([GridComponent, LineChart, CanvasRenderer])

import store from '@/store'

import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'

export default defineComponent({
  name: '',
  components: { ElIcon },
  data() {
    let chart: echarts.ECharts | undefined
    return {
      chart,
    }
  },
  computed: {
    terrainSampling() {
      return store.state.jtCesiumVue.toolbar.terrainSampling
    },
  },
  watch: {
    terrainSampling() {
      this.buildChart()
    },
  },
  mounted() {
    this.initChart()
    this.buildChart()
  },
  methods: {
    buildChart() {
      const { chart, terrainSampling } = this
      if (!chart) {
        return
      }
      if (!terrainSampling.show) {
        return
      }
      const datas = terrainSampling.datas
      if (!datas || !datas.length) {
        return
      }
      const len = datas.length
      const xAxisData = []
      const seriesData = []
      for (let i = 0; i < len; i++) {
        const { index, height } = datas[i]
        xAxisData.push(index)
        seriesData.push(height)
      }

      chart.clear()
      const option = {
        xAxis: [
          {
            type: 'category',
            boundaryGap: false,
            data: xAxisData,
            show: false,
          },
        ],
        yAxis: {
          type: 'value',
          boundaryGap: false,
          scale: true,
          axisLabel: {
            formatter: '{value} m',
          },
          axisPointer: {
            type: 'line',
            show: true,
            label: {
              show: true,
              formatter: '{value} m',
            },
          },
        },
        grid: {
          left: '0',
          right: '0',
          bottom: '0',
          top: '10',
          containLabel: true,
        },
        series: [
          {
            data: seriesData,
            type: 'line',
            symbol: 'none',
            smooth: 0.2,
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgb(255, 0, 0)',
                },
                {
                  offset: 1,
                  color: 'rgb(0, 255, 0)',
                },
              ]),
            },
          },
        ],
      }
      chart.setOption(option)
    },

    initChart() {
      this.chart = echarts.init(this.$refs.sampleChart as HTMLElement)
    },

    close() {
      store.dispatch(
        `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_TERRAIN_SAMPLING}`,
        {
          show: false,
          datas: [],
        }
      )
    },
  },
})
</script>
