---
title: Geo 外部模型统一渲染标准
status: source-reference
owner: project maintainers
updated: 2026-10-19
---

# Geo 外部模型统一渲染标准

> 来源规范快照：Cyber-Sight 9697230d7278ae88afb3c82c98e3865181847d08。此文保留来源的功能语义与制作约定；独立应用的当前目录、依赖和部署以 [Geo application design](../../design/geo-workbench.md) 为准。未声明目标浏览器验收通过。

2026-10-19：[拍摄插件](geo-capture.md)在会话内以绝对拍摄进度设置唯一 `viewer.clock.currentTime`，并通过模型外部 TRS 采样租约暂停局部 RAF；Scene 仍在 preUpdate 按同一日期求值昼夜。停止或取消归还时间与动画。导出借用固定分辨率端口，不重新应用场景画质预设；采集前等待可见资源稳定。

## 背景与目标

普通用户提供外部 glTF 2.0/GLB URL 和 WGS84 定位后，模型自动采用系统统一的昼夜渲染。用户可以切换场景级性能、平衡、兼容模式，不需要逐模型 Profile、Shader 或灯光参数。系统只负责标准与渲染，不制作、托管、上传或管理模型资产。

新制作或重导出的建筑遵循[模型制作与地理参考标准](geo-model-authoring.md)：几何、PBR、UV、纹理、表面变化、夜景及地理元数据由资产制作端交付，周边真实环境与反射归场景优化。该标准补充制作要求，不表示现有模型已重制，也不改变本页运行时能力。

## 范围与非目标

范围为 Platform Geo 的外部模型加载、Scene 渲染能力和必要的使用说明。沿用当前会话资源和原有缩放/姿态调整。不增加资产目录、后端、数据库、场景持久化、第三方依赖、实时人工光源或天气；不改变成都 3D Tiles 科技扫描材质和 Flight 算法。性能档可启用场景级轻量高亮柔光，默认平衡档不启用。混合资源错误隔离规则见失败模式。

## 渲染标准

- 保留模型原有基础颜色、纹理、法线、金属度、粗糙度、透明度及 Unlit 语义。
- PBR 材质中的 Emissive 统一解释为夜景通道，白天乘 0，夜间乘 1；独立运行时副本适配 Cesium 1.144 未支持的 `KHR_materials_emissive_strength`，保持资产原本的强度比例。无 Emissive 的模型不生成窗灯。性能/平衡档加入极低强度蓝灰环境补光近似，兼容档关闭；它不创建灯光，也不表示城市真实照明。
- 只使用 `viewer.clock.currentTime`。根据太阳位置与每个模型的 WGS84 位置求太阳高度；相同 UTC 的不同地区独立计算，禁止读取电脑本地小时或按相机位置判断建筑昼夜。
- 高度角大于等于 +2° 为白天，小于等于 -6° 为夜间，中间采用 smoothstep 平滑过渡。环境漫反射夜间为原始值 0.4 倍，镜面为 0.6 倍；兼容档关闭模型镜面 IBL。直射在 0° 至 +6° 间平滑衰减，低角度偏暖；太阳在地平线下不从地下照亮模型。
- 默认平衡档开启太阳照明和软阴影；性能档提高阴影质量，兼容档关闭阴影。地球光照开关只控制地球表面；模型昼夜始终跟随仿真时间。太阳图形显隐不代表关闭光源。切换模式重新应用预设，之后可手动调整现有 Scene 开关。
- 性能/平衡档使用 SUNLIGHT 大气和 Cesium 动态环境图。Data 注册 Model 和 Cesium3DTileset 的环境生命周期；更新阈值下限为 300 仿真秒，播放时分别取 `max(300, abs(multiplier) × 0.25)` 与 `max(300, abs(multiplier) × 0.5)`。兼容档关闭动态生成并使用保存的或公开默认球谐漫反射系数。只使用公开 API，不读取动态生成器私有球谐结果、不新增计时器或逐帧 reset。
- 近地地球光照与夜间影像衰减在 3D 下校正；性能档启用设备支持的 AO 与夜间高亮柔光，性能/平衡档夜间曝光最多提高 8%。这些是第一轮视觉校准，异步反射和高倍速成本需人工验收，未实现双环境图插值。
- 加载前读取活动场景的明确 WGS84 metadata；有效坐标须询问来源，选择模型坐标且缺少椭球高时采样当前地形，`height_m` 不当海拔。之后仍按模型变换矩阵的地固坐标原点求太阳高度。无法确定有效位置时保留原始渲染并显示说明，不假定成都或地心是有效地点。

## 职责与公共接口

Scene 另以 `plugins/scene/scene.capabilities.ts` 的 `geoRenderQualityCapability` 提供只读 `state.renderMode` 与 `setMode(mode)`。消费者只能通过该 capability 请求既有画质档位，不能自行创建第二个分辨率控制器。本地拼装预览的请求及恢复约定见 [Geo 本地建筑拼装预览](geo-assembly-preview.md)。

能力仍属于 `apps/frontend/src/platform/modules/geo/`，不新增跨 Platform 模块的公共 API。

- Time 拥有 Clock 控制，不导入模型渲染实现。
- Scene 创建并释放统一渲染管理器，使用 `plugins/scene/scene.capabilities.ts` 发布 `scene.modelRendering`。Data 显式依赖 Scene，消费 capability，不导入 Scene controller。
- `tools/scene/model-rendering.ts` 暴露 `createGeoModelRenderingManager(viewer)`、`GeoModelRenderingManager`、`GeoModelRenderingRegistration`。`register(model)` 返回带 `update()` 和 `dispose()` 的句柄；`registerEnvironment(resource)` 管理瓦片环境；`setMode(mode)` 更新策略，`getFocusPosition()` 提供可见模型锚点，`dispose()` 释放。`tools/scene/render-quality.ts` 拥有全局质量、后期和唯一分辨率控制器。这些是 Geo 内部纯工具接口，不依赖 Vue/插件/UI，也不反向依赖 Data。
- Data 负责下载、变换、ready、定位和 Primitive 生命周期，向纯工具注入管理器；等待原始模型 ready 后、首次可见绘制前注册，在模型矩阵更新后调用句柄 `update()`，在 Primitive 销毁前注销。Cesium 1.144 的 ready 帧尚不绘制模型，此顺序避免新 Shader 阻断 ready。核心 API 原始渲染兼容路径仅供独立工具调用；工作台默认注入统一管理器。
- 资源快照可以保存可读渲染说明，不保存 Cesium 重资源。材质信息只通过公开加载回调检查，不访问私有字段；无可靠证据时保持未知，不宣称已发现缺失材质。

## 数据流与性能

AIModels 目录加载的 URL、定位和关联资源来自经过运行时校验的显式发布描述；此入口直接选择发布坐标，手工模型 URL 仍保留坐标来源确认。模型和生成街区继续使用本设计的同一 Scene 管理器，不引入独立渲染链。见 [AIModels 接入](geo-ai-models.md)。

URL/定位 → Data 独立下载解析与发光倍率适配 → 有效坐标时询问来源并按需采样地形 → 创建 Model 并等待原始模型 ready → Scene 渲染管理器登记 → 时间和位置求太阳高度 → 更新材质 uniform、环境光及模型直射光 → 按画幅与包围球自动取景。

管理器只建立一套共享时间/场景更新监听，模型数量增长不增加定时器或监听器。首次注册、时间变化（包括暂停拖动）、位置变化均立即求值。相同时间及配置跳过重复计算，不创建额外 Clock、requestAnimationFrame 或空闲重绘循环。Shader 保持实例稳定，只更新 uniform。

上述约束针对 Scene 昼夜渲染管理器。独立模型的[动画播放器](geo-model-animation.md)仅在用户播放时用局部 RAF 推进片段秒数并请求渲染；暂停、隐藏、后台或移除时停止，不改动唯一 viewer.clock 或本管理器的日夜权重。

自动生成街区通过 `registerTileset(tileset, position)` 显式登记，复用上述太阳高度、PBR 发光、直射和环境策略；任意第三方瓦片继续只登记环境，不强制替换材质。已有 Style/CustomShader 的瓦片不得混入昼夜 Shader。生成街区三档分别使用屏幕误差 5/12/28、缓存 256/128/48 MiB、溢出 64/32/16 MiB，兼容档关闭瓦片阴影；注销恢复原设置。加载、署名和关联状态见[地标与周边](geo-landmark-context.md)。

## 失败模式与兼容性

- glTF/GLB 和引用纹理需由浏览器可访问，跨域、下载失败和不支持的必要扩展保留现有可诊断错误路径。
- 无发光材质和 Unlit 是能力边界，不应阻止正常显示；提示准确描述检查结果。混合材质按 primitive 保留 Unlit 原始语义。
- 加载失败、取消、移除、清空、页面卸载必须清理坐标请求、Blob URL、注册、监听器和 Shader。注销恢复原有模型 Shader/IBL/光色及环境状态，不销毁不属于本系统的资源。
- 原始模型等待 ready 期间的场景渲染异常终止等待并清理，错误只说明场景失败，不断言模型是故障源。页面卸载也终止尚未完成的 ready 等待。
- Cesium 的 `scene.renderError` 不提供资源归属。存在待就绪或已加载模型时，不自动回退所有模型或清除 3D Tiles 科技扫描；展示场景级故障提示，维护者可移除最近添加的模型后重试。没有模型时保留既有 Tileset 回退行为。因此混合资源场景的自动回退受到限制，不承诺自动定位或恢复任意 GPU 故障。
- 注册时同步异常恢复原始渲染；ready 后异步 Shader/WebGL 失败不能等同于该同步回退，需要人工检查。真实浏览器视觉与故障恢复仍需验收，不得将静态通过描述为 GPU 验收。
- Cesium 固定为 1.144.0；升级时复核 CustomShader 材质阶段、Unlit 宏和公开回调。统一标准会使已有外部 PBR 模型的 Emissive 白天关闭，资产提供方应遵守夜景通道约定。

## 验证策略

执行格式、类型检查、lint、架构边界、生产构建、文档归档门禁及 diff 审查；按仓库约定不新增或运行前端自动化/浏览器测试。

维护者人工验收：

1. 仅填 URL 和定位可加载并自动取景；内置坐标时显示两种位置与取消；缩放/姿态为可选调整，不要求逐模型 Profile 或夜景参数。
2. 成都正午/夜间及日落渐变：PBR 明暗、天空环境反射和 Emissive 同步；时间轴显示浏览器本地时区及对应 UTC 偏移，浏览器时区不同于模型所在地时太阳仍按绝对时刻求值。
3. 暂停后拖动、播放、倍速、回到现在及修改位置立即生效；不同经度模型显示各自昼夜，跨日和极昼极夜不使用固定小时分支。
4. 无 Emissive、Unlit、混合材质、透明材质正确显示，提示与实际材质一致。
5. 显隐、移除、失败、退出重入无重复监听器或资源残留；暂停时空闲渲染不持续增长。
6. 地球光照、太阳显隐、阴影开关语义清晰；正常 3D Tiles 科技扫描和 Flight 保持原行为。混合模型/瓦片的场景渲染错误不误清除其他资源样式，按提示人工恢复。
7. 三档模式切换、兼容降级、高DPI画质、3600倍速反射与夜景、GLB发光倍率、地形定位、取消及退出清理，按[质量与定位设计](geo-render-quality-and-placement.md)人工验收。

## 关联记录

- [三档质量与模型坐标决策](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/decisions/ADR-20261002-geo-render-modes-and-model-placement.md)

- [模型制作与地理参考契约](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/decisions/ADR-20261003-geo-model-authoring-and-georeference.md)
- [浏览器时区与太阳环境光 ADR](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/decisions/ADR-20261002-geo-browser-time-and-solar-environment.md)

- [决策](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/decisions/ADR-20260911-geo-external-model-rendering.md)
- [实施计划](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/archive/plans/2026-09-11-geo-external-model-rendering.md)
- [协作记录](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/archive/ai-logs/feat/2026/09/2026-09-11-geo-external-model-rendering.md)
