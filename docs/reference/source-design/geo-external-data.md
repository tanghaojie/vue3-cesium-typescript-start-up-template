---
title: Geo 外部数据独立菜单
status: source-reference
owner: project maintainers
updated: 2026-10-19
---

# Geo 外部数据独立菜单

> 来源规范快照：Cyber-Sight 9697230d7278ae88afb3c82c98e3865181847d08。此文保留来源的功能语义与制作约定；独立应用的当前目录、依赖和部署以 [Geo application design](../../design/geo-workbench.md) 为准。未声明目标浏览器验收通过。

2026-10-19：Data 通过 `plugins/data/data.capabilities.ts` 的 `data.captureSubjects` 向[拍摄插件](geo-capture.md)公开可见独立模型的中心、半径、来源、片段、采样租约与可见瓦片就绪状态。端口不暴露资源 Map，拍摄工程导入不自动加载 URL；既有加载、坐标确认与静态目录发布语义保持有效。

## 职责与边界

“外部数据”位于 Geo 左侧任务菜单，紧随“数据”，直接打开独立加载面板。“数据”只负责底图与注记、地形。外部数据提供 GeoJSON URL、模型 URL、3D Tiles URL 和 AI 模型四种入口；不提供地标与周边、场景 URL、台北示例及相关场景操作入口。AI 模型目录和配套资源加载见 [AIModels 接入设计](geo-ai-models.md)。

这是现有 Platform Geo 模块内的 UI 分工。继续由 data 插件持有唯一 controller、数据资源和 Cesium 生命周期，不增加后端、API、依赖或跨模块公共接口。地标底层解析及生命周期实现保留，但当前菜单不暴露该能力。

## 交互设计

- 首屏按 GeoJSON、模型、3D Tiles、AI 模型顺序显示四个类型按钮，采用两列布局，默认选中 GeoJSON；每次只展开对应加载内容。
- GeoJSON 与 3D Tiles URL 默认空白；模型 URL 保留原有 DEFAULT_GEO_MODEL_URL。类型切换保留三个输入及模型放置草稿。
- 模型表单保留 WGS84 经度、纬度、椭球高及“使用视图中心”；缩放和姿态收在可选详情中。
- 类型选择下方呈现独立加载卡片，当前会话的已加载数据单列管理，保留显示、定位、移除、模型调整与瓦片材质切换。
- 已加载独立模型包含 glTF 动画时，在操作区显示“动画”按钮，点击展开片段、播放/暂停、重播、进度、速度和循环面板；静态资源隐藏该入口。播放进度、隐藏暂停及释放见[模型动画设计](geo-model-animation.md)。
- 加载期间禁止重复提交，以当前 controller 的 loadingOperation 提示真实加载类型。错误在加载表单附近显示，保留 URL 以便重试。

## 内部文件与数据流

`data.plugin.ts` 在同一插件中登记 data 与 external-data 两个任务组和两个 panel。`DataPanel.vue` 管理底图与地形；`ExternalDataPanel.vue` 管理三种 URL 表单、AI 模型目录组装和资源操作。两者调用同一 `data.controller.ts`，再进入既有工具层与 Scene 渲染 capability。`GeoWorkspacePage.vue` 只补齐任务元数据和面板选择，不承载加载规则。

公共文件仍以 [Geo 模块设计](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/design/modules/geo.md) 登记为准，不对其他模块公开两个面板。切换菜单不重建 Viewer 或 controller；模型坐标确认仍由既有 overlay 承载。

## 失败模式与验证

远端失败、跨域限制、无效模型和坐标确认取消继续遵循既有 controller 行为。默认瓦片仍由插件启动逻辑处理。AI 目录按显式模式/精细度选择文件，缺失声明使用静态/原始默认；动画片段由当前模型文件发现，无效时间数据在动画面板提示，不使静态模型加载失败。

执行格式检查、前端 TypeScript/生产构建、修改文件 ESLint、模块所有权与文档归档 CI 检查。按仓库规则不创建或运行前端自动化、浏览器测试。维护者人工验收：独立菜单顺序、数据页仅两个 Tab、三个 URL 默认值与切换、地标入口消失、三类加载/错误/资源管理、模型定位与坐标确认、1280×720 下导航与面板可滚动。

## 交付与复核证据

实现提交为 `c76aa95`，本轮 TypeScript/生产构建、ESLint、格式与模块边界检查通过。提交后 Platform 达到累计 3 个完成事项，触发文档复核；复核范围为 `e71a7b3..c76aa95`，确认 `d4cf929` 的预览完成按钮命名函数、`bd52b3a` 的配色/照明隔离与本次菜单拆分均已进入现行设计。没有被取代但未归档的 Design/ADR，既有计划和协作记录已归档；人工视觉边界保留。
