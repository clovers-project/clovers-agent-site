# Clovers Agent 网站

Clovers Agent 的中文介绍与使用文档站。页面使用原生 HTML / CSS / JavaScript；构建过程仅依赖 Node.js 自带模块。

## 本地预览

安装 Node.js 后，在仓库根目录生成发布文件：

```bash
npm run build
```

构建文件位于 `dist/`。可在本地启动静态服务器预览：

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory dist
```

访问 http://127.0.0.1:8765/ 。

## 发布到 GitHub Pages

仓库通过 `.github/workflows/pages.yml` 构建并发布 `dist/`。在仓库 Settings → Pages 中将 **Build and deployment → Source** 设为 **GitHub Actions**，之后推送到 `main` 或 `master` 即会部署。工作流保留自定义域名配置并发布 404 页面。

## 页面与维护

- `index.html`：项目介绍与架构。
- `quickstart.html`：使用 uv 与 PyPI 包、基于 clovers_client.console 的可复制接入步骤。
- `docs.html`：Agent 使用文档、扩展、排查与末尾的相关项目。
- `assets/site.css` / `assets/site.js`：响应式样式、搜索、复制、页内导航。
- `assets/search-index.json`：站内搜索的标题、关键词与目标；新增章节时同步维护。
- `examples/`：可下载的入口与配置模板；模型占位值需自行替换。
- `assets/brand/`：品牌资源。
- `scripts/build.mjs`：将页面、素材、示例和 Pages 元数据复制到 `dist/`。
- `.github/workflows/pages.yml`：构建并发布 GitHub Pages。
- 原设计包与 Logo 目录保持原样。

内容依据上游 README 与用户指定的框架 / 客户端文档整理，来源链接见文档页末尾。
更新时同步核对安装步骤、宿主行为、版本和文档日期，不把设计素材当作已实现的产品功能。
