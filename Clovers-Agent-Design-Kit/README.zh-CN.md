# Clovers Agent · 完整设计包 v2.0

2026-11-12 · 基于 `Clovers-Agent-Logo/clovers-agent-final.svg` 新版定稿。

**三种正式表情：默认、Coding `>_`、努力思考 `><`。**
气泡外轮廓、四叶草镂空和两条提示线保持新版原稿一致；新增表情只改变眼睛。
建议品牌表达：**会回应，也会认真思考。**

## 从这里开始

1. 双击 `START-HERE.html`：离线预览三种表情、背景、头像、字标与动效，搜索并下载资源。
2. 打开 `brand-overview.png`：查看整套视觉概览。
3. 打开 `07-guidelines/Clovers-Agent-Brand-Guide-v2.pdf`：八页中文视觉规范。

## 核心文件

| 文件 | 内容 |
| --- | --- |
| `01-core/clovers-default.svg` | 新版默认 Logo；与提供的定稿 SVG 逐字节一致 |
| `01-core/clovers-coding.svg` | Coding `>_`：左侧提示符，右侧下划线 |
| `01-core/clovers-thinking.svg` | 努力思考 `><`：双眼向内收拢 |
| `01-core/clovers-loop.svg` | 默认 → Coding → 努力思考 → 默认，6.4 秒循环 |
| `01-core/clovers-once-coding.svg` | 1.2 秒切换到 Coding，结束后保持 |
| `01-core/clovers-once-thinking.svg` | 1.2 秒切换到努力思考，结束后保持 |

## 设计包内容

| 目录 | 交付内容 |
| --- | --- |
| `01-core` | 三种静态表情与三种 SVG 动效 |
| `02-icons` | 3 表情 × 6 配色 SVG；每种另含 32 / 64 / 128 / 256 / 512 / 1024 px PNG |
| `03-avatars` | 3 表情 × 浅色 / 深色 / 绿色背景；SVG 及 128 / 512 / 1024 px PNG |
| `04-wordmarks` | 横排、双行签名、竖排字标；标准、反白、黑色；SVG / PNG |
| `05-animation` | 3 动效 × 标准 / 反白 / 白色 SVG；透明 WebP 与纸白底 GIF |
| `06-web` | SVG / 多尺寸 ICO favicon；180 / 192 / 512 px 应用图标；maskable 图标；manifest；SVG sprite；Web Component；接入示例 |
| `07-guidelines` | 八页 PDF、中文品牌规范、网页接入指南 |
| `08-source` | 可编辑 SVG 画板、可编辑表情中心线、原稿参考、几何参数、色板、CSS 变量、完整生成脚本 |
| `09-social` | 1200 × 630 社交分享图、1500 × 500 横幅；SVG / PNG |

## 选哪个版本

- 默认 Logo：品牌主标识、导航、常规头像、待命状态。
- Coding `>_`：编写代码、执行开发任务、技术协作。
- 努力思考 `><`：分析问题、规划步骤、推敲方案。它不表示失败或报错。
- `primary`：浅色或白色背景；绿色主体、深绿眼睛。
- `reverse`：深色背景；嫩叶绿主体、白色眼睛。
- `forest` / `green` / `white` / `black`：单色应用。
- 头像使用 `03-avatars` 的成品。图形已留出圆形裁切安全空间，背景由平台裁成圆形。

PNG 图标、字标和 WebP 动画是透明背景。四叶草是真镂空，会显示承载面的颜色。
头像、应用图标、社交图和 GIF 有固定底色。

## 新版配色

| 名称 | HEX | 角色 |
| --- | --- | --- |
| 幸运绿 | `#20A464` | 原稿主体色 |
| 深叶绿 | `#175D43` | 原稿眼睛色；主文字 |
| 嫩叶绿 | `#C9EFBE` | 新增扩展色；深色背景 Logo 主体 |
| 纸白 | `#F4F7F2` | 新增扩展色；浅色承载面 |
| 夜林绿 | `#102B22` | 新增扩展色；深色承载面 |

旧版颜色不再作为新版标准。不要把旧版主色或旧轮廓混入新版导出文件。

## 字体与源文件

字标沿用旧包的 Inter SemiBold / Inter Medium 矢量轮廓，品牌拼写继续使用小写 `clovers agent`。
**全部交付字标均已转曲，不依赖字体安装。** 规范、预览页及画板说明使用 Inter / 微软雅黑 / 系统字体回退，不附带字体文件。

三种静态 Logo 都是填充矢量路径，无外部图像、滤镜或蒙版依赖。新表情交付版已把圆头线条展开成填充路径；`08-source/expressions-editable.svg` 另保留可编辑笔画。
`08-source/reference` 保存新版定稿与几何构造参考；构造稿仅解释原稿默认 Logo。

## 动效

循环动画 6.4 秒，表情在 23%–27%、54%–58%、90%–94% 三段交叉淡化；主体不位移、不缩放。
单次动画 1.2 秒：前 25% 默认，25%–55% 淡化到目标，后 45% 保持目标。
SVG 在“减少动态效果”下回退到默认静态表情；GIF / WebP 本身无法读取该偏好，网页应使用 `picture` 静态回退。
循环适用于品牌演示或独立加载提示；真实产品应按实际任务状态切换静态表情，避免把循环误当成处理进度。

## 使用尺寸

默认 Logo 建议最小 32 px；Coding / 努力思考建议最小 48 px。
网站图标另提供 16 / 32 / 48 / 64 px ICO，16 px 主要识别品牌轮廓。
净空以源画板 32 单位为 x，从可见图形（含右上提示线）的外接边缘起，四周至少保留 1x。
保持原始画板比例；不要拉伸、旋转、填实四叶草镂空或移动提示线。

## 网页与再生成

- `07-guidelines/Web-Usage.zh-CN.md`：静态图、动画、sprite、Web Component 接入方法。
- `06-web/integration-example.html`：可通过 HTTP 直接运行的组件示例；直接双击时展示静态后备图。
- `08-source/BUILD.md`：生成静态资产、PDF、动画、清单与 ZIP 的方法。
- `ASSET-MANIFEST.json`：文件用途、像素尺寸、大小、SHA-256。
- `SHA256SUMS.txt`：完整性校验。校验文件自身不列入自己的校验范围。

本包独立交付在 `Design-Kit-v2`；原 `Design-Kit` 和新版 Logo 原稿目录保留。
