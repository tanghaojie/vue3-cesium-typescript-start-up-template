import type { Component } from 'vue'
import type { Viewer } from 'cesium'
import type { GeoCapabilityRegistry } from './capability-registry'
import type { DisposableScope } from './disposable'
import type { GeoEventBus } from './event-bus'
import type { GeoInteractionDefinition, GeoInteractionManager } from './interaction-manager'

export interface GeoPluginDefinition {
  readonly id: string
  readonly order?: number
  readonly requires?: readonly string[]
  install(context: GeoPluginContext): GeoPluginInstance | Promise<GeoPluginInstance>
}

export interface GeoPluginInstance {
  readonly contributions?: GeoPluginContributions
  dispose(): void | Promise<void>
}

export interface GeoPluginContext {
  readonly pluginId: string
  readonly viewer: Viewer
  readonly interactions: GeoInteractionManager
  readonly capabilities: GeoCapabilityRegistry
  readonly events: GeoEventBus
  readonly scope: DisposableScope
  readonly signal: AbortSignal
}

export interface GeoToolContext extends GeoPluginContext {
  readonly toolId: string
}

export interface GeoContributionMetadata {
  /** Local id inside the plugin. The registry publishes `${pluginId}.${id}`. */
  readonly id: string
  readonly label?: string
  readonly labelKey?: string
  readonly icon?: string
  readonly groupId?: string
  readonly order?: number
  isAvailable?(context: GeoToolContext): boolean
}

export interface GeoTaskGroupContribution {
  readonly id: string
  readonly label?: string
  readonly labelKey?: string
  readonly icon?: string
  readonly order?: number
}

export interface GeoActionTool extends GeoContributionMetadata {
  readonly kind: 'action'
  run(context: GeoToolContext): void | Promise<void>
}

export interface GeoToggleTool extends GeoContributionMetadata {
  readonly kind: 'toggle'
  read(context: GeoToolContext): boolean
  write(context: GeoToolContext, enabled: boolean): void | Promise<void>
}

export interface GeoPanelTool extends GeoContributionMetadata {
  readonly kind: 'panel'
  readonly panelId: string
}

export interface GeoInteractionTool extends GeoContributionMetadata {
  readonly kind: 'interaction'
  create(context: GeoToolContext): GeoInteractionDefinition
}

export type GeoToolContribution = GeoActionTool | GeoToggleTool | GeoPanelTool | GeoInteractionTool

export type GeoPanelComponent =
  Component | (() => Promise<Component | { readonly default: Component }>)

export interface GeoPanelContribution extends GeoContributionMetadata {
  readonly panelId?: string
  readonly component: GeoPanelComponent
}

export interface GeoInspectorContribution extends GeoContributionMetadata {
  readonly component: GeoPanelComponent
  matches(object: unknown): boolean
}

export interface GeoStatusItemContribution extends GeoContributionMetadata {
  readonly component: GeoPanelComponent
}

export interface GeoBottomDockContribution extends GeoContributionMetadata {
  readonly component: GeoPanelComponent
}

export interface GeoOverlayContribution extends GeoContributionMetadata {
  readonly component: GeoPanelComponent
}

export interface GeoPluginContributions {
  readonly groups?: readonly GeoTaskGroupContribution[]
  readonly tools?: readonly GeoToolContribution[]
  readonly panels?: readonly GeoPanelContribution[]
  readonly inspectors?: readonly GeoInspectorContribution[]
  readonly statusItems?: readonly GeoStatusItemContribution[]
  readonly bottomDocks?: readonly GeoBottomDockContribution[]
  readonly overlays?: readonly GeoOverlayContribution[]
}

export type GeoContributionKind =
  'group' | 'tool' | 'panel' | 'inspector' | 'statusItem' | 'bottomDock' | 'overlay'

export interface GeoRegisteredContribution {
  readonly id: string
  readonly localId: string
  readonly pluginId: string
  readonly kind: GeoContributionKind
  readonly contribution:
    | GeoTaskGroupContribution
    | GeoToolContribution
    | GeoPanelContribution
    | GeoInspectorContribution
    | GeoStatusItemContribution
    | GeoBottomDockContribution
    | GeoOverlayContribution
}
