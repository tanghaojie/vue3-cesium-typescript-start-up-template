<template>
  <jtDraggableResizable
    v-model="terrianSampleChartShow"
    :resizable="true"
    :w="900"
    :h="360"
    :initialPosition="'bm'"
    class="pointer-events-auto"
    @resizing="terrainSampleChartResizing"
  >
    <template v-slot:title>
      {{ t('jtTerrainSampleChart.title', '地形采样') }}
    </template>
    <div
      class="w-full h-full flex justify-center items-center px-5 py-2 bg-gray-800 bg-opacity-70"
    >
      <div class="relative w-full h-full">
        <div
          ref="sampleChart"
          class="absolute bottom-0 left-0 right-0 top-0"
        ></div>
      </div>
    </div>
  </jtDraggableResizable>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  shallowRef,
  computed,
  watch,
  nextTick,
  inject,
} from 'vue'

import { ElIcon } from 'element-plus'

import * as echarts from 'echarts/core'
import { GridComponent } from 'echarts/components'
import { LineChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import jtDraggableResizable from '@/components/jt-draggable-resizable/index.vue'
import { ToolbarActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/action-types'
import debounce from '@/libs/utils/debounce'
import { useI18n } from 'vue-i18n'

echarts.use([GridComponent, LineChart, CanvasRenderer])

import { useStore } from '@/store'

export default defineComponent({
  name: 'jt-terrain-sample-chart',
  components: { ElIcon, jtDraggableResizable },
  setup() {
    const store = useStore()
    const sampleChart = shallowRef<HTMLElement | null>(null)
    const chart = shallowRef<echarts.ECharts | undefined>(undefined)
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const initChart = (): void => {
      if (!terrainSampling.value.show) {
        return
      }
      chart.value = echarts.init(sampleChart.value as HTMLElement)
    }

    const terrianSampleChartShow = computed({
      get() {
        return terrainSampling.value.show
      },
      set(val: boolean): void {
        cesiumRef?.viewer && cesiumRef?.viewer?.jt?.terrainSampling.removeAll()
        store.dispatch(
          `jtCesiumVue/toolbar/${ToolbarActionTypes.SET_TERRAIN_SAMPLING}`,
          {
            show: val,
            datas: [],
          }
        )
      },
    })

    const terrainSampling = computed(() => {
      return store.state.jtCesiumVue.toolbar.terrainSampling
    })

    const chartResize = debounce(() => {
      chart.value?.resize()
    }, 200)

    const terrainSampleChartResizing = () => {
      chartResize()
    }

    const buildChart = () => {
      if (!terrainSampling.value.show) {
        return
      }
      if (!chart.value || chart.value?.isDisposed()) {
        initChart()
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

      chart.value?.clear()
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
            color: '#fff',
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
      chart.value?.setOption(option)
    }

    const { t } = useI18n()

    onMounted(() => {
      nextTick(() => {
        initChart()
        buildChart()
      })
    })

    watch(terrainSampling, () => {
      nextTick(() => {
        buildChart()
      })
    })

    return {
      sampleChart,
      chart,
      buildChart,
      terrainSampling,
      initChart,
      terrianSampleChartShow,
      terrainSampleChartResizing,
      t,
    }
  },
})
</script>
