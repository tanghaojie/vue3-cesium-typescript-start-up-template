---
title: Organization source synchronization and Pages workflows
status: completed
date: 2026-10-20
---

# Organization source synchronization and Pages workflows

## Goal and authorization

Implement the user's step 4 in tanghaojie/Cesium-Workbench: add and verify the workflows, commit and push personal master, and inspect the first source synchronization. The user performs step 5 (organization Pages settings and first deployment).

## Implementation

1. Confirmed an empty staging area and clean worktree, fetched merged master cb1b2cb4398fa3c3213de770ba66e62f0c85ffdb and created codex/org-publication.
2. Recorded the publication design, implementation plan and AI log before workflow changes.
3. Added verify.yml, sync-org.yml and pages.yml with repository/ref guards, limited permissions, verification before synchronization and an ordinary master push.
4. Added the publication guide and corrected current source identity references after the owner renamed the repository.
5. Completed local verification, archived this plan/log and prepared a conventional AI-marked delivery commit. GitHub Actions execution and SHA comparison are post-push delivery checks; no pre-push runtime success is claimed.

## Actual validation

- Node v24.19.0 and pnpm 11.22.0.
- pnpm install --frozen-lockfile: passed without lockfile changes.
- YAML parsing for all three workflows and bash -n for the sync shell: passed.
- pnpm format and pnpm format:check: passed.
- pnpm lint: passed.
- pnpm build: passed, including Vue/config TypeScript checks, both HTML entries and Cesium static copying.
- git diff --check: passed before delivery.
- Build reports the existing Sass legacy API and chunk-size advisories; no application source is changed.

## Delivery and acceptance boundaries

The associated delivery commit is identified by ci: add organization sync and Pages deployment. The plan/log are included in that same commit; GitHub Actions results are inspected after publishing it. Source synchronization can still be blocked by token expiry, permissions, organization approval or remote history divergence and must be reported if observed.

The original 1.0.0 branch/tag and user content remain preserved. No frontend/browser automation, token inspection, force push, organization-only commits or Pages setting changes were performed. Organization Pages enablement, first deployment and website acceptance are the owner's step 5.
