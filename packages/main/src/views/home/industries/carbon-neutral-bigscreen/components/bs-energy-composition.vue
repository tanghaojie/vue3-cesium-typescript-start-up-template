<template>
  <div class="relative w-full h-full">
    <div ref="sampleChart" class="absolute bottom-0 left-0 right-0 top-0"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted, shallowRef } from 'vue'
import * as echarts from 'echarts'

export default defineComponent({
  name: 'bs-energy-composition',
  setup(props, context) {
    const sampleChart = shallowRef<HTMLElement | null>(null)
    const chart = shallowRef<echarts.ECharts | undefined>(undefined)

    const initChart = (): void => {
      chart.value = echarts.init(sampleChart.value as HTMLElement)
    }

    const buildChart = () => {
      if (!chart.value || chart.value?.isDisposed()) {
        initChart()
      }

      chart.value?.clear()
      const option = {
        title: {
          text: '能源消费结构趋势',
          textStyle: {
            color: '#fff',
            fontSize: 14,
          },
          x: 'center',
          t: 'top',
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985',
            },
          },
        },
        legend: {
          textStyle: {
            color: 'rgb(255, 255, 255)',
          },
          data: ['煤炭', '石油', '天然气', '电力', '热力', '其他'],
          top: '25',
        },
        grid: {
          left: '1%',
          right: '6%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: [
          {
            type: 'category',
            boundaryGap: false,
            data: ['2006年', '2009年', '2012年', '2015年', '2018年', '2021年'],
          },
        ],
        yAxis: [
          {
            type: 'value',
          },
        ],
        series: [
          {
            name: '煤炭',
            type: 'line',
            stack: 'Total',
            areaStyle: {},
            emphasis: {
              focus: 'series',
            },
            data: [1200, 1900, 2400, 1800, 1100, 300],
          },
          {
            name: '石油',
            type: 'line',
            stack: 'Total',
            areaStyle: {},
            emphasis: {
              focus: 'series',
            },
            data: [900, 1100, 1500, 1600, 1800, 2000],
          },
          {
            name: '天然气',
            type: 'line',
            stack: 'Total',
            areaStyle: {},
            emphasis: {
              focus: 'series',
            },
            data: [200, 250, 375, 550, 780, 1200],
          },
          {
            name: '电力',
            type: 'line',
            stack: 'Total',
            areaStyle: {},
            emphasis: {
              focus: 'series',
            },
            data: [800, 1240, 1500, 2000, 2600, 3400],
          },
          {
            name: '热力',
            type: 'line',
            stack: 'Total',
            areaStyle: {},
            emphasis: {
              focus: 'series',
            },
            data: [200, 250, 300, 350, 350, 350],
          },
          {
            name: '其他',
            type: 'line',
            stack: 'Total',
            areaStyle: {},
            emphasis: {
              focus: 'series',
            },
            data: [200, 210, 250, 300, 400, 600],
          },
        ],
      }
      chart.value?.setOption(option)
    }

    onMounted(() => {
      initChart()
      buildChart()
    })

    return {
      sampleChart,
      chart,
      initChart,
      buildChart,
    }
  },
})
</script>
