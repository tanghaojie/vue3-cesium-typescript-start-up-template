---
title: Personal source and organization publication
status: active
updated: 2026-10-20
---

# Personal source and organization publication

## Responsibility and flow

The canonical development repository is tanghaojie/Cesium-Workbench, with master as its default branch. Cesium-Workbench/cesium-workbench.github.io is an independent public publication repository. Changes flow in one direction: personal master -> verified source synchronization -> organization master -> GitHub Pages. Developers submit changes to the personal repository; organization-only source commits would cause the ordinary synchronization push to fail.

The organization site is https://cesium-workbench.github.io/. Vite builds dist at the site root, with index.html, the geo.html compatibility entry and /cesiumStatic/. A project-subpath deployment is outside this design. Branch and tag 1.0.0 stay preserved in the personal repository; source synchronization does not copy all branches, tags, GitHub Releases, issues or repository settings.

## Workflow interfaces

.github/workflows/verify.yml checks non-master branch pushes and pull requests and exposes workflow_call for the synchronization workflow. It runs a frozen install, formatting check, ESLint and the production build including Vue/config TypeScript checks.

.github/workflows/sync-org.yml runs only on the personal repository's master, on push or manual dispatch. It calls verification before the sync job, checks out complete history with persist-credentials disabled and pushes HEAD to organization master without force. Before pushing, it fetches personal master and skips a superseded revision. A shared concurrency group serializes sync runs.

.github/workflows/pages.yml runs its build only in the organization repository on master, on push or manual dispatch. It configures Pages, repeats the engineering checks, builds dist and uploads a Pages artifact. The deployment job needs the successful build, uses the github-pages environment and receives pages:write and id-token:write. The build only needs contents:read and pages:read. The same source files are mirrored, while repository conditions prevent recursive sync and personal-repository Pages deployment.

The workflows use Node 24 and pnpm 11.22.0, consistent with the migration validation environment. They introduce no frontend or browser automation.

## Credentials and setup boundary

The personal repository's Actions secret ORG_SOURCE_SYNC_TOKEN contains a fine-grained token owned by the organization, scoped to the publication repository with Contents and Workflows read/write. The workflow injects it into only the sync shell step, masks the derived HTTP authorization value and never writes it into repository files or a persistent Git remote.

A token-authenticated push allows the receiving repository's push workflows to run. The normal workflow GITHUB_TOKEN is limited to reading the personal repository. Token creation, rotation and organization approval remain repository-owner responsibilities.

The owner enables GitHub Actions as the organization's Pages source and manually starts or reruns the first deployment after enabling it. This implementation does not change Pages settings or confirm website acceptance.

## Failures and recovery

A missing, expired or unapproved token or insufficient repository permissions stops synchronization. A non-fast-forward rejection means the publication history diverged; investigate and preserve those changes rather than force pushing. A superseded revision is skipped so that a later verified master can publish.

Before Pages is enabled, the first automatically triggered Pages build may fail at configuration; after setup the owner runs Deploy GitHub Pages on master. Build, artifact or deployment failures leave the last successful site available. A manual rerun can retry after the cause is fixed. Cancelled or pending concurrency runs do not guarantee that every intermediate commit is deployed.

## Verification and acceptance

Validate YAML parsing, repository/ref guards, reusable workflow dependency, secret reference, non-force push target and dist artifact path, then run pnpm format, pnpm format:check, pnpm lint and pnpm build. Inspect the committed diff and AI trailer. After pushing personal master, verify actual Actions job results and compare the organization master SHA with the intended source SHA.

GitHub Pages enablement and first deployment are a separate owner-operated step. Browser/GPU behavior, target-origin CORS, external assets, capture and codec acceptance remain manual; static checks and a successful source sync do not prove website functionality.
