# Cesium Workbench · Vue 3, TypeScript & CesiumJS

**An open-source 3D geospatial workbench for exploring spatial data and creating camera-shot visualizations.**

Load GeoJSON, glTF/GLB and 3D Tiles; use drawing, measurement, terrain and model tools; compose camera shots and export video or image sequences. Version **2.0.0-rc.1** is a standalone frontend extracted from Cyber-Sight Geo.

[Open workbench](https://cesium-workbench.github.io/?lang=en-US) · [Project overview](https://cesium-workbench.github.io/about/en/) · [简体中文](README.md)

## Formerly vue3-cesium-typescript-start-up-template

**Cesium Workbench is the renamed vue3-cesium-typescript-start-up-template project.** It has grown from a 3D globe visualization starter into a standalone workbench using Vue 3, TypeScript and CesiumJS.

The original implementation is preserved on [branch 1.0.0](https://github.com/tanghaojie/Cesium-Workbench/tree/1.0.0) and [tag 1.0.0](https://github.com/tanghaojie/Cesium-Workbench/releases/tag/1.0.0). GitHub redirects the old repository URL; use the preserved refs for the original template.

- Canonical source: [tanghaojie/Cesium-Workbench](https://github.com/tanghaojie/Cesium-Workbench).
- Website: [cesium-workbench.github.io](https://cesium-workbench.github.io/).
- Publication mirror: [Cesium-Workbench/cesium-workbench.github.io](https://github.com/Cesium-Workbench/cesium-workbench.github.io). Development flows from the personal repository to the organization.

## Capabilities

| Area            | Current functionality                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Data and models | GeoJSON, glTF/GLB, 3D Tiles, imagery and terrain; URL loading and the AIModels static catalog           |
| Spatial tools   | Drawing, distance and area measurement, model inspection, terrain analysis and comparison views         |
| Scene and time  | Camera, 2D/3D modes, quality, lighting and a single simulation clock                                    |
| Camera capture  | Shot/position editing, camera-motion preview, frame-by-frame MP4 or PNG sequences, capture project JSON |
| Development     | 11 compile-time plugins, localization and local icons, standalone frontend without a custom backend     |

The workbench targets a desktop landscape layout with a minimum interaction acceptance viewport of **1280 × 720**. AIModels is a model catalog, and the flight example uses simulated data. There is no built-in 3D generation service, account backend or remote-code plugin marketplace.

## Quick start

Requires Node.js **22.12+** and pnpm **11.22.0**. Current engineering validation uses Node 24.

```sh
git clone https://github.com/tanghaojie/Cesium-Workbench.git
cd Cesium-Workbench
corepack enable
corepack prepare pnpm@11.22.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3333/?lang=en-US. /geo.html remains a compatibility entry. The static product pages are /about/ (Chinese) and /about/en/ (English).

```sh
pnpm format:check
pnpm lint
pnpm build
pnpm preview
```

The build includes Vue/TypeScript and Vite configuration type checks. Output is dist, including both workbench entries, static product pages and a single cesiumStatic resource tree. Deploy at the site root. pnpm run vite remains a development alias.

## Configuration and limitations

Copy .env.example to .env.local if needed. VITE_GEO_TIANDITU_TOKEN is a public browser token, VITE_GEO_AI_MODELS_CATALOG_URL overrides the model catalog, and VITE_APP_NAME overrides the display name. All VITE_* values may appear in browser code; never put server secrets there.

Remote imagery, terrain and sample-data-jt / AIModels assets have separate availability, CORS and usage terms. **MIT licensing of the source does not grant unrestricted redistribution of external assets.** Confirm the original sample-data terms with the maintainer for commercial use.

Video/4K output depends on the browser, device and encoder; PNG sequences provide an alternative. Portrait video output does not imply mobile workspace support. Engineering checks do not establish browser, GPU or encoding acceptance.

## Documentation and contributions

- [Migration and compatibility](docs/migration.md).
- [Camera capture guide](docs/guides/geo-capture.md).
- [Application design and boundaries](docs/design/geo-workbench.md).
- [Source synchronization and publication](docs/guides/organization-publication.md).
- [Search discovery maintenance](docs/guides/search-discovery.md).

Documentation is currently primarily in Chinese. File issues and contributions in the [personal source repository](https://github.com/tanghaojie/Cesium-Workbench/issues).

[Documentation index](docs/README.md) · [Source attribution](NOTICE) · [MIT License](LICENSE)

Copyright © 2021 JackieTang; © 2026 JTLab. Geo source: [Cyber-Sight 9697230](https://github.com/tanghaojie/Cyber-Sight/tree/9697230d7278ae88afb3c82c98e3865181847d08).
