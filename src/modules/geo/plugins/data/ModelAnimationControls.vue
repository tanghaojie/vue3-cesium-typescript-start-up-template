<template>
  <section class="model-animation" :aria-label="`${label} 动画控制`">
    <header class="model-animation__header">
      <div>
        <strong>动画播放</strong>
        <span>{{ status }}</span>
      </div>
      <button type="button" title="收起动画控制" aria-label="收起动画控制" @click="emit('close')">
        ×
      </button>
    </header>
    <label v-if="animation.clips.length > 1" class="model-animation__clip">
      <span>动画片段</span>
      <select :value="animation.clipIndex" @change="selectClip">
        <option v-for="clip in animation.clips" :key="clip.index" :value="clip.index">
          {{ clip.label }}
        </option>
      </select>
    </label>
    <p v-else class="model-animation__name">{{ animation.clips[0]?.label }}</p>
    <div class="model-animation__progress">
      <label class="model-animation__seek">
        <span class="model-animation__sr-only">{{ label }} 动画进度</span>
        <input
          type="range"
          min="0"
          :max="animation.duration"
          step="0.01"
          :value="animation.current"
          :disabled="animation.duration <= 0 || !visible"
          :aria-valuetext="`${time(animation.current)} / ${time(animation.duration)}`"
          @input="seek"
        />
      </label>
      <div class="model-animation__time">
        <span>{{ time(animation.current) }}</span>
        <span>{{ time(animation.duration) }}</span>
      </div>
    </div>
    <div class="model-animation__actions">
      <button
        class="model-animation__play"
        type="button"
        :disabled="!animation.playing && (!visible || animation.duration <= 0)"
        @click="togglePlayback"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path v-if="animation.playing" d="M4 3h3v10H4zm5 0h3v10H9z" />
          <path v-else d="M5 2.5 13 8l-8 5.5z" />
        </svg>
        {{ animation.playing ? '暂停' : '播放' }}
      </button>
      <button type="button" :disabled="!visible || animation.duration <= 0" @click="restart">
        重播
      </button>
      <label class="model-animation__speed">
        <span class="model-animation__sr-only">动画播放速度</span>
        <select :value="animation.speed" @change="changeSpeed">
          <option v-for="speed in speeds" :key="speed" :value="speed">{{ speed }}×</option>
        </select>
      </label>
      <label class="model-animation__loop">
        <input type="checkbox" :checked="animation.loop" @change="changeLoop" />循环
      </label>
    </div>
    <p v-if="animation.error" class="model-animation__error" role="alert">{{ animation.error }}</p>
    <p v-else-if="animation.duration <= 0" class="model-animation__error" role="status">
      该片段缺少有效时间范围，请检查源文件。
    </p>
    <p v-else-if="!visible" class="model-animation__notice">模型已隐藏，显示后可继续播放。</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  GeoModelAnimationCommand,
  GeoModelAnimationSnapshot,
} from '../../tools/model/model-animation'

const props = defineProps<{
  label: string
  animation: GeoModelAnimationSnapshot
  visible: boolean
}>()
const emit = defineEmits<{
  control: [command: GeoModelAnimationCommand]
  close: []
}>()
const speeds = [0.25, 0.5, 1, 1.5, 2, 4]
const status = computed(function playbackStatus() {
  if (props.animation.playing) {
    return '播放中'
  }
  if (!props.animation.started) {
    return '准备播放'
  }
  if (props.animation.current >= props.animation.duration) {
    return '播放完成'
  }
  return '已暂停'
})

function time(seconds: number): string {
  const safe = Math.max(0, seconds)
  const minutes = Math.floor(safe / 60)
  return `${minutes.toString().padStart(2, '0')}:${(safe % 60).toFixed(1).padStart(4, '0')}`
}
function togglePlayback(): void {
  emit('control', { type: props.animation.playing ? 'pause' : 'play' })
}
function restart(): void {
  emit('control', { type: 'restart' })
}
function seek(event: Event): void {
  emit('control', { type: 'seek', seconds: Number((event.target as HTMLInputElement).value) })
}
function selectClip(event: Event): void {
  emit('control', { type: 'select', index: Number((event.target as HTMLSelectElement).value) })
}
function changeSpeed(event: Event): void {
  emit('control', { type: 'speed', speed: Number((event.target as HTMLSelectElement).value) })
}
function changeLoop(event: Event): void {
  emit('control', { type: 'loop', loop: (event.target as HTMLInputElement).checked })
}
</script>

<style scoped>
.model-animation {
  display: grid;
  min-width: 0;
  gap: 12px;
  margin-left: 23px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--geo-accent), transparent 65%);
  border-radius: 10px;
  background: color-mix(in srgb, var(--geo-accent), transparent 95%);
  color: var(--geo-text-soft);
  font-size: 10px;
}
.model-animation__header,
.model-animation__header > div,
.model-animation__actions,
.model-animation__time {
  display: flex;
  align-items: center;
  gap: 8px;
}
.model-animation__header,
.model-animation__time {
  justify-content: space-between;
}
.model-animation__header strong {
  color: var(--geo-text);
  font-size: 11px;
}
.model-animation__header span,
.model-animation__notice,
.model-animation__time {
  color: var(--geo-text-faint);
  font-size: 9px;
}
.model-animation__name {
  margin: 0;
  overflow-wrap: anywhere;
}
.model-animation__clip {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}
.model-animation__clip select {
  width: 100%;
  min-width: 0;
}
.model-animation__seek {
  display: block;
}
.model-animation__seek input {
  display: block;
  width: 100%;
  margin: 0 0 5px;
  accent-color: var(--geo-accent);
  cursor: pointer;
}
.model-animation__time {
  font-variant-numeric: tabular-nums;
}
.model-animation__actions {
  flex-wrap: wrap;
  gap: 6px;
}
.model-animation__actions button,
.model-animation__header button,
.model-animation select {
  min-height: 28px;
  padding: 0 8px;
  border: 1px solid var(--geo-line);
  border-radius: 6px;
  background: var(--geo-surface-strong, #0e1c2a);
  color: var(--geo-text-soft);
  font: inherit;
  cursor: pointer;
}
.model-animation__header button {
  width: 26px;
  min-height: 26px;
  padding: 0;
  font-size: 16px;
}
.model-animation__actions .model-animation__play {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--geo-accent);
  color: #06111d;
  border-color: transparent;
  font-weight: 700;
}
.model-animation__play svg {
  width: 12px;
  height: 12px;
  fill: currentColor;
}
.model-animation__loop {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  white-space: nowrap;
}
.model-animation__loop input {
  margin: 0;
  accent-color: var(--geo-accent);
}
.model-animation__error,
.model-animation__notice {
  margin: 0;
  line-height: 1.6;
}
.model-animation__error {
  color: #ff9ca7;
  overflow-wrap: anywhere;
}
button:hover:not(:disabled) {
  filter: brightness(1.15);
}
button:disabled,
input:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
button:focus-visible,
select:focus-visible,
input:focus-visible {
  outline: 2px solid var(--geo-accent);
  outline-offset: 2px;
}
.model-animation__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
