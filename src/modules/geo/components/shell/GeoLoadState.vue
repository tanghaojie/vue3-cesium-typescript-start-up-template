<template>
  <section class="geo-load-state" role="status">
    <span class="geo-load-state__mark"><PlatformLogo icon-only tone="light" /></span>
    <div>
      <small>CESIUM WORKBENCH</small>
      <h1>{{ title }}</h1>
      <p>{{ detail }}</p>
      <button v-if="actionLabel" type="button" @click="$emit('action')">{{ actionLabel }}</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import PlatformLogo from '@/shared/components/AppLogo.vue'

defineProps<{
  title: string
  detail: string
  actionLabel?: string
}>()

defineEmits<{ action: [] }>()
</script>

<style scoped>
.geo-load-state {
  position: absolute;
  z-index: 30;
  inset: 0;
  display: grid;
  place-content: center;
  grid-template-columns: auto minmax(0, 360px);
  gap: 24px;
  padding: 24px;
  color: var(--geo-text);
  background:
    radial-gradient(circle at 50% 42%, rgba(29, 102, 148, 0.2), transparent 36%),
    rgba(4, 10, 17, 0.78);
  backdrop-filter: blur(8px);
}

.geo-load-state__mark {
  width: 66px;
  height: 66px;
  display: grid;
  place-items: center;
  border: 1px solid var(--geo-line-strong);
  border-radius: 20px;
  background: var(--geo-surface-strong);
  box-shadow: var(--geo-shadow);
}

.geo-load-state__mark :deep(.cyber-logo) {
  --cyber-logo-mark-size: 38px;
  --brand-accent: var(--geo-accent);
}

.geo-load-state small {
  color: var(--geo-accent);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: 0.17em;
}

.geo-load-state h1 {
  margin: 8px 0 0;
  font-family: var(--font-display);
  font-size: 23px;
  letter-spacing: -0.04em;
}

.geo-load-state p {
  margin: 9px 0 0;
  color: var(--geo-text-faint);
  font-size: 11px;
  line-height: 1.65;
}

.geo-load-state button {
  min-height: 40px;
  margin-top: 18px;
  padding: 0 16px;
  border: 1px solid var(--geo-accent);
  border-radius: 10px;
  color: #04121d;
  background: var(--geo-accent);
  font-size: 10px;
  font-weight: 780;
}
</style>
