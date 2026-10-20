---
title: Migrate Geo from Cyber-Sight
status: completed
created: 2026-10-20
updated: 2026-10-20
---

# Migrate Geo from Cyber-Sight

## Baselines

Original template fcea9e53485f356f96fb64cf6cd692f77513d6bd is preserved remotely by branch and annotated tag 1.0.0. Source snapshot is Cyber-Sight 9697230d7278ae88afb3c82c98e3865181847d08. Implement on codex/geo-migration; never rewrite published history.

## Tasks

- [x] Preserve the original template branch/tag before changing application files.
- [x] Write standalone design and collaboration boundaries.
- [x] Import Geo and record source/target paths and content hashes.
- [x] Replace platform startup, localization, icon and theme dependencies with local adapters.
- [x] Replace legacy toolchain and lockfile; preserve both root and geo.html entries.
- [x] Complete frozen install, format, lint, types/build and static artifact checks.
- [x] Document old/new feature mapping, data usage, storage transfer and manual acceptance.
- [x] Commit and publish a reviewable migration branch/PR, then archive records.

## Acceptance and rollback

No frontend/browser automated tests. GPU, CORS, codecs, capture and interaction require human acceptance; do not mark them passed from builds. Keep the original template and Cyber-Sight code for rollback. GitHub rename and production deployment are outside this implementation.

[Design](../../design/geo-workbench.md), [AI log](../ai-logs/2026-10-20-geo-migration.md).

## Actual engineering validation

On Windows, Node v24.19.0 and pnpm 11.22.0: frozen install, pnpm format, pnpm format:check, pnpm lint and pnpm build passed. Build includes Vue and Vite config TypeScript checks. Both HTML entries and one Cesium static directory with Assets/ThirdParty/Widgets/Workers exist. 97 runtime files were imported: 84 byte-identical and 13 with only declared import/brand adaptations. One source menu adapter is excluded. Source/target hashes and no workspace dependency were verified; 81 relative documentation links had zero failures. Browser/GPU/encoding acceptance is still pending.

## Delivery

Implementation commit: 8d5f710edccadd47a4a2e7270429214f48c5c858. Published draft [PR #8](https://github.com/tanghaojie/vue3-cesium-typescript-start-up-template/pull/8). Implementation and allowed engineering validation are completed; listed human browser/GPU/encoding acceptance remains pending. The default branch, production deployment and source cleanup are not changed by this PR.
