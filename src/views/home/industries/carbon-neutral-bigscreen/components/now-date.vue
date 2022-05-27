<template>
  <div class="now-date">
    <div class="date-week text-sm">{{ dateAndWeek }}</div>
    <div class="time font-bold text-2xl">{{ time }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted, nextTick } from 'vue'

export default defineComponent({
  name: 'now-date',
  setup(props, context) {
    const x = '日一二三四五六'
    const date = reactive({
      year: '',
      month: '',
      day: '',
      hour: '',
      minute: '',
      second: '',
      week: '',
    })

    const time = computed(() => {
      return `${date.hour}：${date.minute}：${date.second}`
    })

    const dateAndWeek = computed(() => {
      return `${date.year} ${date.month} ${date.day} ${date.week}`
    })

    const calc = (): void => {
      const now = new Date()
      date.year = now.getFullYear().toString().padStart(4, '0')
      date.month = (now.getMonth() + 1).toString().padStart(2, '0')
      date.day = now.getDate().toString().padStart(2, '0')
      date.hour = now.getHours().toString().padStart(2, '0')
      date.minute = now.getMinutes().toString().padStart(2, '0')
      date.second = now.getSeconds().toString().padStart(2, '0')
      date.week = '星期' + x[now.getDay()]
    }

    onMounted(() => {
      calc()
      setInterval(() => {
        calc()
      }, 1000)
    })

    return {
      date,
      time,
      dateAndWeek,
    }
  },
})
</script>

<style scoped lang="scss"></style>
