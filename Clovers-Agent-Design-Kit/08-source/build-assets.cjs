/* Clovers Agent v2 - deterministic SVG/PNG asset builder.
 * Run: npm install && npm run build (from this folder).
 * Optional offline runtime: CLOVERS_NODE_MODULES=/path/to/node_modules
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.env.CLOVERS_NODE_MODULES ? path.join(process.env.CLOVERS_NODE_MODULES, 'sharp') : 'sharp');
const ROOT = path.resolve(__dirname, '..');
const master = fs.readFileSync(path.join(__dirname, 'reference/clovers-agent-final.svg'), 'utf8');
const paths = [...master.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\/>/g)].map(m => m[1]);
if (paths.length !== 2) throw new Error('Expected the two original logo paths.');
const [BODY, DEFAULT] = paths;
const typePaths = JSON.parse(fs.readFileSync(path.join(__dirname, 'wordmark-paths.json'), 'utf8'));
const COLORS = {green:'#20A464',forest:'#175D43',mint:'#C9EFBE',paper:'#F4F7F2',ink:'#123C2D',night:'#102B22',muted:'#63786B',line:'#DCE6DC',white:'#FFFFFF',black:'#000000'};
const STYLES = {
  primary: {body:COLORS.green,eyes:COLORS.forest},
  reverse: {body:COLORS.mint,eyes:COLORS.white},
  forest: {body:COLORS.forest,eyes:COLORS.forest},
  green: {body:COLORS.green,eyes:COLORS.green},
  white: {body:COLORS.white,eyes:COLORS.white},
  black: {body:COLORS.black,eyes:COLORS.black}
};
const EXPRESSIONS = ['default','coding','thinking'];
const CN = {default:'默认 / 随时回应',coding:'Coding / 正在编写',thinking:'努力思考 / 正在推敲'};
const esc = v => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function write(name,data) { const target=path.join(ROOT,name); fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,data); }
const n = v => +v.toFixed(4);
// Expand round strokes to filled nonzero subpaths. The editable centerlines are
// also delivered separately. All contours have the same winding direction.
function roundStroke(points,r=9) {
  let d='';
  for(let i=1;i<points.length;i++) {
    const [ax,ay]=points[i-1], [bx,by]=points[i], len=Math.hypot(bx-ax,by-ay);
    const nx=-(by-ay)/len*r, ny=(bx-ax)/len*r;
    d+=`M${n(ax-nx)} ${n(ay-ny)}L${n(bx-nx)} ${n(by-ny)}L${n(bx+nx)} ${n(by+ny)}L${n(ax+nx)} ${n(ay+ny)}Z`;
  }
  for(const [x,y] of points) d+=`M${x-r} ${y}A${r} ${r} 0 1 1 ${x+r} ${y}A${r} ${r} 0 1 1 ${x-r} ${y}Z`;
  return d;
}
const CENTERLINES = {
 coding:[[[184,216],[211,238],[184,260]],[[256,260],[288,260]]],
 thinking:[[[184,216],[211,238],[184,260]],[[288,216],[261,238],[288,260]]]
};
function eyes(expr,color) {
  if(expr==='default') return `<path fill="${color}" d="${DEFAULT}"/>`;
  return `<path fill="${color}" fill-rule="nonzero" transform="rotate(-12 236 238)" d="${CENTERLINES[expr].map(p=>roundStroke(p)).join(' ')}"/>`;
}
function mark(expr='default',style='primary') {
  const s=typeof style==='string'?STYLES[style]:style;
  return `<path fill="${s.body}" fill-rule="evenodd" d="${BODY}"/>${eyes(expr,s.eyes)}`;
}
function svg(content,w=512,h=512,title='Clovers Agent',vb=`0 -16 512 512`) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}" role="img"><title>${esc(title)}</title>${content}</svg>\n`;
}
function placed(expr,style,x,y,size) {return `<g transform="translate(${x} ${y}) scale(${size/512})"><g transform="translate(0 16)">${mark(expr,style)}</g></g>`;}
function text(x,y,label,size=20,fill=COLORS.ink,weight=400,extra='') {return `<text x="${x}" y="${y}" font-family="Inter,Microsoft YaHei,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${esc(label)}</text>`;}
function rect(x,y,w,h,fill,rx=0,extra='') {return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;}
const jobs=[];
function png(name,source,width,height) {jobs.push(async()=>{const dst=path.join(ROOT,name);fs.mkdirSync(path.dirname(dst),{recursive:true});await sharp(Buffer.from(source)).resize(width,height,{fit:'contain'}).png().toFile(dst);});}
function saveVector(name,source,widths=[]) {
  write(name,source);
  for(const size of widths) png(name.replace('/svg/','/png/').replace('.svg',`-${size}.png`),source,size);
}
function lockup(kind,style='primary') {
  const color=style==='reverse'?COLORS.white:style==='black'?COLORS.black:COLORS.forest;
  const type=(idx,x,y,s)=>`<path fill="${color}" d="${typePaths[idx]}" transform="translate(${x} ${y}) scale(${s})"/>`;
  if(kind==='horizontal') return svg(placed('default',style,0,20,240)+type(0,250,64,1.2)+type(1,700,64,1.2),1080,280,'Clovers Agent · horizontal','0 0 1080 280');
  if(kind==='signature') return svg(placed('default',style,0,10,290)+type(0,305,10,1.38)+type(1,308,135,1.06),830,310,'Clovers Agent · signature','0 0 830 310');
  return svg(placed('default',style,115,10,410)+type(0,87,408,.72)+type(1,358,408,.72),640,550,'Clovers Agent · stacked','0 0 640 550');
}
function animation(mode,style='primary') {
  const s=STYLES[style], loop=mode==='loop', target=mode==='once-thinking'?'thinking':'coding';
  const duration=loop?'6.4s':'1.2s', repeat=loop?'infinite':'1';
  const keyframes=loop?
   `@keyframes d{0%,23%,94%,100%{opacity:1}27%,90%{opacity:0}}@keyframes c{0%,23%,58%,100%{opacity:0}27%,54%{opacity:1}}@keyframes t{0%,54%,94%,100%{opacity:0}58%,90%{opacity:1}}`:
   `@keyframes d{0%,25%{opacity:1}55%,100%{opacity:0}}@keyframes c{0%,25%{opacity:0}55%,100%{opacity:1}}`;
  const css=`<style>.face{animation-duration:${duration};animation-iteration-count:${repeat};animation-fill-mode:forwards;animation-timing-function:ease-in-out}.d{animation-name:d}.c{opacity:0;animation-name:c}.t{opacity:0;animation-name:t}${keyframes}@media(prefers-reduced-motion:reduce){.face{animation:none!important}.d{opacity:1!important}.c,.t{opacity:0!important}}</style>`;
  return svg(css+`<path fill="${s.body}" fill-rule="evenodd" d="${BODY}"/><g class="face d">${eyes('default',s.eyes)}</g><g class="face c">${eyes(loop?'coding':target,s.eyes)}</g>`+(loop?`<g class="face t">${eyes('thinking',s.eyes)}</g>`:''),512,512,`Clovers Agent · ${mode}`);
}
function overview() {
 let s=rect(0,0,1800,1530,COLORS.paper);
 s+=text(72,74,'CLOVERS AGENT',23,COLORS.forest,650)+text(1728,74,'IDENTITY SYSTEM / 02',17,COLORS.muted,500,'text-anchor="end"');
 s+=rect(64,112,1672,492,COLORS.night,30);
 s+=text(112,176,'A LITTLE CLOVER. A LOT OF POSSIBILITY.',16,COLORS.mint,500);
 s+=text(110,279,'会回应，也会认真思考。',62,COLORS.white,650);
 s+=text(113,349,'同一片四叶草，三种工作状态。',27,'#BDD0C3');
 s+=text(113,526,'NEW LOGO  /  CODING >_  /  THINKING ><',18,COLORS.mint,500);
 s+=placed('default','reverse',1196,140,440);
 s+=text(72,672,'01  表情系统',27,COLORS.forest,650)+text(1728,670,'轮廓一致 · 只改变眼睛',18,COLORS.muted,400,'text-anchor="end"');
 EXPRESSIONS.forEach((e,i)=>{const x=64+i*564;s+=rect(x,710,544,378,COLORS.white,24)+placed(e,'primary',x+130,722,282)+text(x+32,1041,CN[e],23,COLORS.forest,600);});
 s+=rect(64,1120,1012,310,COLORS.white,24)+text(96,1175,'02  品牌色彩',24,COLORS.forest,650);
 ['green','forest','mint','paper','night'].forEach((c,i)=>{const x=96+i*188;s+=rect(x,1210,164,116,COLORS[c],14)+text(x,1366,COLORS[c],20,COLORS.forest,600)+text(x,1394,c.toUpperCase(),12,COLORS.muted,500);});
 s+=rect(1100,1120,636,310,COLORS.forest,24)+text(1134,1175,'03  为真实使用准备',24,COLORS.white,600);
 s+=text(1134,1234,'SVG / PNG / ICO / GIF / WEBP',22,COLORS.mint,600);
 s+=text(1134,1282,'头像 · 字标 · 动效 · 社交封面',23,COLORS.white);
 s+=text(1134,1323,'网页组件 · 设计变量 · 完整规范',23,COLORS.white);
 s+=text(1134,1392,'EDITABLE. REUSABLE. READY TO SHIP.',14,COLORS.mint,500);
 s+=text(72,1490,'Clovers Agent · Design Kit v2.0',16,COLORS.muted)+text(1728,1490,'2026.11.12',16,COLORS.muted,400,'text-anchor="end"');
 return svg(s,1800,1530,'Clovers Agent v2 · 品牌总览','0 0 1800 1530');
}
function social(kind) {
 const og=kind==='og',w=og?1200:1500,h=og?630:500;
 let s=rect(0,0,w,h,COLORS.night);
 s+=`<circle cx="${w}" cy="${h}" r="430" fill="#173C2D"/><circle cx="${w}" cy="${h}" r="310" fill="none" stroke="#285342" stroke-width="1"/>`;
 s+=text(64,82,'CLOVERS AGENT',18,COLORS.mint,600);
 s+=text(62,og?247:214,'会回应，',og?66:60,COLORS.white,650)+text(62,og?330:292,'也会认真思考。',og?66:60,COLORS.white,650);
 s+=text(66,h-72,'CHAT. CODE. THINK.',19,COLORS.mint,500);
 s+=placed('default','reverse',w-460,og?105:45,390);
 return svg(s,w,h,`Clovers Agent · ${kind}` ,`0 0 ${w} ${h}`);
}
function artboard() {
 let s=rect(0,0,1800,1290,COLORS.paper)+text(64,84,'Clovers Agent / editable identity artboard',38,COLORS.forest,600);
 EXPRESSIONS.forEach((e,i)=>{let x=64+i*565;s+=rect(x,130,540,420,COLORS.white,20)+placed(e,'primary',x+90,145,350)+text(x+28,520,CN[e],21,COLORS.forest,500);});
 s+=rect(64,580,816,300,COLORS.white,20)+placed('default','primary',80,620,210);
 typePaths.forEach((d,i)=>s+=`<path fill="${COLORS.forest}" d="${d}" transform="translate(${i?568:318} 668) scale(.62)"/>`);
 s+=rect(908,580,828,300,COLORS.night,20)+placed('coding','reverse',936,590,265)+placed('thinking','reverse',1296,590,265);
 s+=text(64,955,'PALETTE / RGB',20,COLORS.forest,600);
 ['green','forest','mint','paper','night','white','black'].forEach((c,i)=>{let x=64+i*240;s+=rect(x,990,216,130,COLORS[c],12,`stroke="${COLORS.line}"`)+text(x,1159,COLORS[c],23,COLORS.forest,500)+text(x,1194,c,16,COLORS.muted);});
 s+=text(64,1252,'Logo + wordmark: vector paths. Labels: editable text. Original silhouette retained.',18,COLORS.muted);
 return svg(s,1800,1290,'Clovers Agent · editable artwork','0 0 1800 1290');
}
async function main() {
 write('01-core/clovers-default.svg',master);
 for(const e of EXPRESSIONS) {
   if(e!=='default') write(`01-core/clovers-${e}.svg`,svg(mark(e)));
   for(const st of Object.keys(STYLES)) saveVector(`02-icons/svg/${e}-${st}.svg`,svg(mark(e,st),512,512,`Clovers Agent · ${e} · ${st}`),[32,64,128,256,512,1024]);
   for(const theme of ['light','dark','green']) {
     const bg=theme==='light'?COLORS.paper:theme==='dark'?COLORS.night:COLORS.green;
     const st=theme==='light'?'primary':theme==='dark'?'reverse':'white';
     const a=svg(rect(0,0,512,512,bg)+placed(e,st,51.2,51.2,409.6),512,512,`Clovers Agent · ${e} avatar`,'0 0 512 512');
     saveVector(`03-avatars/svg/${e}-${theme}.svg`,a,[128,512,1024]);
   }
 }
 for(const k of ['horizontal','signature','stacked']) for(const st of ['primary','reverse','black']) {
   const source=lockup(k,st);write(`04-wordmarks/svg/${k}-${st}.svg`,source);png(`04-wordmarks/png/${k}-${st}.png`,source,k==='stacked'?1280:2160);
 }
 for(const mode of ['loop','once-coding','once-thinking']) {
   write(`01-core/clovers-${mode}.svg`,animation(mode));
   for(const st of ['primary','reverse','white']) write(`05-animation/svg/${mode}-${st}.svg`,animation(mode,st));
 }
 const favicon=svg(mark());
 write('06-web/favicon.svg',favicon);
 for(const size of [16,32,48,64]) png(`06-web/favicon-${size}.png`,favicon,size);
 const app=svg(rect(0,0,512,512,COLORS.paper)+placed('default','primary',51.2,51.2,409.6),512,512,'Clovers Agent app icon','0 0 512 512');
 for(const size of [180,192,512]) png(`06-web/app-icon-${size}.png`,app,size);
 // Entire mark lies inside the central 80% safe circle.
 const mask=svg(rect(0,0,512,512,COLORS.paper)+placed('default','primary',76.8,76.8,358.4),512,512,'Clovers Agent maskable icon','0 0 512 512');
 png('06-web/app-icon-maskable-512.png',mask,512);
 write('06-web/site.webmanifest',JSON.stringify({name:'Clovers Agent',short_name:'Clovers',id:'./',start_url:'./',scope:'./',display:'standalone',background_color:COLORS.paper,theme_color:COLORS.forest,icons:[{src:'app-icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'app-icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'app-icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]},null,2));
 const symbols=EXPRESSIONS.map(e=>`<symbol id="clovers-${e}" viewBox="0 -16 512 512"><path fill="var(--clovers-body, #20A464)" fill-rule="evenodd" d="${BODY}"/>${eyes(e,'var(--clovers-eyes, #175D43)')}</symbol>`).join('');
 write('06-web/clovers-sprite.svg',`<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`);
 write('06-web/clovers-logo.js',`// Dependency-free Web Component. Import once, then <clovers-logo expression="coding">.\nconst artwork=${JSON.stringify(Object.fromEntries(EXPRESSIONS.map(e=>[e,mark(e,{body:'var(--clovers-body, #20A464)',eyes:'var(--clovers-eyes, #175D43)'})])))};\nexport class CloversLogo extends HTMLElement {\n static get observedAttributes(){return ['expression','label'];}\n constructor(){super();this.attachShadow({mode:'open'});}\n connectedCallback(){this.render();}\n attributeChangedCallback(){if(this.shadowRoot)this.render();}\n render(){const e=Object.hasOwn(artwork,this.getAttribute('expression'))?this.getAttribute('expression'):'default';this.shadowRoot.innerHTML='<style>:host{display:inline-block;width:64px;aspect-ratio:1}svg{display:block;width:100%;height:100%}</style><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -16 512 512" role="img"><title></title>'+artwork[e]+'</svg>';this.shadowRoot.querySelector('title').textContent=this.getAttribute('label')||'Clovers Agent / '+e;}\n}\nif(!customElements.get('clovers-logo')) customElements.define('clovers-logo',CloversLogo);\n`);
 write('08-source/palette.json',JSON.stringify(COLORS,null,2));
 write('08-source/geometry.json',JSON.stringify({viewBox:[0,-16,512,512],bodyPath:BODY,defaultEyePath:DEFAULT,expressionPivot:[236,238],rotation:-12,expressionStrokeWidth:18,expressionCenterlines:CENTERLINES,source:'reference/clovers-agent-final.svg',notes:'New expressions use filled round-stroke outlines. Body, clover aperture and attention rays are unchanged.'},null,2));
 write('08-source/brand-tokens.css',`:root {\n${Object.entries(COLORS).map(([k,v])=>`  --clovers-${k}: ${v};`).join('\n')}\n  --clovers-body: var(--clovers-green);\n  --clovers-eyes: var(--clovers-forest);\n  --clovers-radius-sm: 12px;\n  --clovers-radius-lg: 24px;\n  --clovers-space-unit: 8px;\n  --clovers-font: Inter, \"Microsoft YaHei\", system-ui, sans-serif;\n  --clovers-motion-loop: 6.4s;\n}\n[data-clovers-theme=\"dark\"] {\n  --clovers-body: var(--clovers-mint);\n  --clovers-eyes: var(--clovers-white);\n}\n`);
 write('08-source/expressions-editable.svg',svg(rect(0,-16,1536,512,COLORS.paper)+EXPRESSIONS.map((e,i)=>`<g transform="translate(${i*512} 0)"><path fill="${COLORS.green}" fill-rule="evenodd" d="${BODY}"/>`+(e==='default'?eyes(e,COLORS.forest):`<g transform="rotate(-12 236 238)" stroke="${COLORS.forest}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none">${CENTERLINES[e].map(p=>`<path d="M${p.map(x=>x.join(' ')).join('L')}"/>`).join('')}</g>`)+`</g>`).join(''),1536,512,'Clovers Agent editable expression strokes','0 -16 1536 512'));
 write('08-source/identity-artboard.svg',artboard());
 const ov=overview();write('08-source/brand-overview.svg',ov);png('brand-overview.png',ov,1800);
 for(const kind of ['og','banner']) {const s=social(kind);write(`09-social/${kind}.svg`,s);png(`09-social/${kind}.png`,s,kind==='og'?1200:1500);}
 // UI previews consume only local asset paths; no CDN, network, or fetch.
 write('preview-data.js',`window.CLOVERS_PREVIEW=${JSON.stringify({expressions:EXPRESSIONS,labels:CN,styles:STYLES,colors:COLORS,marks:Object.fromEntries(EXPRESSIONS.map(e=>[e,Object.fromEntries(Object.keys(STYLES).map(st=>[st,svg(mark(e,st))]))]))})};\n`);
 let done=0;
 const workers=Array.from({length:4},async()=>{while(jobs.length){await jobs.shift()();done++;}});
 await Promise.all(workers);
 console.log(`Created SVG sources and ${done} PNG exports in ${ROOT}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
