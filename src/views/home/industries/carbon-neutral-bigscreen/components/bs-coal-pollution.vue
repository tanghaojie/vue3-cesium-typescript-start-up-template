<template>
  <div class="relative w-full h-full">
    <div ref="sampleChart" class="absolute bottom-0 left-0 right-0 top-0"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted, shallowRef } from 'vue'
import * as echarts from 'echarts'

export default defineComponent({
  name: 'bs-coal-pollution',
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
          text: '煤品燃料与环境污染相关指标分析',
          textStyle: {
            color: '#fff',
            fontSize: 14,
          },
          x: 'center',
          t: 'top',
        },
        grid: {
          top: '30%',
          left: '1%',
          right: '6%',
          bottom: '3%',
          containLabel: true,
        },
        legend: {
          textStyle: {
            color: 'rgb(255, 255, 255)',
          },
          data: ['标准煤', '可吸入颗粒物', '二氧化硫', '二氧化氮'],
          top: 25,
        },
        xAxis: {
          type: 'category',
          data: [
            '2005年',
            '2007年',
            '2009年',
            '2011年',
            '2013年',
            '2015年',
            '2017年',
            '2019年',
            '2021年',
          ],
        },
        yAxis: [
          {
            type: 'value',
            name: '万吨标准煤',
            min: 0,
            max: 3000,
            interval: 500,
          },
          {
            type: 'value',
            name: '微克/立方米',
            min: 0,
            max: 180,
            interval: 30,
          },
        ],
        series: [
          {
            name: '标准煤',
            data: [2300, 2600, 2700, 2800, 2400, 2000, 1600, 1200, 800],
            type: 'bar',
          },
          {
            name: '可吸入颗粒物',
            yAxisIndex: 1,
            data: [100, 120, 160, 170, 150, 100, 80, 60, 50],
            type: 'line',
          },
          {
            name: '二氧化硫',
            yAxisIndex: 1,
            data: [120, 120, 130, 140, 140, 100, 90, 70, 40],
            type: 'line',
          },
          {
            name: '二氧化氮',
            yAxisIndex: 1,
            data: [150, 160, 170, 170, 160, 150, 130, 120, 100],
            type: 'line',
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
