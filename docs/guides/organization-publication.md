# 组织源码同步与 GitHub Pages 发布

开发源仓库：[tanghaojie/Cesium-Workbench](https://github.com/tanghaojie/Cesium-Workbench)。发布仓库：[Cesium-Workbench/cesium-workbench.github.io](https://github.com/Cesium-Workbench/cesium-workbench.github.io)。两个仓库的主分支均使用 master，日常开发和合并在个人仓库完成。

## 工作流

- verify.yml：检查分支推送和 PR，也供同步工作流调用。
- sync-org.yml：个人 master 更新后，先完成格式、Lint、类型与生产构建，再把完整源码及 master 历史推送至组织仓库。
- pages.yml：只在组织仓库构建并发布 dist，个人仓库中的同名任务会跳过。

环境使用 Node 24 和 pnpm 11.22.0。同步为普通 Git push，不强推；仅同步 master，不自动复制其他分支、标签、Releases 或仓库设置。1.0.0 分支和标签保存在个人仓库。

## 凭据

个人仓库 Settings -> Secrets and variables -> Actions 中配置 ORG_SOURCE_SYNC_TOKEN。令牌资源所有者为 Cesium-Workbench 组织，只选发布仓库，Contents 和 Workflows 为 Read and write；如组织要求审批，先完成审批。不要把令牌放进代码、文档、VITE_* 或 Git URL。

## 第一次源码同步

把工作流合并并推送到个人 master 后，在个人仓库 [Actions](https://github.com/tanghaojie/Cesium-Workbench/actions) 检查 Sync source to organization，等待 verify/verify 和 sync 成功。

组织仓库首次收到 master 后应将其作为默认分支。可比较两个仓库 master 的最新提交 SHA，确认源码同步完成。日常只在个人仓库提交；组织仓库独立提交会导致后续同步的非快进拒绝。

## 维护者完成第 5 步

1. 打开组织仓库 [Pages 设置](https://github.com/Cesium-Workbench/cesium-workbench.github.io/settings/pages)。
2. 将 Build and deployment -> Source 设置为 GitHub Actions。
3. 打开组织仓库 [Actions](https://github.com/Cesium-Workbench/cesium-workbench.github.io/actions)，选择 Deploy GitHub Pages -> Run workflow -> master。
4. 等待 build 和 deploy 成功，访问 [网站](https://cesium-workbench.github.io/)。

首次同步可能早于 Pages 启用，导致 configure-pages 失败。完成设置后手动重跑即可；这与源码同步成功是两个独立结果。部署工作流使用 github-pages 环境；如配置了环境审批，需要由维护者完成审批。

后续更新个人 master 会自动检查、同步并部署。网站需要部署在域名根路径，当前不支持任意项目子路径。

## 排查与验收

- Missing ORG_SOURCE_SYNC_TOKEN：检查个人仓库 Actions secret 名称和值是否已配置。
- 401/403 或拒绝修改 workflow：检查令牌有效期、组织审批、仓库范围及 Contents/Workflows 写权限。
- 非快进拒绝：先检查并保留组织仓库额外提交，人工决定如何合并，不执行 force push。
- 同步显示跳过旧版本：master 已有更新，检查较新提交对应的运行。
- Pages 配置失败：启用 GitHub Actions 发布源后，在组织仓库重跑部署。
- 工程检查失败：先在个人仓库修复，再推送 master。

格式、Lint、类型与构建不代替人工验收。维护者需检查新域名下的外部资源 CORS、图层和插件交互、相机时间、模型、工程 JSON 导入及浏览器编码输出。本流程不新增或运行前端自动化测试。

设计与权限边界见 [发布设计](../design/organization-publication.md)。GitHub 设置参考 [自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
