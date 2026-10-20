<template>
  <aside
    v-if="controller.presentation.state.clean || state.busy"
    class="capture-overlay"
    aria-label="拍摄控制"
  >
    <div class="capture-overlay__title">
      <span :class="{ recording: state.busy }" /><strong>{{
        state.busy ? '逐帧输出' : '拍摄预览'
      }}</strong
      ><small v-if="state.batchTotal > 1 && state.busy"
        >{{ state.batchIndex }} / {{ state.batchTotal }} 镜头</small
      >
    </div>
    <template v-if="state.busy">
      <progress
        :value="state.progress?.frame ?? 0"
        :max="state.progress?.total ?? 1"
        aria-label="逐帧导出进度"
      />
      <p>
        {{ state.progress?.phase ?? '准备输出文件' }} · {{ state.progress?.frame ?? 0 }} /
        {{ state.progress?.total ?? '—' }} 帧
      </p>
      <p v-if="hidden">页面在后台，等待回到前台后继续。</p>
      <button type="button" @click="controller.cancelExport">取消导出 · Esc</button>
    </template>
    <template v-else>
      <p>{{ state.current.toFixed(2) }} / {{ duration.toFixed(2) }}s</p>
      <div class="capture-overlay__actions">
        <button
          type="button"
          :disabled="!duration"
          @click="state.playing ? controller.pause() : controller.play()"
        >
          {{ state.playing ? '暂停' : '播放' }}</button
        ><button type="button" @click="controller.stop">返回工作台 · Esc</button>
      </div>
    </template>
  </aside>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { CaptureController } from './capture.controller'
const props = defineProps<{ controller: CaptureController }>()
const state = computed(() => props.controller.state)
const duration = computed(() =>
  state.value.project.shots.reduce((total, shot) => total + shot.duration, 0),
)
const hidden = ref(document.hidden)
function visibility(): void {
  hidden.value = document.hidden
}
onMounted(() => document.addEventListener('visibilitychange', visibility))
onBeforeUnmount(() => document.removeEventListener('visibilitychange', visibility))
</script>
<style scoped>
.capture-overlay {
  position: absolute;
  z-index: 50;
  top: 20px;
  right: 20px;
  width: min(300px, calc(100vw - 40px));
  padding: 14px;
  box-sizing: border-box;
  display: grid;
  gap: 11px;
  border: 1px solid var(--geo-line);
  border-radius: 12px;
  color: var(--geo-text);
  background: rgba(5, 16, 25, 0.92);
  box-shadow: var(--geo-shadow);
}
.capture-overlay__title,
.capture-overlay__actions {
  display: flex;
  align-items: center;
  gap: 9px;
}
.capture-overlay__title > span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--geo-accent);
}
.capture-overlay__title > span.recording {
  background: #ff7575;
}
strong {
  font-size: 12px;
}
small,
p {
  margin: 0;
  color: var(--geo-text-soft);
  font-size: 11px;
  line-height: 1.6;
}
small {
  margin-left: auto;
}
progress {
  width: 100%;
  height: 5px;
  accent-color: var(--geo-accent);
}
button {
  flex: 1;
  min-height: 35px;
  padding: 7px 10px;
  border: 1px solid var(--geo-line-strong);
  border-radius: 7px;
  color: var(--geo-text);
  background: #102638;
  font-size: 11px;
  cursor: pointer;
}
button:focus-visible {
  outline: 2px solid var(--geo-accent);
  outline-offset: 2px;
}
</style>
