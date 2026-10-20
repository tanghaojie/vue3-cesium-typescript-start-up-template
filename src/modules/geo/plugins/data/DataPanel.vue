<template>
  <div class="geo-data-panel">
    <div class="data-panel__tabs" role="tablist" aria-label="数据类型">
      <button
        v-for="tab in dataTabs"
        :id="`geo-data-tab-${tab.id}`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`geo-data-panel-${tab.id}`"
        :class="{ 'is-active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <section
      v-if="activeTab === 'imagery'"
      id="geo-data-panel-imagery"
      class="data-panel__section data-panel__tab-panel"
      role="tabpanel"
      aria-labelledby="geo-data-tab-imagery"
    >
      <div class="data-panel__heading">
        <div>
          <span>底图与注记</span>
          <small>按角色浏览可用数据源</small>
        </div>
        <strong>{{ controller.state.imagery.length }} 个图层</strong>
      </div>

      <label class="data-panel__search">
        <span>查找数据源</span>
        <input
          v-model="sourceQuery"
          type="search"
          placeholder="搜索名称、坐标系或用途"
          aria-label="搜索底图、注记或候选源"
        />
      </label>

      <div class="data-panel__filters" role="tablist" aria-label="底图数据源筛选">
        <button
          v-for="filter in sourceFilters"
          :key="filter.id"
          type="button"
          role="tab"
          :aria-selected="sourceFilter === filter.id"
          :class="{ 'is-active': sourceFilter === filter.id }"
          @click="sourceFilter = filter.id"
        >
          {{ filter.label }}<span>{{ filter.count }}</span>
        </button>
      </div>

      <div class="data-panel__catalog" aria-live="polite">
        <section
          v-for="group in filteredSourceGroups"
          :key="group.id"
          class="data-panel__source-group"
        >
          <div class="data-panel__source-group-heading">
            <span>{{ group.label }}</span
            ><small>{{ group.sources.length }} 个源</small>
          </div>

          <article
            v-for="item in group.sources"
            :key="item.source.id"
            class="data-panel__source"
            :class="{
              'is-disabled': !item.availability.available,
              'is-loaded': item.layer,
              'is-degraded': item.layer?.status === 'degraded',
            }"
          >
            <div class="data-panel__source-head">
              <div>
                <strong>{{ item.source.label }}</strong>
                <small>{{ item.source.coordinateSystem }}</small>
              </div>
              <div class="data-panel__source-tools">
                <button
                  class="data-panel__source-info"
                  type="button"
                  :title="item.source.description"
                  :aria-label="`${item.source.label}描述`"
                >
                  i
                </button>
                <span class="data-panel__source-status" :class="`is-${sourceStatusTone(item)}`">
                  {{ sourceStatus(item) }}
                </span>
                <button
                  class="data-panel__source-action"
                  type="button"
                  :disabled="
                    controller.state.busy || !item.availability.available || Boolean(item.layer)
                  "
                  :title="item.availability.reason || item.source.description"
                  @click="addSource(item.source.id)"
                >
                  {{ sourceActionLabel(item) }}
                </button>
              </div>
            </div>
          </article>
        </section>
        <p v-if="!filteredSourceGroups.length" class="data-panel__empty">没有匹配的数据源</p>
      </div>

      <div v-if="controller.state.imagery.length" class="data-panel__layers">
        <div class="data-panel__subheading">
          <span>当前图层</span><small>可调整顺序与透明度</small>
        </div>
        <div
          v-for="layer in controller.state.imagery"
          :key="layer.id"
          class="data-panel__layer"
          :class="{ 'is-degraded': layer.status === 'degraded' }"
        >
          <div class="data-panel__layer-main">
            <label>
              <input
                type="checkbox"
                :checked="layer.show"
                @change="
                  controller.setImageryVisible(
                    layer.id,
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
              <span>{{ layer.label }}</span>
            </label>
            <small
              >{{ layer.coordinateSystem }} ·
              {{ layer.coordinateCorrection === 'gcj02-to-wgs84' ? '已自动校正' : 'WGS84' }} ·
              {{ layer.status === 'degraded' ? '瓦片降级' : '已就绪' }}</small
            >
          </div>
          <div class="data-panel__layer-actions">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="layer.alpha"
              :aria-label="`${layer.label} 透明度`"
              @input="
                controller.setImageryAlpha(
                  layer.id,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
            <button
              type="button"
              aria-label="上移"
              title="上移"
              @click="controller.raiseImagery(layer.id)"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="下移"
              title="下移"
              @click="controller.lowerImagery(layer.id)"
            >
              ↓
            </button>
            <button
              type="button"
              aria-label="定位"
              title="定位"
              @click="controller.flyToImagery(layer.id)"
            >
              ⌖
            </button>
            <button
              type="button"
              aria-label="移除"
              title="移除"
              @click="controller.removeImagery(layer.id)"
            >
              ×
            </button>
          </div>
          <small v-if="layer.error" class="data-panel__error">{{ layer.error }}</small>
        </div>
      </div>
    </section>

    <section
      v-if="activeTab === 'terrain'"
      id="geo-data-panel-terrain"
      class="data-panel__section data-panel__tab-panel"
      role="tabpanel"
      aria-labelledby="geo-data-tab-terrain"
    >
      <div class="data-panel__heading">
        <div><span>地形</span><small>当前场景表面</small></div>
        <strong class="data-panel__terrain-state">
          <i v-if="controller.state.terrain.status === 'loading'" aria-hidden="true" />
          {{
            controller.state.terrain.status === 'loading'
              ? '正在切换…'
              : controller.state.terrain.label
          }}
        </strong>
      </div>
      <div class="data-panel__terrain">
        <button
          type="button"
          :class="{
            'is-active': controller.state.terrain.id === 'ellipsoid',
            'is-loading': controller.state.terrain.status === 'loading',
          }"
          :disabled="controller.state.terrain.status === 'loading'"
          @click="controller.setTerrain('ellipsoid')"
        >
          椭球体
        </button>
        <button
          type="button"
          :class="{
            'is-active': controller.state.terrain.id === 'cesium-world-terrain',
            'is-loading': controller.state.terrain.status === 'loading',
          }"
          :disabled="controller.state.terrain.status === 'loading'"
          @click="controller.setTerrain('cesium-world-terrain')"
        >
          World Terrain
        </button>
      </div>
      <small v-if="controller.state.terrain.error" class="data-panel__error">{{
        controller.state.terrain.error
      }}</small>
    </section>

    <p v-if="controller.state.error" class="data-panel__error">{{ controller.state.error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  GeoImageryAvailability,
  GeoImagerySourceDefinition,
  GeoImagerySourceId,
} from '../../tools/data/imagery-sources'
import type { GeoImageryLayerSnapshot } from '../../tools/data/imagery-layer-manager'
import type { GeoDataController } from './data.controller'

type SourceFilterId = 'all' | GeoImagerySourceDefinition['role']
type DataTabId = 'imagery' | 'terrain'

interface SourceFilter {
  readonly id: SourceFilterId
  readonly label: string
  readonly count: number
}

interface ImagerySourceItem {
  readonly source: GeoImagerySourceDefinition
  readonly availability: GeoImageryAvailability
  readonly layer?: GeoImageryLayerSnapshot
  readonly loading: boolean
}

interface ImagerySourceGroup {
  readonly id: GeoImagerySourceDefinition['role']
  readonly label: string
  readonly sources: readonly ImagerySourceItem[]
}

const props = defineProps<{ controller: GeoDataController }>()
const sourceQuery = ref('')
const sourceFilter = ref<SourceFilterId>('all')
const activeTab = ref<DataTabId>('imagery')
const dataTabs: readonly { id: DataTabId; label: string }[] = [
  { id: 'imagery', label: '底图与注记' },
  { id: 'terrain', label: '地形' },
]
const roleLabels: Record<GeoImagerySourceDefinition['role'], string> = {
  base: '底图',
  overlay: '注记',
  candidate: '候选源',
}
const roleOrder: readonly GeoImagerySourceDefinition['role'][] = ['base', 'overlay', 'candidate']

const sourceFilters = computed<readonly SourceFilter[]>(function createSourceFilters() {
  const catalog = props.controller.imageryCatalog
  return [
    { id: 'all', label: '全部', count: catalog.length },
    ...roleOrder.map(function createRoleFilter(role) {
      return {
        id: role,
        label: roleLabels[role],
        count: catalog.filter((source) => source.role === role).length,
      }
    }),
  ]
})

const filteredSourceGroups = computed<readonly ImagerySourceGroup[]>(function filterSources() {
  const query = sourceQuery.value.trim().toLowerCase()
  const layersBySourceId = new Map<GeoImagerySourceId, GeoImageryLayerSnapshot>()
  props.controller.state.imagery.forEach(function indexLayer(layer) {
    layersBySourceId.set(layer.sourceId, layer)
  })
  return roleOrder
    .filter((role) => sourceFilter.value === 'all' || sourceFilter.value === role)
    .map(function createGroup(role) {
      const sources = props.controller.imageryCatalog
        .filter((source) => source.role === role)
        .filter(function matchesQuery(source) {
          if (!query) {
            return true
          }
          return [
            source.label,
            source.description,
            source.coordinateSystem,
            roleLabels[source.role],
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)
        })
        .map(function createSourceItem(source): ImagerySourceItem {
          return {
            source,
            availability: props.controller.imageryAvailability(source.id),
            layer: layersBySourceId.get(source.id),
            loading: props.controller.state.loadingImagerySource === source.id,
          }
        })
      return { id: role, label: roleLabels[role], sources }
    })
    .filter((group) => group.sources.length > 0)
})

function sourceStatus(item: ImagerySourceItem): string {
  if (item.loading) {
    return '加载中'
  }
  if (item.layer?.status === 'degraded') {
    return '瓦片降级'
  }
  if (item.layer) {
    return '已加载'
  }
  if (!item.availability.available) {
    return '受限'
  }
  return '可添加'
}

function sourceStatusTone(item: ImagerySourceItem): string {
  if (item.loading) {
    return 'loading'
  }
  if (item.layer?.status === 'degraded') {
    return 'degraded'
  }
  if (item.layer) {
    return 'loaded'
  }
  if (!item.availability.available) {
    return 'disabled'
  }
  return 'ready'
}

function sourceActionLabel(item: ImagerySourceItem): string {
  if (item.loading) {
    return '正在加载…'
  }
  if (item.layer) {
    return '已在当前场景'
  }
  if (!item.availability.available) {
    return '暂不可用'
  }
  return '添加到地图'
}

function addSource(sourceId: GeoImagerySourceId): void {
  void props.controller.addImagery(sourceId)
}
</script>

<style scoped>
.geo-data-panel {
  display: grid;
  gap: 18px;
  min-width: 0;
}
.data-panel__tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--geo-line, #263c4e);
  border-radius: 11px;
  background: color-mix(in srgb, var(--geo-surface-strong, #0e1c2a), transparent 16%);
}
.data-panel__tabs button {
  min-height: 34px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--geo-text-faint, #7890a2);
  background: transparent;
  cursor: pointer;
  font-size: 10px;
}
.data-panel__tabs button:hover,
.data-panel__tabs button.is-active {
  border-color: color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 48%);
  color: var(--geo-text, #eff8ff);
  background: color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 86%);
}
.data-panel__tab-panel {
  min-height: 0;
}
.data-panel__section {
  display: grid;
  gap: 10px;
  min-width: 0;
}
.data-panel__heading,
.data-panel__subheading,
.data-panel__source-group-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 10px;
}
.data-panel__heading > div,
.data-panel__subheading,
.data-panel__source-group-heading {
  min-width: 0;
}
.data-panel__heading span,
.data-panel__subheading span,
.data-panel__source-group-heading span {
  color: var(--geo-text-soft, #b6c5d2);
  font-size: 11px;
  font-weight: 700;
}
.data-panel__heading small,
.data-panel__subheading small,
.data-panel__source-group-heading small {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  color: var(--geo-text-faint, #7890a2);
  font-size: 9px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.data-panel__heading strong {
  flex: 0 0 auto;
  color: var(--geo-accent, #45c8ff);
  font-size: 9px;
  font-weight: 700;
}
.data-panel__terrain-state {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.data-panel__terrain-state i {
  width: 8px;
  height: 8px;
  border: 1.5px solid color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 70%);
  border-top-color: var(--geo-accent, #45c8ff);
  border-radius: 50%;
  animation: terrain-loading-spin 0.7s linear infinite;
}
.data-panel__search {
  display: grid;
  gap: 5px;
  color: var(--geo-text-faint, #7890a2);
  font-size: 9px;
}
.data-panel__search input {
  min-height: 32px;
  box-sizing: border-box;
  padding: 0 9px;
  border: 1px solid var(--geo-line, #263c4e);
  border-radius: 8px;
  color: var(--geo-text, #eff8ff);
  background: #091522;
  font-size: 10px;
}
.data-panel__search input:focus {
  outline: 0;
  border-color: var(--geo-accent, #45c8ff);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 84%);
}
.data-panel__filters {
  display: flex;
  gap: 5px;
  min-width: 0;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}
.data-panel__filters::-webkit-scrollbar {
  display: none;
}
.data-panel__filters button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  min-height: 27px;
  padding: 0 9px;
  border: 1px solid var(--geo-line, #263c4e);
  border-radius: 999px;
  color: var(--geo-text-faint, #7890a2);
  background: transparent;
  cursor: pointer;
  font-size: 9px;
}
.data-panel__filters button span {
  color: inherit;
  font-size: 8px;
  opacity: 0.72;
}
.data-panel__filters button:hover,
.data-panel__filters button.is-active {
  border-color: color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 35%);
  color: var(--geo-text, #eff8ff);
  background: color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 87%);
}
.data-panel__toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 24px;
  color: var(--geo-text-faint, #7890a2);
  cursor: pointer;
  font-size: 9px;
}
.data-panel__toggle input {
  margin: 0;
  accent-color: var(--geo-accent, #45c8ff);
}
.data-panel__catalog {
  display: grid;
  gap: 13px;
  max-height: min(330px, 38vh);
  overflow-y: auto;
  padding: 1px 5px 3px 1px;
  scrollbar-color: color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 35%) transparent;
  scrollbar-width: thin;
}
.data-panel__catalog::-webkit-scrollbar {
  width: 6px;
}
.data-panel__catalog::-webkit-scrollbar-track {
  background: transparent;
}
.data-panel__catalog::-webkit-scrollbar-thumb {
  border: 1px solid transparent;
  border-radius: 999px;
  background: color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 45%);
  background-clip: padding-box;
}
.data-panel__source-group {
  display: grid;
  gap: 7px;
  min-width: 0;
}
.data-panel__source-group-heading {
  padding: 0 2px;
}
.data-panel__source-group-heading span {
  color: var(--geo-accent, #45c8ff);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.data-panel__source {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 5px 7px;
  border: 1px solid var(--geo-line, #263c4e);
  border-radius: 11px;
  background: color-mix(in srgb, var(--geo-surface-strong, #0e1c2a), transparent 12%);
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    opacity 0.18s ease;
}
.data-panel__source:hover,
.data-panel__source.is-loaded {
  border-color: color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 55%);
  background: color-mix(
    in srgb,
    var(--geo-accent, #45c8ff),
    var(--geo-surface-strong, #0e1c2a) 92%
  );
}
.data-panel__source.is-disabled {
  border-color: color-mix(in srgb, var(--geo-line, #263c4e), transparent 10%);
  opacity: 0.78;
}
.data-panel__source.is-degraded {
  border-color: color-mix(in srgb, #ff9ca7, transparent 45%);
}
.data-panel__source-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
  width: 100%;
}
.data-panel__source-head > div {
  min-width: 0;
}
.data-panel__source-head strong {
  display: block;
  overflow: hidden;
  color: var(--geo-text, #eff8ff);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.data-panel__source-head small {
  display: block;
  margin-top: 2px;
  color: var(--geo-text-faint, #7890a2);
  font-size: 8px;
}
.data-panel__source-tools {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
}
.data-panel__source-info {
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid var(--geo-line, #263c4e);
  border-radius: 50%;
  color: var(--geo-text-faint, #7890a2);
  background: transparent;
  cursor: help;
  font-family: Georgia, serif;
  font-size: 11px;
  font-style: italic;
  line-height: 16px;
}
.data-panel__source-info:hover,
.data-panel__source-info:focus-visible {
  outline: 0;
  border-color: var(--geo-accent, #45c8ff);
  color: var(--geo-accent, #45c8ff);
}
.data-panel__source-status {
  flex: 0 0 auto;
  padding: 3px 6px;
  border-radius: 999px;
  color: var(--geo-text-faint, #7890a2);
  background: var(--geo-surface-hover, #1b2a38);
  font-size: 8px;
  line-height: 1;
}
.data-panel__source-status.is-ready {
  color: var(--geo-accent, #45c8ff);
  background: color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 87%);
}
.data-panel__source-status.is-loaded {
  color: #a9e9c0;
  background: color-mix(in srgb, #77d69a, transparent 85%);
}
.data-panel__source-status.is-loading {
  color: #ffdc8a;
  background: color-mix(in srgb, #ffca63, transparent 84%);
}
.data-panel__source-status.is-degraded {
  color: #ffb0b8;
  background: color-mix(in srgb, #ff7d8c, transparent 84%);
}
.data-panel__source p {
  display: -webkit-box;
  min-height: 25px;
  margin: 0;
  overflow: hidden;
  color: var(--geo-text-faint, #7890a2);
  font-size: 9px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.data-panel__source-action {
  min-height: 24px;
  padding: 0 7px;
  border: 1px solid color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 52%);
  border-radius: 7px;
  color: var(--geo-accent, #45c8ff);
  background: color-mix(in srgb, var(--geo-accent, #45c8ff), transparent 91%);
  cursor: pointer;
  font-size: 9px;
  font-weight: 700;
}
.data-panel__source-action:hover:not(:disabled),
.data-panel__source-action:focus-visible:not(:disabled) {
  outline: 0;
  color: #06111d;
  background: var(--geo-accent, #45c8ff);
}
.data-panel__source-action:disabled {
  border-color: var(--geo-line, #263c4e);
  color: var(--geo-text-faint, #7890a2);
  background: var(--geo-surface-hover, #1b2a38);
  cursor: not-allowed;
  opacity: 0.85;
}
.data-panel__empty {
  margin: 0;
  padding: 16px 4px;
  color: var(--geo-text-faint, #7890a2);
  font-size: 10px;
  text-align: center;
}
.data-panel__layers {
  display: grid;
  gap: 7px;
}
.data-panel__layer {
  display: grid;
  gap: 7px;
  padding: 8px;
  border: 1px solid var(--geo-line, #263c4e);
  border-radius: 9px;
  background: color-mix(in srgb, var(--geo-surface-strong, #0e1c2a), transparent 20%);
}
.data-panel__layer.is-degraded {
  border-color: color-mix(in srgb, #ff9ca7, transparent 50%);
}
.data-panel__layer-main {
  display: grid;
  gap: 3px;
}
.data-panel__layer-main label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--geo-text, #eff8ff);
  font-size: 10px;
}
.data-panel__layer-main > small {
  padding-left: 23px;
  color: var(--geo-text-faint, #7890a2);
  font-size: 8px;
}
.data-panel__layer-actions {
  display: grid;
  grid-template-columns: 1fr repeat(4, 24px);
  align-items: center;
  gap: 4px;
}
.data-panel__layer-actions input {
  width: 100%;
  accent-color: var(--geo-accent, #45c8ff);
}
.data-panel__layer-actions button {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  color: var(--geo-text-faint, #7890a2);
  background: transparent;
  cursor: pointer;
}
.data-panel__layer-actions button:hover {
  color: var(--geo-text, #eff8ff);
  background: var(--geo-surface-hover, #1b2a38);
}
.data-panel__error {
  color: #ffcb78;
  font-size: 9px;
  line-height: 1.45;
}
.data-panel__error {
  margin: 0;
  color: #ff9ca7;
}
.data-panel__terrain {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.data-panel__terrain button {
  min-height: 38px;
  padding: 7px 9px;
  border: 1px solid var(--geo-line, #263c4e);
  border-radius: 9px;
  color: var(--geo-text, #eff8ff);
  background: var(--geo-surface-strong, #0e1c2a);
  cursor: pointer;
  font-size: 10px;
  text-align: left;
}
.data-panel__terrain button:hover,
.data-panel__terrain button.is-active {
  border-color: var(--geo-accent, #45c8ff);
}
.data-panel__terrain button.is-loading {
  position: relative;
  color: var(--geo-text-faint, #7890a2);
}
.data-panel__terrain button:disabled {
  cursor: wait;
  opacity: 0.72;
}
@keyframes terrain-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .data-panel__terrain-state i {
    animation: none;
  }
}
</style>
