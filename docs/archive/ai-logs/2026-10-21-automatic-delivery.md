---
title: Automatic delivery configuration
status: completed
date: 2026-10-21
change_type: ci
---

# Automatic delivery configuration

## Owner authorization

The owner asked why every task needed a manual merge. After the current GitHub rule was explained, they explicitly selected CI-success automatic merging: keep PR/check gates and remove mandatory manual approval.

## Baseline and actual configuration

Staging/worktree were clean. Started from owner-merged master 7ab0d47a31af5659a34c5b51a78c97de5240ec49. Live baseline: allow_auto_merge=false, one approving review, no required status check and no rulesets. Actual GitHub Actions check verify belongs to app 15368.

Authorized writes and readbacks succeeded: allow_auto_merge=true; master retains a PR requirement with approving review count 0 and strict verify/app 15368. Force push, deletion, signatures, linear history, conversation resolution, administrator enforcement and other flags retain their original values. No secret or new token was read or introduced.

## Durable implementation

Added the automatic-delivery design and updated AGENTS/publication guidance. Future owner-authorized AI deliveries create a topic PR and enable exact-head auto-merge with conventional merge metadata and actual model trailer. Explicit draft/no-merge/review-only instructions remain respected. No workflow automatically opts every external contributor PR in.

Verified SEO PR #9 source sync and Pages run 39549051468 succeeded. Root, both about pages, robots and sitemap returned 200 with correct HTML canonicals, so the prior SEO records are completed and archived.

## Live exercise and validation

Implementation commit 3b091734c9d7c45631b5a26783ddb01ffb92d9a0 was published in [PR #10](https://github.com/tanghaojie/Cesium-Workbench/pull/10). Normal auto-merge opt-in succeeded while verify was queued/running; PR remained OPEN/BLOCKED until the check passed. [PR CI](https://github.com/tanghaojie/Cesium-Workbench/actions/runs/39549621607) and [branch CI](https://github.com/tanghaojie/Cesium-Workbench/actions/runs/39549585326) succeeded, followed by automatic merge 7eac6bad38b6818c7c3b856b7b7c1846f8715fdb. Readback of the merged commit confirmed ci(delivery) subject and the real GPT-6 co-author trailer.

[Master source sync](https://github.com/tanghaojie/Cesium-Workbench/actions/runs/39549734544) was triggered and queued at this closeout snapshot. The closeout documentation PR uses the same automatic flow; its final sync/Pages status is checked during delivery. This log does not imply success before those jobs finish.

pnpm format, pnpm format:check and git diff --check passed. No frontend code or dependency changed, and no browser automation was used. No manual approval/click or bypass action was needed for PR #10.

## Outcome and boundaries

The repeated manual merge blocker is resolved and demonstrated through an actual PR. Browser/GPU acceptance and search-owner actions remain outside this automation. Changing required approvals or disabling auto-merge again requires a later owner decision.
