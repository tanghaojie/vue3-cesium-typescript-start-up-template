<template>
  <section class="geo-tool-panel">
    <div class="geo-tool-panel__grid">
      <button
        type="button"
        :disabled="!controller.state.hasTileset"
        @click="controller.startHighlight"
      >
        悬停高亮
      </button>
      <button
        type="button"
        :disabled="!controller.state.hasTileset"
        @click="controller.startClassification"
      >
        点击分类
      </button>
      <button type="button" @click="controller.cancel">退出交互</button>
    </div>
    <label class="geo-tool-panel__field">
      <span>高度偏移（米）</span>
      <input v-model.number="offset" type="number" step="0.1" @change="applyOffset" />
    </label>
    <div class="geo-tool-panel__grid">
      <button type="button" @click="applyClip">应用裁切</button>
      <button type="button" @click="controller.clearClippingPlane">清除裁切</button>
      <button type="button" @click="controller.setSplitDirection(splitDirection)">分屏方向</button>
    </div>
    <p v-if="controller.state.selected" class="geo-tool-panel__status">
      已选择 {{ Object.keys(controller.state.selected.properties).length }} 个属性
    </p>
    <p class="geo-tool-panel__status">{{ controller.state.status }}</p>
    <button type="button" @click="controller.clear">恢复模型</button>
    <p v-if="controller.state.error" class="geo-tool-panel__error">{{ controller.state.error }}</p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Cartesian3, SplitDirection } from 'cesium'
import type { ModelController } from './model.controller'

const props = defineProps<{ controller: ModelController }>()
const offset = ref(props.controller.state.offsetMeters)
const splitDirection = SplitDirection.RIGHT

function applyOffset(): void {
  props.controller.setHeightOffset(offset.value)
}

function applyClip(): void {
  props.controller.setClippingPlane(new Cartesian3(1, 0, 0), 0)
}
</script>

<style scoped>
.geo-tool-panel {
  display: grid;
  gap: 12px;
  color: var(--geo-text, #eaf6ff);
  font-size: 12px;
}

.geo-tool-panel__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.geo-tool-panel button,
.geo-tool-panel input {
  min-height: 34px;
  border: 1px solid var(--geo-line-strong, #31556c);
  border-radius: 8px;
  color: inherit;
  background: var(--geo-surface-strong, #0c1b29);
}

.geo-tool-panel button {
  cursor: pointer;
}

.geo-tool-panel button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.geo-tool-panel button:hover,
.geo-tool-panel button:focus-visible,
.geo-tool-panel input:focus-visible {
  border-color: var(--geo-accent, #55d6ff);
  outline: none;
}

.geo-tool-panel__field {
  display: grid;
  gap: 6px;
}

.geo-tool-panel__field span,
.geo-tool-panel__status,
.geo-tool-panel__error {
  color: var(--geo-text-faint, #8da4b8);
}

.geo-tool-panel__status,
.geo-tool-panel__error {
  margin: 0;
}

.geo-tool-panel__error {
  color: #ff9aa8;
}
</style>
