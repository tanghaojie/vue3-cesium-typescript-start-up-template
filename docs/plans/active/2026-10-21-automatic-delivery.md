---
title: CI-gated automatic delivery
status: active
date: 2026-10-21
---

# CI-gated automatic delivery

## Authorization

The owner asked why manual merging keeps recurring, then explicitly chose: CI success triggers automatic merge, retaining PR and checks but removing required manual approval.

## Baseline

Source master 7ab0d47a31af5659a34c5b51a78c97de5240ec49 contains the owner's merge of SEO PR #9. allow_auto_merge is false; master requires one approving review; no status checks are required; no rulesets apply. Force pushes/deletion/signatures/linear history/conversation resolution are disabled, and administrator enforcement is false.

## Work

1. Check empty staging/worktree and current rules, and record the design before repository changes.
2. Enable auto-merge; set required approval count 0 and require strict GitHub Actions verify (app 15368), preserving other settings.
3. Record the long-term AI PR/auto-merge delivery rule in AGENTS and publication guidance.
4. Check and close the owner's merged SEO deployment records once real Pages/HTTP evidence is available.
5. Format and commit documentation, publish a PR and enable exact-head auto-merge without admin bypass.
6. Observe that required verify controls merging, then confirm normal source synchronization and Pages deployment.

## Validation

Readbacks and live PR pipeline exercise are pending. No frontend code or browser automation is needed.

## Applied settings and completed prerequisite

Readback confirms allow_auto_merge=true, strict GitHub Actions verify (app 15368) required, required approval count 0, and all unrelated protection flags unchanged. Current AGENTS/design/guide record per-PR auto-merge opt-in. SEO PR #9 production deployment and five HTTP endpoints passed; its plan/log are archived. A live auto-merge PR exercise remains the delivery check after commit.
