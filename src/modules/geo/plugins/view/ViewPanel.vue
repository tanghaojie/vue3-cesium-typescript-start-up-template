<template>
  <div class="geo-view-panel">
    <section class="view-panel__section">
      <div class="view-panel__heading">
        <span>快速定位</span>
        <button type="button" title="刷新相机信息" @click="controller.refresh">↻</button>
      </div>
      <div class="view-panel__locations">
        <button
          v-for="location in controller.locations"
          :key="location.id"
          type="button"
          :class="{ 'is-active': controller.state.activeLocation === location.id }"
          @click="controller.flyTo(location.id)"
        >
          {{ location.label }}
        </button>
      </div>
    </section>

    <section class="view-panel__section">
      <div class="view-panel__heading"><span>场景模式</span></div>
      <div class="view-panel__modes">
        <button
          v-for="mode in modes"
          :key="mode.value"
          type="button"
          :class="{ 'is-active': controller.state.mode === mode.value }"
          @click="controller.setMode(mode.value)"
        >
          {{ mode.label }}
        </button>
      </div>
    </section>

    <section class="view-panel__section view-panel__camera" aria-live="polite">
      <div class="view-panel__heading"><span>相机状态</span></div>
      <dl>
        <div>
          <dt>经度</dt>
          <dd>{{ controller.state.camera.longitude.toFixed(4) }}°</dd>
        </div>
        <div>
          <dt>纬度</dt>
          <dd>{{ controller.state.camera.latitude.toFixed(4) }}°</dd>
        </div>
        <div>
          <dt>高度</dt>
          <dd>{{ formatDistance(controller.state.camera.height) }}</dd>
        </div>
        <div>
          <dt>视角</dt>
          <dd>
            {{ controller.state.camera.heading.toFixed(1) }}° /
            {{ controller.state.camera.pitch.toFixed(1) }}°
          </dd>
        </div>
      </dl>
    </section>

    <section class="view-panel__section">
      <div class="view-panel__heading"><span>视距限制</span></div>
      <label class="view-panel__field">
        <span>最小距离</span>
        <input
          type="number"
          min="0"
          step="100"
          :value="Math.round(controller.state.limits.minimumZoomDistance)"
          @change="setMinimum($event)"
        />
      </label>
      <label class="view-panel__field">
        <span>最大距离</span>
        <input
          type="number"
          min="1"
          step="1000"
          :value="Math.round(controller.state.limits.maximumZoomDistance)"
          @change="setMaximum($event)"
        />
      </label>
    </section>

    <p v-if="controller.state.error" class="view-panel__error">{{ controller.state.error }}</p>
  </div>
</template>

<script setup lang="ts">
import type { GeoSceneMode } from '../../tools/view/camera-view'
import type { GeoViewController } from './view.controller'

const props = defineProps<{ controller: GeoViewController }>()

const modes: readonly { value: GeoSceneMode; label: string }[] = [
  { value: '3D', label: '3D' },
  { value: '2D', label: '2D' },
  { value: 'COLUMBUS_VIEW', label: '哥伦布' },
]

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${meters.toFixed(0)} m`
}

function numericValue(event: Event): number | undefined {
  const value = Number((event.target as HTMLInputElement).value)
  return Number.isFinite(value) ? value : undefined
}

function setMinimum(event: Event): void {
  const value = numericValue(event)
  if (value !== undefined) {
    props.controller.setLimits({ minimumZoomDistance: value })
  }
}

function setMaximum(event: Event): void {
  const value = numericValue(event)
  if (value !== undefined) {
    props.controller.setLimits({ maximumZoomDistance: value })
  }
}
</script>

<style scoped>
.geo-view-panel {
  display: grid;
  gap: 18px;
}
.view-panel__section {
  display: grid;
  gap: 10px;
}
.view-panel__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--geo-text-soft, #b6c5d2);
  font-size: 11px;
  font-weight: 700;
}
.view-panel__heading button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}
.view-panel__heading button:hover {
  background: var(--geo-surface-hover, #1b2a38);
}
.view-panel__locations,
.view-panel__modes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.view-panel__locations button,
.view-panel__modes button {
  min-height: 36px;
  border: 1px solid var(--geo-line, #263c4e);
  border-radius: 9px;
  color: var(--geo-text, #eff8ff);
  background: var(--geo-surface-strong, #0e1c2a);
  cursor: pointer;
  font-size: 10px;
}
.view-panel__locations button.is-active,
.view-panel__modes button.is-active {
  border-color: var(--geo-accent, #45c8ff);
  color: #06111d;
  background: var(--geo-accent, #45c8ff);
}
.view-panel__camera dl {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 10px;
  border: 1px solid var(--geo-line, #263c4e);
  border-radius: 10px;
  background: color-mix(in srgb, var(--geo-surface-strong, #0e1c2a), transparent 12%);
}
.view-panel__camera dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 10px;
}
.view-panel__camera dt {
  color: var(--geo-text-faint, #7890a2);
}
.view-panel__camera dd {
  margin: 0;
  color: var(--geo-text, #eff8ff);
  font-variant-numeric: tabular-nums;
}
.view-panel__field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--geo-text-soft, #b6c5d2);
  font-size: 10px;
}
.view-panel__field input {
  width: 120px;
  min-height: 32px;
  padding: 0 8px;
  border: 1px solid var(--geo-line, #263c4e);
  border-radius: 8px;
  color: var(--geo-text, #eff8ff);
  background: #091522;
  font-size: 10px;
}
.view-panel__error {
  margin: 0;
  color: #ff9ca7;
  font-size: 10px;
  line-height: 1.5;
}
</style>
