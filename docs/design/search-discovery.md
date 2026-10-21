---
title: Search and AI discovery after repository rename
status: active
updated: 2026-10-21
---

# Search and AI discovery after repository rename

## User decisions and responsibility

The canonical site is https://cesium-workbench.github.io/. The owner explicitly chose GitHub Pages over the existing Vercel homepage setting. The root remains the interactive workbench; independent, useful product pages are served at /about/ (Simplified Chinese) and /about/en/ (English).

The canonical source is tanghaojie/Cesium-Workbench; the organization repository publishes the same source. Preserve the exact legacy name vue3-cesium-typescript-start-up-template in visible rename explanations, README content and structured identity. Branch/tag 1.0.0 remain the historical implementation, rather than a second current product.

## Boundaries and interfaces

public/about/ owns static product information and shared visual assets. Its HTML contains visible, source-backed descriptions, supported data formats, feature groups, setup, factual Q&A, limitations and repository/documentation links without JavaScript or WebGL. A lightweight atlas/editorial visual style uses local CSS and an illustrative globe, without presenting it as an application screenshot.

index.html and geo.html keep the same Geo runtime. Both declare the root canonical; geo.html is excluded from sitemap.xml as a duplicate entry. Metadata includes descriptive title/description, robots preview permissions, Open Graph and Twitter cards with an actual local preview PNG. The default application bootstrap preserves the HTML title; an explicitly configured VITE_APP_NAME can still override it.

GeoWorkspacePage accepts an optional projectInfoUrl from the app assembly. It renders a localized native link to product information while normal workspace chrome is visible, and hides it in clean or framed capture presentation. Geo contains no SEO policy, host assumptions or discovery-module imports. The Viewer clock, rendering, capture contracts and browser storage are unchanged.

Static sitemap.xml lists only the root and the two canonical product pages. robots.txt allows crawling and points to that sitemap; it is not an indexing guarantee. Product pages have reciprocal hreflang and self-canonicals. Identical builds on Vercel declare the corresponding GitHub Pages canonical; this is a canonical signal, not an HTTP redirect or proof that crawlers selected that URL.

## Accurate entity and repository content

Structured JSON-LD on the product pages describes SoftwareApplication and SoftwareSourceCode using visible facts: brand and former name, version, supported functions, license, runtime requirements and source repository. No fabricated reviews, ratings, adoption metrics or guaranteed rich results are added. The root only describes the WebSite identity.

README.md and README.en.md explain the rename, product capabilities, quick start, source/publication roles and limitations. package.json points to the canonical source, homepage and issues. Both GitHub repositories receive descriptive About text, the canonical homepage and relevant topics; remote repository metadata is separate from source synchronization.

GEO means making public facts accessible and attributable for generative search. No crawler impersonation, bot-only content, hidden keyword repetition or special AI ranking claims are introduced. A special llms.txt is not required for Google's AI search and is not a substitute for useful visible pages.

## Maintenance and failure modes

Keep public HTML, JSON-LD version, README facts and package metadata consistent when releasing or changing functionality. On a future domain move, update all canonicals, language alternates, preview URLs, sitemap and both repositories' About links together. Preserve old-name references until a human decides they no longer help discoverability.

A static product page remains readable if the Viewer, imagery or external models cannot initialize. Links into the application retain the current origin. External documentation and source links use the personal repository. Third-party assets, CORS and browser codec limitations remain explicit.

## Verification and evidence boundaries

Run formatting, ESLint, TypeScript and the production build; inspect emitted HTML, native links, JSON-LD parsing, sitemap/canonical consistency and preview dimensions. These are static and HTTP checks, not frontend or browser automation. After publishing, inspect real source synchronization/Pages results and fetch the deployed pages and crawler files.

The owner performs visual, interaction, GPU and capture acceptance. Search Console/Bing ownership verification, sitemap submission and indexing requests require owner account access and are documented separately; indexing, rankings, AI citations and traffic changes cannot be guaranteed or claimed from this implementation alone.

## Primary guidance

- [Google AI features and your website](https://developers.google.com/search/docs/appearance/ai-features): ordinary SEO, accessible text, internal links and factual visible structured data remain the foundation.
- [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics): meaningful titles and initial HTML metadata.
- [Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): consistent preferred URLs and sitemap signals.
- [Structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): markup must match visible content.
