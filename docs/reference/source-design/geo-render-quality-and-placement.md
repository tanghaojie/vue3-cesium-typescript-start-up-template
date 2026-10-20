---
title: Geo 三档显示质量与模型坐标选择
status: source-reference
owner: project maintainers
updated: 2026-10-19
---

# Geo 三档显示质量与模型坐标选择

> 来源规范快照：Cyber-Sight 9697230d7278ae88afb3c82c98e3865181847d08。此文保留来源的功能语义与制作约定；独立应用的当前目录、依赖和部署以 [Geo application design](../../design/geo-workbench.md) 为准。未声明目标浏览器验收通过。

2026-10-19：[拍摄导出](geo-capture.md)通过 `scene.renderQuality.acquireFixedResolution` 临时关闭自适应分辨率，锁定原生输出像素；释放恢复原比例和 DPR 策略，不重新应用画质预设或覆盖手动场景设置。

## 目标与范围

服务「AI建模世界」加载、浏览和3600倍速昼夜录屏的第一轮改进。新增性能、平衡、兼容三档场景显示模式；按维护者命名，性能代表最高显示质量与固定录屏分辨率，默认平衡。保持现有默认影像与手动图层选择，不切换卫星源，不改变浏览器时区与唯一 viewer.clock。

本轮包括近地光照、阴影、克制后期、夜间IBL与发光倍率、GLB坐标询问、真实地形高度与按画幅自动构图。局部三维街区、纹理重制、语义窗灯、自动环绕、双环境图插值及离线导出属于后续资产/渲染工作。

## 模式与渲染

Scene 拥有质量生命周期，核心分辨率工具不再在 Runtime 与 Scene 重复安装。性能锁定原生像素分辨率，启用HDR、较高质量软阴影、支持时的轻量AO与受控高亮柔光；平衡保留像素预算自适应、HDR、较低成本软阴影；兼容限制渲染像素、关闭HDR、阴影、AO、柔光与大气效果，外部模型关闭动态环境图并使用稳定漫反射环境，仍保留太阳与夜景通道语义。模式不持久化场景，不引入后端。

| 策略                | 性能                           | 平衡（默认）                         | 兼容                                |
| ------------------- | ------------------------------ | ------------------------------------ | ----------------------------------- |
| 分辨率              | 原生DPR，比例1，不随FPS降低    | 忽略DPR，160万CSS像素预算，比例0.6–1 | 忽略DPR，90万像素预算，比例0.4–0.85 |
| 目标帧率            | 60                             | 60                                   | 30                                  |
| 阴影                | 4096软阴影                     | 2048软阴影                           | 关闭                                |
| MSAA                | 4，设备支持时                  | 2，设备支持时                        | 1                                   |
| HDR / AO / 夜间柔光 | 支持时开启 / 支持时开启 / 开启 | 支持时开启 / 关闭 / 关闭             | 全部关闭                            |
| 环境图              | 动态，时间预算0.25秒           | 动态，时间预算0.5秒                  | 关闭动态生成                        |

模式按钮在场景面板，切换会重新应用完整预设，之后允许手动调整现有开关。帧率是目标上限，不是硬件性能保证。像素预算受最小比例约束，不是所有分辨率下的硬性像素上限。

三维近地观看不再使用 Cesium 默认的百万米光照淡出；非3D恢复原距离语义。漫反射与镜面夜间贡献分别校准，不把所有反射压成同一数值；直射在地平线附近平滑衰减并加入太阳低角度暖色。环境图更新时间以300仿真秒为下限，高倍速允许有限真实时间预算，仍由Cesium管理生成与销毁，不逐帧reset；这只是第一轮成本控制，反射连续性需人工验收。

3D下 Globe 的 lighting 与 night fade 两组距离分别设为0/1米。当前引擎的 lighting 与 night 使用相反方向的公式：此值使近地lighting充分生效，同时night进入暗化端；不从参数名称推断同一渐变方向。离开3D及释放时恢复原值。模型夜间漫反射/镜面IBL分别保留0.4/0.6，兼容镜面为0。性能/平衡的微量蓝灰补光由材质近似实现，不创建真实城市光源。

自建柔光是半分辨率高亮提取与9次采样的轻量混合，仅性能档夜间开启，阈值0.82–0.98，强度最高0.12；属于色调映射后的视觉柔光，不宣称物理HDR Bloom。关闭Cesium默认Bloom与FXAA，保留PBR_NEUTRAL，性能/平衡夜间曝光最多1.08。全局曝光/柔光按最近登记的可见模型锚点求值，没有模型时按相机位置；每个模型的太阳与夜景仍独立求值。

环境更新阈值分别为 `max(300, abs(multiplier) × 0.25/0.5)`，3600倍时为900/1800仿真秒。暂停恢复300秒阈值。此值控制更新时间差，不能承诺严格每0.25/0.5真实秒完成一张环境图；不读取生成器私有结果或宣称无闪烁。

保存并恢复原有Scene、后期、分辨率、DPR与模型状态。所有监听与自建后期资源归所属dispose管理，禁用时不引入空闲重绘。地球光照与模型各自太阳高度语义继续独立。

## 模型准备与坐标决策

本节的坐标询问针对手工模型 URL。2026-10-17 增加的 [AIModels 目录入口](geo-ai-models.md)使用通过版本/同源/数值校验且明确声明 `coordinateSource: manifest` 的发布坐标，以 resolver 直接选择 input；不改变用户手工 URL 的确认规则。该入口读取统一 model.json，不自动猜测任意模型目录里的 placement.json。适用范围见 [静态发布 ADR](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/decisions/ADR-20261017-aimodels-static-publishing.md)。

Data 下载并解析每次加载的独立GLB/JSON副本，不修改远程源资产或共享Cesium缓存。对当前引擎未实现的KHR_materials_emissive_strength，把每材质倍率转换到仅在内存加载中使用的HDR发光因子，防止重复叠乘；保留Unlit及其他材质。重新封装GLB只改变JSON，保留二进制chunk，外部buffer/图片相对URL仍基于原模型URL。

只读取明确WGS84地理metadata，例如根节点extras的longitude_wgs84/latitude_wgs84；验证数值、范围与活动场景。height_m表示模型尺寸，不当海拔。存在有效内置坐标时，在Primitive加入场景前显示两种坐标与取消按钮：使用模型坐标或使用加载输入坐标。模型坐标缺少椭球高时采样当前地形；输入坐标保留显式高度、缩放与姿态。没有坐标不弹窗，继续输入定位。取消、下载失败、地形采样失败、卸载均不得残留模型或未完成的选择。

元数据优先级为glTF全局extras、活动scene extras、活动scene根节点extras；字段为数值型 `longitude_wgs84` / `latitude_wgs84`，可选定位高度为 `ellipsoid_height_m`。这些是资产明确约定，并非glTF统一地理坐标标准；不猜测普通XYZ、尺寸或坐标系。多个根节点位置冲突会报可读错误。GLB校验2.0头与chunk长度；JSON glTF要求2.0。椭球地形使用0米，有availability的真实地形用最高可用精度，其余采样level12；采样失败或等待期间地形变更须重试或选输入坐标，不能静默置零。

新资产按[制作与地理参考标准](geo-model-authoring.md)只在唯一活动根节点保存一份规范字段，采用 WGS84、米制局部锚点及明确椭球高语义。未知高程省略，不能把展示默认高度 0 当实测值。该制作标准中的 CRS、精度、朝向说明、placement.json 和质量版本不新增自动读取能力；当前代码仍只读取上述经纬度与可选椭球高。

坐标决策由Data controller持有Promise与只读请求快照；Vue只展示原生对话框和提交选择，不读取Cesium私有字段。取消不作为错误。模型就绪后按真实范围、视场角和画幅取景；默认成都瓦片加载不得在完成时夺走当前镜头。

Data通过独立overlay贡献挂载原生dialog，面板切换不会卸载待选择请求，ESC/取消/插件卸载都结束请求。工具层的坐标resolver是可选注入端口，工作台默认注入；纯工具调用者未注入时保留输入定位。Blob URL保留至移除/失败/取消后释放，防止纹理异步加载失去来源。重新封装只保留运行时副本，不回写原GLB；高于1的发光因子只供当前Cesium加载，不输出为标准资产。

取景按包围球、较小的横/纵视场角与1.18留白求距离，初始heading35°、pitch-18°；无效画幅使用35°视角兜底，不改变用户FOV。启动预置只在Viewer初始化设置。

## 接口与边界

全部文件位于现有Platform geo。core/render-performance提供模式分辨率策略；tools/scene提供太阳数学、质量控制和模型渲染；tools/data提供独立模型准备与坐标解析；tools/view提供模型构图。插件controller负责Vue状态、能力注入及生命周期，工具层不反向导入插件/UI。不新增跨模块公共入口。

内部端口为分辨率控制器 `setMode/dispose`、模型管理器 `register/registerEnvironment/setMode/getFocusPosition/dispose`、模型准备 `prepareGeoModelAsset(url, signal)` 与坐标resolver、质量工具 `setMode/dispose`、纯取景函数 `modelCameraOffset`。它们只依赖Cesium、浏览器原生接口及Geo内部类型；不新增Foundation接口或第三方依赖。

## 验证与失败模式

执行格式、Vue/TypeScript、ESLint、架构、生产构建及文档归档检查。遵循AGENTS.md，不创建或运行前端/浏览器自动化测试。

人工验收：三模式切换与退出恢复；默认图层未改变；有效/无效/缺失metadata；两种坐标、取消与卸载；地形锚点；508米模型横屏完整构图；暂停跳时、3600倍速、昼夜地面/建筑一致；发光强度比例与混合Unlit；低配/WebGL1/无浮点后期扩展的降级。静态门禁不代表GPU或录屏视觉验收。

当前台北101源资产无UV和贴图，不能通过渲染设置补回真实立面细节；Google底图是带固定照片阴影的二维影像，不能生成随时间变化的周边建筑几何和遮挡。上述资产和底图局限仍在，不改默认影像，也不把原生天空/地面环境图描述为真实城市反射。

## 关联

- [现有模型渲染标准](geo-model-rendering.md)
- [决策](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/decisions/ADR-20261002-geo-render-modes-and-model-placement.md)
- [实施计划](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/archive/plans/2026-10-02-geo-render-modes-and-model-placement.md)
