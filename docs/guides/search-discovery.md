# 搜索与 AI 检索维护

## 主官网和页面

主官网为 https://cesium-workbench.github.io/，由维护者于 2026-10-21 明确确认。个人和组织仓库的 About 官网链接使用同一地址。

- /：保持三维工作台首页。
- /geo.html：兼容入口，canonical 指向 /，不单独列入站点地图。
- /about/：中文静态项目介绍，不依赖 JavaScript 或 WebGL。
- /about/en/：英文静态项目介绍，与中文版互相声明 hreflang。
- /sitemap.xml：根地址和两份介绍页的规范 URL。
- /robots.txt：允许抓取并公布 sitemap 地址。
- /about/social-preview.png：1200 × 630 分享预览；SVG 源文件随仓库保存。

Vercel 若部署相同源码，也会声明对应 GitHub Pages URL 为 canonical。它是规范地址提示，不是服务器跳转，也不能保证搜索引擎一定采用。根地址始终保留现有使用流程，关于项目的链接在普通工作台界面显示，净画面和画幅预览中隐藏。

## 从旧名称迁移检索线索

保留准确旧名 vue3-cesium-typescript-start-up-template，在中英文 README、介绍页的项目沿革和结构化身份中明确关联 Cesium Workbench。原模板实现保存在个人仓库的 1.0.0 分支/标签，避免把旧模板行为误说成当前版本行为。

GitHub 仓库 Description、Website 和 Topics 不随 Git 源码自动同步；维护两个仓库的设置。描述中突出 Vue 3、TypeScript、CesiumJS、3D Tiles、glTF/GeoJSON 和相机输出等实际能力，避免堆砌无关热门词。

## 发布后由维护者完成

1. 使用自己的 Google Search Console 账户添加 URL 前缀属性 https://cesium-workbench.github.io/。
2. 按平台提供的方式验证所有权。若选择 HTML 文件或 meta 标签验证，取得真实校验文件/值后再加入仓库；不要填入占位校验码。GitHub Pages 公共域名的 DNS 由 GitHub 管理，不应假设可以修改其域名 DNS。
3. 提交 https://cesium-workbench.github.io/sitemap.xml。
4. 用 URL 检查查看根地址、/about/ 和 /about/en/，在平台允许时请求编入索引。
5. 可在 Bing Webmaster Tools 中添加站点并提交同一份 sitemap。

站点账户入口：[Google Search Console](https://search.google.com/search-console)、[Bing Webmaster Tools](https://www.bing.com/webmasters/)。

所有权验证、提交 sitemap、发起索引请求属于维护者账号操作。本次源码优化不会虚构其完成状态，也不声称已建立流量监测。

## GEO 的实际内容

GEO 在这里指提高生成式搜索对项目的发现与准确引用：可直接读取的正文、清楚的产品事实、旧名对应关系、原始文档链接和一致的 JSON-LD。没有虚构评分、用户数量或第三方背书，也没有只给机器人显示的关键词。

Google 官方说明，AI 搜索仍遵循基础 SEO，不需要特殊 AI 文本文件或专用 schema。因此本次没有把 llms.txt 当作排名工具。收录、排名、AI 引用和流量提升都需要后续观察。

## 持续维护和验证

发布新版本时同时更新 package.json、中英文 README、介绍页的可见版本和 JSON-LD；能力变化同步修改正文与结构化内容。主域名变化时同步更新 canonical、hreflang、OG/Twitter URL、sitemap、robots 和两个仓库官网链接。

允许执行格式、Lint、类型、生产构建及产物/HTTP 静态检查。页面布局、键盘导航、窄屏介绍页、工作台链接和拍摄模式隐藏行为由维护者人工验收；不创建或运行前端自动化/浏览器测试。

在 Search Console 中分别观察品牌词、旧项目名和功能词的展示、点击与页面索引；没有数据时记录未提供，不把成功部署当作曝光增长。

参考：[当前搜索设计](../design/search-discovery.md)、[Google AI 搜索指南](https://developers.google.com/search/docs/appearance/ai-features)、[canonical 说明](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)、[结构化数据政策](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)。
