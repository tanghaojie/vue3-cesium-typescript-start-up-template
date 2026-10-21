---
title: Automatic delivery configuration
status: active
date: 2026-10-21
change_type: ci
---

# Automatic delivery configuration

## User instruction

The owner manually merged PR #9 and asked for automatic merging. A focused preference question explained the current one-review requirement. The owner explicitly selected CI-only auto-merge: keep PR/check gates and remove mandatory manual approval.

## Evidence and decisions

Initial staging/worktree were clean. Read live repository and master protection settings: allow_auto_merge=false, one approving review, no required status check, no rulesets. Existing GitHub Actions check is named verify with app ID 15368. GitHub official documentation confirms repository enablement plus per-PR opt-in and remaining merge requirements.

Created codex/automatic-delivery from latest master 7ab0d47a31af5659a34c5b51a78c97de5240ec49. The owner's SEO merge is preserved. No secrets were read. The selected policy will be stored in current design and AGENTS rather than relying on chat history.

## Planned implementation

Enable auto-merge, require strict verify with approval count 0, preserve all other protections, and exercise a real PR through the authenticated maintainer CLI. No admin bypass, direct master push or approval impersonation.

## Results

Settings writes, documentation validation, PR exercise and publication checks are pending. SEO source sync for 7ab0d47 succeeded; its Pages deployment was still running when inspected.

## Applied and re-read configuration

The authorized GitHub configuration writes succeeded. Repository allow_auto_merge is true. Personal master requires strict verify from GitHub Actions app 15368, retains the PR requirement, and has required_approving_review_count=0. Administrator enforcement remains false; force push, deletion, signatures, linear history and conversation-resolution flags remain unchanged. No other repository or external contributor opt-in workflow was modified.

The owner-merged SEO commit 7ab0d47 synced successfully and Pages run 39549051468 succeeded. HTTP returned 200 for root, both about languages, robots and sitemap, with correct HTML canonicals. Its records are archived. AGENTS and publication guidance now require each future owner-authorized AI delivery PR to opt into normal auto-merge. Documentation formatting and live PR exercise are next.
