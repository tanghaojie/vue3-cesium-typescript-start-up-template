---
title: Standalone Geo workbench
status: active
updated: 2026-10-20
---

# Standalone Geo workbench

## Responsibility and boundaries

This repository owns the standalone frontend Geo application. Its display name is Cesium Workbench; the GitHub slug remains unchanged. Source snapshot: Cyber-Sight 9697230d7278ae88afb3c82c98e3865181847d08. Version 2.0.0-rc.1 introduces a replacement application; the original template remains unchanged on branch/tag 1.0.0.

src/modules/geo owns the Viewer runtime, Cesium tools, compile-time plugins, controllers, panels and workspace page. src/app only starts the application and configures its identity. src/shared contains the minimal local localization/icon/brand/style adapters. There is no backend, database, auth, Vuex, global Viewer, remote code loading or plugin marketplace.

## Public interfaces and dependencies

The app mounts modules/geo/pages/GeoWorkspacePage.vue directly. No router is installed; source-only registerViews.ts is excluded. Geo plugins are assembled by geo.plugins.ts; plugins collaborate through core capability/event/disposable contracts. Tools receive real Cesium objects as explicit parameters and do not import the app or UI adapters.

Geo depends on shared/localization/localization and localization.resource, shared/components/AppIcon.vue and AppLogo.vue. Those shared adapters do not import Geo; bootstrap registers the Geo localization resource. Theme and icon assets are local snapshots, with source attribution. There are no workspace:* dependencies or imports into Cyber-Sight.

## Data flow and lifecycle

main.ts installs localization and the Geo resource, applies document identity and mounts the workspace. The page creates one GeoRuntime and disposes it on unmount. The runtime creates one Viewer, installs the 11 plugins, owns the unique viewer.clock and releases listeners/resources on disposal. Asynchronous operations honor AbortSignal.

Data loads external URLs and the AIModels static catalog. Scene controls quality, lighting and model rendering. Time and simulated flights use the same Viewer clock. Capture leases camera, time, model animation and render resolution through existing capabilities, then restores their state on finish, cancel or error. Compile-time plugins are Data, View, Scene, Time, Capture, Flight, Drawing, Measurement, Model, Terrain and Compare.

## Compatibility and persistence

Keep Cesium 1.144.0, Mediabunny 1.61.6 and fflate 0.8.3 during the migration. Capture projects retain JSON version 1 and keys cyber-sight:capture:current:v1 / cyber-sight:capture:library:v1. localStorage is origin-scoped; users export JSON at the old origin and import it at a new origin. No automatic cross-origin transfer or resource execution is introduced.

index.html is the default entry; geo.html is a compatibility entry to the same module, built together with one cesiumStatic directory. Deployment initially uses the site root and CESIUM_BASE_URL=/cesiumStatic/. Do not claim arbitrary subpath support. Keep pnpm run vite as an alias for development.

## Failures and asset boundaries

Retain external-resource errors, imagery fallback, model readiness, cancellation and codec/size/memory guards. VITE_GEO_TIANDITU_TOKEN is a public client token; VITE_GEO_AI_MODELS_CATALOG_URL overrides the static model catalog. Example env files contain no real credentials. External sample models, imagery and terrain have their own availability and usage terms; MIT source licensing does not grant blanket data redistribution rights. Flight data is simulated, and AIModels is a model catalog rather than an in-app generation service.

The DEV assemblyPreview query retains its explicit development-only behavior. Minimum supported interaction layout remains 1280x720 landscape; portrait video export does not imply mobile layout support.

## Validation and rollback

Run frozen install, formatting, ESLint, TypeScript and production build; verify import closure, one Cesium asset tree, both HTML outputs and the migration manifest. No automated frontend/browser tests are added or run. Human acceptance covers plugins, icons/localization, target-origin CORS, camera/time, model rendering/animation, capture JSON persistence and 1080p/4K MP4/PNG outputs, cancellation and restore. Static checks never imply these have passed.

Rollback uses branch/tag 1.0.0 or the retained Cyber-Sight build, without history rewriting or deleting browser data. Cyber-Sight is temporarily frozen for fallback; future source cleanup/embedding is separate. Target commits are the development source after handoff; no long-term bidirectional source copying is established.

## Implemented validation

The frozen install, formatting, Lint, Vue/config types and production build passed on Windows with Node v24.19.0 and pnpm 11.22.0. A static inventory confirms 97 imported runtime files, 11 plugins, two HTML entries, one complete Cesium resource tree and zero workspace dependencies. No browser acceptance has been claimed. See the migration log for commands, deviations and remaining manual checks.
