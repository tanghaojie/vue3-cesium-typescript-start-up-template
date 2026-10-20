import { reactive, readonly, shallowReactive } from 'vue'
import type { Viewer } from 'cesium'
import { createGeoCapabilityRegistry, type GeoCapabilityRegistry } from './capability-registry'
import { createDisposableScope, type Disposable, type DisposableScope } from './disposable'
import { createGeoEventBus, type GeoEventBus } from './event-bus'
import type { GeoEventMap } from './event-bus'
import type { GeoInteractionManager } from './interaction-manager'
import type {
  GeoActionTool,
  GeoBottomDockContribution,
  GeoOverlayContribution,
  GeoContributionKind,
  GeoInspectorContribution,
  GeoPanelContribution,
  GeoPluginContributions,
  GeoPluginContext,
  GeoPluginDefinition,
  GeoPluginInstance,
  GeoRegisteredContribution,
  GeoStatusItemContribution,
  GeoTaskGroupContribution,
  GeoToggleTool,
  GeoToolContext,
  GeoToolContribution,
} from './geo-plugin'

export interface GeoPluginStatus {
  readonly id: string
  status: 'pending' | 'installing' | 'ready' | 'failed' | 'disposed'
  error?: string
}

export interface GeoPluginError {
  readonly pluginId: string
  readonly phase: 'validate' | 'install' | 'contribution' | 'execute' | 'dispose'
  readonly message: string
}

export interface GeoPluginRegistryState {
  status: 'idle' | 'installing' | 'ready' | 'disposing' | 'disposed'
  readonly pluginStatuses: readonly GeoPluginStatus[]
  readonly errors: readonly GeoPluginError[]
  readonly busyToolIds: readonly string[]
  activePanelId?: string
}

export interface GeoPluginRegistry extends Disposable {
  readonly state: Readonly<GeoPluginRegistryState>
  readonly capabilities: GeoCapabilityRegistry
  readonly events: GeoEventBus
  readonly contributions: readonly GeoRegisteredContribution[]
  register(definitions: readonly GeoPluginDefinition[]): void
  validate(): void
  install(viewer: Viewer): Promise<void>
  getContribution(id: string): GeoRegisteredContribution | undefined
  getContributions(kind?: GeoContributionKind): readonly GeoRegisteredContribution[]
  executeTool(id: string, enabled?: boolean): Promise<void>
  readToggle(id: string): boolean
  setActivePanel(id: string | undefined): void
}

export interface GeoPluginRegistryOptions {
  readonly definitions?: readonly GeoPluginDefinition[]
  readonly interactions: GeoInteractionManager
  readonly capabilities?: GeoCapabilityRegistry
  readonly events?: GeoEventBus
}

interface InstalledPlugin {
  readonly definition: GeoPluginDefinition
  readonly viewer: Viewer
  readonly scope: DisposableScope
  readonly abortController: AbortController
  readonly instance: GeoPluginInstance
}

interface PluginStatusState extends GeoPluginStatus {
  status: GeoPluginStatus['status']
}

class GeoPluginRegistryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeoPluginRegistryError'
  }
}

class GeoPluginBusyError extends Error {
  constructor(id: string) {
    super(`Geo tool "${id}" is already running`)
    this.name = 'GeoPluginBusyError'
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function compareDefinitions(left: GeoPluginDefinition, right: GeoPluginDefinition): number {
  const orderDifference = (left.order ?? 0) - (right.order ?? 0)
  return orderDifference || left.id.localeCompare(right.id)
}

function ensureLocalId(id: string, kind: string, pluginId: string): void {
  if (!id.trim()) {
    throw new GeoPluginRegistryError(`${kind} id in plugin "${pluginId}" cannot be empty`)
  }
  if (id.includes('.')) {
    throw new GeoPluginRegistryError(
      `${kind} id "${id}" in plugin "${pluginId}" must be local and cannot contain a dot`,
    )
  }
}

function qualify(pluginId: string, localId: string): string {
  return `${pluginId}.${localId}`
}

function contributionEntries(
  pluginId: string,
  contributions: GeoPluginContributions | undefined,
): GeoRegisteredContribution[] {
  if (!contributions) {
    return []
  }
  const entries: GeoRegisteredContribution[] = []
  function add<T extends GeoRegisteredContribution['contribution']>(
    kind: GeoContributionKind,
    contribution: T,
  ): void {
    ensureLocalId(contribution.id, kind, pluginId)
    entries.push({
      id: qualify(pluginId, contribution.id),
      localId: contribution.id,
      pluginId,
      kind,
      contribution,
    })
  }
  contributions.groups?.forEach(function addGroup(group: GeoTaskGroupContribution) {
    add('group', group)
  })
  contributions.tools?.forEach(function addTool(tool: GeoToolContribution) {
    add('tool', tool)
  })
  contributions.panels?.forEach(function addPanel(panel: GeoPanelContribution) {
    add('panel', panel)
  })
  contributions.inspectors?.forEach(function addInspector(inspector: GeoInspectorContribution) {
    add('inspector', inspector)
  })
  contributions.statusItems?.forEach(function addStatusItem(statusItem: GeoStatusItemContribution) {
    add('statusItem', statusItem)
  })
  contributions.bottomDocks?.forEach(function addBottomDock(bottomDock: GeoBottomDockContribution) {
    add('bottomDock', bottomDock)
  })
  contributions.overlays?.forEach(function addOverlay(overlay: GeoOverlayContribution) {
    add('overlay', overlay)
  })
  return entries
}

export function createGeoPluginRegistry(
  optionsOrDefinitions: GeoPluginRegistryOptions | readonly GeoPluginDefinition[],
  maybeInteractions?: GeoInteractionManager,
): GeoPluginRegistry {
  const options: GeoPluginRegistryOptions = Array.isArray(optionsOrDefinitions)
    ? {
        definitions: optionsOrDefinitions,
        interactions: maybeInteractions as GeoInteractionManager,
      }
    : (optionsOrDefinitions as GeoPluginRegistryOptions)
  if (!options.interactions) {
    throw new Error('Geo plugin registry requires an InteractionManager')
  }

  const definitions: GeoPluginDefinition[] = []
  const installed = new Map<string, InstalledPlugin>()
  const installedOrder: string[] = []
  const contributionMap = new Map<string, GeoRegisteredContribution>()
  // Shell computed values can be evaluated before asynchronous plugin installation completes.
  // Keep the collection shallow so later contribution publication invalidates those values
  // without proxying plugin-owned component definitions or controllers.
  const contributionList = shallowReactive<GeoRegisteredContribution[]>([])
  const busyToolIds = new Set<string>()
  const capabilities = options.capabilities ?? createGeoCapabilityRegistry()
  const events = options.events ?? createGeoEventBus<GeoEventMap>()
  const ownedCapabilities = !options.capabilities
  const ownedEvents = !options.events
  const mutableState = reactive<{
    status: GeoPluginRegistryState['status']
    pluginStatuses: PluginStatusState[]
    errors: GeoPluginError[]
    busyToolIds: string[]
    activePanelId?: string
  }>({
    status: 'idle',
    pluginStatuses: [],
    errors: [],
    busyToolIds: [],
  })
  let disposed = false
  let installationPromise: Promise<void> | undefined

  function statusFor(id: string): PluginStatusState {
    const status = mutableState.pluginStatuses.find(function findStatus(item) {
      return item.id === id
    })
    if (!status) {
      throw new GeoPluginRegistryError(`Unknown Geo plugin "${id}"`)
    }
    return status
  }

  function addError(pluginId: string, phase: GeoPluginError['phase'], error: unknown): void {
    mutableState.errors.push({ pluginId, phase, message: errorMessage(error) })
  }

  function validateDefinitions(): void {
    const ids = new Set<string>()
    definitions.forEach(function validateDefinition(definition) {
      if (!definition.id.trim()) {
        throw new GeoPluginRegistryError('Geo plugin id cannot be empty')
      }
      if (definition.id.includes('.')) {
        throw new GeoPluginRegistryError(`Geo plugin id "${definition.id}" cannot contain a dot`)
      }
      if (ids.has(definition.id)) {
        throw new GeoPluginRegistryError(`Duplicate Geo plugin id "${definition.id}"`)
      }
      ids.add(definition.id)
    })

    definitions.forEach(function validateDependencies(definition) {
      ;(definition.requires ?? []).forEach(function validateDependency(dependencyId) {
        if (!ids.has(dependencyId)) {
          throw new GeoPluginRegistryError(
            `Geo plugin "${definition.id}" requires missing plugin "${dependencyId}"`,
          )
        }
      })
    })

    const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]))
    const visiting = new Set<string>()
    const visited = new Set<string>()
    function visit(id: string): void {
      if (visited.has(id)) {
        return
      }
      if (visiting.has(id)) {
        throw new GeoPluginRegistryError(`Circular Geo plugin dependency involving "${id}"`)
      }
      visiting.add(id)
      const definition = definitionsById.get(id)
      definition?.requires?.forEach(visit)
      visiting.delete(id)
      visited.add(id)
    }
    definitions.forEach(function detectCycle(definition) {
      visit(definition.id)
    })
  }

  function orderedDefinitions(): readonly GeoPluginDefinition[] {
    validateDefinitions()
    const byId = new Map(definitions.map((definition) => [definition.id, definition]))
    const ordered: GeoPluginDefinition[] = []
    const visiting = new Set<string>()
    const visited = new Set<string>()
    function visit(id: string): void {
      if (visited.has(id)) {
        return
      }
      if (visiting.has(id)) {
        throw new GeoPluginRegistryError(`Circular Geo plugin dependency involving "${id}"`)
      }
      visiting.add(id)
      const definition = byId.get(id)
      if (!definition) {
        throw new GeoPluginRegistryError(`Unknown Geo plugin "${id}"`)
      }
      ;(definition.requires ?? [])
        .map((dependencyId) => byId.get(dependencyId) as GeoPluginDefinition)
        .sort(compareDefinitions)
        .forEach(function visitDependency(dependency) {
          visit(dependency.id)
        })
      visiting.delete(id)
      visited.add(id)
      ordered.push(definition)
    }
    definitions
      .slice()
      .sort(compareDefinitions)
      .forEach(function visitDefinition(definition) {
        visit(definition.id)
      })
    return ordered
  }

  function register(nextDefinitions: readonly GeoPluginDefinition[]): void {
    if (disposed || mutableState.status !== 'idle') {
      throw new GeoPluginRegistryError('Geo plugins can only be registered before installation')
    }
    definitions.push(...nextDefinitions)
    try {
      validateDefinitions()
    } catch (error) {
      definitions.splice(definitions.length - nextDefinitions.length, nextDefinitions.length)
      throw error
    }
    mutableState.pluginStatuses.splice(
      0,
      mutableState.pluginStatuses.length,
      ...definitions.map(function createStatus(definition): PluginStatusState {
        return { id: definition.id, status: 'pending' }
      }),
    )
  }

  async function installPlugins(viewer: Viewer): Promise<void> {
    if (disposed) {
      throw new GeoPluginRegistryError('Cannot install Geo plugins after disposal')
    }
    if (mutableState.status === 'ready') {
      return
    }
    if (installationPromise) {
      return installationPromise
    }
    const ordered = orderedDefinitions()
    mutableState.status = 'installing'
    installationPromise = (async function installInOrder() {
      for (const definition of ordered) {
        if (disposed) {
          break
        }
        const status = statusFor(definition.id)
        const failedDependency = (definition.requires ?? []).find(
          function findFailedDependency(dependencyId) {
            return statusFor(dependencyId).status !== 'ready'
          },
        )
        if (failedDependency) {
          status.status = 'failed'
          status.error = `Required Geo plugin "${failedDependency}" is not ready`
          addError(definition.id, 'install', new Error(status.error))
          continue
        }
        status.status = 'installing'
        const scope = createDisposableScope()
        const abortController = new AbortController()
        scope.defer(function abortPlugin() {
          abortController.abort()
        })
        const context: GeoPluginContext = {
          pluginId: definition.id,
          viewer,
          interactions: options.interactions,
          capabilities,
          events,
          scope,
          signal: abortController.signal,
        }
        let instance: GeoPluginInstance | undefined
        try {
          instance = await definition.install(context)
          if (disposed || abortController.signal.aborted) {
            instance.dispose()
            scope.dispose()
            status.status = 'disposed'
            continue
          }
          if (!instance || typeof instance.dispose !== 'function') {
            throw new GeoPluginRegistryError(
              `Geo plugin "${definition.id}" install() did not return a disposable instance`,
            )
          }
          const entries = contributionEntries(definition.id, instance.contributions)
          const entryIds = new Set<string>()
          entries.forEach(function validateContributionId(entry) {
            if (contributionMap.has(entry.id)) {
              throw new GeoPluginRegistryError(`Duplicate Geo contribution id "${entry.id}"`)
            }
            if (entryIds.has(entry.id)) {
              throw new GeoPluginRegistryError(`Duplicate Geo contribution id "${entry.id}"`)
            }
            entryIds.add(entry.id)
          })
          entries.forEach(function publishContribution(entry) {
            contributionMap.set(entry.id, entry)
            contributionList.push(entry)
          })
          installed.set(definition.id, {
            definition,
            viewer,
            scope,
            abortController,
            instance,
          })
          installedOrder.push(definition.id)
          status.status = 'ready'
        } catch (error) {
          abortController.abort()
          try {
            instance?.dispose()
          } catch (disposeError) {
            addError(definition.id, 'dispose', disposeError)
          }
          try {
            scope.dispose()
          } catch (disposeError) {
            addError(definition.id, 'dispose', disposeError)
          }
          status.status = 'failed'
          status.error = errorMessage(error)
          addError(
            definition.id,
            error instanceof GeoPluginRegistryError && error.message.includes('contribution')
              ? 'contribution'
              : 'install',
            error,
          )
        }
      }
      if (!disposed) {
        mutableState.status = 'ready'
      }
      installationPromise = undefined
    })()
    return installationPromise
  }

  function toolContext(plugin: InstalledPlugin, toolId: string): GeoToolContext {
    return {
      pluginId: plugin.definition.id,
      toolId,
      viewer: plugin.viewer,
      interactions: options.interactions,
      capabilities,
      events,
      scope: plugin.scope,
      signal: plugin.abortController.signal,
    }
  }

  async function executeTool(id: string, enabled?: boolean): Promise<void> {
    const entry = contributionMap.get(id)
    if (!entry || entry.kind !== 'tool') {
      throw new GeoPluginRegistryError(`Unknown Geo tool contribution "${id}"`)
    }
    const plugin = installed.get(entry.pluginId)
    if (!plugin) {
      throw new GeoPluginRegistryError(`Geo plugin "${entry.pluginId}" is not available`)
    }
    const tool = entry.contribution as GeoToolContribution
    const context = toolContext(plugin, id)
    if (tool.isAvailable && !tool.isAvailable(context)) {
      throw new GeoPluginRegistryError(`Geo tool "${id}" is not available in the current scene`)
    }
    if (tool.kind === 'panel') {
      mutableState.activePanelId = tool.panelId.includes('.')
        ? tool.panelId
        : qualify(entry.pluginId, tool.panelId || entry.localId)
      return
    }
    if (tool.kind === 'interaction') {
      options.interactions.activate(tool.create(context))
      return
    }
    if (busyToolIds.has(id)) {
      throw new GeoPluginBusyError(id)
    }
    busyToolIds.add(id)
    mutableState.busyToolIds.push(id)
    try {
      if (tool.kind === 'action') {
        await (tool as GeoActionTool).run(context)
      } else {
        const toggle = tool as GeoToggleTool
        await toggle.write(context, enabled ?? !toggle.read(context))
      }
    } catch (error) {
      addError(entry.pluginId, 'execute', error)
      throw error
    } finally {
      busyToolIds.delete(id)
      const index = mutableState.busyToolIds.indexOf(id)
      if (index >= 0) {
        mutableState.busyToolIds.splice(index, 1)
      }
    }
  }

  function readToggle(id: string): boolean {
    const entry = contributionMap.get(id)
    if (!entry || entry.kind !== 'tool') {
      throw new GeoPluginRegistryError(`Geo tool "${id}" is not a toggle contribution`)
    }
    const tool = entry.contribution as GeoToolContribution
    if (tool.kind !== 'toggle') {
      throw new GeoPluginRegistryError(`Geo tool "${id}" is not a toggle contribution`)
    }
    const plugin = installed.get(entry.pluginId)
    if (!plugin) {
      throw new GeoPluginRegistryError(`Geo plugin "${entry.pluginId}" is not available`)
    }
    const context = toolContext(plugin, id)
    return tool.read(context)
  }

  function setActivePanel(id: string | undefined): void {
    if (id !== undefined && contributionMap.get(id)?.kind !== 'panel') {
      throw new GeoPluginRegistryError(`Unknown Geo panel contribution "${id}"`)
    }
    mutableState.activePanelId = id
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    mutableState.status = 'disposing'
    options.interactions.cancel()
    installedOrder
      .slice()
      .reverse()
      .forEach(function disposePlugin(pluginId) {
        const plugin = installed.get(pluginId)
        if (!plugin) {
          return
        }
        const status = statusFor(pluginId)
        plugin.abortController.abort()
        try {
          plugin.instance.dispose()
        } catch (error) {
          addError(pluginId, 'dispose', error)
        }
        try {
          plugin.scope.dispose()
        } catch (error) {
          addError(pluginId, 'dispose', error)
        }
        status.status = 'disposed'
        installed.delete(pluginId)
      })
    installedOrder.splice(0, installedOrder.length)
    contributionMap.clear()
    contributionList.splice(0, contributionList.length)
    if (ownedCapabilities) {
      capabilities.dispose()
    }
    if (ownedEvents) {
      events.dispose()
    }
    mutableState.busyToolIds.splice(0, mutableState.busyToolIds.length)
    mutableState.activePanelId = undefined
    mutableState.status = 'disposed'
  }

  register(options.definitions ?? [])

  return {
    state: readonly(mutableState),
    capabilities,
    events,
    get contributions() {
      return contributionList
    },
    register,
    validate: validateDefinitions,
    install: installPlugins,
    getContribution(id) {
      return contributionMap.get(id)
    },
    getContributions(kind) {
      return kind
        ? contributionList.filter(function filterContribution(item) {
            return item.kind === kind
          })
        : contributionList
    },
    executeTool,
    readToggle,
    setActivePanel,
    dispose,
  }
}
