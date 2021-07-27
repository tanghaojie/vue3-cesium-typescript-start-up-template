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
import { defineComponent, onMounted, reactive, ref, computed, watch } from 'vue'

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
  setup() {
    const sampleChart = ref<HTMLElement | null>(null)
    const chart = ref<echarts.ECharts | undefined>(undefined)

    const initChart = (): void => {
      chart.value = echarts.init(sampleChart.value as HTMLElement)
    }

    const terrainSampling = computed(() => {
      return store.state.jtCesiumVue.toolbar.terrainSampling
    })

    const buildChart = () => {
      if (!chart.value || !terrainSampling.value.show) {
        return
      }
      const datas = terrainSampling.value.datas
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

      chart.value.clear()
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
      chart.value.setOption(option)
    }

    const close = (): void => {
      store.dispatch(
        `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_TERRAIN_SAMPLING}`,
        {
          show: false,
          datas: [],
        }
      )
    }

    onMounted(() => {
      initChart()
      buildChart()
    })

    watch(terrainSampling, () => {
      buildChart()
    })

    return {
      sampleChart,
      chart,
      buildChart,
      terrainSampling,
      initChart,
      close,
    }
  },
})
</script>
