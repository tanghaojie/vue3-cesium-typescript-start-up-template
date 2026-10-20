<template>
  <section class="assembly-preview" aria-label="建筑拼装预览">
    <header><span>本地预览</span><strong>建筑 · 从无到有</strong></header>
    <p>38 个构件逐步飞入拼装 · 成都示例位置</p>
    <div class="assembly-preview__actions" aria-label="模型照明">
      <button
        type="button"
        :aria-pressed="state.lighting === 'studio'"
        @click="preview.setLighting('studio')"
      >
        柔光对照
      </button>
      <button
        type="button"
        :aria-pressed="state.lighting === 'scene'"
        @click="preview.setLighting('scene')"
      >
        场景日光
      </button>
    </div>
    <small>已恢复 Blender 视口配色 · 高清预览</small>
    <p v-if="state.loading" role="status">正在加载模型并定位镜头…</p>
    <template v-else-if="state.loaded">
      <div class="assembly-preview__progress">
        <span>{{ state.current.toFixed(1) }} s / {{ state.duration.toFixed(2) }} s</span>
        <span>{{
          state.playing ? '拼装中' : state.current >= state.duration ? '拼装完成' : '已暂停'
        }}</span>
      </div>
      <input
        aria-label="拼装进度"
        type="range"
        min="0"
        :max="state.duration"
        step="0.01"
        :value="state.current"
        @input="seek"
      />
      <div class="assembly-preview__actions">
        <button type="button" @click="state.playing ? preview.pause() : preview.play()">
          {{ state.playing ? '暂停' : '播放' }}
        </button>
        <button type="button" @click="preview.play(true)">重新拼装</button>
        <button type="button" @click="showCompleted">查看完成</button>
      </div>
    </template>
    <div class="assembly-preview__actions">
      <button v-if="!state.loaded && !state.loading" type="button" @click="loadPreview">
        加载并播放
      </button>
      <button v-if="state.loaded || state.loading" type="button" @click="clearPreview">
        移除预览
      </button>
    </div>
    <p v-if="state.error" class="assembly-preview__error" role="alert">{{ state.error }}</p>
    <small>模型来自 AIModels · 拼装进度独立于场景时间</small>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { useGeoRuntime } from '../../core/geo-context'
import {
  geoModelRenderingCapability,
  geoRenderQualityCapability,
} from '../../plugins/scene/scene.capabilities'
import {
  createAssemblyPreview,
  type AssemblyPreviewState,
} from '../../tools/model/assembly-preview'

const runtime = useGeoRuntime()
const state = shallowRef<AssemblyPreviewState>({
  lighting: 'studio',
  loading: false,
  loaded: false,
  playing: false,
  current: 0,
  duration: 0,
  count: 0,
})
const preview = createAssemblyPreview(
  runtime.viewerAccess.require(),
  runtime.plugins.capabilities.require(geoModelRenderingCapability),
  (value) => {
    state.value = value
  },
)
const quality = runtime.plugins.capabilities.require(geoRenderQualityCapability)
const originalQuality = quality.state.renderMode

function loadPreview(): void {
  quality.setMode('performance')
  void preview.load()
}

function restoreQuality(): void {
  if (quality.state.renderMode === 'performance' && runtime.state.status === 'ready') {
    quality.setMode(originalQuality)
  }
}

function clearPreview(): void {
  preview.clear()
  restoreQuality()
}

function seek(event: Event): void {
  preview.pause()
  preview.seek(Number((event.target as HTMLInputElement).value))
}

function showCompleted(): void {
  preview.pause()
  preview.seek(state.value.duration)
}

onMounted(loadPreview)
onBeforeUnmount(() => {
  preview.dispose()
  restoreQuality()
})
</script>

<style scoped>
.assembly-preview {
  position: absolute;
  z-index: 30;
  top: 24px;
  right: 76px;
  width: min(340px, calc(100vw - 110px));
  padding: 20px;
  display: grid;
  gap: 14px;
  border: 1px solid var(--geo-line-strong);
  border-radius: 16px;
  color: var(--geo-text);
  background: var(--geo-surface);
  box-shadow: var(--geo-shadow);
  backdrop-filter: blur(18px);
  font-size: 12px;
}
header {
  display: grid;
  gap: 8px;
}
header span {
  color: var(--geo-accent);
  font-size: 11px;
  letter-spacing: 0.15em;
}
header strong {
  font-size: 20px;
  font-weight: 600;
}
p {
  margin: 0;
  color: var(--geo-text-soft);
  line-height: 1.6;
}
small {
  color: var(--geo-text-faint);
  font-size: 10px;
}
input {
  width: 100%;
  accent-color: var(--geo-accent);
  cursor: pointer;
}
.assembly-preview__progress {
  display: flex;
  justify-content: space-between;
}
.assembly-preview__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
button {
  padding: 8px 12px;
  border: 1px solid var(--geo-line-strong);
  border-radius: 8px;
  background: var(--geo-surface-hover);
  color: inherit;
  cursor: pointer;
}
button:hover,
button:focus-visible {
  border-color: var(--geo-accent);
}
.assembly-preview__error {
  color: #ffb7ab;
}
button[aria-pressed='true'] {
  border-color: var(--geo-accent);
  color: var(--geo-accent);
  background: rgba(73, 201, 255, 0.12);
}
</style>
