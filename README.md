# Cesium Workbench

**基于 Vue 3、TypeScript 与 CesiumJS 的开源三维地球工作台。**

加载 GeoJSON、glTF/GLB 与 3D Tiles，操作图层、地形、绘制和测量工具，编排相机镜头并输出视频或图片序列。当前版本 2.0.0-rc.1 是从 Cyber-Sight Geo 提取的独立前端。

An open-source 3D geospatial workbench built with Vue 3, TypeScript and CesiumJS. Explore 3D Tiles and glTF, use spatial tools, and create camera-shot exports.

Formerly **vue3-cesium-typescript-start-up-template**. The original implementation is preserved on [branch 1.0.0](https://github.com/tanghaojie/vue3-cesium-typescript-start-up-template/tree/1.0.0) and [tag 1.0.0](https://github.com/tanghaojie/vue3-cesium-typescript-start-up-template/releases/tag/1.0.0). GitHub repository rename has not been performed.

## 快速开始 / Quick start

需要 Node.js 22.12+（当前验证环境见迁移记录）与 pnpm 11.22.0。

```sh
corepack enable
corepack prepare pnpm@11.22.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

访问 http://localhost:3333/；/geo.html 为兼容入口。pnpm run vite 仍可使用。英文入口使用 /?lang=en-US。

```sh
pnpm format:check
pnpm lint
pnpm build
pnpm preview
```

build 包含 Vue/TypeScript 与 Vite 配置类型检查。产物位于 dist，一次构建生成两个 HTML 入口及唯一 cesiumStatic。初始仅支持部署在站点根路径。

## 功能 / Features

- Data：影像、地形、GeoJSON、glTF/GLB、3D Tiles 与 AIModels 静态目录。
- View / Scene / Time：相机、场景模式、质量/光照、时间轴与唯一仿真时钟。
- Flight：模拟航线可视化；不是实时航班服务。
- Drawing / Measurement / Model / Terrain / Compare：标绘、测量、模型工具、地形分析与对比。
- Capture：镜头模板、机位编辑、工程 JSON/本机保存、净画面和逐帧 MP4/PNG 输出路径。

插件是编译期源码模块；没有远程代码插件市场、通用 npm SDK、后台账户或数据库。当前支持桌面横向工作台，最低交互验收基线 1280×720；竖屏视频输出不表示手机布局支持。

## 配置与数据 / Configuration and data

将 .env.example 复制为 .env.local 后按需填写；默认无需自建后端。VITE_GEO_TIANDITU_TOKEN 仅用于公开浏览器客户端令牌，VITE_GEO_AI_MODELS_CATALOG_URL 可替换静态模型目录。所有 VITE_* 值都可能进入浏览器，禁止填入服务器秘密。

默认演示使用远程影像、地形与 sample-data-jt / AIModels 资产；网络和 CORS 会影响加载。原示例数据测试用途可按原说明使用，商业用途请联系维护者确认；代码 MIT 不等于远程素材的无限再分发授权。

## 迁移与验收 / Migration and acceptance

[迁移说明](docs/migration.md)覆盖旧功能映射、工程跨域导入、部署和人工验收。[拍摄指南](docs/guides/geo-capture.md)说明相机、动画与导出行为。

本次只执行工程静态门禁；交互、跨域资源、GPU 和浏览器编码由维护者人工验收。MP4/4K 支持取决于实际浏览器/编码器/设备；PNG 为备选输出路径。现有线上演示仍属于此前部署，不应视为本候选版本已上线。

## 结构 / Structure

```text
src/app/           # 启动与应用配置
src/modules/geo/   # core / tools / plugins / components / pages
src/shared/        # 独立本地化、图标、品牌与样式
docs/              # 设计、迁移清单、指南与协作记录
```

[设计与文档入口](docs/README.md) · [来源与版权](NOTICE) · [MIT License](LICENSE)

Copyright © 2021 JackieTang; © 2026 JTLab. Geo source: [Cyber-Sight 9697230](https://github.com/tanghaojie/Cyber-Sight/tree/9697230d7278ae88afb3c82c98e3865181847d08).
