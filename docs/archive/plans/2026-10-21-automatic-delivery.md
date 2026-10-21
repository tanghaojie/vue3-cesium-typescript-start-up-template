---
title: CI-gated automatic delivery
status: completed
date: 2026-10-21
---

# CI-gated automatic delivery

## Authorization and baseline

The owner explicitly chose CI-success auto-merge: retain PR and check gates, remove mandatory manual approval. Before this task, source master required one approving review, no status check was mandatory, and allow_auto_merge was false.

## Completed changes

- Enabled repository allow_auto_merge.
- Kept the master PR requirement with required_approving_review_count=0.
- Required strict/up-to-date GitHub Actions verify from app ID 15368.
- Preserved all other protection values, including disabled force pushes/deletions and unchanged administrator enforcement.
- Recorded per-PR automatic delivery in AGENTS, current design and publication guide. AI delivery uses the authenticated maintainer CLI, an exact head SHA, a conventional merge subject and the actual model trailer.
- Verified the owner's previous SEO deployment and archived its records with real production evidence.

## Actual verification

Settings were read back successfully. Documentation formatting, final formatting check and git diff --check passed. No frontend code changed and no frontend/browser automation was run.

[PR #10](https://github.com/tanghaojie/Cesium-Workbench/pull/10) is the live exercise. Auto-merge was enabled while the required check was pending, and the PR remained OPEN/BLOCKED during that interval. [Required PR verify](https://github.com/tanghaojie/Cesium-Workbench/actions/runs/39549621607) passed; GitHub then merged automatically as 7eac6bad38b6818c7c3b856b7b7c1846f8715fdb. The merged commit's conventional title and GPT-6 trailer were verified locally. No manual approval/click, administrator bypass, direct master push, force push or fabricated review was used.

The merge triggered [normal master source synchronization](https://github.com/tanghaojie/Cesium-Workbench/actions/runs/39549734544), confirming the existing push-triggered flow remains connected. That run was queued at the documentation closeout snapshot; final synchronization/Pages outcomes are inspected after the closeout PR publishes, without claiming pre-run success here.

## Boundaries and maintenance

Repository enablement alone does not opt future PRs in; AGENTS requires the delivering AI to enable each eligible PR. A draft, conflict, failed check or out-of-date base continues to block automatic merging. Owner instructions for review-only work, drafts or no-merge still take precedence.

SEO production pages were already confirmed through successful source sync/Pages and five HTTP 200 checks. Search-account ownership/submission and manual visual/browser/GPU/capture acceptance remain owner actions.
