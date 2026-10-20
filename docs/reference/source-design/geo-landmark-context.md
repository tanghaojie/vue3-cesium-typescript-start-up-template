---
title: Geo 地标与自动周边街区
status: source-reference
owner: project maintainers
updated: 2026-10-17
---

# Geo 地标与自动周边街区

> 来源规范快照：Cyber-Sight 9697230d7278ae88afb3c82c98e3865181847d08。此文保留来源的功能语义与制作约定；独立应用的当前目录、依赖和部署以 [Geo application design](../../design/geo-workbench.md) 为准。未声明目标浏览器验收通过。

## 目标与范围

第一版交付开放建筑数据生成器、共享 PBR 材质、台北 101 周边资产及 Sight 场景加载与昼夜适配。主体模型继续由制作端维护，默认 Google 混合影像不变，性能/平衡/兼容命名和唯一 viewer.clock 不变。

生成工具和资产属于外部 `tanghaojie/sample-data` 素材工程，Sight 不运行地图提取、网格生成或资产托管，不增加后端/数据库。数据使用真实轮廓、可用高度与建筑分段，未知高度按类型估算并记录，背景材质为可复现近似。

## 场景接口

2026-10-17 起，外部数据独立菜单保留三种 URL，并增加 AIModels 模型目录；当前 UI 不提供地标与周边、场景 URL、台北示例及场景管理操作，见[外部数据独立菜单](geo-external-data.md)。以下保留原有地标工具层接口与生命周期说明；AIModels 的配套资源通过[模型发布描述](geo-ai-models.md)自动关联，不重新开放地标场景入口。

新增显式 scene.json URL 加载，不猜测任意模型的 sidecar。版本 1 描述名称、WGS84 锚点、主体模型 URL、周边 3D Tiles URL、署名和椭球体地形要求。相对 URL 基于场景索引解析。坐标范围、数值、版本和 URL 在工具层校验，不执行远程代码。

模型仍经过内置坐标/输入坐标确认。最终位置必须与场景锚点接近，缩放/姿态必须符合预生成环境；不匹配时保留主体并提示，不能挪动整片真实街区假装匹配。第一版周边只支持椭球体地形，切换真实地形时隐藏周边并提示，避免地面错位。初版主体排除在制作阶段完成，不依赖 WebGL2 裁剪。

加载任务有独立 AbortController；取消和插件卸载结束坐标询问并回收已经添加的资源。失败不留下半加载周边，主体加载成功而周边失败时保留主体并提供重试。关联记录仅限当前会话。移除、显隐和主体变换处理环境关联，不跨页面持久化。

## 模块与职责

- tools/data/landmark-scene.ts：纯场景索引解析、URL 与定位兼容性校验；
- tools/data/data-browser.ts：Model/3D Tiles 创建、取消、Primitive 所有权及环境渲染登记；
- tools/data/landmark-scene-loader.ts：场景加载编排、独立取消、关联生命周期、重试与署名；
- plugins/data/data.controller.ts：注入坐标选择、连接工具状态与 UI 操作；
- plugins/data/DataPanel.vue：底图与注记、地形；ExternalDataPanel.vue 提供三种 URL、AI 模型目录和会话资源管理，不提供地标场景 UI；
- tools/scene/model-rendering.ts：新增显式瓦片昼夜登记，复用太阳、IBL 与唯一 Clock，并应用瓦片质量预算。

所有运行时代码仍位于现有 Platform Geo，不新增跨模块公共端口、第三方前端依赖或后台管理能力。

## 资产与渲染

生成器规范轮廓、孔洞、分段、高度及主体排除，按空间分块输出 glTF 2.0/3D Tiles 1.1。外墙具有米制 UV、共享基础色/粗糙度/法线与固定发光窗灯纹理；固定种子使重复生成稳定。保留来源、版本、估算统计和 ODbL 署名。大范围地形、道路、车辆、准确植被及实时城市反射不属于第一版。

素材仓库入口为 `tools/geo-context/README.md`，提供固定版本下载、配置、直接网格/GLB 导出、资产校验和七项生成器回归检查。不需要 Blender 运行环境。Overture 已融合 OSM，因此第一版不从 Overpass 再叠加重复建筑。OSM 分段高度使用离地顶部语义；分段缺失高度不会继承父塔高度。

台北资产使用 `2026-09-23.1`，下载 8,627 个 building 和 1,760 个 building_part；1.4 km 范围最终纳入 5,821 栋建筑，排除台北 101 及 31 个分段。52 个空间瓦片各有完整/简化两级 GLB，共 104 个文件、206,484 个三角形（两个级别合计）。实际源为 OpenStreetMap 和 East Asian Buildings；随资产提供压缩源数据、配置、版本及校验报告。

普通 Cesium Model 与 3D Tiles 的默认 forwardAxis 不同；生成瓦片显式使用 glTF +X=东、+Y=上、+Z=南，再由每瓦片 ENU→ECEF 变换定位。主体模型继续使用既有 Model 轴向契约，不能把瓦片变换复制给它。

普通模型继续沿用既有 register(model)，生成瓦片通过 registerTileset(tileset, position) 显式启用昼夜。生成资产无 Cesium3DTileStyle，避免 Style 与 CustomShader 混用。窗灯发光乘当地太阳高度平滑因子；白天关闭，夜间增加，不创建第二时钟或每帧随机灯光。不把发光当真实人工光源。

性能档保留高质量纹理/较低屏幕误差与阴影，平衡使用较高误差和较低缓存，兼容关闭瓦片阴影、镜面与动态环境图并增大误差。切档不改变地理布局。注销先恢复 shader、IBL、lightColor 和瓦片质量参数，再销毁自建 shader。

## 验证和边界

执行格式、类型、lint、架构、生产构建及文档归档门禁。资产制作侧检查真实提取数量、几何有效性、GLB/纹理引用、UV/法线、包围体、地理轴向、重复主体排除及版本/署名。不创建或运行前端自动化/浏览器测试。

维护者人工验收：模型坐标选择/取消、场景定位一致、周边失败重试、卸载和显隐、变换/地形不兼容提示、三档质量、昼夜跳时和 3600 倍速、完整环绕与 GPU 故障。静态验证不等于录屏视觉验收。

## 集成与发布

本能力与 master 的 PRISM 应用壳/主题更新共同发布。合并保留既有 Foundation、主题包、锁文件与下游首页/关于页；Geo 渲染和资源接口保持模块边界。Sight/Standalone Geo 继续由同一生产构建输出，素材由 sample-data master 托管。

## 关联

- [模型制作标准](geo-model-authoring.md)
- [统一渲染](geo-model-rendering.md)
- [质量与定位](geo-render-quality-and-placement.md)
- [决策](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/decisions/ADR-20261004-geo-generated-landmark-context.md)
