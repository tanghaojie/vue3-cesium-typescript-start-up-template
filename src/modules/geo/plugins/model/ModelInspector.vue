<template>
  <section class="model-inspector">
    <div class="model-inspector__heading">3D Tiles 要素</div>
    <dl v-if="controller.state.selected" class="model-inspector__properties">
      <template v-for="(value, key) in controller.state.selected.properties" :key="key">
        <dt>{{ key }}</dt>
        <dd>{{ formatValue(value) }}</dd>
      </template>
    </dl>
    <p v-else class="model-inspector__empty">请选择一个模型要素。</p>
  </section>
</template>

<script setup lang="ts">
import type { ModelController } from './model.controller'

defineProps<{ controller: ModelController }>()

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
</script>

<style scoped>
.model-inspector {
  display: grid;
  gap: 12px;
  color: var(--geo-text, #eaf6ff);
  font-size: 12px;
}

.model-inspector__heading {
  color: var(--geo-text-soft, #bcd2e3);
  font-weight: 700;
}

.model-inspector__properties {
  display: grid;
  grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr);
  gap: 8px;
  margin: 0;
}

.model-inspector__properties dt {
  color: var(--geo-text-faint, #8da4b8);
}

.model-inspector__properties dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.model-inspector__empty {
  margin: 0;
  color: var(--geo-text-faint, #8da4b8);
}
</style>
