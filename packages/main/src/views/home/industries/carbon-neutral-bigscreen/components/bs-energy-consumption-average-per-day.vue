<template>
  <div class="relative w-full h-full">
    <div ref="sampleChart" class="absolute bottom-0 left-0 right-0 top-0"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted, shallowRef } from 'vue'
import * as echarts from 'echarts'

export default defineComponent({
  name: 'bs-energy-consumption-average-per-day',
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
          text: '主要能源日均消费量',
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
          data: ['原油', '汽油', '煤油', '柴油', '燃料油', '电力', '天然气'],
          top: 25,
        },
        xAxis: {
          type: 'category',
          data: [
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
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: '原油',
            type: 'line',
            data: [
              30000, 29020, 27000, 24000, 28000, 26000, 23000, 22000, 21000, 23000, 25000, 26000,
              25000, 24000,
            ],
          },
          {
            name: '汽油',
            type: 'line',
            data: [
              5000, 6000, 6000, 7000, 6000, 7000, 6000, 7000, 8000, 9000, 11000, 13000, 15000,
              16000,
            ],
          },
          {
            name: '煤油',
            type: 'line',
            data: [
              10000, 10500, 12000, 11500, 12000, 12500, 12800, 13500, 13500, 13600, 13900, 15000,
              14000, 14200,
            ],
          },
          {
            name: '柴油',
            type: 'line',
            data: [
              4000, 4000, 5000, 3000, 3000, 3000, 4000, 5000, 3000, 4000, 3000, 5000, 4000, 3000,
            ],
          },
          {
            name: '燃料油',
            type: 'line',
            data: [
              2000, 3000, 4000, 4000, 5000, 6000, 6000, 5000, 6000, 5000, 6000, 7000, 8000, 8000,
            ],
          },
          {
            name: '电力',
            type: 'line',
            data: [
              22000, 23000, 24000, 25000, 26000, 27000, 28000, 29000, 30000, 31000, 32000, 33000,
              34000, 35000,
            ],
          },
          {
            name: '天然气',
            type: 'line',
            data: [
              10000, 12000, 12500, 13000, 14000, 13500, 14500, 14000, 15000, 15500, 16000, 17000,
              18000, 20000,
            ],
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
