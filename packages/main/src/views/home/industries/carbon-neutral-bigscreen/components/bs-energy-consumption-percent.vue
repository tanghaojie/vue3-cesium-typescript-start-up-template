<template>
  <div class="relative w-full h-full">
    <div ref="sampleChart" class="absolute bottom-0 left-0 right-0 top-0"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted, shallowRef } from 'vue'
import * as echarts from 'echarts'

export default defineComponent({
  name: 'bs-energy-consumption-percent',
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
          text: '各能源品质在终端能源消费总量中所占比重',
          textStyle: {
            color: '#fff',
            fontSize: 14,
          },
          x: 'center',
          t: 'top',
        },
        grid: {
          top: '20%',
          left: '1%',
          right: '6%',
          bottom: '3%',
          containLabel: true,
        },
        legend: {
          textStyle: {
            color: 'rgb(255, 255, 255)',
          },
          data: ['煤炭', '石油', '天然气', '电力', '热力', '其他'],
          top: 25,
        },
        xAxis: {
          type: 'category',
          data: [
            '2005年',
            '2006年',
            '2007年',
            '2008年',
            '2009年',
            '2010年',
            '2011年',
            '2012年',
            '2013年',
            '2014年',
            '2015年',
            '2016年',
            '2017年',
            '2018年',
            '2019年',
            '2020年',
            '2021年',
          ],
        },
        yAxis: [
          {
            type: 'value',
            axisLine: {
              show: true,
            },
            splitLine: {
              show: false,
            },
          },
        ],
        series: [
          {
            name: '煤炭',
            type: 'line',
            symbolSize: 12,
            data: [40, 41, 42, 41, 38, 36, 36, 35, 34, 33, 32, 31, 30, 28, 26, 25, 22],
          },
          {
            name: '石油',
            type: 'line',
            symbolSize: 12,
            data: [25, 26, 28, 29, 30, 30, 31, 32, 33, 34, 32, 33, 36, 38, 37, 36, 39],
          },
          {
            name: '天然气',
            type: 'line',
            symbolSize: 12,
            data: [5, 6, 6, 7, 6, 7, 6, 7, 8, 9, 11, 13, 15, 16, 19, 24, 25],
          },
          {
            name: '电力',
            type: 'line',
            symbolSize: 12,
            data: [30, 31, 32, 35, 36, 37, 38, 40, 42, 43, 45, 46, 47, 48, 48, 47, 48],
          },
          {
            name: '热力',
            type: 'line',
            symbolSize: 12,
            data: [4, 4, 5, 3, 3, 3, 4, 5, 3, 4, 3, 5, 4, 3, 4, 5, 6],
          },
          {
            name: '其他',
            type: 'line',
            symbolSize: 12,
            data: [2, 3, 4, 4, 5, 6, 6, 5, 6, 5, 6, 7, 8, 8, 9, 8, 9],
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
