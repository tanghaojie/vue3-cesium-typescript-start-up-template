---
title: Geo AIModels 模型目录与关联资源加载
owner: project maintainers
status: source-reference
updated: 2026-10-19
---

# Geo AIModels 模型目录与关联资源加载

> 来源规范快照：Cyber-Sight 9697230d7278ae88afb3c82c98e3865181847d08。此文保留来源的功能语义与制作约定；独立应用的当前目录、依赖和部署以 [Geo application design](../../design/geo-workbench.md) 为准。未声明目标浏览器验收通过。

## 职责与边界

外部数据增加第四种“AI 模型”，原有三个 URL 入口保持默认值。AIModels 拥有模型、附件、静态 catalog.json 和每个项目的 model.json；Cyber-Sight 只读取发布协议并加载资源，不扫描目录，不增加后端、数据库或跨模块公共接口。协议主规范在 AIModels 的 docs/publishing-protocol.md。

## 发布协议与数据流

版本 1 的 catalog.json 提供 updatedAt、models（id、label、description、thumbnail、manifest、variants 的 id/label）。model.json 提供版本、稳定 id、label、description、model URL/字节数/SHA-256、variants、placement、resources 和 attribution。URL 相对于各自 JSON 解析；模型和附件限定在配置目录的同源 HTTP(S) 发布站，署名可外链。只读取指定字段，运行时校验版本、唯一 ID、数量、字符串长度、有限数字、坐标、姿态和支持的资源类型。文件摘要用于发布工具与线上交付校验，Geo 运行时校验摘要格式，沿用既有模型下载，不另外重复下载文件。

默认目录 https://jt-ai-models.vercel.app/catalog.json，可通过 VITE_GEO_AI_MODELS_CATALOG_URL 配置。打开 AI 模型类型时获取目录，展示搜索、缩略图、简介、刷新与失败重试；点击卡片读取描述并加载所选模型、声明的 GeoJSON/3D Tiles 配套资源，最后定位主模型。模式与精细度按声明选择，缺省为静态/原始版。目录和描述读取使用 no-cache，资源仍遵循托管缓存。

独立模型加载后若当前 glTF 自带动画，“已加载数据”可显示[动画控制入口](geo-model-animation.md)。2026-10-19 起按[模式与精细度 ADR](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/decisions/ADR-20261019-ai-model-modes.md)兼容扩展 v1；静态主文件不因此获得播放按钮。

### 模式、精细度与默认配置

顶层 model/variants 始终是 static（静态模型）。可选 modes 数组只声明 assembly（飞入拼装）、explode（爆炸分解），每项独立提供 model、variants、defaultVariant 和可选 label。model 必须是实际文件。未声明 modes/variants 等价空数组；不继承静态 variants 到动画。defaultMode 缺省 static，顶层及各模式 defaultVariant 缺省 original；original 指各自模式的主文件。显式默认值必须存在，未知模式、重复 ID、无效默认引用及 null 等非法类型报错，不能伪装为缺省。

catalog 提供各额外模式的 id、label、defaultVariant、variants 摘要和顶层默认值；model.json 提供对应真实文件/字节/摘要。Sight 在工具层将旧/新目录规范化为含 static 的模式列表；缺失声明仍可使用静态原始版和已有质量档。卡片展示“模式”和“精细度”，只有多个选项时出现选择器；切换模式使用该模式默认精细度，刷新后失效的选择恢复到可用默认。重新打开面板时优先展示已加载组的组合。点击加载/重新加载才生效，不自动播放。已加载组记录并显示模式与精细度；重复定位必须两者均相同。

每次加载读取 model.json 验证选择，目录/描述不一致时提示刷新。沿用整组重载（含街区）和失败/取消清理，不增加资产缓存或无缝热切换。加载开始替换旧组后失败不恢复旧组。静态/动画共用发布定位、附件与署名；parts.json/animation.json 仍不下载、不解析。

已校验的发布 placement 明确 coordinateSource=manifest，直接作为 input 定位，避免手工 URL 的坐标弹框；原 URL 加载保持原有确认。所有高程明确是椭球高，展示值不当作测绘结果。仅椭球体可用的发布项在其他地形下阻止加载并提示切换，不自动改场景地形。

## 内部结构与生命周期

- tools/data/ai-model-catalog.ts：纯 JSON 下载、解析、版本与同源校验、URL 解析。
- tools/data/ai-model-loader.ts：关联资源编排、取消、失败回收、重复加载、显隐和移除；注入既有 GeoDataBrowser，不依赖 Vue 或 controller。
- plugins/data/data.controller.ts：持有目录与任务状态，连接 loader、唯一资源管理器和 UI。
- plugins/data/AiModelCatalog.vue：搜索、卡片、质量版本、任务进度/取消及已加载组状态。
- ExternalDataPanel.vue：只增加类型入口并组装组件，保留既有资源列表与操作。

主模型与配套资源作为组管理。重复点击已加载模型直接定位；部分失败支持重新加载。必需资源失败回滚本次组全部资源；可选配套失败保留主体并显示原因。取消与插件卸载结束请求并清理本次已创建资源。组内任一资源的移除/显隐作用于整组；有配套的模型定位调整被阻止并给出说明，避免主体与街区错位。切换至不兼容地形时隐藏组资源并说明，恢复地形后按用户显隐意图恢复。署名和近似定位说明在模型组中可查看。

## 失败与验证

目录下载失败只影响 AI 类型；发布项解析失败不进入 Cesium。主文件、关联资源及嵌套瓦片/纹理须发布且允许跨域。取消后不保留半加载组；加载状态由 controller 持有，切换面板不重复加载。

验证包括 AIModels 生成/校验与负向协议检查、已跟踪资源及嵌套引用检查、线上发布文件读取、Cyber-Sight TypeScript/生产构建、ESLint、格式、架构和归档 CI。按 AGENTS.md 不创建或运行前端自动化或浏览器测试；模型实际显示、坐标、昼夜、重复加载、取消、移除、地形切换及 1280×720 布局由维护者人工验收。

## 模式与精细度实施证据

2026-10-19：AIModels c2a1200 交付可选声明、默认归一化、模式文件完整性校验和目录摘要；发布器 13 项测试及 9 模型/139 文件完整校验通过。望京 SOHO 提供 static/assembly/explode 三模式，国家大剧院保留三档精细度，其余源配置使用缺省。未修改二进制资产。

Sight 通过共享契约构建、前端 TypeScript/生产构建、修改文件 ESLint、格式、模块边界及归档 CI；实际动画、定位、下载/GPU 成本与交互待人工验收。本轮不运行前端/浏览器自动化、不推送或部署，见[计划](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/archive/plans/2026-10-19-ai-model-modes.md)与[日志](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/archive/ai-logs/feat/2026/10/2026-10-19-ai-model-modes.md)。

## 首次接入证据

Cyber-Sight 接入提交为 `9fc04f1`，已推送并核对 origin/master。AIModels 最终提交 `e913492` 已推送，GitHub Actions `38998132258` 成功，Vercel 对应提交 READY。文档复核确认新发布坐标入口是手工 URL 确认策略的显式扩展，两个 ADR 各自保持适用范围，无需废弃旧决策。Platform 审查基线推进到真实接入提交，保留浏览器人工验收边界。

AIModels 功能提交 `d9ff258`、跨平台目录排序修正 `37692bd` 已推送。发布目录包含 8 个模型及 2 个额外质量版本；线上 9 个 JSON 匹配本地，10 个模型文件的完整 SHA-256 与字节数一致，131 个配套/预览端点 HTTP 与 CORS 检查通过。当前代码完成类型、生产构建、修改文件 ESLint、格式和模块边界检查；浏览器行为保持人工验收边界。
