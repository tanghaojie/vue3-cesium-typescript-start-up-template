<template>
  <section
    class="geo-time-dock"
    :class="{
      'geo-time-dock--collapsed': collapsed,
      'geo-time-dock--joined-with-status': joinedWithStatus,
    }"
    :aria-label="t('geo.time.timeline')"
  >
    <div class="geo-time-dock__controls">
      <button
        type="button"
        class="geo-time-dock__play"
        :title="controller.state.playing ? t('geo.time.pause') : t('geo.time.play')"
        :aria-label="controller.state.playing ? t('geo.time.pause') : t('geo.time.play')"
        @click="controller.togglePlayback"
      >
        {{ controller.state.playing ? 'Ⅱ' : '▶' }}
      </button>
      <button
        v-if="!collapsed"
        type="button"
        class="geo-time-dock__now"
        :title="t('geo.time.now')"
        @click="controller.resetToNow"
      >
        {{ t('geo.time.now') }}
      </button>
      <strong :title="browserTimeZone">{{
        formatCurrentTime(controller.state.currentTime)
      }}</strong>
      <select
        :value="controller.state.multiplier"
        :aria-label="t('geo.time.speed')"
        @change="setMultiplier"
      >
        <option v-for="speed in speeds" :key="speed" :value="speed">{{ speed }}×</option>
      </select>
    </div>

    <div v-if="!collapsed" class="geo-time-dock__track">
      <div class="geo-time-dock__boundaries">
        <span>{{ formatBoundary(controller.state.viewportStart) }}</span>
        <span>{{ formatBoundary(controller.state.viewportStop) }}</span>
      </div>
      <div
        ref="timelineTrack"
        class="geo-time-dock__ruler"
        role="group"
        tabindex="0"
        :aria-label="t('geo.time.scrub')"
        @keydown="onRulerKeydown"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @wheel.prevent="onWheel"
      >
        <span
          v-for="tick in minorTicks"
          :key="`minor:${tick.time}`"
          class="geo-time-dock__tick geo-time-dock__tick--minor"
          :style="{ left: `${tick.offset}%` }"
        />
        <span
          v-for="tick in majorTicks"
          :key="`major:${tick.time}`"
          class="geo-time-dock__tick geo-time-dock__tick--major"
          :style="{ left: `${tick.offset}%` }"
          :title="formatBoundary(tick.time)"
        >
          <i />
          <em>{{ tick.label }}</em>
        </span>
        <span
          v-if="currentTimeVisible"
          class="geo-time-dock__cursor"
          :style="{ left: `${currentTimeOffset}%` }"
          aria-hidden="true"
        />
      </div>
    </div>

    <div v-if="!collapsed" class="geo-time-dock__lighting">
      <label>
        <input type="checkbox" :checked="solarLighting.state.lighting" @change="setLighting" />
        <i aria-hidden="true" />
        <span>{{ t('geo.time.sunlight') }}</span>
      </label>
      <label :title="t('geo.time.shadowCost')">
        <input type="checkbox" :checked="solarLighting.state.shadows" @change="setShadows" />
        <i aria-hidden="true" />
        <span>{{ t('geo.time.shadows') }}</span>
      </label>
    </div>

    <button
      type="button"
      class="geo-time-dock__toggle"
      :title="collapsed ? expandLabel : collapseLabel"
      :aria-label="collapsed ? expandLabel : collapseLabel"
      :aria-expanded="!collapsed"
      @click="emit('update:collapsed', !collapsed)"
    >
      <AppIcon name="chevron-down" />
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useLocalization } from '@/shared/localization/localization'
import type { GeoSolarLightingCapability } from '../scene/scene.capabilities'
import type { GeoTimeController } from './time.controller'

interface TickDefinition {
  readonly step: number
  readonly unit: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'
}

interface TimelineTick {
  readonly label: string
  readonly offset: number
  readonly time: number
}

interface PointerSession {
  readonly pointerId: number
  lastClientX: number
  moved: boolean
  seeking: boolean
}

const props = defineProps<{
  controller: GeoTimeController
  solarLighting: GeoSolarLightingCapability
  collapsed: boolean
  joinedWithStatus: boolean
  collapseLabel: string
  expandLabel: string
}>()

const emit = defineEmits<{
  'update:collapsed': [collapsed: boolean]
}>()

const { t } = useLocalization()
const timelineTrack = ref<HTMLElement>()
const speeds = [1, 10, 60, 600, 3600] as const
const browserTimeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone
const currentFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'shortOffset',
})
const boundaryFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'shortOffset',
})
let pointerSession: PointerSession | undefined

const viewportDuration = computed(function currentViewportDuration() {
  return props.controller.state.viewportStop - props.controller.state.viewportStart
})

const tickDefinitions = computed(function selectTickDefinitions() {
  const duration = viewportDuration.value
  if (duration <= 5 * 60 * 1000) {
    return { major: { unit: 'second', step: 30 }, minor: { unit: 'second', step: 5 } } as const
  }
  if (duration <= 60 * 60 * 1000) {
    return { major: { unit: 'minute', step: 5 }, minor: { unit: 'minute', step: 1 } } as const
  }
  if (duration <= 6 * 60 * 60 * 1000) {
    return { major: { unit: 'minute', step: 30 }, minor: { unit: 'minute', step: 5 } } as const
  }
  if (duration <= 24 * 60 * 60 * 1000) {
    return { major: { unit: 'hour', step: 3 }, minor: { unit: 'minute', step: 30 } } as const
  }
  if (duration <= 7 * 24 * 60 * 60 * 1000) {
    return { major: { unit: 'day', step: 1 }, minor: { unit: 'hour', step: 6 } } as const
  }
  if (duration <= 31 * 24 * 60 * 60 * 1000) {
    return { major: { unit: 'day', step: 7 }, minor: { unit: 'day', step: 1 } } as const
  }
  if (duration <= 365.25 * 24 * 60 * 60 * 1000) {
    return { major: { unit: 'month', step: 1 }, minor: { unit: 'day', step: 7 } } as const
  }
  if (duration <= 5 * 365.25 * 24 * 60 * 60 * 1000) {
    return { major: { unit: 'month', step: 3 }, minor: { unit: 'month', step: 1 } } as const
  }
  return { major: { unit: 'year', step: 1 }, minor: { unit: 'month', step: 3 } } as const
})

const majorTicks = computed(function visibleMajorTicks() {
  return buildTicks(tickDefinitions.value.major, true)
})

const minorTicks = computed(function visibleMinorTicks() {
  return buildTicks(tickDefinitions.value.minor, false)
})

const currentTimeOffset = computed(function currentTimelineOffset() {
  return (
    ((props.controller.state.currentTime - props.controller.state.viewportStart) /
      viewportDuration.value) *
    100
  )
})

const currentTimeVisible = computed(function isCurrentTimeVisible() {
  return currentTimeOffset.value >= 0 && currentTimeOffset.value <= 100
})

function alignToTick(epochMilliseconds: number, definition: TickDefinition): Date {
  const date = new Date(epochMilliseconds)
  date.setTime(epochMilliseconds - date.getMilliseconds())
  switch (definition.unit) {
    case 'second':
      date.setTime(date.getTime() - (date.getSeconds() % definition.step) * 1000)
      break
    case 'minute':
      date.setTime(
        date.getTime() - date.getSeconds() * 1000 - (date.getMinutes() % definition.step) * 60_000,
      )
      break
    case 'hour':
      date.setHours(Math.floor(date.getHours() / definition.step) * definition.step, 0, 0, 0)
      break
    case 'day':
      date.setHours(0, 0, 0, 0)
      break
    case 'month':
      date.setHours(0, 0, 0, 0)
      date.setDate(1)
      date.setMonth(Math.floor(date.getMonth() / definition.step) * definition.step)
      break
    case 'year':
      date.setHours(0, 0, 0, 0)
      date.setDate(1)
      date.setMonth(0)
      date.setFullYear(Math.floor(date.getFullYear() / definition.step) * definition.step)
      break
  }
  return date
}

function advanceTick(date: Date, definition: TickDefinition): void {
  switch (definition.unit) {
    case 'second':
      // Elapsed-time steps preserve repeated short ticks during a DST rollback.
      date.setTime(date.getTime() + definition.step * 1000)
      break
    case 'minute':
      date.setTime(date.getTime() + definition.step * 60_000)
      break
    case 'hour':
      date.setHours(date.getHours() + definition.step)
      break
    case 'day':
      date.setDate(date.getDate() + definition.step)
      break
    case 'month':
      date.setMonth(date.getMonth() + definition.step)
      break
    case 'year':
      date.setFullYear(date.getFullYear() + definition.step)
      break
  }
}

function formatTick(epochMilliseconds: number, definition: TickDefinition): string {
  const date = new Date(epochMilliseconds)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  switch (definition.unit) {
    case 'second':
      return `${hours}:${minutes}:${seconds}`
    case 'minute':
    case 'hour':
      return `${month}/${day} ${hours}:${minutes}`
    case 'day':
      return `${month}/${day}`
    case 'month':
      return `${date.getFullYear()}-${month}`
    case 'year':
      return String(date.getFullYear())
  }
}

function buildTicks(definition: TickDefinition, includeLabels: boolean): TimelineTick[] {
  const start = props.controller.state.viewportStart
  const stop = props.controller.state.viewportStop
  const duration = stop - start
  const cursor = alignToTick(start, definition)
  const ticks: TimelineTick[] = []
  let iterations = 0

  while (cursor.getTime() < start && iterations < 1000) {
    advanceTick(cursor, definition)
    iterations += 1
  }
  while (cursor.getTime() <= stop && iterations < 1000) {
    const time = cursor.getTime()
    ticks.push({
      time,
      offset: ((time - start) / duration) * 100,
      label: includeLabels ? formatTick(time, definition) : '',
    })
    advanceTick(cursor, definition)
    iterations += 1
  }
  return ticks
}

function formatCurrentTime(value: number): string {
  return currentFormatter.format(value)
}

function formatBoundary(value: number): string {
  return boundaryFormatter.format(value)
}

function timeAtClientX(clientX: number): number | undefined {
  const track = timelineTrack.value
  if (!track) {
    return undefined
  }
  const rect = track.getBoundingClientRect()
  if (rect.width <= 0) {
    return undefined
  }
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  return props.controller.state.viewportStart + viewportDuration.value * ratio
}

function setMultiplier(event: Event): void {
  props.controller.setMultiplier(Number((event.target as HTMLSelectElement).value))
}

function setLighting(event: Event): void {
  props.solarLighting.setLighting((event.target as HTMLInputElement).checked)
}

function setShadows(event: Event): void {
  props.solarLighting.setShadows((event.target as HTMLInputElement).checked)
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0 || !timelineTrack.value) {
    return
  }
  event.preventDefault()
  const rect = timelineTrack.value.getBoundingClientRect()
  const cursorX = rect.left + (currentTimeOffset.value / 100) * rect.width
  pointerSession = {
    pointerId: event.pointerId,
    lastClientX: event.clientX,
    moved: false,
    seeking: currentTimeVisible.value && Math.abs(event.clientX - cursorX) <= 12,
  }
  timelineTrack.value.setPointerCapture(event.pointerId)
  if (pointerSession.seeking) {
    const time = timeAtClientX(event.clientX)
    if (time !== undefined) {
      props.controller.seek(time)
    }
  }
}

function onPointerMove(event: PointerEvent): void {
  if (!pointerSession || pointerSession.pointerId !== event.pointerId || !timelineTrack.value) {
    return
  }
  const deltaX = event.clientX - pointerSession.lastClientX
  if (Math.abs(deltaX) > 1) {
    pointerSession.moved = true
  }
  pointerSession.lastClientX = event.clientX
  if (pointerSession.seeking) {
    const time = timeAtClientX(event.clientX)
    if (time !== undefined) {
      props.controller.seek(time)
    }
    return
  }
  const width = timelineTrack.value.getBoundingClientRect().width
  if (width > 0 && deltaX !== 0) {
    props.controller.panViewport(-deltaX / width)
  }
}

function onPointerUp(event: PointerEvent): void {
  if (!pointerSession || pointerSession.pointerId !== event.pointerId) {
    return
  }
  if (!pointerSession.seeking && !pointerSession.moved) {
    const time = timeAtClientX(event.clientX)
    if (time !== undefined) {
      props.controller.seek(time)
    }
  }
  if (timelineTrack.value?.hasPointerCapture(event.pointerId)) {
    timelineTrack.value.releasePointerCapture(event.pointerId)
  }
  pointerSession = undefined
}

function onWheel(event: WheelEvent): void {
  const anchor = timeAtClientX(event.clientX)
  if (anchor === undefined) {
    return
  }
  props.controller.zoomViewport(anchor, Math.pow(1.0015, event.deltaY))
}

function onRulerKeydown(event: KeyboardEvent): void {
  const anchor = currentTimeVisible.value
    ? props.controller.state.currentTime
    : (props.controller.state.viewportStart + props.controller.state.viewportStop) / 2
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      props.controller.panViewport(-0.2)
      break
    case 'ArrowRight':
      event.preventDefault()
      props.controller.panViewport(0.2)
      break
    case 'PageUp':
      event.preventDefault()
      props.controller.panViewport(-0.8)
      break
    case 'PageDown':
      event.preventDefault()
      props.controller.panViewport(0.8)
      break
    case '+':
    case '=':
      event.preventDefault()
      props.controller.zoomViewport(anchor, 0.75)
      break
    case '-':
    case '_':
      event.preventDefault()
      props.controller.zoomViewport(anchor, 1.35)
      break
    case 'Home':
      event.preventDefault()
      props.controller.resetToNow()
      break
  }
}
</script>

<style scoped>
.geo-time-dock {
  min-height: 78px;
  display: grid;
  grid-template-columns: auto minmax(260px, 1fr) auto auto;
  align-items: center;
  gap: 18px;
  padding: 10px 14px;
  border: 1px solid var(--geo-line);
  border-radius: 15px;
  color: var(--geo-text-soft);
  background: var(--geo-surface-strong);
  box-shadow: var(--geo-shadow);
  backdrop-filter: blur(18px) saturate(125%);
  pointer-events: auto;
}

.geo-time-dock--joined-with-status {
  border-bottom: 0;
  border-radius: 15px 15px 0 0;
  box-shadow: none;
}

.geo-time-dock--collapsed {
  min-height: 44px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  padding: 5px 10px;
}

.geo-time-dock__controls,
.geo-time-dock__lighting,
.geo-time-dock__lighting label {
  display: flex;
  align-items: center;
}

.geo-time-dock__controls {
  gap: 8px;
}

.geo-time-dock button,
.geo-time-dock select {
  min-height: 32px;
  border: 1px solid var(--geo-line-strong);
  border-radius: 9px;
  color: var(--geo-text);
  background: rgba(17, 33, 46, 0.88);
}

.geo-time-dock__toggle {
  width: 32px;
  display: grid;
  place-items: center;
}

.geo-time-dock__toggle :deep(.icon) {
  width: 14px;
  height: 14px;
  transition: transform 0.18s ease;
}

.geo-time-dock--collapsed .geo-time-dock__toggle :deep(.icon) {
  transform: rotate(180deg);
}

.geo-time-dock button {
  cursor: pointer;
}

.geo-time-dock button:hover,
.geo-time-dock select:hover {
  border-color: color-mix(in srgb, var(--geo-accent), transparent 48%);
  background: var(--geo-surface-hover);
}

.geo-time-dock__play {
  width: 34px;
  color: var(--geo-accent) !important;
  font-size: 12px;
}

.geo-time-dock__now {
  padding: 0 10px;
  font-size: 10px;
}

.geo-time-dock strong {
  min-width: 132px;
  color: var(--geo-text);
  font-family: var(--font-display);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.geo-time-dock--collapsed strong {
  min-width: 0;
}

.geo-time-dock select {
  padding: 0 8px;
  font-family: var(--font-display);
  font-size: 10px;
}

.geo-time-dock__track {
  min-width: 0;
}

.geo-time-dock__boundaries {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
  color: var(--geo-text-faint);
  font-family: var(--font-display);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.geo-time-dock__ruler {
  position: relative;
  height: 32px;
  overflow: hidden;
  border-top: 1px solid var(--geo-line-strong);
  outline: none;
  cursor: ew-resize;
  touch-action: none;
}

.geo-time-dock__ruler:focus-visible {
  outline: 2px solid var(--geo-accent);
  outline-offset: 4px;
}

.geo-time-dock__tick,
.geo-time-dock__cursor {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
}

.geo-time-dock__tick {
  width: 1px;
  background: var(--geo-line-strong);
}

.geo-time-dock__tick--minor {
  height: 5px;
}

.geo-time-dock__tick--major {
  height: 11px;
}

.geo-time-dock__tick--major i {
  display: block;
  height: 11px;
}

.geo-time-dock__tick--major em {
  position: absolute;
  top: 13px;
  left: 4px;
  color: var(--geo-text-faint);
  font-family: var(--font-display);
  font-size: 9px;
  font-style: normal;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.geo-time-dock__cursor {
  z-index: 1;
  width: 2px;
  height: 100%;
  background: var(--geo-accent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--geo-accent), transparent 45%);
}

.geo-time-dock__cursor::before {
  position: absolute;
  top: -1px;
  left: 50%;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--geo-accent);
  content: '';
  transform: translate(-50%, -25%);
}

.geo-time-dock__lighting {
  gap: 12px;
}

.geo-time-dock__lighting label {
  position: relative;
  gap: 7px;
  font-size: 10px;
  white-space: nowrap;
  cursor: pointer;
}

.geo-time-dock__lighting input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.geo-time-dock__lighting i {
  position: relative;
  width: 30px;
  height: 18px;
  border-radius: 12px;
  background: #253747;
}

.geo-time-dock__lighting i::after {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dce7ee;
  content: '';
  transition: transform 0.16s ease;
}

.geo-time-dock__lighting input:checked + i {
  background: var(--geo-accent);
}

.geo-time-dock__lighting input:checked + i::after {
  transform: translateX(12px);
}

.geo-time-dock__lighting input:focus-visible + i {
  outline: 2px solid var(--geo-accent);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .geo-time-dock__lighting i::after,
  .geo-time-dock__toggle :deep(.icon) {
    transition: none;
  }
}
</style>
