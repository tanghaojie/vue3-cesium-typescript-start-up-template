---
title: Repository and website search discovery
status: completed
date: 2026-10-21
change_type: feat
---

# Repository and website search discovery

## User goal and decisions

The owner reports successful deployment and asks to improve repository/site SEO and GEO after renaming. They chose: preserve the current workbench homepage, add independent product information pages, and use GitHub Pages as the main site instead of the previous Vercel repository homepage.

## Evidence and scope

Staging/worktree were empty. Origin/master was 0fb638c874a19fa913b9dfffb21cd508c91cdb5a; branch codex/seo-discovery started there. Read the standalone AGENTS.md and current Geo/publication designs. This repository has no CodeGraph directory, Foundation/Platform scopes or archive ledger.

Before changes, source metadata had the owner's AI-friendly description, four topics and a Vercel homepage; organization About metadata was empty. The public GitHub Pages HTML returned 200 with no canonical. Root HTML contained a minimal app shell, and bootstrap replaced its descriptive title with the plain brand.

agent-reach GitHub CLI reads succeeded. Jina Reader failed TLS; primary Google documentation and direct HTTP reads were used for confirmation. Direct Vercel HTTP failed, so no Vercel deployment behavior is claimed. No browser automation was performed.

## Implemented changes

Added static Chinese/English product information with source-backed features, rename history, setup, Q&A and limitations. Added local atlas-style CSS/illustration and a PNG social preview generated from the versioned SVG. Added canonical/language/social/JSON-LD markup and crawler files. Product information works without application JavaScript or WebGL.

Root/geo.html retain the workbench and canonicalize to the root. Default HTML titles are retained unless VITE_APP_NAME is explicitly set. App assembly supplies the optional projectInfoUrl; the localized link hides during clean/framed capture presentation without modifying Viewer or capture contracts.

Updated bilingual README, package identity and current design/guides/indexes. Updated both remote repository descriptions, homepage links and 17 relevant Topics via GitHub CLI, then re-read them. The source description retains AI-friendly positioning and explicitly mentions the former name. Homepage is the user-selected GitHub Pages URL. No dependency versions, lockfile, 1.0.0 refs or external domain settings were changed.

## Actual verification

Frozen install, formatting, formatting check, ESLint and production build including Vue/config TypeScript checks passed on Node v24.19.0 / pnpm 11.22.0. Built artifact inspection parsed metadata/JSON-LD for index.html, geo.html, about/index.html and about/en/index.html; checked native local references; confirmed 1200 × 630 PNG and valid three-URL sitemap XML; inspected robots.txt. The social preview was viewed as a local image.

Existing Sass legacy API and bundle-size advisories remain. No frontend unit, component, E2E or browser automation was added or run. Layout, keyboard, locale link and capture hiding remain human acceptance boundaries.

## Delivery and verification limits

Associated implementation commit: feat(discovery): improve repository and website search visibility, with GPT-6 co-author trailer. This log is archived in that commit before publishing the PR; real CI, merge, organization synchronization, Pages deployment and deployed HTTP responses are inspected in delivery and reported to the owner. No pre-push success for those systems is implied.

Owner account actions remain: Search Console/Bing ownership, sitemap submission and indexing requests. No search analytics, rankings, generated-answer citations or traffic gains were measured or guaranteed. Primary guidance links are recorded in the current discovery design.
