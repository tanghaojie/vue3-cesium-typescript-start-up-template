<template>
  <section class="shot-editor">
    <label
      >镜头名称<input :value="shot.name" maxlength="120" @change="patch({ name: text($event) })"
    /></label>
    <div class="pair">
      <label
        >运动<select :value="shot.kind" @change="setKind">
          <option value="orbit">环绕</option>
          <option value="move">机位过渡</option>
          <option value="hold">固定机位</option>
        </select></label
      >
      <label
        >时长 / 秒<input
          type="number"
          min="0.5"
          max="120"
          step="0.5"
          :value="shot.duration"
          @change="patch({ duration: numeric($event) })"
      /></label>
    </div>
    <div class="pair">
      <label
        >速度曲线<select
          :value="shot.easing"
          @change="patch({ easing: text($event) === 'linear' ? 'linear' : 'smooth' })"
        >
          <option value="smooth">柔和起止</option>
          <option value="linear">匀速</option>
        </select></label
      >
      <label v-if="shot.kind === 'orbit'"
        >环绕角度 / °<input
          type="number"
          min="-720"
          max="720"
          :value="shot.arc"
          @change="patch({ arc: numeric($event) })"
      /></label>
    </div>
    <div class="pair">
      <label v-for="which in poseKeys" :key="which"
        >{{ which === 'start' ? '起点' : '终点' }}相机距离 / 米<input
          type="number"
          min="0.1"
          max="50000000"
          step="any"
          :disabled="which === 'end' && shot.kind === 'hold'"
          :value="
            Number(capturePoseDistance(shot.kind === 'hold' ? shot.start : shot[which]).toFixed(2))
          "
          @change="$emit('distance', which, numeric($event))"
      /></label>
    </div>
    <p class="hint">数值越小，相机越近；沿当前视线调整，保持注视点与视场角。固定机位只调整起点。</p>
    <div class="pair">
      <button type="button" @click="$emit('locate', 'start')">移动到起点视角</button>
      <button type="button" @click="$emit('locate', 'end')">移动到终点视角</button>
    </div>
    <div class="pair">
      <button type="button" @click="$emit('capture', 'start')">用当前视角设为起点</button>
      <button type="button" :disabled="shot.kind === 'hold'" @click="$emit('capture', 'end')">
        用当前视角设为终点
      </button>
    </div>
    <p class="hint">
      暂停后可以拖动场景调整视角，再保存机位。环绕的角度从起点计算，终点控制距离与高度。
    </p>
    <label
      >昼夜速度 / 每拍摄秒推进的场景秒数<input
        type="number"
        min="-86400"
        max="86400"
        step="60"
        :value="shot.sceneRate"
        @change="patch({ sceneRate: numeric($event) })"
    /></label>
    <p class="hint">0 锁定光照；3600 表示拍摄 1 秒推进 1 小时。</p>
    <template v-if="clips.length">
      <label
        >同步模型动画<select :value="shot.animation?.clip ?? ''" @change="selectAnimation">
          <option value="">保持此前姿态</option>
          <option v-for="clip in clips" :key="clip.index" :value="`${clip.index}:${clip.label}`">
            {{ clip.label }} · {{ clip.duration.toFixed(1) }}s
          </option>
        </select></label
      >
      <div v-if="shot.animation" class="pair">
        <label
          >动画起点 / 秒<input
            type="number"
            min="0"
            step="0.1"
            :value="shot.animation.start"
            @change="patch({ animation: { ...shot.animation, start: numeric($event) } })"
        /></label>
        <label
          >动画终点 / 秒<input
            type="number"
            min="0"
            step="0.1"
            :value="shot.animation.end"
            @change="patch({ animation: { ...shot.animation, end: numeric($event) } })"
        /></label>
      </div>
    </template>
    <details>
      <summary>精调机位 · 局部坐标（米）</summary>
      <div v-for="which in poseKeys" :key="which" class="pose">
        <strong>{{ which === 'start' ? '起点' : '终点' }}</strong>
        <label
          >垂直视场角 / °<input
            type="number"
            min="10"
            max="100"
            :value="shot[which].fov"
            @change="poseValue(which, 'fov', 0, numeric($event))"
        /></label>
        <div v-for="field in vectorKeys" :key="field" class="vector">
          <span>{{ field === 'position' ? '相机' : '注视点' }}</span>
          <label v-for="(axis, index) in axes" :key="axis"
            >{{ axis
            }}<input
              type="number"
              step="1"
              :value="Number(shot[which][field][index].toFixed(2))"
              @change="poseValue(which, field, index, numeric($event))"
          /></label>
        </div>
      </div>
    </details>
  </section>
</template>

<script setup lang="ts">
import type { DeepReadonly } from 'vue'
import { capturePoseDistance, type CaptureShot } from '../../tools/capture/capture-project'
const props = defineProps<{
  shot: DeepReadonly<CaptureShot>
  clips: readonly { index: number; label: string; duration: number }[]
}>()
const emit = defineEmits<{
  update: [patch: Partial<CaptureShot>]
  capture: [which: 'start' | 'end']
  locate: [which: 'start' | 'end']
  distance: [which: 'start' | 'end', value: number]
}>()
const axes = ['东', '北', '上']
const poseKeys = ['start', 'end'] as const
const vectorKeys = ['position', 'target'] as const
function text(event: Event): string {
  return (event.target as HTMLInputElement).value
}
function numeric(event: Event): number {
  return text(event).trim() ? Number(text(event)) : NaN
}
function patch(value: Partial<CaptureShot>): void {
  emit('update', value)
}
function setKind(event: Event): void {
  patch({ kind: text(event) as CaptureShot['kind'] })
}
function selectAnimation(event: Event): void {
  const clip = props.clips.find((item) => `${item.index}:${item.label}` === text(event))
  patch({
    animation: clip
      ? { clip: `${clip.index}:${clip.label}`, start: 0, end: clip.duration }
      : undefined,
  })
}
function poseValue(
  which: 'start' | 'end',
  field: 'position' | 'target' | 'fov',
  index: number,
  value: number,
): void {
  const pose = {
    position: [...props.shot[which].position],
    target: [...props.shot[which].target],
    fov: props.shot[which].fov,
  } as CaptureShot['start']
  if (field === 'fov') {
    pose.fov = value
  } else {
    pose[field][index] = value
  }
  patch({ [which]: pose })
}
</script>

<style scoped>
.shot-editor,
.pose {
  display: grid;
  gap: 10px;
}
label {
  display: grid;
  gap: 5px;
  color: var(--geo-text-soft);
  font-size: 11px;
}
input,
select,
button {
  min-width: 0;
  width: 100%;
  min-height: 34px;
  padding: 6px 8px;
  border: 1px solid var(--geo-line);
  border-radius: 7px;
  color: var(--geo-text);
  background: #0b1a27;
  font: inherit;
  box-sizing: border-box;
}
button {
  font-size: 10px;
  cursor: pointer;
}
button:hover {
  border-color: var(--geo-accent);
}
button:disabled,
input:disabled {
  opacity: 0.4;
  cursor: default;
}
.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}
.hint {
  margin: 0;
  color: var(--geo-text-faint);
  font-size: 10px;
  line-height: 1.6;
}
summary {
  padding: 8px 0;
  cursor: pointer;
  color: var(--geo-text-soft);
  font-size: 11px;
}
.pose {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid var(--geo-line);
  border-radius: 8px;
}
.pose strong {
  font-size: 11px;
}
.vector {
  display: grid;
  grid-template-columns: 35px repeat(3, minmax(0, 1fr));
  gap: 5px;
  align-items: end;
}
.vector span {
  color: var(--geo-text-faint);
  font-size: 10px;
  padding-bottom: 10px;
}
.vector input {
  padding: 6px 3px;
  font-size: 10px;
}
input:focus-visible,
select:focus-visible,
button:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--geo-accent);
  outline-offset: 2px;
}
</style>
