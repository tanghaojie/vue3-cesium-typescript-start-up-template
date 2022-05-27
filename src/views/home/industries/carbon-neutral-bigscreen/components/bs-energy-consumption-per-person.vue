<template>
  <div class="relative w-full h-full">
    <div ref="sampleChart" class="absolute bottom-0 left-0 right-0 top-0"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted, shallowRef } from 'vue'
import * as echarts from 'echarts'

export default defineComponent({
  name: 'bs-energy-consumption-per-person',
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
          text: '常住人口人均能源消费量分析',
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
          top: 25,
        },
        xAxis: {
          type: 'category',
          data: ['能源总量', '煤炭', '原油', '电力'],
        },
        yAxis: [
          {
            type: 'value',
            name: '',
            min: 0,
            max: 6000,
            interval: 1000,
          },
        ],
        series: [
          {
            name: '全国人均',
            type: 'bar',
            data: [3235, 2782, 424, 4676],
            label: {
              show: true,
              position: 'top',
            },
          },
          {
            name: 'XX市',
            type: 'bar',
            data: [3279, 226, 378, 4915],
            label: {
              show: true,
              position: 'top',
            },
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
