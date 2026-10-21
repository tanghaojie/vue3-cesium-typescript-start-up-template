# Cesium Workbench · Vue 3 + CesiumJS 三维地球工作台

**AI 友好的开源三维地球工作台，基于 Vue 3、TypeScript 与 CesiumJS。**

加载 GeoJSON、glTF/GLB 和 3D Tiles，使用绘制、测量、地形与模型工具，编排相机镜头并输出视频或图片序列。当前版本 **2.0.0-rc.1** 是从 Cyber-Sight Geo 提取的独立前端，可直接在线使用，也可作为 CesiumJS 二次开发的起点。

[在线工作台](https://cesium-workbench.github.io/) · [项目介绍](https://cesium-workbench.github.io/about/) · [English](README.en.md) · [拍摄指南](docs/guides/geo-capture.md)

An open-source 3D geospatial workbench built with Vue 3, TypeScript and CesiumJS. Explore 3D Tiles and glTF, use spatial tools, and create camera-shot exports.

## 原 vue3-cesium-typescript-start-up-template

**Cesium Workbench 就是原来的 vue3-cesium-typescript-start-up-template。** 仓库现已更名为 Cesium-Workbench，从三维地球可视化启动模板发展为独立工作台。

原模板实现完整保存在 [1.0.0 分支](https://github.com/tanghaojie/Cesium-Workbench/tree/1.0.0)和 [1.0.0 标签](https://github.com/tanghaojie/Cesium-Workbench/releases/tag/1.0.0)。旧仓库链接由 GitHub 重定向到新仓库；需要原实现时请使用上述分支或标签。

- 开发源仓库：[tanghaojie/Cesium-Workbench](https://github.com/tanghaojie/Cesium-Workbench)
- 官网：[cesium-workbench.github.io](https://cesium-workbench.github.io/)
- 发布仓库：[Cesium-Workbench/cesium-workbench.github.io](https://github.com/Cesium-Workbench/cesium-workbench.github.io)，由个人源仓库单向同步。

## 可以做什么

| 能力       | 当前内容                                                                    |
| ---------- | --------------------------------------------------------------------------- |
| 数据与模型 | GeoJSON、glTF/GLB、3D Tiles、影像、地形；URL 加载与 AIModels 静态目录       |
| 空间工具   | 绘制、距离与面积测量、模型检查、地形分析、对比视图                          |
| 场景与时间 | 相机、二维/三维场景、质量与光照、唯一仿真时钟                               |
| 相机与输出 | 机位/镜头编排、自动运镜预览、逐帧 MP4 或 PNG 序列、拍摄工程 JSON 导入与保存 |
| 开发结构   | 11 个编译期插件、本地化与图标、独立前端、无自建后台依赖                     |

工作台主要面向桌面横向布局，最低交互验收基线为 **1280 × 720**。AIModels 是静态模型目录；航班数据为模拟数据。应用没有内置三维模型生成服务、后台账户系统或远程插件市场。

## 快速开始

需要 Node.js **22.12+** 与 pnpm **11.22.0**，当前工程验证使用 Node 24。

```sh
git clone https://github.com/tanghaojie/Cesium-Workbench.git
cd Cesium-Workbench
corepack enable
corepack prepare pnpm@11.22.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

访问 http://localhost:3333/；/geo.html 是兼容入口，英文工作台使用 /?lang=en-US。静态项目介绍位于 /about/，英文介绍位于 /about/en/。

```sh
pnpm format:check
pnpm lint
pnpm build
pnpm preview
```

build 包含 Vue/TypeScript 与 Vite 配置类型检查。产物位于 dist，生成两个工作台 HTML 入口、静态介绍页及唯一 cesiumStatic。部署在站点根路径；pnpm run vite 保留为开发别名。

## 配置与数据

将 .env.example 复制为 .env.local 后按需填写；默认无需自建后端。

- VITE_GEO_TIANDITU_TOKEN：公开浏览器客户端令牌。
- VITE_GEO_AI_MODELS_CATALOG_URL：替换静态模型目录。
- VITE_APP_NAME：覆盖工作台显示名称。

所有 VITE_* 值都可能进入浏览器，禁止填入服务器秘密。远程影像、地形与 sample-data-jt / AIModels 资产的网络、可用性和 CORS 会影响加载。

**源码 MIT 许可不代表远程素材可以无限再分发。** 示例数据按各自条款使用；原示例数据商业用途请联系维护者确认。MP4/4K 输出取决于浏览器、编码器和设备，PNG 序列为备选输出路径。竖屏视频输出不表示手机布局支持。

## 文档与贡献

- [迁移与兼容说明](docs/migration.md)：旧功能映射、跨域工程 JSON 转移与验收边界。
- [拍摄与导出指南](docs/guides/geo-capture.md)：相机、动画和输出行为。
- [架构与模块边界](docs/design/geo-workbench.md)：运行时、插件和资源生命周期。
- [组织同步与发布](docs/guides/organization-publication.md)：个人开发、组织发布。
- [搜索与 AI 检索维护](docs/guides/search-discovery.md)：主域名、内容维护与站点地图提交。

问题反馈与贡献请提交到[个人源仓库](https://github.com/tanghaojie/Cesium-Workbench/issues)。工程静态检查不代替浏览器、GPU、资源 CORS 和编码输出的人工功能验收。

```text
src/app/           # 启动与应用配置
src/modules/geo/   # core / tools / plugins / components / pages
src/shared/        # 独立本地化、图标、品牌与样式
public/about/      # 中英文静态产品介绍与分享素材
docs/              # 设计、指南、迁移清单与协作记录
```

[文档入口](docs/README.md) · [来源与版权](NOTICE) · [MIT License](LICENSE)

Copyright © 2021 JackieTang; © 2026 JTLab. Geo source: [Cyber-Sight 9697230](https://github.com/tanghaojie/Cyber-Sight/tree/9697230d7278ae88afb3c82c98e3865181847d08).
