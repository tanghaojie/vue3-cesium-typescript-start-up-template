<template>
  <div class="geo-task-overview">
    <span class="geo-task-overview__icon"><AppIcon :name="icon" /></span>
    <p>{{ description }}</p>
    <div><i />{{ pendingLabel }}</div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'

defineProps<{
  icon: string
  description: string
  pendingLabel: string
}>()
</script>

<style scoped>
.geo-task-overview {
  display: grid;
  gap: 18px;
}

.geo-task-overview__icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--geo-accent), transparent 68%);
  border-radius: 15px;
  color: var(--geo-accent);
  background: color-mix(in srgb, var(--geo-accent), transparent 90%);
}

.geo-task-overview p {
  margin: 0;
  color: var(--geo-text-soft);
  font-size: 11px;
  line-height: 1.75;
}

.geo-task-overview div {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--geo-line);
  border-radius: 11px;
  color: var(--geo-text-faint);
  background: var(--geo-surface-hover);
  font-size: 9px;
}

.geo-task-overview div i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--geo-text-faint);
}
</style>
