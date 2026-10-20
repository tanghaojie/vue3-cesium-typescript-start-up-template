<template>
  <aside class="geo-panel" :aria-label="title" :style="{ '--geo-panel-width': `${panelWidth}px` }">
    <header class="geo-panel__header">
      <div>
        <span>{{ eyebrow }}</span>
        <h2>{{ title }}</h2>
      </div>
      <button type="button" :aria-label="closeLabel" :title="closeLabel" @click="$emit('close')">
        <AppIcon name="close" />
      </button>
    </header>
    <div class="geo-panel__body"><slot /></div>
    <div
      class="geo-panel__resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label="拖动调整面板宽度"
      aria-valuemin="360"
      :aria-valuemax="maximumPanelWidth"
      :aria-valuenow="panelWidth"
      tabindex="0"
      @pointerdown="startResize"
      @keydown="resizeWithKeyboard"
    />
  </aside>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'

defineProps<{
  title: string
  eyebrow: string
  closeLabel: string
}>()

defineEmits<{ close: [] }>()

const MINIMUM_PANEL_WIDTH = 360
const PREFERRED_PANEL_WIDTH = 420
const MAXIMUM_PANEL_WIDTH = 640

const panelWidth = ref(PREFERRED_PANEL_WIDTH)
const maximumPanelWidth = computed(function panelMaximumWidth() {
  if (typeof window === 'undefined') {
    return MAXIMUM_PANEL_WIDTH
  }
  return Math.max(MINIMUM_PANEL_WIDTH, Math.min(MAXIMUM_PANEL_WIDTH, window.innerWidth - 260))
})
let resizeStartX = 0
let resizeStartWidth = PREFERRED_PANEL_WIDTH

function clampPanelWidth(value: number): number {
  return Math.min(Math.max(value, MINIMUM_PANEL_WIDTH), maximumPanelWidth.value)
}

function updateResize(event: PointerEvent): void {
  panelWidth.value = clampPanelWidth(resizeStartWidth + event.clientX - resizeStartX)
}

function stopResize(): void {
  document.body.style.removeProperty('user-select')
  window.removeEventListener('pointermove', updateResize)
  window.removeEventListener('pointerup', stopResize)
}

function startResize(event: PointerEvent): void {
  if (event.button !== 0) {
    return
  }
  event.preventDefault()
  resizeStartX = event.clientX
  resizeStartWidth = panelWidth.value
  document.body.style.setProperty('user-select', 'none')
  window.addEventListener('pointermove', updateResize)
  window.addEventListener('pointerup', stopResize, { once: true })
}

function resizeWithKeyboard(event: KeyboardEvent): void {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
    return
  }
  event.preventDefault()
  panelWidth.value = clampPanelWidth(panelWidth.value + (event.key === 'ArrowRight' ? 20 : -20))
}

onBeforeUnmount(stopResize)
</script>

<style scoped>
.geo-panel {
  position: absolute;
  z-index: 19;
  top: 22px;
  bottom: var(--geo-side-bottom, 86px);
  left: 90px;
  width: var(--geo-panel-width);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--geo-line);
  border-radius: 18px;
  color: var(--geo-text);
  background: var(--geo-surface);
  box-shadow: var(--geo-shadow);
  backdrop-filter: blur(22px) saturate(120%);
  animation: geo-panel-enter 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.geo-panel__resize-handle {
  position: absolute;
  z-index: 1;
  top: 14px;
  right: -6px;
  bottom: 14px;
  width: 12px;
  border-radius: 999px;
  cursor: col-resize;
}

.geo-panel__resize-handle::after {
  position: absolute;
  top: 50%;
  left: 4px;
  width: 3px;
  height: 42px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--geo-accent), transparent 55%);
  content: '';
  opacity: 0;
  transform: translateY(-50%);
  transition: opacity 0.16s ease;
}

.geo-panel:hover .geo-panel__resize-handle::after,
.geo-panel__resize-handle:focus-visible::after {
  opacity: 1;
}

.geo-panel__resize-handle:focus-visible {
  outline: 2px solid var(--geo-accent);
  outline-offset: 2px;
}

.geo-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 15px;
  border-bottom: 1px solid var(--geo-line);
}

.geo-panel__header span {
  color: var(--geo-accent);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.geo-panel__header h2 {
  margin: 4px 0 0;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 740;
  letter-spacing: -0.03em;
}

.geo-panel__header button {
  width: 38px;
  height: 38px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 11px;
  color: var(--geo-text-faint);
  background: transparent;
}

.geo-panel__header button:hover,
.geo-panel__header button:focus-visible {
  outline: 0;
  color: var(--geo-text);
  background: var(--geo-surface-hover);
}

.geo-panel__body {
  min-height: 0;
  overflow: auto;
  padding: 18px;
  scrollbar-color: color-mix(in srgb, var(--geo-accent), transparent 38%) transparent;
  scrollbar-width: thin;
}

.geo-panel__body::-webkit-scrollbar {
  width: 6px;
}

.geo-panel__body::-webkit-scrollbar-track {
  background: transparent;
}

.geo-panel__body::-webkit-scrollbar-thumb {
  border: 1px solid transparent;
  border-radius: 999px;
  background: color-mix(in srgb, var(--geo-accent), transparent 45%);
  background-clip: padding-box;
}

@keyframes geo-panel-enter {
  from {
    opacity: 0;
    transform: translateX(-10px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .geo-panel {
    animation: none;
  }
}
</style>
