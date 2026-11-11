# 再生成与维护

设计包的图形源是本目录的 `reference/clovers-agent-final.svg` 和 `wordmark-paths.json`。
构建不依赖旧版设计包所在位置，不会改写原稿。

## 环境

- Node.js 与 `sharp`：生成 SVG 和 PNG。
- Python 与 `Pillow`、`reportlab`、`pypdf`：生成 GIF / WebP / ICO、PDF、清单、ZIP。
- 中文 TrueType 字体：默认使用 Windows 的 `C:/Windows/Fonts/msyh.ttc` 与 `msyhbd.ttc`。
- PDF 视觉检查可使用 Poppler 的 `pdftoppm`。
- `sharp` 的 SVG 文字栅格化使用宿主字体；为复现概览中的文字样式，宿主应安装 Inter 与微软雅黑。Logo 和字标本身不依赖字体。

## 构建

在本目录运行：

```sh
npm install
npm run build
python -m pip install -r requirements.txt
python build-deliverables.py
```

如使用预装依赖，可设置 `CLOVERS_NODE_MODULES` 指向包含 `sharp` 的 node_modules 目录。
Linux / macOS 可设置 `CLOVERS_FONT_REGULAR` 和 `CLOVERS_FONT_BOLD` 为可用的中文 TrueType 字体文件（需支持 reportlab）；否则脚本会明确报出缺失字体。

静态构建入口 `build-assets.cjs`：

- 从原稿读取两条填充路径，默认核心 SVG 保持原字节。
- 为新增表情建立圆头中心线，展开为填充子路径。
- 输出图标、头像、字标、SVG 动效、网页素材、社交素材和可编辑画板。
- `preview-data.js` 来自相同路径与配色。

后续构建入口 `build-deliverables.py`：

- 用已导出的透明 PNG 采样生成 25 fps 动画；与 SVG 使用相同时间表。
- 创建多尺寸 ICO、八页中文规范 PDF。
- 核对 SVG 的 XML、图像尺寸、核心原稿哈希、头像与 maskable 安全区。
- 写入资产清单和 SHA-256，生成根目录旁的 `Clovers-Agent-Design-Kit-v2.zip`。

## 修改范围

- 表情：编辑 `CENTERLINES`，保持主体路径不变。
- 配色：编辑 `COLORS` / `STYLES`，同步更新规范与文案。
- 字标：修改 `lockup()` 组合位置，文字路径位于 `wordmark-paths.json`。
- 文案 / 离线页：编辑包根目录 HTML / CSS / JS 及 guidelines Markdown。
- PDF：修改 Python 中的手册页面布局。

每次构建覆盖本设计包内对应产物。生成脚本和人工编辑的 README / 规范 / 预览页都应作为源保留。
修改任何交付文件后重新运行后续构建，避免清单与文件不一致。

## 验收

1. 浏览 START-HERE.html，检查表情、背景切换、搜索、下载、动效重播。
2. 在 390 px 与桌面宽度检查无横向溢出。
3. 通过 HTTP 打开组件示例，验证三种状态。
4. 渲染 PDF 全部页面，检查中文、分页、溢出和图像清晰度。
5. 检查透明图标、32/48 px 实际尺寸与圆形头像裁切。
6. 使用 SHA256SUMS.txt 核对文件，解压 ZIP 后再次核对。

品牌默认图形和字标来自用户提供的素材。本包不附带字体软件，也不新增字体授权承诺。

## 本地预览服务器

运行 `python serve-preview.py`（从本目录），会在 `127.0.0.1:8765` 提供整个设计包。
该服务显式设置 JS / SVG / CSS MIME 类型；无需第三方包。按 Ctrl+C 停止。
可用 `--port 其他端口` 修改端口。普通离线资源页不需要启动服务器。
