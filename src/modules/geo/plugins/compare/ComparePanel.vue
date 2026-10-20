<template>
  <section class="geo-tool-panel">
    <div class="geo-tool-panel__inputs">
      <label class="geo-tool-panel__field">
        <span>左侧图层</span>
        <select v-model="leftId">
          <option
            v-for="layer in controller.state.layers"
            :key="`left-${layer.id}`"
            :value="layer.id"
          >
            {{ layer.label }}
          </option>
        </select>
      </label>
      <label class="geo-tool-panel__field">
        <span>右侧图层</span>
        <select v-model="rightId">
          <option
            v-for="layer in controller.state.layers"
            :key="`right-${layer.id}`"
            :value="layer.id"
          >
            {{ layer.label }}
          </option>
        </select>
      </label>
    </div>
    <div class="geo-tool-panel__grid">
      <button
        type="button"
        :disabled="controller.state.layers.length < 2 || !leftId || !rightId || leftId === rightId"
        @click="enableComparison"
      >
        开始对比
      </button>
      <button type="button" @click="controller.refreshLayers">刷新图层</button>
    </div>
    <label class="geo-tool-panel__field">
      <span>分屏位置 {{ Math.round(controller.state.splitPosition * 100) }}%</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="controller.state.splitPosition"
        @input="onSplitInput"
      />
    </label>
    <div class="geo-tool-panel__grid">
      <button
        type="button"
        :disabled="!controller.state.hasSession || !controller.state.enabled"
        @click="controller.setEnabled(false)"
      >
        暂停
      </button>
      <button
        type="button"
        :disabled="!controller.state.hasSession || controller.state.enabled"
        @click="controller.setEnabled(true)"
      >
        显示
      </button>
      <button type="button" :disabled="!controller.state.hasSession" @click="controller.disable">
        关闭对比
      </button>
    </div>
    <p v-if="controller.state.error" class="geo-tool-panel__error">{{ controller.state.error }}</p>
  </section>
</template>

<script setup lang="ts">
import type { CompareController } from './compare.controller'
import { ref, watch } from 'vue'

const props = defineProps<{ controller: CompareController }>()
const leftId = ref('')
const rightId = ref('')

watch(
  () => props.controller.state.layers.map((layer) => layer.id),
  function synchronizeSelection(ids) {
    if (!ids.includes(leftId.value)) {
      leftId.value = ids[0] ?? ''
    }
    if (!ids.includes(rightId.value) || rightId.value === leftId.value) {
      rightId.value = ids.find((id) => id !== leftId.value) ?? ''
    }
  },
  { immediate: true },
)
function enableComparison(): void {
  props.controller.enableLayerComparison(leftId.value, rightId.value)
}

function onSplitInput(event: Event): void {
  props.controller.setSplitPosition(Number((event.target as HTMLInputElement).value))
}
</script>

<style scoped>
.geo-tool-panel {
  display: grid;
  gap: 12px;
  color: var(--geo-text, #eaf6ff);
  font-size: 12px;
}

.geo-tool-panel__field {
  display: grid;
  gap: 8px;
}

.geo-tool-panel__inputs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.geo-tool-panel select {
  min-height: 34px;
  border: 1px solid var(--geo-line-strong, #31556c);
  border-radius: 8px;
  padding: 0 8px;
  color: var(--geo-text, #eaf6ff);
  background: var(--geo-surface-strong, #0c1b29);
}

.geo-tool-panel__grid {
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

.geo-tool-panel button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.geo-tool-panel__error {
  margin: 0;
  color: #ff9aa8;
}
</style>
