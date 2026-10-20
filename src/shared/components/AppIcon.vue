<template>
  <svg class="icon" aria-hidden="true" focusable="false">
    <use :href="symbolId" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveIconName } from '@/shared/icons/icon-registry'

const props = defineProps<{ name: string }>()
// 所有图标从构建时 SVG sprite 引用，未知名称由注册表统一回退。
const symbolId = computed(() => `#icon-${resolveIconName(props.name)}`)
</script>
