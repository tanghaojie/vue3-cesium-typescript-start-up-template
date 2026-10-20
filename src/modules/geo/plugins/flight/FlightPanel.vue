<template>
  <section class="geo-flight-panel">
    <div class="geo-flight-panel__hero" :class="{ 'geo-flight-panel__hero--live': state.enabled }">
      <div>
        <span class="geo-flight-panel__kicker">
          {{ state.enabled ? t('geo.flight.active') : t('geo.flight.inactive') }}
        </span>
        <h3>{{ t('geo.flight.title') }}</h3>
        <p>{{ t('geo.flight.description') }}</p>
      </div>
      <button
        type="button"
        class="geo-flight-panel__power"
        :class="{ 'geo-flight-panel__power--active': state.enabled }"
        :aria-pressed="state.enabled"
        :aria-label="state.enabled ? t('geo.flight.disable') : t('geo.flight.enable')"
        @click="controller.setEnabled(!state.enabled)"
      >
        <span />
        {{ state.enabled ? t('geo.flight.disable') : t('geo.flight.enable') }}
      </button>
    </div>

    <div class="geo-flight-panel__metrics">
      <article>
        <span>{{ t('geo.flight.aircraft') }}</span>
        <strong>{{ state.aircraftCount }}</strong>
        <small>{{ state.enabled ? 'AIRBORNE' : 'STANDBY' }}</small>
      </article>
      <article>
        <span>{{ t('geo.flight.source') }}</span>
        <strong>SIM</strong>
        <small>LOCAL ONLY</small>
      </article>
    </div>

    <dl class="geo-flight-panel__details">
      <div>
        <dt>{{ t('geo.flight.timeline') }}</dt>
        <dd>{{ t('geo.flight.timelineValue') }}</dd>
      </div>
      <div>
        <dt>{{ t('geo.flight.scope') }}</dt>
        <dd>{{ t('geo.flight.scopeValue') }}</dd>
      </div>
    </dl>

    <label class="geo-flight-panel__visibility">
      <span>
        <strong>{{ t('geo.flight.routes') }}</strong>
        <small>{{ t('geo.flight.routesHint') }}</small>
      </span>
      <input
        type="checkbox"
        :checked="state.routesVisible"
        :disabled="!state.enabled"
        @change="controller.setRoutesVisible(($event.target as HTMLInputElement).checked)"
      />
    </label>

    <button
      type="button"
      class="geo-flight-panel__refresh"
      :disabled="!state.enabled"
      @click="controller.reset"
    >
      <span aria-hidden="true">↻</span>
      {{ t('geo.flight.reset') }}
    </button>

    <p class="geo-flight-panel__notice">{{ t('geo.flight.researchNotice') }}</p>
  </section>
</template>

<script setup lang="ts">
import { useLocalization } from '@/shared/localization/localization'
import type { GeoFlightController } from './flight.controller'

const props = defineProps<{ controller: GeoFlightController }>()
const { t } = useLocalization()
const state = props.controller.state
</script>

<style scoped>
.geo-flight-panel {
  display: grid;
  gap: 14px;
  color: var(--geo-text);
  font-size: 11px;
}

.geo-flight-panel__hero {
  display: grid;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--geo-line-strong);
  border-radius: 14px;
  background:
    linear-gradient(145deg, rgba(73, 201, 255, 0.06), transparent 58%), var(--geo-surface-strong);
  box-shadow: inset 3px 0 0 rgba(159, 181, 194, 0.26);
}

.geo-flight-panel__hero--live {
  border-color: color-mix(in srgb, var(--geo-accent), transparent 62%);
  box-shadow: inset 3px 0 0 var(--geo-accent);
}

.geo-flight-panel__kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--geo-text-faint);
  font:
    700 9px/1 'IBM Plex Mono',
    'Cascadia Code',
    monospace;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.geo-flight-panel__kicker::before {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  content: '';
}

.geo-flight-panel__hero--live .geo-flight-panel__kicker {
  color: var(--geo-accent);
}

.geo-flight-panel h3 {
  margin: 8px 0 5px;
  color: var(--geo-text);
  font-size: 16px;
  letter-spacing: 0.02em;
}

.geo-flight-panel__hero p {
  margin: 0;
  color: var(--geo-text-soft);
  line-height: 1.65;
}

.geo-flight-panel__power,
.geo-flight-panel__refresh {
  min-height: 40px;
  border: 1px solid var(--geo-line-strong);
  border-radius: 10px;
  color: var(--geo-text-soft);
  background: rgba(7, 18, 28, 0.76);
  cursor: pointer;
}

.geo-flight-panel__power {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-weight: 700;
}

.geo-flight-panel__power span {
  width: 9px;
  height: 9px;
  border: 1px solid currentColor;
  border-radius: 50%;
}

.geo-flight-panel__power--active {
  border-color: color-mix(in srgb, var(--geo-accent), transparent 48%);
  color: var(--geo-accent);
  background: color-mix(in srgb, var(--geo-accent), transparent 90%);
}

.geo-flight-panel__power--active span {
  background: currentColor;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--geo-accent), transparent 84%);
}

.geo-flight-panel__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.geo-flight-panel__metrics article {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--geo-line);
  border-radius: 11px;
  background: var(--geo-surface-hover);
}

.geo-flight-panel__metrics span,
.geo-flight-panel__details dt {
  color: var(--geo-text-faint);
  font-size: 9px;
}

.geo-flight-panel__metrics strong {
  color: var(--geo-text);
  font:
    700 22px/1.15 'IBM Plex Mono',
    'Cascadia Code',
    monospace;
}

.geo-flight-panel__metrics small {
  color: var(--geo-accent);
  font:
    700 8px/1 'IBM Plex Mono',
    'Cascadia Code',
    monospace;
  letter-spacing: 0.12em;
}

.geo-flight-panel__details {
  display: grid;
  gap: 9px;
  margin: 0;
  padding: 13px;
  border: 1px solid var(--geo-line);
  border-radius: 11px;
}

.geo-flight-panel__details div {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 9px;
}

.geo-flight-panel__details dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--geo-text-soft);
  font:
    500 9px/1.55 'IBM Plex Mono',
    'Cascadia Code',
    monospace;
  text-align: right;
}

.geo-flight-panel__visibility {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 13px;
  border: 1px solid var(--geo-line);
  border-radius: 11px;
  background: var(--geo-surface-hover);
  cursor: pointer;
}

.geo-flight-panel__visibility span {
  display: grid;
  gap: 4px;
}

.geo-flight-panel__visibility strong {
  color: var(--geo-text-soft);
  font-size: 11px;
}

.geo-flight-panel__visibility small {
  color: var(--geo-text-faint);
  font-size: 9px;
  line-height: 1.4;
}

.geo-flight-panel__visibility input {
  width: 36px;
  height: 20px;
  margin: 0;
  accent-color: var(--geo-accent);
  cursor: inherit;
}

.geo-flight-panel__visibility:has(input:disabled) {
  cursor: not-allowed;
  opacity: 0.45;
}

.geo-flight-panel__refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.geo-flight-panel__power:hover,
.geo-flight-panel__refresh:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--geo-accent), transparent 48%);
  color: var(--geo-accent);
}

.geo-flight-panel__refresh:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.geo-flight-panel__message,
.geo-flight-panel__notice {
  margin: 0;
  padding: 11px 12px;
  border: 1px solid var(--geo-line);
  border-radius: 10px;
  color: var(--geo-text-faint);
  background: var(--geo-surface-hover);
  line-height: 1.6;
}

.geo-flight-panel__message--error {
  border-color: rgba(255, 122, 143, 0.32);
  color: #ff9aa8;
  background: rgba(126, 28, 47, 0.16);
}

.geo-flight-panel__notice {
  border-style: dashed;
  background: transparent;
}

@media (prefers-reduced-motion: reduce) {
  .geo-flight-panel__power,
  .geo-flight-panel__refresh {
    transition: none;
  }
}
</style>
