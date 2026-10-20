---
title: Geo 已加载模型动画控制
status: source-reference
owner: project maintainers
updated: 2026-10-19
---

# Geo 已加载模型动画控制

> 来源规范快照：Cyber-Sight 9697230d7278ae88afb3c82c98e3865181847d08。此文保留来源的功能语义与制作约定；独立应用的当前目录、依赖和部署以 [Geo application design](../../design/geo-workbench.md) 为准。未声明目标浏览器验收通过。

2026-10-19：[拍摄模块](geo-capture.md)新增外部采样租约，临时暂停局部 RAF 并按拍摄秒数控制 TRS 动画；结束恢复原片段、进度、速度、循环和播放状态。普通操作在租约期间拒绝抢占。内存 glTF 对缺名或重名节点赋予运行时唯一名称，通过公开 `Model.getNode` / `ModelNode.matrix` 重置 TRS，不改写源 GLB；权重通道不进入拍摄采样。动画片段用索引加名称引用，避免重名歧义。

## 目标与边界

在“外部数据 → 已加载数据”的资源操作区，仅对内嵌 glTF 动画的独立模型显示“动画”按钮。点击展开该资源的播放面板，支持片段选择、播放/暂停、重播、秒数进度、速度及循环。一次展开一个资源的面板；关闭面板或切换菜单保留资源的播放状态。

能力属于 Platform Geo 内部，不增加依赖、后端或跨模块公共接口。URL 和 AI 模型加载共用既有 Model 路径。静态 GLB、GeoJSON 与 3D Tiles 不显示按钮，不解析瓦片内模型动画。AIModels 可按[模式声明](geo-ai-models.md)选择独立动画 GLB，不猜测静态文件旁的 assembly/explode 地址，不读取制作附录。望京 SOHO 的静态模式不含动画，选择其飞入或爆炸模式后才有播放入口。

## 职责和数据流

- `tools/model/model-animation.ts`：读取 glTF 动画名称与时间范围；管理单个 Model 的局部播放状态、Cesium 动画句柄、RAF、错误与释放，无 Vue 依赖。
- `tools/data/data-browser.ts`：从现有 `gltfCallback` 取得动画元数据，在 Model ready 后建立控制器并把快照纳入资源；隐藏资源时暂停，移除、失败、销毁时先释放动画。
- `plugins/data/data.controller.ts`：转发动画命令和资源快照，不向 UI 暴露 Cesium Model；动画进度更新仅同步资源列表。
- `plugins/data/ExternalDataPanel.vue` / `ModelAnimationControls.vue`：资源行条件按钮与内嵌控制面板，沿用 Geo 主题、命名按钮、键盘可用的原生表单及错误提示。

加载完成不激活动画，保留文件默认姿态。每次只播放选中的一个 glTF 片段，避免自动叠加冲突片段。切换片段暂停并回到该片段起点；重播从 0 开始，拖动进度会暂停，结束保持末帧。片段时间使用从 0 到最后关键帧的原始局部秒数，保留原有错峰与首帧之前的保持。

## 时间和生命周期

模型播放以 `performance.now()` / RAF 推进局部秒数，通过 Cesium 公开的 `activeAnimations.add({ index, animationTime })` 与 `animateWhilePaused` 求值。固定早期 startTime 避免正常场景时钟回退阻断动画，不写入 `viewer.clock` 的日期、倍率或播放状态。通过 `requestRender()` 支持按需渲染。

播放进度 UI 限频更新；暂停、拖动、切换、结束立即通知。资源被隐藏、页面进入后台时暂停，避免后台累积时间后跳帧。移除资源、取消加载、插件卸载或 Viewer 销毁时取消 RAF、移除 DOM/Scene 监听并清除自有动画句柄，再销毁 Model。控制面板不拥有资源生命周期。

## 失败与兼容

仅识别当前 glTF 的 animations，不依赖文件名、模型标签或材质名。缺少有效时间范围的片段给出面板错误，不影响静态主体加载。播放异常就地停止并提示，可重播重试。片段切换遵循 Cesium 对 glTF 通道的求值；不承诺切换后重置其他片段独占且未被当前片段覆盖的属性，也不新增动画混合或骨骼重定向。

## 验证

执行格式、TypeScript、生产构建、修改文件 ESLint、模块边界和文档归档 CI。不创建或运行前端或浏览器自动化。维护者人工核对静态按钮隐藏、有动画按钮出现、片段选择、暂停/回退/末帧/重播/速度/循环、隐藏与删除、菜单切换、后台恢复，以及场景时间暂停/回退/3600 倍速不影响模型局部进度。最低布局 1280×720。

本次工程检查均通过，实际交互/视觉仍待人工验收。可在“外部数据 → 模型”填写 `https://jt-ai-models.vercel.app/models/wangjing-soho/wangjing-soho-assembly.glb`，按已有坐标确认流程加载；预期显示 `BUILD_ASSEMBLY`、30 s。爆炸文件为同目录 `wangjing-soho-explode.glb`，预期 `BUILD_EXPLODE`、12 s。也可在声明了 modes 的 AI 目录中选择对应模式；同一目录项按模式整组替换，避免保留同位置的静态主体遮挡动画。

## 关联

- [外部数据设计](geo-external-data.md)
- [局部播放决策](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/decisions/ADR-20261018-model-animation-controls.md)
- [实施计划](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/archive/plans/2026-10-18-geo-model-animation.md)
