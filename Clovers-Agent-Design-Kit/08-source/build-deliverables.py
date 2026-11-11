"""Build Clovers Agent v2 animation, PDF, checksums and distributable ZIP."""
from __future__ import annotations
import hashlib
import json
import math
import os
from pathlib import Path
import re
import zipfile
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
COLORS = json.loads((ROOT / "08-source/palette.json").read_text("utf-8"))
QA = ROOT.parent / "tmp" / "clovers-v2-qa"
QA.mkdir(parents=True, exist_ok=True)
EXPRESSIONS = ("default", "coding", "thinking")
PNG = ROOT / "02-icons/png"


def ease(t):
    """CSS ease-in-out: cubic-bezier(.42, 0, .58, 1)."""
    lo, hi = 0.0, 1.0
    for _ in range(24):
        u = (lo + hi) / 2
        x = 3 * (1-u)**2 * u * .42 + 3 * (1-u) * u*u * .58 + u**3
        if x < t:
            lo = u
        else:
            hi = u
    return 3 * (1-u) * u*u + u**3


def weights(progress, mode):
    if mode != "loop":
        blend = 0 if progress <= .25 else 1 if progress >= .55 else ease((progress-.25)/.30)
        return ("default", "thinking" if mode == "once-thinking" else "coding", blend)
    for a, b, start, end in [
        ("default", "coding", .23, .27),
        ("coding", "thinking", .54, .58),
        ("thinking", "default", .90, .94),
    ]:
        if progress < start:
            return a, a, 0
        if progress <= end:
            return a, b, ease((progress-start)/(end-start))
    return "default", "default", 0


def build_animations():
    directory = ROOT / "05-animation/previews"
    directory.mkdir(exist_ok=True)
    originals = {e: Image.open(PNG / f"{e}-primary-512.png").convert("RGBA").resize((384, 384), Image.Resampling.LANCZOS) for e in EXPRESSIONS}
    for mode in ("loop", "once-coding", "once-thinking"):
        frame_count = 160 if mode == "loop" else 30
        frames = []
        for index in range(frame_count):
            a, b, fraction = weights(index / frame_count, mode)
            frames.append(Image.blend(originals[a], originals[b], fraction))
        frames[0].save(directory / f"clovers-{mode}.webp", save_all=True, append_images=frames[1:], duration=40, loop=0 if mode == "loop" else 1, lossless=True, method=6)
        # One shared palette prevents per-frame color flicker.
        palette_board = Image.new("RGB", (384*3, 384), COLORS["paper"])
        for index, expression in enumerate(EXPRESSIONS):
            palette_board.paste(originals[expression], (index*384, 0), originals[expression])
        palette = palette_board.quantize(colors=256)
        gif_frames = []
        for frame in frames:
            flat = Image.new("RGB", frame.size, COLORS["paper"])
            flat.paste(frame, mask=frame.getchannel("A"))
            gif_frames.append(flat.quantize(palette=palette, dither=Image.Dither.NONE))
        options = {"loop": 0} if mode == "loop" else {}
        gif_frames[0].save(directory / f"clovers-{mode}.gif", save_all=True, append_images=gif_frames[1:], duration=40, disposal=1, optimize=False, **options)
    Image.open(ROOT / "06-web/favicon-64.png").save(ROOT / "06-web/favicon.ico", sizes=[(16,16),(32,32),(48,48),(64,64)])


def contrast(a, b):
    def lum(color):
        rgb = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
        values = [x / 12.92 if x <= .04045 else ((x + .055) / 1.055)**2.4 for x in rgb]
        return sum(a*b for a,b in zip(values, [.2126,.7152,.0722]))
    light, dark = sorted((lum(a),lum(b)), reverse=True)
    return (light+.05)/(dark+.05)


def build_pdf():
    regular = os.environ.get("CLOVERS_FONT_REGULAR", "C:/Windows/Fonts/msyh.ttc")
    bold = os.environ.get("CLOVERS_FONT_BOLD", "C:/Windows/Fonts/msyhbd.ttc")
    for file in (regular, bold):
        if not Path(file).is_file():
            raise RuntimeError(f"Chinese font missing: {file}. Set CLOVERS_FONT_REGULAR / CLOVERS_FONT_BOLD.")
    pdfmetrics.registerFont(TTFont("CloversText", regular, subfontIndex=0))
    pdfmetrics.registerFont(TTFont("CloversBold", bold, subfontIndex=0))
    target = ROOT / "07-guidelines/Clovers-Agent-Brand-Guide-v2.pdf"
    c = canvas.Canvas(str(target), pagesize=(960, 640), pageCompression=1)
    c.setTitle("Clovers Agent v2 - 品牌视觉与表情规范")
    c.setAuthor("Clovers Agent")
    c.setSubject("新版 Logo、Coding >_、努力思考 >< 及完整应用规范")

    def box(x, y, w, h, fill, radius=0, stroke=None):
        c.setFillColor(HexColor(fill))
        c.setStrokeColor(HexColor(stroke or fill))
        c.setLineWidth(1)
        c.roundRect(x, 800-y-h, w, h, radius, fill=1, stroke=bool(stroke))

    def text(x, y, content, size=20, color=None, bold=False):
        c.setFont("CloversBold" if bold else "CloversText", size)
        c.setFillColor(HexColor(color or COLORS["ink"]))
        c.drawString(x, 800-y, content)

    def para(x, y, content, width, size=17, color=None, leading=None):
        font = "CloversText"
        leading = leading or size*1.7
        line = ""
        for char in content:
            if char == "\n":
                text(x,y,line,size,color); line=""; y+=leading
            elif pdfmetrics.stringWidth(line+char,font,size) > width:
                text(x,y,line,size,color); line=char; y+=leading
            else:
                line += char
        if line:
            text(x,y,line,size,color)
        return y+leading

    def image(file, x, y, w, h=None):
        with Image.open(file) as im:
            iw,ih=im.size
        h=h or w*ih/iw
        c.drawImage(ImageReader(str(file)), x, 800-y-h, w, h, mask="auto")

    def icon(expression, x, y, size, style="primary"):
        image(PNG / f"{expression}-{style}-1024.png",x,y,size,size)

    def line(x1, y1, x2, y2, color=None, dash=None):
        c.setStrokeColor(HexColor(color or COLORS["line"]));c.setLineWidth(1)
        c.setDash(dash or [])
        c.line(x1,800-y1,x2,800-y2)
        c.setDash([])

    def page(number, label, title=None, subtitle=None, dark=False):
        c.saveState(); c.scale(.8,.8)
        bg=COLORS["night"] if dark else COLORS["paper"]
        fg=COLORS["white"] if dark else COLORS["forest"]
        box(0,0,1200,800,bg)
        text(56,48,"CLOVERS AGENT / DESIGN KIT 02",13,fg,True)
        text(900,48,label,12,COLORS["mint"] if dark else COLORS["muted"])
        line(56,70,1144,70,"#335244" if dark else None)
        if title:
            text(56,132,title,37,fg,True)
        if subtitle:
            text(58,173,subtitle,17,COLORS["mint"] if dark else COLORS["muted"])
        line(56,744,1144,744,"#335244" if dark else None)
        text(56,774,"Clovers Agent  /  v2.0  /  2026.11.12",12,COLORS["mint"] if dark else COLORS["muted"])
        text(1082,774,f"{number:02d} / 08",12,COLORS["mint"] if dark else COLORS["muted"])

    def end():
        c.restoreState();c.showPage()

    page(1,"BRAND GUIDELINES",dark=True)
    text(60,156,"A LITTLE CLOVER.",18,COLORS["mint"],True)
    text(58,272,"会回应，",64,COLORS["white"],True)
    text(58,358,"也会认真思考。",64,COLORS["white"],True)
    para(60,430,"Clovers Agent 新版视觉识别系统\n默认 / Coding >_ / 努力思考 ><",610,22,"#BDD0C3",38)
    icon("default",760,177,365,"reverse")
    box(58,584,1084,104,"#193D2E",18)
    text(84,624,"一个轮廓，三个状态。",25,COLORS["white"],True)
    text(84,660,"图标 · 头像 · 字标 · 动效 · 网页资源 · 社交素材 · 可编辑源文件",17,COLORS["mint"])
    end()

    page(2,"01 / EXPRESSIONS","让眼睛，表达工作状态。","正式标识使用默认表情；产品交互可按实际任务切换 Coding 与努力思考。")
    items=[("default","默认","随时回应","品牌主标识、常规对话、待命。"),("coding","Coding >_","正在编写","开发协作、代码编写、任务执行。"),("thinking","努力思考 ><","认真推敲","分析问题、规划步骤、思考方案。")]
    for index,(expression,name,action,desc) in enumerate(items):
        x=56+index*369
        box(x,214,350,415,COLORS["white"],18)
        text(x+24,250,f"0{index+1} / {expression.upper()}",13,COLORS["muted"])
        icon(expression,x+56,262,238)
        text(x+24,535,name,25,COLORS["forest"],True)
        text(x+24,572,action,17,COLORS["forest"])
        para(x+24,604,desc,305,14,COLORS["muted"])
    box(56,655,1088,60,"#E6EEE2",12)
    text(78,692,"状态必须与产品行为对应。努力思考不代表出错；重要反馈同时提供文字。",18,COLORS["forest"])
    end()

    page(3,"02 / GEOMETRY","熟悉的轮廓，统一的秩序。","气泡、四叶草镂空和提示线全部保留新版原稿，仅替换新增表情的眼部。")
    box(56,214,522,480,COLORS["white"],18)
    icon("thinking",120,236,390)
    # Clear space boundary uses the mark's actual alpha bounds, plus 32/512.
    with Image.open(PNG/"thinking-primary-1024.png") as im:
        left,top,right,bottom=im.getchannel("A").getbbox()
    scale=390/1024; pad=390*32/512
    x0,y0=120+left*scale-pad,236+top*scale-pad
    x1,y1=120+right*scale+pad,236+bottom*scale+pad
    for a,b,d,e in [(x0,y0,x1,y0),(x0,y1,x1,y1),(x0,y0,x0,y1),(x1,y0,x1,y1)]:
        line(a,b,d,e,"#7DAF8C",[5,5])
    text(85,661,"净空 x = 源画板 32 单位；包含右上提示线。",17,COLORS["muted"])
    text(624,256,"原稿保持不变",24,COLORS["forest"],True)
    para(624,294,"默认 SVG 与提供的定稿逐字节一致。四叶草采用真实镂空，不覆盖白色形状。",488,18,COLORS["muted"])
    line(624,370,1144,370)
    text(624,416,"新增表情的共同参数",24,COLORS["forest"],True)
    para(624,457,"-12° 倾角 / 18 单位圆头笔画\n以 (236, 238) 为旋转中心\n交付版已展开为填充矢量路径",488,18,COLORS["muted"],34)
    line(624,562,1144,562)
    text(624,605,"保留原始画板",24,COLORS["forest"],True)
    text(624,644,"viewBox = 0 -16 512 512",20,COLORS["forest"])
    text(624,677,"整体等比缩放，不单独移动眼睛与提示线。",16,COLORS["muted"])
    end()

    page(4,"03 / COLOR","从幸运绿，到夜林绿。","主色来自新版原稿；扩展色服务于浅色、深色与应用场景。")
    names={"green":"幸运绿","forest":"深叶绿","mint":"嫩叶绿","paper":"纸白","night":"夜林绿"}
    for index,key in enumerate(names):
        x=56+index*222
        box(x,221,200,146,COLORS[key],14,stroke=COLORS["line"] if key=="paper" else None)
        text(x,403,names[key],23,COLORS["forest"],True)
        text(x,438,COLORS[key],18,COLORS["forest"])
        text(x,468,"原稿色" if index<2 else "配套扩展色",14,COLORS["muted"])
    box(56,510,520,198,COLORS["white"],16)
    icon("coding",70,520,166)
    text(254,561,"浅色背景 / primary",21,COLORS["forest"],True)
    para(254,599,"绿色主体，深绿眼睛。\n正文使用深叶绿。",294,17,COLORS["muted"])
    box(598,510,546,198,COLORS["night"],16)
    icon("thinking",614,520,166,"reverse")
    text(796,561,"深色背景 / reverse",21,COLORS["white"],True)
    para(796,599,"嫩叶绿主体，白色眼睛。\n镂空显示承载面的颜色。",316,17,COLORS["mint"])
    end()

    page(5,"04 / LOCKUPS","从标识，到每个品牌触点。","字标沿用旧包的 Inter 矢量文字，全部已转曲，不依赖字体安装。")
    box(56,216,702,235,COLORS["white"],18)
    text(80,251,"HORIZONTAL / 横排字标",13,COLORS["muted"])
    image(ROOT/"04-wordmarks/png/horizontal-primary.png",77,274,655)
    box(56,472,340,239,COLORS["white"],18)
    text(80,507,"SIGNATURE / 双行签名",13,COLORS["muted"])
    image(ROOT/"04-wordmarks/png/signature-primary.png",75,540,305)
    box(417,472,341,239,COLORS["night"],18)
    text(441,507,"STACKED / 竖排字标",13,COLORS["mint"])
    image(ROOT/"04-wordmarks/png/stacked-reverse.png",492,522,191)
    text(802,251,"头像与裁切",25,COLORS["forest"],True)
    for index,(expression,theme) in enumerate([("default","light"),("coding","dark"),("thinking","green")]):
        x=804+index*112
        file=ROOT/f"03-avatars/png/{expression}-{theme}-512.png"
        c.saveState()
        clip=c.beginPath();clip.circle(x+48,800-320-48,48);c.clipPath(clip,stroke=0)
        image(file,x,320,96)
        c.restoreState()
    para(802,470,"三种表情 × 三种底色。\n成品预留圆形裁切空间，\n保持默认尺寸，不额外放大。",328,18,COLORS["muted"],33)
    line(802,580,1144,580)
    para(802,620,"图标与字标 PNG 透明；\n头像使用固定背景。",328,17,COLORS["muted"],31)
    end()

    page(6,"05 / MOTION","轻轻切换，让注意力留在内容上。","外轮廓固定；眼睛交叉淡化。SVG 为正式动效，WebP / GIF 用于内容平台。")
    for index,e in enumerate(EXPRESSIONS):
        x=82+index*374
        icon(e,x,202,200)
        text(x+20,428,["默认","Coding >_","努力思考 ><"][index],22,COLORS["forest"],True)
        if index<2:
            text(x+257,316,">",32,COLORS["green"],True)
    segments=[(.23,"default"),(.04,"fade"),(.27,"coding"),(.04,"fade"),(.32,"thinking"),(.04,"fade"),(.06,"default")]
    x=56
    for width,label in segments:
        color=COLORS["green"] if label=="coding" else COLORS["forest"] if label=="thinking" else COLORS["mint"] if label=="default" else "#DCE6DC"
        box(x,466,1088*width,20,color);x+=1088*width
    text(56,519,"循环 / 6.4 秒",22,COLORS["forest"],True)
    text(710,519,"单次 / 1.2 秒",22,COLORS["forest"],True)
    para(56,556,"默认 → Coding → 思考 → 默认。\n切换区间：23%-27% / 54%-58% / 90%-94%。",620,17,COLORS["muted"],31)
    para(710,556,"0.3 秒默认；0.36 秒淡化；\n最后 0.54 秒保持目标。",425,17,COLORS["muted"],31)
    box(56,645,1088,67,"#E6EEE2",12)
    text(78,673,"减少动态效果：SVG 自动显示默认静态表情。",17,COLORS["forest"])
    text(78,699,"GIF / WebP 需在网页用 picture 回退。真实任务状态使用静态表情切换。",16,COLORS["forest"])
    end()

    page(7,"06 / APPLICATION","小处清楚，大处一致。","优先使用正确版本与尺寸；不要依赖表情单独传达重要信息。")
    box(56,218,515,240,COLORS["white"],18)
    for i,size in enumerate([32,48,64,96]):
        x=88+i*115
        icon("default" if i==0 else "coding",x,276,size)
        text(x,414,f"{size} px",15,COLORS["muted"])
    text(80,255,"推荐最小尺寸",20,COLORS["forest"],True)
    text(80,440,"默认 ≥32 px；Coding / 思考 ≥48 px。",16,COLORS["forest"])
    box(594,218,550,240,COLORS["night"],18)
    icon("thinking",616,241,160,"reverse")
    text(807,279,"Clovers Agent",20,COLORS["white"],True)
    text(807,325,"正在认真推敲…",25,COLORS["white"])
    text(807,369,"配合明确的文字状态",16,COLORS["mint"])
    text(619,433,"不要用思考表情表示错误、失败或告警。",16,COLORS["mint"])
    text(56,513,"保持这些约束",24,COLORS["forest"],True)
    para(56,554,"不拉伸或额外旋转。不填实镂空。\n不添加外描边、渐变或投影。\n不移动、删除右上提示线。",515,19,COLORS["muted"],36)
    text(594,513,"文字与背景",24,COLORS["forest"],True)
    ratio=contrast(COLORS["forest"],COLORS["white"])
    para(594,554,f"深叶绿 / 白色：对比度 {ratio:.2f}:1。\n幸运绿不用于小字号正文。\n复杂背景上使用纯色承载面。",550,19,COLORS["muted"],36)
    text(56,707,"应用图标包含 any / maskable；社交封面包含 1200×630 与 1500×500。",17,COLORS["forest"])
    end()

    page(8,"07 / HANDOFF","打开即用，也能继续生长。","源文件、规范、生成脚本和校验清单都在包内。")
    folders=[
        ("01-core","三种表情 / 三种动效"),
        ("02-icons","六套配色 / 六档 PNG 尺寸"),
        ("03-avatars","深浅及绿色头像 / 圆形裁切"),
        ("04-wordmarks","横排 / 双行签名 / 竖排"),
        ("05-animation","SVG / GIF / 透明 WebP"),
        ("06-web","Favicon / 应用图标 / 组件"),
        ("07-guidelines","PDF / 品牌规范 / 网页接入"),
        ("08-source","矢量画板 / 几何 / 生成脚本"),
        ("09-social","分享图 / 横幅"),
    ]
    for index,(folder,desc) in enumerate(folders):
        y=229+index*49
        box(56,y-22,650,43,COLORS["white"],6)
        text(72,y+6,folder,16,COLORS["forest"],True)
        text(264,y+6,desc,16,COLORS["muted"])
    box(737,207,407,489,COLORS["forest"],18)
    text(765,257,"先打开这三个文件",24,COLORS["white"],True)
    text(765,317,"START-HERE.html",21,COLORS["mint"],True)
    text(765,351,"离线预览、切换、搜索与下载。",16,COLORS["white"])
    text(765,410,"brand-overview.png",21,COLORS["mint"],True)
    text(765,444,"一张图，了解完整设计语言。",16,COLORS["white"])
    text(765,503,"README.zh-CN.md",21,COLORS["mint"],True)
    text(765,537,"目录说明、使用入口和维护方法。",16,COLORS["white"])
    para(765,608,"原稿保留；旧版设计包不覆盖。\n交付文件通过 SHA-256 校验。",350,16,COLORS["mint"],31)
    end()
    c.save()
    reader=PdfReader(target)
    if len(reader.pages)!=8:
        raise AssertionError("Guide must contain 8 pages")
    for number,p in enumerate(reader.pages,1):
        if len(p.extract_text())<100:
            raise AssertionError(f"Missing PDF text on page {number}")
    return target


def build_review_sheet():
    sheet=Image.new("RGB",(1500,1010),COLORS["paper"])
    d=ImageDraw.Draw(sheet)
    from PIL import ImageFont
    f=ImageFont.truetype("C:/Windows/Fonts/Inter-Regular.ttf",22) if Path("C:/Windows/Fonts/Inter-Regular.ttf").exists() else ImageFont.load_default()
    for row,expression in enumerate(EXPRESSIONS):
        y=32+row*300
        d.text((28,y),expression,fill=COLORS["forest"],font=f)
        x=200
        for size in [16,24,32,48,64,96,128]:
            im=Image.open(PNG/f"{expression}-primary-512.png").convert("RGBA").resize((size,size),Image.Resampling.LANCZOS)
            sheet.paste(im,(x,y+70),im);d.text((x,y+214),str(size),fill=COLORS["forest"],font=f);x+=150
        for i,theme in enumerate(["light","dark"]):
            im=Image.open(ROOT/f"03-avatars/png/{expression}-{theme}-512.png").convert("RGBA").resize((116,116),Image.Resampling.LANCZOS)
            mask=Image.new("L",(116,116));ImageDraw.Draw(mask).ellipse((0,0,115,115),fill=255)
            sheet.paste(im,(1250+i*122,y+60),mask)
    sheet.save(QA/"sizes-and-crops.png")
    default=Image.open(ROOT/"02-icons/png/default-primary-1024.png").convert("RGBA")
    backdrop=Image.new("RGB",default.size,"#D9B4CF");backdrop.paste(default,mask=default.getchannel("A"));backdrop.resize((512,512)).save(QA/"transparency-check.png")


def files():
    return sorted(p for p in ROOT.rglob("*") if p.is_file() and not any(part in ("node_modules","__pycache__", ".git") for part in p.relative_to(ROOT).parts))


def verify():
    errors=[]
    src=ROOT/"08-source/reference/clovers-agent-final.svg"
    if src.read_bytes()!=(ROOT/"01-core/clovers-default.svg").read_bytes():
        errors.append("Default core differs from original master")
    body=ET.parse(src).getroot().find("{http://www.w3.org/2000/svg}path").attrib["d"]
    svg_count=0;png_count=0
    for file in files():
        if file.suffix==".svg":
            svg_count+=1
            try:
                root=ET.parse(file).getroot()
                if file.parent.name=="svg" and file.parent.parent.name=="02-icons":
                    if root.find("{http://www.w3.org/2000/svg}path").attrib["d"]!=body:
                        errors.append(f"Body changed: {file.name}")
            except ET.ParseError as exc:
                errors.append(f"Invalid XML: {file.name}: {exc}")
        if file.suffix==".png":
            png_count+=1
            with Image.open(file) as im:
                im.load()
                if "02-icons" in file.parts:
                    size=int(file.stem.rsplit("-",1)[1])
                    if im.size!=(size,size) or im.mode!="RGBA":
                        errors.append(f"Wrong icon format: {file.name}")
                    if im.getchannel("A").getextrema()!=(0,255):
                        errors.append(f"No proper alpha: {file.name}")
    for expression in EXPRESSIONS:
        # Test visible artwork, not the square avatar background.
        im=Image.open(PNG/f"{expression}-primary-512.png").convert("RGBA").resize((410,410),Image.Resampling.LANCZOS)
        alpha=im.getchannel("A")
        for y in range(410):
            for x in range(410):
                if alpha.getpixel((x,y))>16 and math.hypot(x+51-256,y+51-256)>256:
                    errors.append(f"Avatar clipping: {expression}");break
            if errors and errors[-1]==f"Avatar clipping: {expression}":
                break
    im=Image.open(PNG/"default-primary-512.png").convert("RGBA").resize((358,358),Image.Resampling.LANCZOS)
    for y in range(358):
        for x in range(358):
            if im.getpixel((x,y))[3]>16 and math.hypot(x+77-256,y+77-256)>204.8:
                errors.append("Maskable artwork exceeds safe circle");break
    ico=Image.open(ROOT/"06-web/favicon.ico")
    if ico.ico.sizes()!={(16,16),(32,32),(48,48),(64,64)}:
        errors.append("ICO sizes mismatch")
    animation_info={}
    for file in sorted((ROOT/"05-animation/previews").iterdir()):
        if file.suffix not in (".gif",".webp"):
            continue
        with Image.open(file) as im:
            mode="loop" if file.stem=="clovers-loop" else "once"
            expected=6400 if mode=="loop" else 1200
            loop=im.info.get("loop")
            if file.suffix==".gif":
                duration=0
                for index in range(im.n_frames):
                    im.seek(index);duration+=im.info.get("duration",0)
                if duration!=expected:errors.append(f"Duration mismatch: {file.name} = {duration}")
                if mode=="once" and loop is not None:errors.append(f"Once GIF repeats: {file.name}")
            else:
                data=file.read_bytes()
                offset=12;duration=0
                while offset+8<=len(data):
                    chunk=data[offset:offset+4]
                    length=int.from_bytes(data[offset+4:offset+8],"little")
                    if chunk==b"ANMF":
                        duration+=int.from_bytes(data[offset+20:offset+23],"little")
                    offset+=8+length+(length%2)
                if duration!=expected:errors.append(f"WebP duration mismatch: {file.name} = {duration}")
                if loop!=(0 if mode=="loop" else 1):errors.append(f"WebP loop mismatch: {file.name}")
            animation_info[file.name]={"frames":im.n_frames,"duration_ms":duration,"loop":loop}
    result={"status":"passed" if not errors else "failed","date":"2026-11-12","checks":{"default_master_byte_identical":src.read_bytes()==(ROOT/"01-core/clovers-default.svg").read_bytes(),"svg_xml_validated":svg_count,"png_decoded":png_count,"original_body_preserved_in_all_icon_variants":True,"avatar_circle_safe":not any("Avatar" in e for e in errors),"maskable_circle_safe":not any("Maskable" in e for e in errors),"pdf_pages":8,"favicon_sizes":[16,32,48,64]},"animation":animation_info,"contrast":{"forest_on_white":round(contrast(COLORS["forest"],COLORS["white"]),2),"green_on_white":round(contrast(COLORS["green"],COLORS["white"]),2)},"errors":errors}
    (ROOT/"07-guidelines/DELIVERY-CHECK.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    if errors:
        raise AssertionError("\n".join(errors))
    return result


def finalize():
    manifest_file=ROOT/"ASSET-MANIFEST.json"
    sums_file=ROOT/"SHA256SUMS.txt"
    descriptions={"01-core":"正式核心 Logo / 动效","02-icons":"透明图标","03-avatars":"固定底色头像","04-wordmarks":"已转曲字标","05-animation":"动态素材","06-web":"网页与应用接入","07-guidelines":"规范与交付检查","08-source":"可编辑源文件与构建脚本","09-social":"社交分享素材"}
    entries=[]
    for file in files():
        if file.name in ("ASSET-MANIFEST.json","SHA256SUMS.txt"):
            continue
        relative=file.relative_to(ROOT).as_posix()
        entry={"path":relative,"purpose":descriptions.get(relative.split("/")[0],"离线预览与交付说明"),"bytes":file.stat().st_size,"sha256":hashlib.sha256(file.read_bytes()).hexdigest()}
        if file.suffix in (".png",".gif",".webp",".ico"):
            with Image.open(file) as image:
                entry["width"],entry["height"]=image.size
                entry["format"]=image.format
        elif file.suffix==".svg":
            root=ET.parse(file).getroot()
            if "viewBox" in root.attrib:entry["viewBox"]=root.attrib["viewBox"]
        entries.append(entry)
    manifest={"name":"Clovers Agent Design Kit","version":"2.0.0","created":"2026-11-12","source":"User-supplied clovers-agent-final.svg","expressions":["default","coding >_","thinking ><"],"asset_count":len(entries),"hash_scope":"All package files except ASSET-MANIFEST.json and SHA256SUMS.txt. SHA256SUMS.txt additionally hashes ASSET-MANIFEST.json.","assets":entries}
    manifest_file.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
    sums=[f"{item['sha256']}  {item['path']}" for item in entries]
    sums.append(f"{hashlib.sha256(manifest_file.read_bytes()).hexdigest()}  ASSET-MANIFEST.json")
    sums_file.write_text("\n".join(sums)+"\n",encoding="utf-8")
    zipfile_path=ROOT.parent/"Clovers-Agent-Design-Kit-v2.zip"
    with zipfile.ZipFile(zipfile_path,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for file in files():
            archive.write(file,Path(ROOT.name)/file.relative_to(ROOT))
    with zipfile.ZipFile(zipfile_path) as archive:
        if archive.testzip() is not None:
            raise AssertionError("ZIP CRC verification failed")
        for item in entries:
            data=archive.read(f"{ROOT.name}/{item['path']}")
            if hashlib.sha256(data).hexdigest()!=item["sha256"]:
                raise AssertionError(f"ZIP checksum mismatch: {item['path']}")
    print(json.dumps({"files":len(entries)+2,"zip":str(zipfile_path),"zip_bytes":zipfile_path.stat().st_size,"pdf_pages":8,"checks":"passed"},ensure_ascii=False))


if __name__=="__main__":
    build_animations()
    build_pdf()
    build_review_sheet()
    verify()
    finalize()
