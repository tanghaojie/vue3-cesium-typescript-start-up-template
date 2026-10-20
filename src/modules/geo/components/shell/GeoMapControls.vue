<template>
  <div class="geo-map-controls" :aria-label="label">
    <button type="button" :title="locateLabel" :aria-label="locateLabel" @click="$emit('locate')">
      <AppIcon name="map-pin" />
    </button>
    <button
      type="button"
      :title="sceneMode === '3d' ? mode2dLabel : mode3dLabel"
      :aria-label="sceneMode === '3d' ? mode2dLabel : mode3dLabel"
      @click="$emit('toggle-mode')"
    >
      <b>{{ sceneMode === '3d' ? '2D' : '3D' }}</b>
    </button>
    <button
      class="geo-map-controls__compass"
      type="button"
      :title="northLabel"
      :aria-label="northLabel"
      @click="$emit('orient-north')"
    >
      <span
        class="geo-map-controls__compass-needle"
        :style="{ transform: `rotate(${-heading}deg)` }"
        aria-hidden="true"
      />
    </button>
    <button
      type="button"
      :title="fullscreen ? exitFullscreenLabel : fullscreenLabel"
      :aria-label="fullscreen ? exitFullscreenLabel : fullscreenLabel"
      @click="$emit('toggle-fullscreen')"
    >
      <AppIcon name="monitor" />
    </button>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import type { GeoSceneMode } from '../../core/geo-runtime'

defineProps<{
  label: string
  sceneMode: GeoSceneMode
  fullscreen: boolean
  heading: number
  locateLabel: string
  northLabel: string
  mode2dLabel: string
  mode3dLabel: string
  fullscreenLabel: string
  exitFullscreenLabel: string
}>()

defineEmits<{
  'orient-north': []
  locate: []
  'toggle-mode': []
  'toggle-fullscreen': []
}>()
</script>

<style scoped>
.geo-map-controls {
  position: absolute;
  z-index: 20;
  top: 22px;
  right: 22px;
  display: grid;
  gap: 4px;
  padding: 5px;
  border: 1px solid var(--geo-line);
  border-radius: 16px;
  background: var(--geo-surface-strong);
  box-shadow: var(--geo-shadow);
  backdrop-filter: blur(18px) saturate(125%);
}

.geo-map-controls button,
.geo-map-controls__compass {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 11px;
  color: var(--geo-text-soft);
  background: transparent;
}

.geo-map-controls button:hover,
.geo-map-controls button:focus-visible {
  outline: 0;
  color: var(--geo-accent);
  background: var(--geo-surface-hover);
}

.geo-map-controls button b {
  font-family: var(--font-display);
  font-size: 12px;
}

.geo-map-controls button.geo-map-controls__compass {
  position: relative;
  border-top: 1px solid var(--geo-line);
  border-bottom: 1px solid var(--geo-line);
  border-radius: 0;
}

.geo-map-controls__compass-needle {
  position: relative;
  width: 24px;
  height: 34px;
  transform-origin: center;
  transition: transform 0.18s ease;
}

.geo-map-controls__compass-needle::before,
.geo-map-controls__compass-needle::after {
  position: absolute;
  left: 50%;
  width: 9px;
  height: 17px;
  content: '';
  clip-path: polygon(50% 0, 100% 100%, 50% 76%, 0 100%);
  transform: translateX(-50%);
}

.geo-map-controls__compass-needle::before {
  top: 5px;
  background: #ff6b6b;
}

.geo-map-controls__compass-needle::after {
  bottom: 5px;
  background: #dce8f0;
  transform: translateX(-50%) rotate(180deg);
}
@media (prefers-reduced-motion: reduce) {
  .geo-map-controls__compass-needle {
    transition: none;
  }
}
</style>
