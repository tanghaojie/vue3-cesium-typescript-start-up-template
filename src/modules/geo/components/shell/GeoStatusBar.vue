<template>
  <footer
    class="geo-statusbar"
    :class="{
      'geo-statusbar--collapsed': collapsed,
      'geo-statusbar--compact': compact,
      'geo-statusbar--joined-with-dock': joinedWithDock,
    }"
    :aria-live="collapsed ? 'off' : 'polite'"
  >
    <button
      type="button"
      class="geo-statusbar__toggle"
      :title="collapsed ? expandLabel : collapseLabel"
      :aria-label="collapsed ? expandLabel : collapseLabel"
      :aria-expanded="!collapsed"
      @click="emit('toggle')"
    >
      <AppIcon name="chevron-down" />
    </button>

    <template v-if="!collapsed">
      <span class="geo-statusbar__position"><AppIcon name="map-pin" /></span>
      <span
        ><small>{{ longitudeLabel }}</small
        >{{ coordinate(longitude) }}</span
      >
      <span
        ><small>{{ latitudeLabel }}</small
        >{{ coordinate(latitude) }}</span
      >
      <span class="geo-statusbar__optional"
        ><small>{{ heightLabel }}</small
        >{{ height(surfaceHeight) }}</span
      >
      <span class="geo-statusbar__optional geo-statusbar__camera"
        ><small>{{ cameraLabel }}</small
        >{{ height(cameraHeight) }}</span
      >
      <span class="geo-statusbar__optional"
        ><small>{{ fpsLabel }}</small
        >{{ fps ?? '—' }}</span
      >
      <strong><i :class="{ 'geo-statusbar__pulse': active }" />{{ hint }}</strong>
    </template>
  </footer>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'

defineProps<{
  longitude?: number
  latitude?: number
  surfaceHeight?: number
  cameraHeight?: number
  fps?: number
  hint: string
  active: boolean
  longitudeLabel: string
  latitudeLabel: string
  heightLabel: string
  cameraLabel: string
  fpsLabel: string
  collapsed: boolean
  compact: boolean
  joinedWithDock: boolean
  collapseLabel: string
  expandLabel: string
}>()

const emit = defineEmits<{
  toggle: []
}>()

function coordinate(value: number | undefined): string {
  return value === undefined ? '—' : `${value.toFixed(4)}°`
}

function height(value: number | undefined): string {
  if (value === undefined) {
    return '—'
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)} km`
  }
  return `${value.toFixed(1)} m`
}
</script>

<style scoped>
.geo-statusbar {
  position: absolute;
  z-index: 20;
  right: 22px;
  bottom: 14px;
  left: 22px;
  box-sizing: border-box;
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 3px 10px;
  border: 1px solid var(--geo-line);
  border-radius: 15px;
  color: var(--geo-text-soft);
  background: var(--geo-surface-strong);
  box-shadow: var(--geo-shadow);
  backdrop-filter: blur(18px) saturate(125%);
  transition:
    right 0.18s ease,
    width 0.18s ease,
    min-height 0.18s ease,
    padding 0.18s ease;
}

.geo-statusbar--collapsed {
  right: auto;
  width: 44px;
  min-height: 44px;
  padding: 1px;
}

.geo-statusbar--joined-with-dock {
  border-top: 0;
  border-radius: 0 0 15px 15px;
}

.geo-statusbar--joined-with-dock::before {
  position: absolute;
  top: 0;
  right: 12px;
  left: 12px;
  border-top: 1px solid var(--geo-line);
  content: '';
}

.geo-statusbar__toggle {
  width: 40px;
  height: 40px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 10px;
  color: var(--geo-accent);
  background: transparent;
  cursor: pointer;
}

.geo-statusbar__toggle:hover {
  background: var(--geo-surface-hover);
}

.geo-statusbar__toggle:focus-visible {
  outline: 2px solid var(--geo-accent);
  outline-offset: 2px;
}

.geo-statusbar__toggle :deep(.icon) {
  width: 15px;
  height: 15px;
  transition: transform 0.18s ease;
}

.geo-statusbar--collapsed .geo-statusbar__toggle {
  width: 100%;
  height: 40px;
}

.geo-statusbar--collapsed .geo-statusbar__toggle :deep(.icon) {
  transform: rotate(180deg);
}

.geo-statusbar > span:not(.geo-statusbar__position) {
  min-width: 122px;
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
  padding: 3px 16px;
  border-right: 1px solid var(--geo-line);
  font-family: var(--font-display);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.geo-statusbar small {
  color: var(--geo-text-faint);
  font-family: inherit;
  font-size: 8px;
  font-weight: 700;
}

.geo-statusbar__position {
  width: 34px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: var(--geo-accent);
}

.geo-statusbar strong {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding: 0 10px 0 20px;
  overflow: hidden;
  color: var(--geo-text);
  font-size: 10px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.geo-statusbar strong i {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--geo-accent);
}

.geo-statusbar--compact .geo-statusbar__camera {
  display: none;
}

.geo-statusbar__pulse {
  animation: geo-tool-pulse 1.4s ease-in-out infinite;
}

@keyframes geo-tool-pulse {
  50% {
    box-shadow: 0 0 0 5px color-mix(in srgb, var(--geo-accent), transparent 84%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .geo-statusbar,
  .geo-statusbar__toggle :deep(.icon) {
    transition: none;
  }

  .geo-statusbar__pulse {
    animation: none;
  }
}
</style>
