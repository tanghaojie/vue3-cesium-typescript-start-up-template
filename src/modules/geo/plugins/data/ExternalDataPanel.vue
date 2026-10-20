<template>
  <div class="external-data-panel" :aria-busy="controller.state.busy">
    <div class="data-panel__intro">
      <span>{{ activeType === 'ai-model' ? '浏览 AIModels 模型' : '通过 URL 添加数据' }}</span>
      <small>选择数据类型，加载到当前场景</small>
    </div>
    <div class="data-panel__types" role="group" aria-label="外部数据类型">
      <button
        v-for="item in dataTypes"
        :key="item.id"
        type="button"
        :aria-pressed="activeType === item.id"
        :class="{ 'is-active': activeType === item.id }"
        @click="activeType = item.id"
      >
        <AppIcon :name="item.icon" />
        <strong>{{ item.label }}</strong>
        <small>{{ item.format }}</small>
      </button>
    </div>
    <AiModelCatalog v-if="activeType === 'ai-model'" :controller="controller" />
    <section
      v-show="activeType === 'geojson'"
      class="data-panel__load-card"
      aria-label="GeoJSON URL"
    >
      <label class="data-panel__input"
        ><span>GeoJSON URL</span
        ><input v-model="geoJsonUrl" type="url" placeholder="https://…/data.geojson"
      /></label>
      <button
        class="data-panel__primary"
        type="button"
        :disabled="!geoJsonUrl || controller.state.busy"
        @click="loadGeoJson"
      >
        加载 GeoJSON
      </button>
    </section>
    <section v-show="activeType === 'model'" class="data-panel__load-card" aria-label="模型 URL">
      <label class="data-panel__input"
        ><span>模型 URL</span
        ><input v-model="modelUrl" type="url" placeholder="https://…/model.glb"
      /></label>
      <div class="data-panel__model-placement">
        <div class="data-panel__model-placement-heading">
          <div><strong>模型放置</strong><small>WGS84 坐标 · 角度制</small></div>
          <button type="button" @click="useViewCenter">使用视图中心</button>
        </div>
        <div class="data-panel__transform-grid">
          <label
            ><span>经度</span
            ><input v-model.number="modelPlacement.longitude" type="number" step="0.000001"
          /></label>
          <label
            ><span>纬度</span
            ><input v-model.number="modelPlacement.latitude" type="number" step="0.000001"
          /></label>
          <label
            ><span>椭球高 m</span
            ><input v-model.number="modelPlacement.height" type="number" step="0.1"
          /></label>
        </div>
        <details class="data-panel__model-details">
          <summary>可选的缩放与姿态</summary>
          <div class="data-panel__transform-grid">
            <label
              ><span>缩放</span
              ><input v-model.number="modelPlacement.scale" type="number" min="0.000001" step="0.1"
            /></label>
            <label
              ><span>航向°</span
              ><input v-model.number="modelPlacement.heading" type="number" step="1"
            /></label>
            <label
              ><span>俯仰°</span
              ><input v-model.number="modelPlacement.pitch" type="number" step="1"
            /></label>
            <label
              ><span>翻滚°</span><input v-model.number="modelPlacement.roll" type="number" step="1"
            /></label>
          </div>
        </details>
      </div>
      <button
        class="data-panel__primary"
        type="button"
        :disabled="!modelUrl || controller.state.busy"
        @click="loadModel"
      >
        <span
          v-if="controller.state.loadingOperation === 'model'"
          class="data-panel__button-loading"
        >
          <i aria-hidden="true" />正在加载…
        </span>
        <span v-else>加载 glTF / GLB</span>
      </button>
    </section>
    <section
      v-show="activeType === 'tileset'"
      class="data-panel__load-card"
      aria-label="3D Tiles URL"
    >
      <label class="data-panel__input"
        ><span>3D Tiles URL</span
        ><input v-model="tilesetUrl" type="url" placeholder="https://…/tileset.json"
      /></label>
      <button
        class="data-panel__primary"
        type="button"
        :disabled="!tilesetUrl || controller.state.busy"
        @click="loadTileset"
      >
        加载 3D Tiles
      </button>
    </section>
    <p v-if="controller.state.busy" class="data-panel__loading" role="status" aria-live="polite">
      <i aria-hidden="true" />{{ loadingLabel }}
    </p>
    <button
      v-if="controller.state.aiModelLoadingId"
      class="data-panel__cancel"
      type="button"
      @click="controller.cancelAiModelLoad()"
    >
      取消模型加载
    </button>
    <p v-if="controller.state.error" class="data-panel__error" role="alert">
      {{ controller.state.error }}
    </p>
    <section v-if="controller.state.resources.length" class="data-panel__section">
      <div class="data-panel__heading">
        <div>
          <span>已加载数据</span
          ><small>{{ controller.state.resources.length }} 项 · 当前会话</small>
        </div>
      </div>
      <div
        v-for="resource in controller.state.resources"
        :key="resource.id"
        class="data-panel__resource"
      >
        <div class="data-panel__resource-summary">
          <label
            ><input
              type="checkbox"
              :disabled="controller.state.busy"
              :checked="resource.show"
              @change="
                controller.setResourceVisible(
                  resource.id,
                  ($event.target as HTMLInputElement).checked,
                )
              "
            /><span class="data-panel__resource-name"
              ><strong>{{ resource.label }}</strong
              ><small v-if="resource.modelTransform">{{
                modelTransformSummary(resource.modelTransform)
              }}</small
              ><small
                v-if="resource.modelRenderingNotice"
                class="data-panel__resource-policy-warning"
                >{{ resource.modelRenderingNotice }}</small
              ><small v-if="resource.autoHidden" class="data-panel__resource-policy-warning"
                >视角高于 30 km，已暂停绘制</small
              ><small v-else-if="resource.maximumVisibleCameraHeight">30 km 外自动隐藏</small></span
            ></label
          >
          <div class="data-panel__resource-actions">
            <button
              :disabled="controller.state.busy"
              v-if="resource.visualStyle"
              class="data-panel__resource-style"
              type="button"
              :title="resource.visualStyle === 'cyber-scan' ? '切换为原始材质' : '切换为科技扫描'"
              @click="toggleTilesetVisualStyle(resource)"
            >
              <i
                :class="{ 'is-active': resource.visualStyle === 'cyber-scan' }"
                aria-hidden="true"
              />
              {{ resource.visualStyle === 'cyber-scan' ? '科技扫描' : '原始材质' }}
            </button>
            <button
              :disabled="controller.state.busy"
              v-if="resource.modelTransform"
              class="data-panel__resource-adjust"
              type="button"
              :aria-expanded="expandedModelId === resource.id"
              :title="expandedModelId === resource.id ? '收起模型调整' : '调整模型'"
              @click="toggleModelEditor(resource)"
            >
              调整
            </button>
            <button
              v-if="resource.animation?.clips.length"
              class="data-panel__resource-animation"
              :class="{ 'is-playing': resource.animation.playing }"
              :disabled="controller.state.busy"
              type="button"
              :aria-label="`动画控制 ${resource.label}`"
              :aria-expanded="expandedAnimationId === resource.id"
              :aria-controls="`model-animation-${resource.id}`"
              title="动画控制"
              @click="toggleAnimationPanel(resource.id)"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2.5 13 8l-8 5.5z" /></svg>
              <span>动画</span>
            </button>
            <button
              :disabled="controller.state.busy"
              type="button"
              :aria-label="`定位 ${resource.label}`"
              title="定位"
              @click="controller.flyToResource(resource.id)"
            >
              ⌖
            </button>
            <button
              :disabled="controller.state.busy"
              type="button"
              :aria-label="`移除 ${resource.label}`"
              title="移除"
              @click="removeResource(resource.id)"
            >
              ×
            </button>
          </div>
        </div>
        <ModelAnimationControls
          v-if="resource.animation && expandedAnimationId === resource.id"
          :id="`model-animation-${resource.id}`"
          :label="resource.label"
          :animation="resource.animation"
          :visible="resource.show && !resource.autoHidden"
          @control="controller.controlModelAnimation(resource.id, $event)"
          @close="closeAnimationPanel"
        />
        <div
          v-if="
            resource.modelTransform && expandedModelId === resource.id && modelDrafts[resource.id]
          "
          class="data-panel__model-editor"
        >
          <div class="data-panel__transform-grid">
            <label
              ><span>经度</span
              ><input
                v-model.number="modelDrafts[resource.id].longitude"
                type="number"
                step="0.000001"
            /></label>
            <label
              ><span>纬度</span
              ><input
                v-model.number="modelDrafts[resource.id].latitude"
                type="number"
                step="0.000001"
            /></label>
            <label
              ><span>高度 m</span
              ><input v-model.number="modelDrafts[resource.id].height" type="number" step="0.1"
            /></label>
            <label
              ><span>缩放</span
              ><input
                v-model.number="modelDrafts[resource.id].scale"
                type="number"
                min="0.000001"
                step="0.1"
            /></label>
            <label
              ><span>航向°</span
              ><input v-model.number="modelDrafts[resource.id].heading" type="number" step="1"
            /></label>
            <label
              ><span>俯仰°</span
              ><input v-model.number="modelDrafts[resource.id].pitch" type="number" step="1"
            /></label>
            <label
              ><span>翻滚°</span
              ><input v-model.number="modelDrafts[resource.id].roll" type="number" step="1"
            /></label>
          </div>
          <button
            class="data-panel__model-apply"
            type="button"
            :disabled="controller.state.busy"
            @click="applyModelTransform(resource.id)"
          >
            应用变换
          </button>
        </div>
      </div>
    </section>

    <p v-if="!controller.state.resources.length" class="data-panel__empty">尚未加载外部数据</p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { GeoDataResourceSnapshot, GeoModelTransform } from '../../tools/data/data-browser'
import { DEFAULT_GEO_MODEL_URL } from '../../tools/data/data-presets'
import type { GeoDataController } from './data.controller'
import AiModelCatalog from './AiModelCatalog.vue'
import ModelAnimationControls from './ModelAnimationControls.vue'

const props = defineProps<{ controller: GeoDataController }>()
type ExternalDataType = 'geojson' | 'model' | 'tileset' | 'ai-model'
const activeType = ref<ExternalDataType>('geojson')
const dataTypes: readonly { id: ExternalDataType; label: string; format: string; icon: string }[] =
  [
    { id: 'geojson', label: 'GeoJSON', format: '矢量数据', icon: 'map-pin' },
    { id: 'model', label: '模型', format: 'glTF / GLB', icon: 'grid' },
    { id: 'tileset', label: '3D Tiles', format: '三维瓦片', icon: 'layers' },
    { id: 'ai-model', label: 'AI 模型', format: 'AIModels', icon: 'database' },
  ]
const geoJsonUrl = ref('')
const modelUrl = ref(DEFAULT_GEO_MODEL_URL)
const tilesetUrl = ref('')
const modelPlacement = reactive<GeoModelTransform>(props.controller.suggestModelTransform())
const modelDrafts = reactive<Record<string, GeoModelTransform>>({})
const expandedModelId = ref<string>()
const expandedAnimationId = ref<string>()
const loadingLabel = computed(function currentLoadingLabel() {
  switch (props.controller.state.loadingOperation) {
    case 'ai-model':
      return props.controller.state.aiModelProgress ?? '正在加载 AI 模型…'
    case 'geojson':
      return '正在加载 GeoJSON…'
    case 'model':
      return '正在加载模型…'
    case 'tileset':
      return '正在加载 3D Tiles…'
    case 'fly-to':
      return '正在定位数据…'
    case 'transform':
      return '正在应用模型变换…'
    default:
      return '正在处理数据…'
  }
})

async function loadGeoJson(): Promise<void> {
  await props.controller.loadGeoJson({ url: geoJsonUrl.value, label: 'GeoJSON 数据' })
}

async function loadModel(): Promise<void> {
  await props.controller.loadModel({
    url: modelUrl.value,
    label: '外部模型',
    transform: copyModelTransform(modelPlacement),
  })
}

function copyModelTransform(transform: GeoModelTransform): GeoModelTransform {
  return { ...transform }
}

function useViewCenter(): void {
  Object.assign(modelPlacement, props.controller.suggestModelTransform())
}

function modelTransformSummary(transform: GeoModelTransform): string {
  return `${transform.longitude.toFixed(4)}°, ${transform.latitude.toFixed(4)}° · ${transform.height.toFixed(1)} m · ×${transform.scale}`
}

function toggleModelEditor(resource: GeoDataResourceSnapshot): void {
  if (!resource.modelTransform) {
    return
  }
  if (expandedModelId.value === resource.id) {
    expandedModelId.value = undefined
    return
  }
  modelDrafts[resource.id] = copyModelTransform(resource.modelTransform)
  expandedModelId.value = resource.id
}

async function applyModelTransform(id: string): Promise<void> {
  const draft = modelDrafts[id]
  if (!draft) {
    return
  }
  await props.controller.updateModelTransform(id, copyModelTransform(draft))
}

function removeResource(id: string): void {
  props.controller.removeResource(id)
  delete modelDrafts[id]
  if (expandedModelId.value === id) {
    expandedModelId.value = undefined
  }
  if (expandedAnimationId.value === id) {
    expandedAnimationId.value = undefined
  }
}

function toggleAnimationPanel(id: string): void {
  expandedAnimationId.value = expandedAnimationId.value === id ? undefined : id
}

function closeAnimationPanel(): void {
  expandedAnimationId.value = undefined
}

function toggleTilesetVisualStyle(resource: GeoDataResourceSnapshot): void {
  if (!resource.visualStyle) {
    return
  }
  props.controller.setTilesetVisualStyle(
    resource.id,
    resource.visualStyle === 'cyber-scan' ? 'original' : 'cyber-scan',
  )
}

async function loadTileset(): Promise<void> {
  await props.controller.loadTileset({ url: tilesetUrl.value, label: '外部 3D Tiles' })
}
</script>

<style scoped>
.external-data-panel {
  display: grid;
  gap: 16px;
  min-width: 0;
}
.data-panel__intro {
  display: grid;
  gap: 5px;
}
.data-panel__intro > span {
  color: var(--geo-text);
  font-size: 13px;
  font-weight: 700;
}
.data-panel__intro small,
.data-panel__types small {
  color: var(--geo-text-faint);
  font-size: 10px;
}
.data-panel__types {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}
.data-panel__types button {
  display: grid;
  justify-items: center;
  gap: 7px;
  min-width: 0;
  padding: 13px 4px;
  border: 1px solid var(--geo-line);
  border-radius: 11px;
  background: var(--geo-surface-strong);
  color: var(--geo-text-soft);
  cursor: pointer;
}
.data-panel__types button.is-active {
  border-color: var(--geo-accent);
  background: color-mix(in srgb, var(--geo-accent), transparent 90%);
  color: var(--geo-accent);
}
.data-panel__types strong {
  font-size: 11px;
}
.data-panel__types :deep(svg) {
  width: 21px;
  height: 21px;
}
.data-panel__load-card {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--geo-line);
  border-radius: 12px;
  background: color-mix(in srgb, var(--geo-surface-strong), transparent 20%);
}
.data-panel__section {
  display: grid;
  gap: 9px;
  min-width: 0;
}
.data-panel__heading > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.data-panel__heading span {
  color: var(--geo-text-soft);
  font-size: 11px;
  font-weight: 700;
}
.data-panel__heading small {
  color: var(--geo-text-faint);
  font-size: 9px;
}
.data-panel__input input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  min-height: 36px;
  padding: 0 9px;
  border: 1px solid var(--geo-line);
  border-radius: 8px;
  color: var(--geo-text);
  background: #091522;
  font-size: 11px;
}
.data-panel__resource label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--geo-text);
  font-size: 11px;
}
.data-panel__resource input[type='checkbox'] {
  accent-color: var(--geo-accent);
}
.data-panel__resource button {
  min-width: 28px;
  min-height: 28px;
  padding: 0 5px;
  border: 0;
  border-radius: 6px;
  color: var(--geo-text-soft);
  background: var(--geo-surface-hover);
  cursor: pointer;
}
.data-panel__error {
  margin: 0;
  color: #ff9ca7;
  font-size: 11px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.data-panel__empty {
  margin: 0;
  padding: 18px 8px;
  border: 1px dashed var(--geo-line);
  border-radius: 10px;
  color: var(--geo-text-faint);
  text-align: center;
  font-size: 11px;
}
.data-panel__cancel {
  min-height: 32px;
  border: 1px solid var(--geo-line);
  border-radius: 8px;
  color: var(--geo-text-soft);
  background: var(--geo-surface-hover);
  cursor: pointer;
}
.data-panel__input {
  display: grid;
  gap: 5px;
  color: var(--geo-text-faint, #7890a2);
  font-size: 9px;
}
.data-panel__model-placement,
.data-panel__model-editor {
  display: grid;
  gap: 9px;
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 72%);
  border-radius: 10px;
  background: color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 94%);
}
.data-panel__model-details {
  color: var(--geo-text-faint, #7890a2);
  font-size: 9px;
}
.data-panel__model-details summary {
  cursor: pointer;
}
.data-panel__model-details[open] summary {
  margin-bottom: 9px;
  color: var(--geo-text-soft, #b6c5d2);
}
.data-panel__model-placement-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.data-panel__model-placement-heading strong,
.data-panel__model-placement-heading small {
  display: block;
}
.data-panel__model-placement-heading strong {
  color: var(--geo-text, #eff8ff);
  font-size: 10px;
}
.data-panel__model-placement-heading small {
  margin-top: 2px;
  color: var(--geo-text-faint, #7890a2);
  font-size: 8px;
}
.data-panel__model-placement-heading button,
.data-panel__model-apply {
  min-height: 27px;
  padding: 0 8px;
  border: 1px solid color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 50%);
  border-radius: 7px;
  color: var(--geo-accent, #45c8ff);
  background: transparent;
  cursor: pointer;
  font-size: 9px;
}
.data-panel__transform-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}
.data-panel__transform-grid label {
  display: grid;
  gap: 4px;
  color: var(--geo-text-faint, #7890a2);
  font-size: 8px;
}
.data-panel__transform-grid input {
  width: 100%;
  min-width: 0;
  min-height: 29px;
  box-sizing: border-box;
  padding: 0 7px;
  border: 1px solid var(--geo-line, #263c4e);
  border-radius: 7px;
  color: var(--geo-text, #eff8ff);
  background: #091522;
  font-size: 9px;
}
.data-panel__transform-grid input:focus {
  outline: 0;
  border-color: var(--geo-accent, #45c8ff);
}
.data-panel__primary {
  min-height: 34px;
  border: 1px solid color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 40%);
  border-radius: 8px;
  color: #06111d;
  background: var(--geo-accent, #45c8ff);
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
}
.data-panel__loading,
.data-panel__button-loading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.data-panel__loading {
  color: #ffdc8a;
  font-size: 9px;
  white-space: nowrap;
}
.data-panel__loading i,
.data-panel__button-loading i {
  width: 9px;
  height: 9px;
  border: 1.5px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: data-panel-loading-spin 0.7s linear infinite;
}
.data-panel__button-loading {
  justify-content: center;
}
.data-panel__primary:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
.data-panel__resource {
  display: grid;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--geo-line, #263c4e);
}
.data-panel__resource-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 5px;
}
.data-panel__resource-name {
  min-width: 0;
}
.data-panel__resource-name strong,
.data-panel__resource-name small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.data-panel__resource-name .data-panel__resource-policy-warning {
  color: #ffc66f;
}
.data-panel__resource-summary .data-panel__resource-style {
  display: inline-flex;
  width: auto;
  align-items: center;
  gap: 5px;
  padding: 0 7px;
  border: 1px solid color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 72%);
  color: var(--geo-text-soft, #aec3d2);
  font-size: 8px;
  white-space: nowrap;
  background: color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 94%);
}
.data-panel__resource-style i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--geo-text-faint, #7890a2);
  box-shadow: 0 0 0 transparent;
}
.data-panel__resource-style i.is-active {
  background: #55e7ff;
  box-shadow: 0 0 8px color-mix(in srgb, #55e7ff, transparent 18%);
}
.data-panel__resource-name small {
  margin-top: 2px;
  color: var(--geo-text-faint, #7890a2);
  font-size: 8px;
  font-weight: 400;
}
.data-panel__resource-summary .data-panel__resource-adjust {
  width: auto;
  padding: 0 7px;
  color: var(--geo-accent, #45c8ff);
  font-size: 8px;
}
.data-panel__model-editor {
  margin-left: 23px;
  border-color: var(--geo-line, #263c4e);
  background: color-mix(in srgb, var(--geo-surface-strong, #0e1c2a), transparent 12%);
}
.data-panel__resource .data-panel__model-apply {
  width: 100%;
  height: auto;
  min-height: 27px;
  padding: 0 8px;
  border: 1px solid color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 50%);
}
.data-panel__resource .data-panel__model-apply:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.data-panel__resource-summary {
  grid-template-columns: minmax(0, 1fr) auto;
}
.data-panel__resource-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}
.data-panel__resource-actions .data-panel__resource-animation {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--geo-accent);
  font-size: 8px;
}
.data-panel__resource-animation svg {
  width: 11px;
  height: 11px;
  fill: currentColor;
}
.data-panel__resource-actions .data-panel__resource-animation[aria-expanded='true'],
.data-panel__resource-actions .data-panel__resource-animation.is-playing {
  background: color-mix(in srgb, var(--geo-accent), transparent 82%);
}
.data-panel__resource-name {
  overflow: hidden;
}
.data-panel__resource-name .data-panel__resource-policy-warning {
  white-space: normal;
  line-height: 1.5;
}
.data-panel__input input:focus-visible,
button:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--geo-accent);
  outline-offset: 2px;
}
button:hover:not(:disabled) {
  filter: brightness(1.12);
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
@keyframes data-panel-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .data-panel__loading i,
  .data-panel__button-loading i {
    animation: none;
  }
}
</style>
