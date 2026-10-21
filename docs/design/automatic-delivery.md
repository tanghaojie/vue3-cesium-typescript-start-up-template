---
title: CI-gated automatic PR delivery
status: active
updated: 2026-10-21
---

# CI-gated automatic PR delivery

## Owner decision

On 2026-10-21 the owner explicitly chose automatic merge after CI, retaining pull requests and check gates while removing mandatory human approval. This applies to tanghaojie/Cesium-Workbench, not unrelated repositories. The organization publication repository continues receiving the normal source-sync push.

## GitHub configuration

Enable repository allow_auto_merge. Keep master protected by a pull-request requirement, with required_approving_review_count set to 0. Require GitHub Actions check verify from app ID 15368, with strict up-to-date checking. The existing verify workflow runs formatting, ESLint and production build including Vue/config TypeScript checks.

Preserve unrelated existing protection settings: force pushes and deletion remain disabled; administrator enforcement, signature, linear-history and conversation-resolution settings stay as before. An administrator's technical bypass ability is not the normal AI delivery path.

The repository switch allows auto-merge, but each PR must opt in. For a completed user-authorized task, the AI creates a topic PR and enables auto-merge through the authenticated maintainer CLI, with an exact expected head SHA, a conventional merge title and the actual model co-author trailer. Do not add a workflow that silently opts every external contributor's PR into merge.

## Delivery flow

Topic branch -> PR -> required verify succeeds on an up-to-date branch -> GitHub merges -> personal master source synchronization -> organization Pages build/deploy.

Use the authenticated maintainer CLI to enable auto-merge, preserving the normal push-triggered sync pipeline. No new credential is introduced. Existing token scope and source-sync logic are unchanged.

If CI fails, fix within the authorized task and update the PR. If the base advances, bring the branch up to date with preserved history and rerun checks. A draft, conflict, failing check or other explicit GitHub gate still blocks merge. Do not use --admin, direct protected-master pushes, force push, fake approval or altered checks to bypass a blocked delivery.

Automatic merge does not cover search-account ownership actions, manual browser/GPU acceptance or new consequential task scope. The user can request a draft or no-merge outcome for a particular task.

## Verification and recovery

Read back allow_auto_merge and all branch settings after applying the minimal configuration change. Exercise a normal documentation PR, enable auto-merge while verify is pending, confirm it waits and then merges without a manual approval/click, and inspect the master sync/Pages result.

Record the baseline and actual check/PR URLs in the task log. A settings change must preserve unrelated protections and be reported if the API rejects it; do not weaken additional settings to make a test pass. The owner can restore a positive approving-review count or disable auto-merge later.
