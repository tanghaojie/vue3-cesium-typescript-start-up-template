---
status: source-reference
updated: 2026-10-17
---

# Geo 本地建筑拼装预览

> 来源规范快照：Cyber-Sight 9697230d7278ae88afb3c82c98e3865181847d08。此文保留来源的功能语义与制作约定；独立应用的当前目录、依赖和部署以 [Geo application design](../../design/geo-workbench.md) 为准。未声明目标浏览器验收通过。

用户需要在本地查看 AIModels 已发布 GLB 的构件飞入效果。本次属于 Geo 内部临时开发能力，使用 `/geo.html?assemblyPreview=1` 显式启用，只有 Vite DEV 模式加载组件；生产构建不提供入口。

后续新资产按 [CS-AM-1 分件与动画制作要求](geo-model-assembly-authoring.md)交付。该制作规范不把本页固定示例推广为通用生产播放器；新资产不能依赖本页的特定材质名改色和柔光补偿。

2026-10-18 已另行接入[普通已加载模型动画控制](geo-model-animation.md)，以实际文件内嵌片段为准，默认不自动播放。本页固定样例、多构件同步、配色与照明对照仍独立保留在 DEV。

## 职责与接口

### 材质与对照照明（2026-10-17 修订）

根据当前 Blender 只读检查，四个 Assembly 材质的 `diffuse_color` 为已显示的混凝土、结构、幕墙、屋顶配色，但 Principled Base Color 都为 `[0.8,0.8,0.8,1]`；发布 GLB 同样全部灰色。因此灰色不是前端丢材质，而是导出前实际节点没有设置颜色。截图对应的实体工作室显示不等同于实际材质渲染。

临时预览只对下载后的内存副本按四个明确材质名恢复上述视口颜色，保持动画、几何、alpha 和其他材质属性；不修改 Blender、仓库源 GLB 或线上文件。`tools/model/assembly-preview-materials.ts` 负责 GLB JSON 段重建并保留其他数据段，未知材质不改。此兼容路径只用于该示例，不加入通用加载器。

默认“柔光对照”使用模型专属 UNLIT CustomShader 按相机空间法线做柔和主光/补光，保留恢复后的漫反射颜色，避免场景昼夜改变对照配色；不声称复刻 Blender 工作室环境或 AgX。可切换“场景日光”，注销柔光 Shader 并重新使用统一太阳与环境渲染；切换不重启动画。清理注销管理器句柄并销毁自有 Shader。

Scene 提供 `geoRenderQualityCapability`，公开只读 renderMode 与 setMode，内部仍由原有唯一分辨率控制器设置。临时面板挂载时请求高清模式、卸载时在模式未被改为其他档时恢复原档，避免预览直接写 resolutionScale 或创建竞争控制器。移除模型也恢复原画质，重新加载时再请求高清。

`components/preview/AssemblyPreview.vue` 只负责操作和状态显示；`tools/model/assembly-preview.ts` 的 `createAssemblyPreview(viewer, rendering)` 拥有下载、Primitive、动画、镜头、取消和清理，返回 `load / play / pause / seek / clear / dispose`。这些均为 Geo 内部接口，不增加跨模块公共依赖。页面只组装组件，组件使用 Viewer 访问端口和 Scene 公开 capability。

加载固定地址 `https://jt-ai-models.vercel.app/tmp/building_assembly.glb`，复用 `prepareGeoModelAsset` 与统一模型渲染管理器。演示位置为成都附近明确标注的示例坐标，不声称模型包含真实地理定位；在当前地形上采样高度。模型就绪后同时激活全部构件动画，通过公开 `animationTime` 和 `animateWhilePaused` 使用同一实际经过秒数，短片段停留末帧。预览独立于场景 Clock，不改变昼夜、时间倍率或航班时间。

## 数据流、失败与清理

DEV + URL 参数 → Viewer ready → 动态组件 → 下载 GLB → 地形高度 → Model ready → 注册统一渲染 → 激活动画 → 固定覆盖建筑及飞入范围的镜头 → 自动播放。面板可暂停、重播、拖动进度、显示完成状态及移除模型。

网络、地形、加载、场景渲染异常显示可重试错误；异步加载和镜头等待检查取消状态。移除、重试、退出页面时取消下载、ready 等待与镜头飞行，注销渲染句柄、事件及 Blob URL，销毁自有 Primitive；不修改原始 GLB、不改现有模型加载语义。

## 验证边界

本地工程检查和发布资源检查通过；开发组件模块请求 HTTP 200，生产构建排除了专用预览代码。按钮事件使用命名函数以避免多语句内联表达式在格式化后产生开发编译错误。该 DEV 组件在生产包中被排除，生产构建本身不能证明其开发编译或视觉行为。

执行格式、类型、lint、生产构建及文档审计。按仓库约定不运行前端或浏览器自动化。人工打开本地入口确认：首次自动播放、全构件同步顺序、暂停/拖动/重播、结束保持、移除/失败重试/离开页面，且昼夜时间和原有数据加载不变。生产包不得包含该预览入口或专用组件。实际视觉效果由维护者查看。
