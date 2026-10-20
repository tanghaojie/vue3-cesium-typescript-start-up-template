---
title: Standalone Geo migration
status: active
date: 2026-10-20
---

# Standalone Geo migration

User requested saving current content as branch/tag 1.0.0, then implementing the migration assessment. Both refs have been pushed at original fcea9e5. Source 9697230 is fixed. Source Geo remains for rollback; repository rename, new deployment and deletion of source are not executed.

Chosen implementation: independent frontend, Geo runtime/tools/plugins unchanged except documented adapters, minimal local shared UI/localization/theme, no backend or SDK. App display name follows the assessment recommendation; GitHub slug remains unchanged. Code checks and manual acceptance are reported separately.

Implemented 97 Geo runtime files and excluded the Sight-only view registration adapter; 84 files are byte-identical, 13 contain only import/brand adaptations. All 11 plugin definitions are retained. Localized startup, sprite icons, brand and theme adapters remove Foundation/Platform and workspace dependencies. A local PRISM token snapshot and copyright notices preserve provenance. Core runtime dependencies are pinned to the source installed versions.

Validation on Windows / Node v24.19.0 / pnpm 11.22.0: pnpm install --frozen-lockfile, pnpm format, pnpm format:check, pnpm lint and pnpm build passed. Build includes Vue and Vite config TypeScript checks. Static output verification confirms index.html, geo.html and one complete cesiumStatic tree. Manifest source/target hashes pass; 81 relative document links have no failures. fast-glob 3.3.3 is explicitly declared for the SVG plugin; the source build policy allows esbuild and disables optional parcel watcher scripts. Existing Sass legacy API and large chunk notices remain; guards are not relaxed.

No frontend or browser automation was created or run. No real tokens, production data or credentials are recorded. Human interaction, external-origin CORS, GPU/model visuals, local project import and video encoding remain pending. No new deployment, source deletion or GitHub rename has been performed.

The implementation commit and later record-close commit are identified by Git history. The migration branch is prepared for a draft PR; manual acceptance remains an explicit release gate.

[Design](../design/geo-workbench.md), [Plan](../plans/active/2026-10-20-geo-migration.md).
