---
title: Organization publication workflow implementation
status: completed
date: 2026-10-20
change_type: ci
---

# Organization publication workflow implementation

## User goal and instructions

The user completed repository rename/creation and token setup, then explicitly asked the AI to complete step 4. They will complete step 5. The canonical source is tanghaojie/Cesium-Workbench; publication is Cesium-Workbench/cesium-workbench.github.io.

## Evidence and decisions

The initial staging area and worktree were empty. Local migration branch c995bd3 was clean; fetched master cb1b2cb4398fa3c3213de770ba66e62f0c85ffdb contains the merged migration. Created codex/org-publication from origin/master and updated the local origin URL to the renamed personal repository.

The standalone AGENTS.md requires a topic branch, design, plan, AI log and conventional AI-marked commits. It does not use Foundation/Platform scopes or Forge archive ledgers. Reused the prepared reference YAML with master-only source synchronization, verification before sync, organization-only Pages deployment, non-force push and narrow permissions.

No secrets were read or recorded. The existing ORG_SOURCE_SYNC_TOKEN is referenced by name only. The owner retains Pages setup and browser acceptance.

## Actual changes

Added the three workflows and organization publication design/guide. Updated the current Geo design and README source links to the renamed personal repository. The workflows use Node 24 / pnpm 11.22.0 and publish dist at the organization site root. Completed plan/log are archived and linked from documentation indexes. Application source, dependency versions, lockfile and the original 1.0.0 refs are unchanged.

## Actual validation

On Windows with Node v24.19.0 and pnpm 11.22.0, the frozen install, formatting, final formatting check, ESLint and production build all passed. Build includes Vue and config TypeScript validation and produced index.html, geo.html and the Cesium resources. YAML parsing and sync-shell bash -n passed. The first sandboxed Git Bash syntax check was prevented by Windows process restrictions; the same read-only check passed in the authorized normal environment.

The build retained existing Sass legacy API and large-chunk advisories. No frontend unit, component, E2E or browser automation was added or run.

## Delivery and outstanding work

Associated delivery commit: ci: add organization sync and Pages deployment, with the actual GPT-6 co-author trailer. This log is archived with that commit before push. Actions execution and organization-master SHA comparison are checked after push and reported in the delivery response; success is not claimed here before those runs occur.

Pages enablement, first deployment and manual browser/GPU/CORS/capture acceptance belong to the owner's step 5. If source synchronization fails, diagnose and repair only within the authorized workflow scope; report token or external permission blockers without exposing credentials.
