<template>
  <section class="geo-tool-panel">
    <div class="geo-tool-panel__grid">
      <button type="button" @click="controller.startPoint">点</button>
      <button type="button" @click="controller.startPolyline">线</button>
      <button type="button" @click="controller.startPolygon">面</button>
    </div>
    <p class="geo-tool-panel__hint">单击添加节点，双击完成，Esc 取消。</p>
    <p class="geo-tool-panel__status">
      {{ controller.state.status }} · {{ controller.state.pointCount }} 个节点
    </p>
    <div class="geo-tool-panel__actions">
      <button
        type="button"
        :disabled="controller.state.status !== 'drawing'"
        @click="controller.cancel"
      >
        取消当前
      </button>
      <button type="button" @click="controller.clearCurrent">清除当前</button>
      <button type="button" @click="controller.clearAll">清除全部</button>
    </div>
    <p v-if="controller.state.error" class="geo-tool-panel__error">{{ controller.state.error }}</p>
  </section>
</template>

<script setup lang="ts">
import type { DrawingController } from './drawing.controller'

defineProps<{ controller: DrawingController }>()
</script>

<style scoped>
.geo-tool-panel {
  display: grid;
  gap: 12px;
  color: var(--geo-text, #eaf6ff);
  font-size: 12px;
}

.geo-tool-panel__grid,
.geo-tool-panel__actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.geo-tool-panel button {
  min-height: 34px;
  border: 1px solid var(--geo-line-strong, #31556c);
  border-radius: 8px;
  color: inherit;
  background: var(--geo-surface-strong, #0c1b29);
  cursor: pointer;
}

.geo-tool-panel button:hover:not(:disabled),
.geo-tool-panel button:focus-visible {
  border-color: var(--geo-accent, #55d6ff);
}

.geo-tool-panel button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.geo-tool-panel__hint,
.geo-tool-panel__status,
.geo-tool-panel__error {
  margin: 0;
  color: var(--geo-text-faint, #8da4b8);
}

.geo-tool-panel__error {
  color: #ff9aa8;
}
</style>
