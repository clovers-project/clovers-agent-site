(() => {
  const data=window.CLOVERS_PREVIEW;
  const state={expression:'default',background:'light',limit:18};
  const captions={default:'随时回应。',coding:'正在编写。',thinking:'认真推敲。'};
  function updateLogo(){
    const style=state.background==='dark'?'reverse':'primary';
    const root=document.getElementById('live-logo');
    root.innerHTML=data.marks[state.expression][style];
    root.querySelector('title').textContent=data.labels[state.expression];
    document.getElementById('logo-stage').dataset.background=state.background;
    document.getElementById('stage-caption').textContent=captions[state.expression];
    document.getElementById('stage-index').textContent=`0${data.expressions.indexOf(state.expression)+1} / 03`;
    document.getElementById('current-download').href=`02-icons/svg/${state.expression}-${style}.svg`;
  }
  document.querySelectorAll('button[data-expression]').forEach(button=>button.addEventListener('click',()=>{
    state.expression=button.dataset.expression;
    document.querySelectorAll('button[data-expression]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    updateLogo();
  }));
  document.querySelectorAll('button[data-background]').forEach(button=>button.addEventListener('click',()=>{
    state.background=button.dataset.background;
    document.querySelectorAll('button[data-background]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    updateLogo();
  }));
  const paletteNames={green:'幸运绿 / 主标志',forest:'深叶绿 / 眼睛与文字',mint:'嫩叶绿 / 深底扩展',paper:'纸白 / 浅色背景',night:'夜林绿 / 深色背景'};
  for(const [key,label] of Object.entries(paletteNames)){
    const button=document.createElement('button');button.className='palette-item';
    button.innerHTML=`<span class="palette-color" style="background:${data.colors[key]}"></span><strong>${data.colors[key]}</strong><small>${label} · 点击复制</small>`;
    button.setAttribute('aria-label',`复制${label} ${data.colors[key]}`);
    button.addEventListener('click',async()=>{
      const hex=data.colors[key];let success=false;
      try{if(navigator.clipboard){await navigator.clipboard.writeText(hex);success=true;}}catch{}
      if(!success){const field=document.createElement('textarea');field.value=hex;field.style.position='fixed';field.style.left='-9999px';document.body.append(field);field.select();success=document.execCommand('copy');field.remove();}
      document.getElementById('copy-feedback').textContent=success?`已复制 ${hex}`:`色值：${hex}，可直接选择复制。`;
    });
    document.getElementById('palette-grid').append(button);
  }
  document.getElementById('replay-animation').addEventListener('click',()=>{
    const old=document.getElementById('once-preview'),fresh=old.cloneNode();
    fresh.src=`05-animation/svg/once-thinking-reverse.svg?replay=${Date.now()}`;old.replaceWith(fresh);
  });
  const assets=[];
  const add=(category,file,detail='')=>assets.push({category,file,detail});
  for(const expression of data.expressions){
    for(const style of Object.keys(data.styles)){
      add('icons',`02-icons/svg/${expression}-${style}.svg`,'矢量 / 透明');
      for(const size of [32,64,128,256,512,1024])add('icons',`02-icons/png/${expression}-${style}-${size}.png`,`${size} × ${size}`);
    }
    for(const theme of ['light','dark','green']){
      add('avatars',`03-avatars/svg/${expression}-${theme}.svg`,'矢量 / 固定底色');
      for(const size of [128,512,1024])add('avatars',`03-avatars/png/${expression}-${theme}-${size}.png`,`${size} × ${size}`);
    }
  }
  for(const shape of ['horizontal','signature','stacked'])for(const style of ['primary','reverse','black'])for(const format of ['svg','png'])add('wordmarks',`04-wordmarks/${format}/${shape}-${style}.${format}`,'已转曲');
  for(const motion of ['loop','once-coding','once-thinking']){
    for(const style of ['primary','reverse','white'])add('animation',`05-animation/svg/${motion}-${style}.svg`,motion==='loop'?'6.4 秒循环':'1.2 秒单次');
    for(const format of ['webp','gif'])add('animation',`05-animation/previews/clovers-${motion}.${format}`,format==='gif'?'纸白底':'透明背景');
  }
  for(const file of ['favicon.svg','favicon.ico','app-icon-180.png','app-icon-192.png','app-icon-512.png','app-icon-maskable-512.png','site.webmanifest','clovers-sprite.svg','clovers-logo.js','integration-example.html'])add('web',`06-web/${file}`);
  for(const name of ['og','banner'])for(const format of ['svg','png'])add('social',`09-social/${name}.${format}`,name==='og'?'1200 × 630':'1500 × 500');
  for(const file of ['07-guidelines/Clovers-Agent-Brand-Guide-v2.pdf','07-guidelines/Brand-Guidelines.zh-CN.md','07-guidelines/Web-Usage.zh-CN.md','08-source/identity-artboard.svg','08-source/expressions-editable.svg','08-source/palette.json','08-source/brand-tokens.css','08-source/geometry.json','08-source/build-assets.cjs','08-source/build-deliverables.py','ASSET-MANIFEST.json','SHA256SUMS.txt'])add('source',file);
  function renderLibrary(){
    const category=document.getElementById('asset-category').value,query=document.getElementById('asset-search').value.trim().toLowerCase();
    const matches=assets.filter(a=>(category==='all'||category===a.category)&&`${a.file} ${a.detail}`.toLowerCase().includes(query));
    const list=document.getElementById('asset-list');list.replaceChildren();
    for(const asset of matches.slice(0,state.limit)){
      const row=document.createElement('div');row.className='asset-row';
      const extension=asset.file.split('.').pop().toUpperCase();
      row.innerHTML=`<span class="asset-tag">${extension}</span><span class="asset-name">${asset.file}</span><span class="asset-size">${asset.detail}</span><a href="${asset.file}" download aria-label="下载 ${asset.file}">下载 ↗</a>`;
      list.append(row);
    }
    if(!matches.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='没有匹配的资源，请尝试其他关键词。';list.append(empty);}
    document.getElementById('result-count').textContent=`${matches.length} 个资源`;
    document.getElementById('load-more').hidden=state.limit>=matches.length;
  }
  for(const id of ['asset-category','asset-search'])document.getElementById(id).addEventListener(id==='asset-category'?'change':'input',()=>{state.limit=18;renderLibrary();});
  document.getElementById('load-more').addEventListener('click',()=>{state.limit+=36;renderLibrary();});
  updateLogo();renderLibrary();
})();
