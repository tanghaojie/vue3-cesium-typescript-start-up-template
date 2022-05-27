<template>
  <div class="w-full h-full px-3 py-6 text-white grid grid-rows-4 grid-cols-2">
    <div class="text-center h-7 col-span-2 font-bold text-xl">概览</div>
    <div class="text-sm">
      人口总数
      <span class="text-yellow-700 font-bold text-xl">1609.4</span>
      万人
    </div>
    <div class="">
      清洁能源消耗
      <span class="text-yellow-700 font-bold text-xl">6851.3</span>
      万顿标准煤
    </div>
    <div class="">
      地区生产总值
      <span class="text-yellow-700 font-bold text-xl">25371.3</span>
      亿元
    </div>
    <div class="">
      绿化覆盖面积
      <span class="text-yellow-700 font-bold text-xl">93324.5</span>
      公顷
    </div>
    <div class="">
      能源消耗总量
      <span class="text-yellow-700 font-bold text-xl">9713.6</span>
      万顿标准煤
    </div>
    <div class="">
      森林面积
      <span class="text-yellow-700 font-bold text-xl">923812.8</span>
      公顷
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted } from 'vue'

export default defineComponent({
  name: 'bs-overview',
})
</script>
