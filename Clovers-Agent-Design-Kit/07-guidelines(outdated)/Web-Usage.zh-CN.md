# Clovers Agent v2 · 网页接入

以下示例假设把整个设计包部署在站点 `/brand/`。实际使用时请根据项目目录修改路径。

## 静态 Logo

```html
<img src="/brand/01-core/clovers-default.svg"
     alt="Clovers Agent" width="48" height="48">
<img src="/brand/01-core/clovers-coding.svg"
     alt="Clovers Agent 正在编写" width="64" height="64">
<img src="/brand/01-core/clovers-thinking.svg"
     alt="Clovers Agent 正在思考" width="64" height="64">
```

如旁边已存在状态文字，Logo 应使用空 `alt=""`，避免重复朗读。
状态更新可用独立的 `role="status"` 容器；Logo 本身不应造成重复播报。

## 深色背景

```html
<img src="/brand/02-icons/svg/thinking-reverse.svg"
     alt="" width="64" height="64">
```

primary 使用原稿双色；reverse 使用浅绿主体、白色眼睛。
四叶草中间是真透明，不能靠 CSS 的 `color` 为外部 `<img>` 改色。

## SVG 动效

```html
<img src="/brand/05-animation/svg/loop-primary.svg"
     alt="Clovers Agent 表情演示" width="128" height="128">
```

循环 SVG 6.4 秒，单次 SVG 1.2 秒；浏览器加载 SVG 后开始播放。
单次可通过新建带不同查询参数的 `<img>` 重新播放，参考离线预览的实现。
SVG 内置减少动态效果处理。截图工具或设计软件可能只显示 SVG 首帧。

## GIF / WebP 的静态回退

```html
<picture>
  <source media="(prefers-reduced-motion: reduce)"
          srcset="/brand/01-core/clovers-default.svg">
  <img src="/brand/05-animation/previews/clovers-loop.webp"
       alt="Clovers Agent 表情演示" width="128" height="128">
</picture>
```

优先使用 SVG；WebP 适合支持该格式的内容平台；GIF 提供较广兼容性但使用固定纸白底。

## 无依赖 Web Component

```html
<script type="module" src="/brand/06-web/clovers-logo.js"></script>
<clovers-logo expression="thinking"
              label="Clovers Agent 正在思考"
              style="width:64px"></clovers-logo>
```

`expression` 接受 `default`、`coding`、`thinking`，非法值回退为 default。
`label` 用于可访问标题；省略时使用品牌名称与状态。
可以通过 JavaScript 的 `setAttribute('expression', 'coding')` 更新真实任务状态。

```css
clovers-logo {
  --clovers-body: #C9EFBE;
  --clovers-eyes: #FFFFFF;
}
```

模块需要 HTTP(S) 服务；不能依赖 `file://` 直接加载模块。包内的 START-HERE.html 使用普通脚本，可直接双击离线运行。

## SVG sprite

```html
<svg width="64" height="64" viewBox="0 -16 512 512"
     role="img" aria-label="Clovers Agent 正在思考">
  <use href="/brand/06-web/clovers-sprite.svg#clovers-thinking"></use>
</svg>
```

sprite 应与页面同源部署。可以通过继承的 `--clovers-body` / `--clovers-eyes` 变量改色。
在目标浏览器中验证跨文件 CSS 变量支持；兼容性要求较高时直接用固定配色 SVG。

## 网站与应用图标

```html
<link rel="icon" type="image/svg+xml" href="/brand/06-web/favicon.svg">
<link rel="icon" sizes="any" href="/brand/06-web/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180"
      href="/brand/06-web/app-icon-180.png">
<link rel="manifest" href="/brand/06-web/site.webmanifest">
<meta name="theme-color" content="#175D43">
```

`site.webmanifest` 是接入模板：部署时将其中的 `id`、`start_url`、`scope` 改成实际应用路径。
图标路径相对于 manifest 文件解析。`any` 和 `maskable` 使用不同安全区，不要互换。
manifest 与图标不等于完整离线应用；如需离线能力，按产品需求另行实现。

## 预览示例

在设计包根目录启动任意本地静态服务器，访问 `06-web/integration-example.html`。
推荐在安装 Python 的环境运行 `python 08-source/serve-preview.py`，再访问本机 8765 端口。
附带的服务器显式设置 JavaScript MIME 类型，避免部分 Windows 环境把 `.js` 作为 `text/plain` 发送而导致模块加载失败。
生产服务器同样应把 `.js` 配置为 `text/javascript` 或 `application/javascript`。
该示例包含默认、Coding、thinking 的实时切换、深色版本和动效静态回退。
