# 从旧模板迁移 / Migration

## 已保存的原版

原仓库 master 的原始提交 fcea9e53485f356f96fb64cf6cd692f77513d6bd 已保存在同名分支和 annotated tag 1.0.0。该快照的 package.json 仍为原始 0.5.0，不为标签名称改写旧内容。

获取原版：git switch --detach refs/tags/1.0.0；继续开发旧版可使用 git switch --track origin/1.0.0。分支和 tag 同名时请使用完整 ref 避免歧义。

新版为 2.0.0-rc.1，来自 Cyber-Sight 9697230d7278ae88afb3c82c98e3865181847d08，沿用目标仓库提交历史。GitHub 仓库名与演示域名本轮未改变；生产部署不属于本次源码迁移。

## 能力映射

| 旧模板能力                                      | 新版位置/处理                                                 |
| ----------------------------------------------- | ------------------------------------------------------------- |
| 地球视图、相机与状态栏                          | View 插件与工作台 Shell                                       |
| 图层、地形与偏移纠正                            | Data 插件及 imagery-sources 坐标校正                          |
| 环境、场景与光照                                | Scene 插件；保留唯一 Viewer Clock                             |
| 绘制、测量                                      | Drawing / Measurement 插件                                    |
| 3D Tiles、裁剪、模型工具                        | Data / Model 插件与 capability                                |
| 地形采样、剖面、等高线等                        | Terrain 插件，具体边界见来源设计                              |
| 分屏对比                                        | Compare 插件                                                  |
| 旧行业大屏、ECharts 业务示例                    | 留在 1.0.0，不混入通用 Geo 工作台                             |
| 旧 Vuex store、window.Cesium 与组件 API         | 留在 1.0.0；新版不提供兼容包装                                |
| 当前 Geo 时间轴、模拟航线、模型目录、动画与拍摄 | 全部保留对应插件/工具；Flight 为模拟数据，AIModels 为静态目录 |

此表是迁移范围映射，不是旧模板所有工具的逐项功能等价或人工验收声明。旧源码可通过 1.0.0 取回。

## 本地工程与域名

拍摄工程仍使用 JSON 版本 1，保留 cyber-sight:capture:current:v1 与 cyber-sight:capture:library:v1。同源且键保持时继续读取；换域名后先在旧站导出 JSON，再在新站导入并加载/绑定模型。JSON 不包含模型、瓦片、影像或视频文件；导入不会自动访问所有资源地址。

语言可通过 ?lang=zh-CN / ?lang=en-US 选择；默认中文，语言偏好存储使用独立命名空间。旧 pnpm run vite 命令继续有效。

## 部署

一次构建输出 index.html、geo.html 与唯一 cesiumStatic。初始支持站点根路径；不要直接部署到 /repository-name/ 之类子目录并期望绝对资源路径工作。保留 /geo.html 外链兼容，资源 404 不应被重写成 HTML。

保留默认远程演示数据与可配置目录；在新 origin 核对 CORS、网络和素材使用条款。Google/高德/天地图、示例模型及地形的可访问性不由构建成功保证，令牌只能是适用服务允许公开的客户端令牌。

## 验收

自动门禁仅为冻结安装、格式、Lint、类型、生产构建和静态清单。根据仓库规则没有创建或运行前端/浏览器自动化。

- [ ] 1280×720 及常见桌面尺寸的图标、面板、中英文与弹层。
- [ ] 11 插件主要操作、互斥交互、相机/时钟与资源移除。
- [ ] 目标 HTTPS origin 的影像、地形、模型、3D Tiles 与 AIModels 加载/失败恢复。
- [ ] 原拍摄 JSON 导入、本地保存、模型绑定、动画与机位。
- [ ] 1080p/4K 适用编码、横竖画幅、MP4/PNG、取消、后台及状态恢复。

这些人工项未由静态构建替代。候选版本通过人工验收后，再决定正式部署、改名和来源清理。

[逐文件迁移清单](migration-manifest.json)、[拍摄指南](guides/geo-capture.md)、[当前设计](design/geo-workbench.md)。
