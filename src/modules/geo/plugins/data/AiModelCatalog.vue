<template>
  <section class="ai-model-catalog" aria-label="AI 模型目录">
    <header class="ai-model-catalog__heading">
      <div><strong>AIModels</strong><small>发布模型 · 点击加载到场景</small></div>
      <button
        type="button"
        :disabled="controller.state.aiModelCatalogStatus === 'loading'"
        @click="controller.refreshAiModelCatalog()"
      >
        刷新目录
      </button>
    </header>
    <label class="ai-model-catalog__search">
      <span>查找模型</span>
      <input v-model="query" type="search" placeholder="搜索模型名称或简介" />
    </label>
    <p v-if="controller.state.aiModelCatalogStatus === 'loading'" role="status">
      正在读取发布目录…
    </p>
    <div
      v-else-if="controller.state.aiModelCatalogError"
      class="ai-model-catalog__error"
      role="alert"
    >
      <p>{{ controller.state.aiModelCatalogError }}</p>
      <button type="button" @click="controller.refreshAiModelCatalog()">重新读取</button>
    </div>
    <p v-else-if="!items.length" class="ai-model-catalog__empty">
      {{ query.trim() ? '没有匹配的模型' : '暂无已发布模型' }}
    </p>
    <div v-else class="ai-model-catalog__list">
      <article v-for="item in items" :key="item.id" class="ai-model-card">
        <button
          class="ai-model-card__preview"
          type="button"
          :disabled="controller.state.busy"
          :aria-label="`加载 ${item.label}`"
          @click="load(item)"
        >
          <img
            v-if="item.thumbnail && !failedThumbnails[item.id]"
            :src="item.thumbnail"
            alt=""
            loading="lazy"
            @error="failedThumbnails[item.id] = true"
          />
          <AppIcon v-else name="grid" />
          <span v-if="controller.state.aiModelLoadingId === item.id">正在加载…</span>
          <span v-else-if="loadedGroup(item.id)">已加入场景</span>
        </button>
        <div class="ai-model-card__body">
          <strong>{{ item.label }}</strong>
          <p>{{ item.description }}</p>
          <div class="ai-model-card__actions">
            <label v-if="item.modes.length > 1">
              <span>模式</span>
              <select
                :value="selection(item).modeId"
                :disabled="controller.state.busy"
                @change="selectMode(item, $event)"
              >
                <option v-for="mode in item.modes" :key="mode.id" :value="mode.id">
                  {{ mode.label }}
                </option>
              </select>
            </label>
            <small v-else>{{ selectedMode(item).label }}</small>
            <label v-if="selectedMode(item).variants.length">
              <span>精细度</span>
              <select
                :value="selection(item).variantId"
                :disabled="controller.state.busy"
                @change="selectVariant(item, $event)"
              >
                <option value="original">原始版</option>
                <option
                  v-for="variant in selectedMode(item).variants"
                  :key="variant.id"
                  :value="variant.id"
                >
                  {{ variant.label }}
                </option>
              </select>
            </label>
            <small v-else>原始版</small>
            <button
              class="ai-model-card__load"
              type="button"
              :disabled="controller.state.busy"
              @click="load(item)"
            >
              {{ actionLabel(item) }}
            </button>
          </div>
        </div>
      </article>
    </div>
    <section
      v-if="controller.state.aiModelGroups.length"
      class="ai-model-catalog__groups"
      aria-label="已加载 AI 模型"
    >
      <h3>已加载 AI 模型</h3>
      <article
        v-for="group in controller.state.aiModelGroups"
        :key="group.id"
        class="ai-model-group"
      >
        <div class="ai-model-group__heading">
          <label
            ><input
              type="checkbox"
              :checked="group.show"
              :disabled="controller.state.busy"
              @change="
                controller.setResourceVisible(
                  group.modelId,
                  ($event.target as HTMLInputElement).checked,
                )
              "
            />{{ group.label }}</label
          >
          <button
            type="button"
            :disabled="controller.state.busy"
            @click="controller.removeResource(group.modelId)"
          >
            移除整组
          </button>
        </div>
        <small>{{ group.modeLabel }} · {{ group.variantLabel }}</small>
        <small>{{
          group.status === 'partial'
            ? '部分配套未加载，可重新加载'
            : `${group.resourceIds.length} 项资源已就绪`
        }}</small>
        <p v-if="group.terrainHidden" class="ai-model-catalog__error">
          当前地形不兼容，已暂停显示；切回椭球体后恢复。
        </p>
        <details>
          <summary>定位说明与来源</summary>
          <p>{{ group.notice }}</p>
          <a
            v-for="credit in group.attribution"
            :key="credit.url + credit.text"
            :href="credit.url"
            target="_blank"
            rel="noopener noreferrer"
            >{{ credit.text }}</a
          >
        </details>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { GeoDataController } from './data.controller'
import {
  resolveAiModelSelection,
  type AiModelCatalogItem,
  type AiModelModeId,
  type AiModelSelection,
} from '../../tools/data/ai-model-catalog'

const props = defineProps<{ controller: GeoDataController }>()
const query = ref('')
const selections = reactive<Record<string, AiModelSelection | undefined>>({})
const failedThumbnails = reactive<Record<string, boolean>>({})
const items = computed(function filteredModels() {
  const text = query.value.trim().toLowerCase()
  return props.controller.state.aiModelCatalog.filter((item) =>
    `${item.label} ${item.description}`.toLowerCase().includes(text),
  )
})

function loadedGroup(id: string) {
  return props.controller.state.aiModelGroups.find((group) => group.id === id)
}

function selection(item: AiModelCatalogItem): AiModelSelection {
  return resolveAiModelSelection(item, selections[item.id] ?? loadedGroup(item.id))
}

function selectedMode(item: AiModelCatalogItem) {
  return item.modes.find((mode) => mode.id === selection(item).modeId)!
}

function selectMode(item: AiModelCatalogItem, event: Event): void {
  selections[item.id] = resolveAiModelSelection(item, {
    modeId: (event.target as HTMLSelectElement).value as AiModelModeId,
  })
}

function selectVariant(item: AiModelCatalogItem, event: Event): void {
  selections[item.id] = resolveAiModelSelection(item, {
    ...selection(item),
    variantId: (event.target as HTMLSelectElement).value,
  })
}

function actionLabel(item: AiModelCatalogItem): string {
  if (props.controller.state.aiModelLoadingId === item.id) {
    return '正在加载…'
  }
  const group = loadedGroup(item.id)
  if (!group) {
    return '加载模型'
  }
  const selected = selection(item)
  return group.status === 'partial' ||
    group.modeId !== selected.modeId ||
    group.variantId !== selected.variantId
    ? '重新加载'
    : '定位模型'
}

function load(item: AiModelCatalogItem): void {
  void props.controller.loadAiModel(item.id, selection(item))
}

onMounted(function readCatalog() {
  if (props.controller.state.aiModelCatalogStatus === 'idle') {
    void props.controller.refreshAiModelCatalog()
  }
})
</script>

<style scoped>
.ai-model-catalog {
  display: grid;
  gap: 13px;
  min-width: 0;
}
.ai-model-catalog__heading,
.ai-model-card__actions,
.ai-model-group__heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.ai-model-catalog__heading strong {
  display: block;
  color: var(--geo-text);
  font-size: 14px;
}
.ai-model-catalog__heading small,
.ai-model-card__actions small,
.ai-model-group > small {
  color: var(--geo-text-faint);
  font-size: 10px;
}
.ai-model-catalog button {
  min-height: 30px;
  padding: 4px 9px;
  border: 1px solid var(--geo-line);
  border-radius: 7px;
  color: var(--geo-text-soft);
  background: var(--geo-surface-hover);
  cursor: pointer;
  font-size: 10px;
}
.ai-model-catalog button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ai-model-catalog button:focus-visible,
.ai-model-catalog input:focus-visible,
.ai-model-catalog select:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--geo-accent);
  outline-offset: 2px;
}
.ai-model-catalog__search {
  display: grid;
  gap: 6px;
  font-size: 10px;
  color: var(--geo-text-faint);
}
.ai-model-catalog__search input,
select {
  width: 100%;
  box-sizing: border-box;
  min-height: 33px;
  border: 1px solid var(--geo-line);
  border-radius: 7px;
  padding: 0 9px;
  color: var(--geo-text);
  background: #091522;
  font-size: 11px;
}
.ai-model-catalog__list,
.ai-model-catalog__groups {
  display: grid;
  gap: 12px;
}
.ai-model-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--geo-line);
  border-radius: 12px;
  background: var(--geo-surface-strong);
}
.ai-model-card .ai-model-card__preview {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 132px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-bottom: 1px solid var(--geo-line);
  border-radius: 0;
  background: #102333;
}
.ai-model-card__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ai-model-card__preview :deep(svg) {
  width: 34px;
  height: 34px;
  color: var(--geo-accent);
}
.ai-model-card__preview span {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 4px 7px;
  border-radius: 5px;
  color: var(--geo-text);
  background: rgba(4, 13, 22, 0.85);
}
.ai-model-card__body {
  display: grid;
  gap: 8px;
  padding: 12px;
}
.ai-model-card__body > strong {
  color: var(--geo-text);
  font-size: 12px;
}
.ai-model-catalog p {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--geo-text-faint);
  overflow-wrap: anywhere;
}
.ai-model-card__actions label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--geo-text-faint);
  font-size: 10px;
}
.ai-model-card__actions {
  flex-wrap: wrap;
}
.ai-model-card__actions select {
  width: auto;
  min-width: 0;
}
.ai-model-card__actions .ai-model-card__load {
  flex-shrink: 0;
  border-color: color-mix(in srgb, var(--geo-accent), transparent 50%);
  color: var(--geo-accent);
  background: color-mix(in srgb, var(--geo-accent), transparent 91%);
}
.ai-model-catalog .ai-model-catalog__error,
.ai-model-catalog__error p {
  color: #ffb1a9;
}
.ai-model-catalog__error {
  display: grid;
  gap: 8px;
}
.ai-model-catalog__empty {
  padding: 18px 8px;
  text-align: center;
}
.ai-model-catalog__groups h3 {
  margin: 4px 0 0;
  color: var(--geo-text-soft);
  font-size: 12px;
}
.ai-model-group {
  display: grid;
  gap: 8px;
  padding: 11px;
  border: 1px solid var(--geo-line);
  border-radius: 10px;
}
.ai-model-group__heading label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--geo-text);
  font-size: 11px;
}
.ai-model-group input {
  accent-color: var(--geo-accent);
}
.ai-model-group details {
  color: var(--geo-text-faint);
  font-size: 10px;
  line-height: 1.7;
}
.ai-model-group summary {
  cursor: pointer;
}
.ai-model-group a {
  display: block;
  color: var(--geo-accent);
  overflow-wrap: anywhere;
}
</style>
