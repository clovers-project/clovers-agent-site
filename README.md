# Clovers Agent 网站

基于 Clovers Agent Design Kit v2 的中文介绍与使用文档站。纯 HTML / CSS / JavaScript，无构建依赖。

## 本地预览

在仓库根目录执行：

```bash
python -m http.server 8765 --bind 127.0.0.1
```

访问 http://127.0.0.1:8765/ 。页面资源使用相对路径，兼容 GitHub Pages 项目子目录。

## 发布到 GitHub Pages

在仓库 Settings → Pages 中选择 **Deploy from a branch**，选择实际发布分支（main 或 master）和 **/ (root)**。
提交并推送本仓库即可部署。本次制作不包含远程推送或修改仓库 Pages 设置。

## 页面与维护

- `index.html`：项目介绍与架构。
- `quickstart.html`：使用 uv 与 PyPI 包、基于 clovers_client.console 的可复制接入步骤。
- `docs.html`：Agent 使用文档、扩展、排查与末尾的相关项目。
- `assets/site.css` / `assets/site.js`：响应式样式、搜索、复制、页内导航。
- `assets/search-index.json`：站内搜索的标题、关键词与目标；新增章节时同步维护。
- `examples/`：可下载的入口与配置模板；模型占位值需自行替换。
- `assets/brand/`：从原设计包选用的品牌资源，保持 SVG 轮廓与配色。
- 原设计包与 Logo 目录保持原样。

内容依据上游 README 与用户指定的框架 / 客户端文档整理，来源链接见文档页末尾。
更新时同步核对安装步骤、宿主行为、版本和文档日期，不把设计素材当作已实现的产品功能。
