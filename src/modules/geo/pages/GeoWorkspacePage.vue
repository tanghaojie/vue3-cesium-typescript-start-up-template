<template>
  <main
    ref="workspaceRoot"
    class="geo-workspace"
    :class="{
      'geo-workspace--status-collapsed': statusBarCollapsed,
      'geo-workspace--has-bottom-docks': bottomDocks.length > 0,
      'geo-workspace--bottom-docks-collapsed': bottomDocksCollapsed,
      'geo-workspace--framed': Boolean(runtime.presentation.state.aspectRatio),
      'geo-workspace--clean': runtime.presentation.state.clean,
    }"
    :aria-label="t('geo.views.workspace')"
  >
    <div
      ref="mapContainer"
      class="geo-map-host"
      :style="mapFrameStyle"
      :class="{ 'geo-map-host--crosshair': runtime.interactions.state.cursor === 'crosshair' }"
    />
    <div
      v-show="!runtime.presentation.state.aspectRatio"
      class="geo-map-atmosphere"
      aria-hidden="true"
    />

    <a
      v-if="projectInfoUrl"
      v-show="!runtime.presentation.state.clean && !runtime.presentation.state.aspectRatio"
      class="geo-project-info"
      :href="projectInfoUrl"
      target="_blank"
      rel="noopener"
      >{{ t('geo.workspace.projectInfo') }} <span aria-hidden="true">↗</span></a
    >

    <template v-if="runtime.state.status === 'ready'">
      <component
        :is="assemblyPreviewComponent"
        v-if="assemblyPreviewComponent"
        v-show="!runtime.presentation.state.clean"
      />
      <GeoToolRail
        v-show="!runtime.presentation.state.clean"
        :items="taskRailItems"
        :active-id="activeTaskId"
        :label="t('geo.views.workspace')"
        @select="selectTask"
      />

      <GeoPanelFrame
        v-if="panelOpen"
        v-show="!runtime.presentation.state.clean"
        :title="activeTask.label"
        :eyebrow="`TASK · ${activeTask.id.toUpperCase()}`"
        :close-label="t('geo.tasks.closePanel')"
        @close="closePanel"
      >
        <component :is="activePanelComponent" v-if="activePanelComponent" />
        <GeoTaskOverview
          v-else
          :icon="activeTask.icon"
          :description="activeTask.description"
          :pending-label="t('geo.tasks.pending')"
        />
      </GeoPanelFrame>

      <GeoMapControls
        v-show="!runtime.presentation.state.clean && !runtime.presentation.state.aspectRatio"
        :label="t('geo.views.workspace')"
        :scene-mode="runtime.state.sceneMode"
        :fullscreen="runtime.state.fullscreen"
        :heading="runtime.state.heading"
        :north-label="t('geo.controls.orientNorth')"
        :locate-label="t('geo.controls.locateUser')"
        :mode2d-label="t('geo.controls.mode2d')"
        :mode3d-label="t('geo.controls.mode3d')"
        :fullscreen-label="t('geo.controls.fullscreen')"
        :exit-fullscreen-label="t('geo.controls.exitFullscreen')"
        @orient-north="runtime.orientNorth()"
        @locate="locateUser"
        @toggle-mode="toggleSceneMode"
        @toggle-fullscreen="toggleFullscreen"
      />

      <GeoInspectorFrame
        v-if="activeInspectorComponent"
        v-show="!runtime.presentation.state.clean"
        :title="t('geo.inspector.title')"
        eyebrow="SELECTION"
      >
        <component :is="activeInspectorComponent" />
      </GeoInspectorFrame>

      <GeoPluginErrors
        v-show="!runtime.presentation.state.clean"
        :title="t('geo.plugins.errors')"
        :errors="runtime.plugins.state.errors"
      />

      <component :is="overlay.component" v-for="overlay in overlays" :key="overlay.id" />

      <div
        v-if="bottomDocks.length"
        v-show="!runtime.presentation.state.clean && !runtime.presentation.state.aspectRatio"
        class="geo-bottom-docks"
      >
        <component
          :is="dock.component"
          v-for="dock in bottomDocks"
          :key="dock.id"
          :collapsed="bottomDockCollapsed[dock.id] ?? true"
          :joined-with-status="!statusBarCollapsed"
          :collapse-label="t('geo.time.collapse')"
          :expand-label="t('geo.time.expand')"
          @update:collapsed="setBottomDockCollapsed(dock.id, $event)"
        />
      </div>

      <GeoStatusBar
        v-show="!runtime.presentation.state.clean"
        :longitude="runtime.state.longitude"
        :latitude="runtime.state.latitude"
        :surface-height="runtime.state.surfaceHeight"
        :camera-height="runtime.state.cameraHeight"
        :fps="runtime.state.framesPerSecond"
        :hint="activeHint"
        :active="Boolean(runtime.interactions.state.activeId)"
        :longitude-label="t('geo.status.longitude')"
        :latitude-label="t('geo.status.latitude')"
        :height-label="t('geo.status.height')"
        :camera-label="t('geo.status.camera')"
        :fps-label="t('geo.status.fps')"
        :collapsed="statusBarCollapsed"
        :compact="bottomDocks.length > 0 && !bottomDocksCollapsed"
        :joined-with-dock="bottomDocks.length > 0 && !statusBarCollapsed"
        :collapse-label="t('geo.status.collapse')"
        :expand-label="t('geo.status.expand')"
        @toggle="statusBarCollapsed = !statusBarCollapsed"
      />
    </template>

    <GeoLoadState
      v-if="runtime.state.status === 'idle' || runtime.state.status === 'mounting'"
      :title="t('geo.workspace.loading')"
      :detail="t('geo.workspace.loadingDetail')"
    />
    <GeoLoadState
      v-else-if="runtime.state.status === 'failed'"
      :title="t('geo.workspace.failed')"
      :detail="runtime.state.error || t('geo.workspace.webglHint')"
      :action-label="t('geo.workspace.retry')"
      @action="mountWorkspace"
    />
  </main>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  type Component,
} from 'vue'
import { useLocalization } from '@/shared/localization/localization'
import GeoLoadState from '../components/shell/GeoLoadState.vue'
import GeoInspectorFrame from '../components/shell/GeoInspectorFrame.vue'
import GeoMapControls from '../components/shell/GeoMapControls.vue'
import GeoPanelFrame from '../components/shell/GeoPanelFrame.vue'
import GeoPluginErrors from '../components/shell/GeoPluginErrors.vue'
import GeoStatusBar from '../components/shell/GeoStatusBar.vue'
import GeoTaskOverview from '../components/shell/GeoTaskOverview.vue'
import GeoToolRail, { type GeoTaskRailItem } from '../components/shell/GeoToolRail.vue'
import { provideGeoRuntime } from '../core/geo-context'
import type {
  GeoBottomDockContribution,
  GeoOverlayContribution,
  GeoInspectorContribution,
  GeoPanelContribution,
  GeoTaskGroupContribution,
  GeoToolContribution,
} from '../core/geo-plugin'
import { createGeoRuntime } from '../core/geo-runtime'
import { geoPlugins } from '../geo.plugins'

defineProps<{ projectInfoUrl?: string }>()

interface GeoTaskItem extends GeoTaskRailItem {
  description: string
}

const { t } = useLocalization()
const assemblyPreviewComponent =
  import.meta.env.DEV && new URLSearchParams(window.location.search).get('assemblyPreview') === '1'
    ? defineAsyncComponent(() => import('../components/preview/AssemblyPreview.vue'))
    : undefined
const workspaceRoot = ref<HTMLElement>()
const mapContainer = ref<HTMLElement>()
const activeTaskId = ref<string | undefined>('data')
const panelOpen = ref(true)
const statusBarCollapsed = ref(true)
const bottomDockCollapsed = ref<Record<string, boolean>>({})
const locationError = ref<string>()
const runtime = createGeoRuntime({ plugins: geoPlugins })
provideGeoRuntime(runtime)
const viewport = ref({ width: window.innerWidth, height: window.innerHeight })
let resizeObserver: ResizeObserver | undefined
const mapFrameStyle = computed(function compositionFrame() {
  const ratio = runtime.presentation.state.aspectRatio
  if (!ratio) {
    return undefined
  }
  const width = Math.min(viewport.value.width, viewport.value.height * ratio)
  return {
    width: `${width}px`,
    height: `${width / ratio}px`,
    inset: 'auto',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  }
})

const taskDefinitions = computed<readonly GeoTaskItem[]>(function taskMetadata() {
  return [
    {
      id: 'data',
      label: t('geo.tasks.data'),
      icon: 'database',
      description: t('geo.tasks.dataDescription'),
    },
    {
      id: 'external-data',
      label: t('geo.tasks.externalData'),
      icon: 'link',
      description: t('geo.tasks.externalDataDescription'),
    },
    {
      id: 'view',
      label: t('geo.tasks.view'),
      icon: 'monitor',
      description: t('geo.tasks.viewDescription'),
    },
    {
      id: 'scene',
      label: t('geo.tasks.scene'),
      icon: 'layers',
      description: t('geo.tasks.sceneDescription'),
    },
    {
      id: 'flight',
      label: t('geo.tasks.flight'),
      icon: 'activity',
      description: t('geo.tasks.flightDescription'),
    },
    {
      id: 'capture',
      label: t('geo.tasks.capture'),
      icon: 'monitor',
      description: t('geo.tasks.captureDescription'),
    },
    {
      id: 'drawing',
      label: t('geo.tasks.drawing'),
      icon: 'edit',
      description: t('geo.tasks.drawingDescription'),
    },
    {
      id: 'measurement',
      label: t('geo.tasks.measurement'),
      icon: 'map-pin',
      description: t('geo.measurement.idleHint'),
    },
    {
      id: 'model',
      label: t('geo.tasks.model'),
      icon: 'grid',
      description: t('geo.tasks.modelDescription'),
    },
    {
      id: 'terrain',
      label: t('geo.tasks.terrain'),
      icon: 'chart',
      description: t('geo.tasks.terrainDescription'),
    },
    {
      id: 'compare',
      label: t('geo.tasks.compare'),
      icon: 'panel',
      description: t('geo.tasks.compareDescription'),
    },
  ]
})

const tasks = computed<readonly GeoTaskItem[]>(function geoTasks() {
  const installedGroupIds = new Set(
    runtime.plugins
      .getContributions('group')
      .map((entry) => (entry.contribution as GeoTaskGroupContribution).id),
  )
  return taskDefinitions.value.filter((task) => installedGroupIds.has(task.id))
})
const taskRailItems = computed<readonly GeoTaskRailItem[]>(function railItems() {
  return tasks.value.map(function toRailItem(task) {
    return { id: task.id, label: task.label, icon: task.icon }
  })
})
const activeTask = computed<GeoTaskItem>(function currentTask() {
  return (
    tasks.value.find((task) => task.id === activeTaskId.value) ??
    tasks.value[0] ??
    taskDefinitions.value[0]
  )
})
const activePanelComponent = computed<Component | undefined>(function currentPanelComponent() {
  const activePanelId = runtime.plugins.state.activePanelId
  if (!panelOpen.value || !activePanelId) {
    return undefined
  }
  const entry = runtime.plugins.getContribution(activePanelId)
  if (!entry || entry.kind !== 'panel') {
    return undefined
  }
  return (entry.contribution as GeoPanelContribution).component as Component
})
const activeInspectorComponent = computed<Component | undefined>(
  function currentInspectorComponent() {
    const entry = runtime.plugins.getContributions('inspector').find(function findInspector(item) {
      return (item.contribution as GeoInspectorContribution).matches(undefined)
    })
    return entry ? (entry.contribution as GeoInspectorContribution).component : undefined
  },
)
const bottomDocks = computed(function registeredBottomDocks() {
  return runtime.plugins
    .getContributions('bottomDock')
    .map(function toBottomDock(entry) {
      const contribution = entry.contribution as GeoBottomDockContribution
      return { id: entry.id, component: contribution.component, order: contribution.order ?? 0 }
    })
    .sort(function compareBottomDocks(left, right) {
      return left.order - right.order || left.id.localeCompare(right.id)
    })
})
const overlays = computed(function registeredOverlays() {
  return runtime.plugins.getContributions('overlay').map(function toOverlay(entry) {
    return { id: entry.id, component: (entry.contribution as GeoOverlayContribution).component }
  })
})
const bottomDocksCollapsed = computed(function allBottomDocksCollapsed() {
  return (
    bottomDocks.value.length > 0 &&
    bottomDocks.value.every((dock) => bottomDockCollapsed.value[dock.id] ?? true)
  )
})
const activeHint = computed(function currentHint() {
  if (locationError.value) {
    return locationError.value
  }
  if (runtime.interactions.state.activeId) {
    return `${t('geo.status.activeTool')} · ${runtime.interactions.state.activeId}`
  }
  return activeTask.value.description
})

async function locateUser(): Promise<void> {
  locationError.value = undefined
  try {
    await runtime.locateUser()
  } catch (error) {
    locationError.value = error instanceof Error ? error.message : '网页定位失败'
  }
}

async function mountWorkspace(): Promise<void> {
  const container = mapContainer.value
  if (!container) {
    return
  }
  try {
    await runtime.mount(container)
    if (!tasks.value.some((task) => task.id === activeTaskId.value)) {
      activeTaskId.value = tasks.value[0]?.id ?? 'data'
    }
    const taskId = activeTaskId.value
    if (taskId) {
      openTaskPanel(taskId)
    }
  } catch {
    // GeoRuntime owns the diagnosable failure state rendered above.
  }
}

function selectTask(id: string): void {
  if (activeTaskId.value === id) {
    panelOpen.value = !panelOpen.value
    if (panelOpen.value) {
      openTaskPanel(id)
    } else {
      runtime.plugins.setActivePanel(undefined)
      activeTaskId.value = undefined
    }
    return
  }
  runtime.interactions.cancel('switch')
  activeTaskId.value = id
  panelOpen.value = true
  openTaskPanel(id)
}

function openTaskPanel(groupId: string): void {
  const panelTool = runtime.plugins.getContributions('tool').find(function findPanelTool(entry) {
    const contribution = entry.contribution as GeoToolContribution
    return contribution.kind === 'panel' && contribution.groupId === groupId
  })
  if (!panelTool) {
    runtime.plugins.setActivePanel(undefined)
    return
  }
  void runtime.plugins.executeTool(panelTool.id)
}

function closePanel(): void {
  runtime.interactions.cancel('cancel')
  runtime.plugins.setActivePanel(undefined)
  panelOpen.value = false
  activeTaskId.value = undefined
}

function setBottomDockCollapsed(id: string, collapsed: boolean): void {
  bottomDockCollapsed.value = { ...bottomDockCollapsed.value, [id]: collapsed }
}

function toggleSceneMode(): void {
  runtime.setSceneMode(runtime.state.sceneMode === '3d' ? '2d' : '3d')
}

async function toggleFullscreen(): Promise<void> {
  const target = workspaceRoot.value
  if (target) {
    await runtime.toggleFullscreen(target)
  }
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape') {
    return
  }
  if (runtime.interactions.state.activeId) {
    runtime.interactions.cancel('cancel')
    return
  }
  runtime.plugins.setActivePanel(undefined)
  panelOpen.value = false
  activeTaskId.value = undefined
}

onMounted(function mountGeoPage() {
  resizeObserver = new ResizeObserver(function measureWorkspace(entries) {
    const rect = entries[0]?.contentRect
    if (rect) {
      viewport.value = { width: rect.width, height: rect.height }
    }
  })
  if (workspaceRoot.value) {
    resizeObserver.observe(workspaceRoot.value)
  }
  window.addEventListener('keydown', handleEscape)
  void mountWorkspace()
})

onBeforeUnmount(function disposeGeoPage() {
  resizeObserver?.disconnect()
  window.removeEventListener('keydown', handleEscape)
  runtime.dispose()
})
</script>

<style scoped>
.geo-project-info {
  position: absolute;
  z-index: 20;
  top: 22px;
  left: 50%;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 8px 14px;
  transform: translateX(-50%);
  border: 1px solid var(--geo-line);
  border-radius: 10px;
  color: var(--geo-text);
  background: var(--geo-surface-strong);
  font-size: 12px;
  backdrop-filter: blur(18px);
}

.geo-project-info:hover {
  color: var(--geo-accent);
}

.geo-project-info:focus-visible {
  outline: 2px solid var(--geo-accent);
  outline-offset: 3px;
}

.geo-workspace {
  --geo-accent: #49c9ff;
  --geo-accent-deep: #268fd9;
  --geo-text: #eef7fc;
  --geo-text-soft: rgba(226, 240, 248, 0.78);
  --geo-text-faint: rgba(215, 231, 240, 0.52);
  --geo-line: rgba(195, 221, 235, 0.13);
  --geo-line-strong: rgba(195, 221, 235, 0.22);
  --geo-surface: rgba(7, 16, 26, 0.88);
  --geo-surface-strong: rgba(6, 14, 23, 0.91);
  --geo-surface-hover: rgba(173, 218, 241, 0.09);
  --geo-shadow: 0 20px 54px rgba(0, 5, 10, 0.4);
  --geo-statusbar-height: 48px;
  --geo-bottom-dock-bottom: calc(14px + var(--geo-statusbar-height) - 1px);
  --geo-bottom-dock-height: 70px;
  --geo-side-bottom: 86px;
  --geo-credits-bottom: calc(var(--geo-bottom-dock-bottom) + var(--geo-bottom-dock-height) + 16px);
  position: fixed;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  color: var(--geo-text);
  background: #07111c;
  isolation: isolate;
}

.geo-workspace--status-collapsed {
  --geo-bottom-dock-bottom: 14px;
  --geo-credits-bottom: calc(var(--geo-bottom-dock-bottom) + var(--geo-bottom-dock-height) + 16px);
}

.geo-workspace--framed {
  background: #02070c;
}

.geo-workspace--clean {
  --geo-credits-bottom: 8px;
}

.geo-workspace--bottom-docks-collapsed {
  --geo-bottom-dock-height: 44px;
}

.geo-workspace--has-bottom-docks {
  --geo-side-bottom: calc(var(--geo-bottom-dock-bottom) + var(--geo-bottom-dock-height) + 16px);
}

.geo-map-host,
.geo-map-atmosphere {
  position: absolute;
  inset: 0;
}

.geo-map-host {
  background: radial-gradient(circle at 58% 38%, rgba(32, 90, 130, 0.4), transparent 30%), #07111c;
}

.geo-map-host :deep(canvas) {
  cursor: grab !important;
}

.geo-map-atmosphere {
  z-index: 5;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(2, 8, 14, 0.18), transparent 22% 74%, rgba(2, 7, 12, 0.36)),
    radial-gradient(circle at 50% 45%, transparent 48%, rgba(1, 6, 11, 0.24) 100%);
}

.geo-map-host--crosshair :deep(canvas) {
  cursor: crosshair !important;
}

.geo-workspace :global(.cesium-viewer),
.geo-workspace :global(.cesium-viewer-cesiumWidgetContainer),
.geo-workspace :global(.cesium-widget),
.geo-workspace :global(.cesium-widget canvas) {
  width: 100%;
  height: 100%;
}

.geo-workspace :global(.cesium-viewer-bottom) {
  right: 26px;
  bottom: var(--geo-credits-bottom);
  left: auto;
  transition: bottom 0.18s ease;
}

.geo-bottom-docks {
  position: absolute;
  z-index: 20;
  right: 22px;
  bottom: var(--geo-bottom-dock-bottom);
  left: 22px;
  transition: bottom 0.18s ease;
  pointer-events: none;
}

.geo-workspace--status-collapsed .geo-bottom-docks {
  left: 74px;
}

.geo-workspace--status-collapsed.geo-workspace--bottom-docks-collapsed .geo-bottom-docks {
  width: min(360px, calc(100% - 96px));
  left: auto;
}

.geo-workspace :global(.cesium-widget-credits) {
  border-radius: 5px;
  background: rgba(4, 10, 16, 0.62);
  backdrop-filter: blur(6px);
}

@media (prefers-reduced-motion: reduce) {
  .geo-workspace :global(.cesium-viewer-bottom),
  .geo-bottom-docks {
    transition: none;
  }
}
</style>
