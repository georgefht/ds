/* Read-only inspection, independent of product actions. */
(() => {
  'use strict';
  const data=UIKitFoundations,rules=TaskInspectorRules,extra=TaskInspectorExtras;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $=id=>document.getElementById(id),px=v=>Math.round(parseFloat(v)*100)/100;
  const svg=name=>`<svg class="icon icon-small" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const panel=document.createElement('section');panel.id='task-inspector';panel.className='uk-component inspector-panel';panel.dataset.inspectorUi='';panel.setAttribute('popover','manual');panel.setAttribute('aria-label','Инспектор дизайн-системы');
  panel.innerHTML=`<div class="inspector-panel__heading"><h2>Инспектор</h2><button class="icon-button clear-button" type="button" id="inspector-close" aria-label="Закрыть инспектор"><img src="assets/icons/865ea.svg" alt="" width="18" height="18"></button></div><div class="inspector-controls"><div id="inspect-font-control"></div><div id="inspect-space-control"></div><div id="inspect-component-control"></div><div id="inspect-color-control"></div><p class="inspector-help" id="inspector-help">Включите <strong>«Шрифты»</strong> и выберите любой текст на странице.</p><div class="inspector-legend" id="inspector-legend" hidden><span><i></i>Внутренний отступ</span><span><i></i>Между элементами</span></div></div><div class="inspector-reading inspector-extra-reading" id="inspector-component-reading" hidden></div><div class="inspector-reading inspector-extra-reading" id="inspector-color-reading" hidden></div><div class="inspector-reading" id="inspector-reading"><p class="inspector-empty">Здесь будут размер, интервал строки, насыщенность, токен и стиль выбранного текста.</p></div><details class="inspector-style-list" id="inspector-style-list"><summary>Все шрифты на странице <span id="inspector-style-count"></span></summary><div class="inspector-style-list__items" id="inspector-style-items"></div></details><details class="inspector-style-list" id="inspector-component-list"><summary>Все компоненты на странице <span id="inspector-component-count"></span></summary><div class="inspector-style-list__items" id="inspector-component-items"></div></details><div class="inspector-footer"><button class="ui-button" data-size="s" type="button" id="inspector-reset">Всё выключить</button><span class="inspector-copy-status" id="inspector-copy-status" role="status" aria-live="polite"></span></div>`;
  const overlay=document.createElement('div');overlay.id='inspector-overlay';overlay.className='inspector-overlay';overlay.dataset.inspectorUi='';overlay.setAttribute('popover','manual');overlay.setAttribute('aria-hidden','true');overlay.innerHTML='<div class="inspector-component-layer" id="inspector-component-layer"></div><div class="inspector-color-layer" id="inspector-color-layer"></div><div class="inspector-spacing-layer" id="inspector-spacing-layer"></div><div class="inspector-text-layer" id="inspector-text-layer"></div>';
  document.body.append(overlay,panel);
  const launch=document.createElement('button');launch.type='button';launch.className='inspector-launch';launch.id='inspector-launch';launch.dataset.inspectorUi='';launch.setAttribute('aria-expanded','false');launch.setAttribute('aria-controls',panel.id);launch.innerHTML=svg('info')+'<span>Инспектор</span>';
  const tools=document.createElement('div');tools.className='breadcrumb-tools';const breadcrumb=document.querySelector('.breadcrumb');tools.append(launch,breadcrumb.querySelector('a'));breadcrumb.append(tools);
  const fonts=new UIKitComponents.Toggle($('inspect-font-control'),{label:'Шрифты: выбрать текст',position:'right'});
  const spaces=new UIKitComponents.Toggle($('inspect-space-control'),{label:'Вертикальные отступы',position:'right'});
  const components=new UIKitComponents.Toggle($('inspect-component-control'),{label:'Компоненты: показать состав',position:'right'});
  const colors=new UIKitComponents.Toggle($('inspect-color-control'),{label:'Цвета: выбрать участок',position:'right'});
  let selectedComponent=null,selectedColor=null,hoveredElement=null,componentLinks=[],componentInventory=[],transitionUntil=0;
  const picking=()=>fonts.checked||components.checked||colors.checked;
  let selected=null,hovered=null,scheduled=false,open=false,inventory=[],measurements=[],copyTimer,layerParent=document.body;
  const excluded=el=>!el||el.closest('[data-inspector-ui],svg,script,style,noscript,[hidden],[inert]');
  function visible(el) {if(excluded(el)||!el.isConnected)return false;const r=el.getBoundingClientRect();if(!r.width||!r.height)return false;return el.checkVisibility?el.checkVisibility({opacityProperty:true,visibilityProperty:true}):getComputedStyle(el).visibility!=='hidden';}
  function text(el) {return (el.matches('input,textarea')?el.value||el.placeholder||el.getAttribute('aria-label'):el.textContent).replace(/\s+/g,' ').trim();}
  function textElements() {
    const items=new Set(),walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    for(let node=walker.nextNode();node;node=walker.nextNode()){if(node.textContent.trim()&&visible(node.parentElement))items.add(node.parentElement);}
    document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]),textarea').forEach(el=>{if(visible(el))items.add(el);});return [...items];
  }
  function splitSelectors(value) {
    const output=[];let depth=0,start=0;
    for(let i=0;i<value.length;i++){const c=value[i];if(c==='('||c==='[')depth++;else if(c===')'||c===']')depth--;else if(c===','&&!depth){output.push(value.slice(start,i).trim());start=i+1;}}
    output.push(value.slice(start).trim());return output;
  }
  function specificity(selector) {
    let additional=0;
    // Functional selector arguments contribute their most specific branch.
    for(let match; (match=/:(is|not|has|where)\(/.exec(selector));) {
      const start=match.index,endStart=start+match[0].length;let end=endStart,depth=1;
      while(end<selector.length&&depth){if(selector[end]==='(')depth++;if(selector[end]===')')depth--;end++;}
      if(match[1]!=='where')additional+=Math.max(...splitSelectors(selector.slice(endStart,end-1)).map(specificity));selector=selector.slice(0,start)+' '+selector.slice(end);
    }
    const ids=(selector.match(/#[\w-]+/g)||[]).length;
    const attrs=(selector.match(/\[[^\]]*\]/g)||[]).length;selector=selector.replace(/\[[^\]]*\]/g,'');
    const classes=(selector.match(/\.[\w-]+|:(?!:)[\w-]+(?:\([^)]*\))?/g)||[]).length;
    selector=selector.replace(/#[\w-]+|\.[\w-]+|:{1,2}[\w-]+(?:\([^)]*\))?/g,' ');
    const tags=(selector.match(/(?:^|[\s>+~])[a-zA-Z][\w-]*/g)||[]).length;return additional+ids*10000+(attrs+classes)*100+tags;
  }
  const indexed=rules.map(r=>({...r,selectors:splitSelectors(r.selector).map(selector=>({selector,weight:specificity(selector)}))}));
  function winningFont(el) {
    let winner=null;
    for(const rule of indexed){const value=rule.declarations.font;if(!value||rule.media.some(q=>!matchMedia(q).matches))continue;
      const matching=rule.selectors.filter(s=>{try{return el.matches(s.selector);}catch{return false;}});if(!matching.length)continue;
      const important=/!important\s*$/.test(value),weight=Math.max(...matching.map(s=>s.weight));
      const candidate={...rule,value:value.replace(/\s*!important\s*$/,''),important,weight};
      if(!winner||Number(important)>Number(winner.important)||important===winner.important&&(weight>winner.weight||weight===winner.weight&&rule.order>winner.order))winner=candidate;
    }
    if(el.style.font){const important=el.style.getPropertyPriority('font')==='important';if(!winner||important||!winner.important)winner={value:el.style.font,source:'Атрибут style',selector:el.tagName.toLowerCase(),important,weight:1000000};}
    return winner;
  }
  function winningProperty(el,names) {
    if(typeof names==='string')names=[names];let winner=null;
    const accept=(candidate)=>{if(!winner||Number(candidate.important)>Number(winner.important)||candidate.important===winner.important&&(candidate.weight>winner.weight||candidate.weight===winner.weight&&candidate.order>winner.order))winner=candidate;};
    for(const rule of indexed){if(rule.media.some(q=>!matchMedia(q).matches))continue;const entries=Object.entries(rule.declarations).filter(([key])=>names.includes(key));if(!entries.length)continue;
      const matching=rule.selectors.filter(s=>{try{return el.matches(s.selector);}catch{return false;}});if(!matching.length)continue;const weight=Math.max(...matching.map(s=>s.weight));
      entries.forEach(([property,value],i)=>accept({...rule,property,value:value.replace(/\s*!important\s*$/,''),important:/!important\s*$/.test(value),weight,order:rule.order*1000+i}));
    }
    [...el.style].forEach((property,i)=>{if(names.includes(property))accept({property,value:el.style.getPropertyValue(property),source:'Атрибут style',selector:el.tagName.toLowerCase(),important:el.style.getPropertyPriority(property)==='important',weight:1000000,order:100000000+i});});return winner;
  }
  function fontSource(el) {
    for(let node=el;node;node=node.parentElement){const source=winningFont(node);if(!source||['inherit','unset'].includes(source.value))continue;
      const token=source.value.match(/var\((--ds-type-[\w-]+)\)/)?.[1];return {...source,token:token||null,inherited:node!==el};
    }
    return null;
  }
  function metrics(el) {
    const s=getComputedStyle(el);return {family:s.fontFamily,size:px(s.fontSize),line:s.lineHeight==='normal'?'normal':px(s.lineHeight),weight:Number(s.fontWeight),tracking:s.letterSpacing==='normal'?0:px(s.letterSpacing),style:s.fontStyle,color:s.color,stretch:s.fontStretch,variation:s.fontVariationSettings,decoration:s.textDecorationLine,case:s.textTransform};
  }
  function matchStyle(m) {return data.typography.find(t=>m.family.includes(t.fontName.family)&&t.fontSize===m.size&&t.weight===m.weight&&Math.abs(t.lineHeightPx-m.line)<.1&&Math.abs(t.letterSpacingPx-m.tracking)<.02&&m.style==='normal');}
  function baseStyle(m,source) {return data.typography.find(t=>t.cssVariable===source?.token)||data.typography.find(t=>t.fontSize===m.size&&t.weight===m.weight)||null;}
  const weights={100:'Thin',200:'Extra Light',300:'Light',400:'Regular',500:'Medium',600:'Semi Bold',700:'Bold',800:'Extra Bold',900:'Black'};
  const sizeValue=v=>v==='normal'?'Автоматически':v+' px';
  function readFont(el) {
    const m=metrics(el),source=fontSource(el),exact=matchStyle(m),base=baseStyle(m,source),bound=data.typography.find(t=>t.cssVariable===source?.token),style=bound||exact||base;
    const differences=style?[m.size!==style.fontSize?`размер ${m.size} вместо ${style.fontSize} px`:null,m.line!==style.lineHeightPx?`строка ${sizeValue(m.line)} вместо ${style.lineHeightPx} px`:null,m.weight!==style.weight?`насыщенность ${m.weight} вместо ${style.weight}`:null,Math.abs(m.tracking-style.letterSpacingPx)>.02?`межбуквенный интервал ${m.tracking} вместо ${style.letterSpacingPx} px`:null].filter(Boolean):[];
    return {m,source,exact,base,bound,style,differences};
  }
  const row=(label,value)=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
  function showReading(el) {
    if(!el||!visible(el)){$('inspector-reading').innerHTML='<p class="inspector-empty">Выберите текст на странице или стиль из списка ниже.</p>';return;}
    const {m,source,exact,bound,style,differences}=readFont(el);
    const styleTitle=style?style.name:'Индивидуальные параметры';
    const association=bound?'Токен применён':exact?'Совпадает со стилем':'Базовый / ближайший стиль';
    $('inspector-reading').innerHTML=`<p class="inspector-sample">${esc(text(el).slice(0,180))}</p><div class="inspector-style-title">${esc(styleTitle)}<span class="inspector-label">${association}</span></div>${style?`<button class="inspector-token" type="button" data-inspector-copy="${style.cssVariable}" aria-label="Скопировать токен ${style.name}">${esc(style.cssVariable)}</button>`:''}<dl class="inspector-dl">${row('Семейство',m.family)}${row('Размер',sizeValue(m.size))}${row('Высота строки',sizeValue(m.line))}${row('Насыщенность',m.weight+' · '+(weights[m.weight]||'Variable'))}${row('Начертание',m.style==='normal'?'Прямое':m.style)}${row('Межбуквенный интервал',sizeValue(m.tracking))}${row('Цвет текста',m.color)}</dl>${differences.length?`<p class="inspector-note">Локальные настройки: ${esc(differences.join('; '))}.</p>`:!bound&&exact?'<p class="inspector-source">Значения совпадают с Figma. В CSS параметры заданы напрямую, без привязки к текстовому токену.</p>':!style?'<p class="inspector-note">В Figma нет текстового стиля с такими параметрами.</p>':''}<details class="inspector-more"><summary>Стиль Figma и источник</summary>${style?`<dl class="inspector-dl">${row('Название',style.name)}${row('Размер / строка',style.fontSize+' / '+style.lineHeightPx+' px')}${row('Начертание Figma',style.fontName.style)}${row('Интервал абзаца Figma',style.paragraphSpacing+' px')}${row('ID стиля',style.id)}</dl><a href="https://www.figma.com/design/${data.source.fileKey}/?node-id=${data.source.typographyNodeId.replace(':','-')}" target="_blank" rel="noopener">Типографика в Figma ↗</a>`:''}${source?`<p class="inspector-source">${esc(source.source)}<br><code>${esc(source.selector)}</code><br><code>font: ${esc(source.value)}</code>${source.inherited?'<br>Шрифт наследуется от родительского элемента.':''}</p>`:''}<dl class="inspector-dl">${row('Преобразование текста',m.case)}${row('Декорация',m.decoration)}${row('Ширина шрифта',m.stretch)}${row('Вариативные оси',m.variation)}</dl></details>`;
  }
  function updateInventory() {
    const groups=new Map();
    for(const el of textElements()){const info=readFont(el),m=info.m;if(m.size<=0)continue;const token=info.bound?.cssVariable||info.exact?.cssVariable||'',key=[m.family,m.size,m.line,m.weight,m.tracking,m.style,token].join('|');
      if(!groups.has(key))groups.set(key,{el,count:0,...info});groups.get(key).count++;
    }
    inventory=[...groups.values()];$('inspector-style-count').textContent='· '+inventory.length;
    $('inspector-style-items').innerHTML=inventory.map((item,i)=>`<button type="button" class="inspector-style-item" data-inspector-item="${i}"><span>${esc(item.bound?.name||item.exact?.name||'Локальный стиль')}<small>${item.m.size} / ${sizeValue(item.m.line)} · ${item.m.weight}</small></span><span>${item.count}</span></button>`).join('');
  }
  function clippedRect(el,rect) {
    let left=Math.max(0,rect.left),right=Math.min(innerWidth,rect.right),top=Math.max(0,rect.top),bottom=Math.min(innerHeight,rect.bottom);
    for(let ancestor=el.parentElement;ancestor&&ancestor!==document.body;ancestor=ancestor.parentElement){const s=getComputedStyle(ancestor),r=ancestor.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(s.overflowX)){left=Math.max(left,r.left);right=Math.min(right,r.right);}if(/auto|scroll|hidden|clip/.test(s.overflowY)){top=Math.max(top,r.top);bottom=Math.min(bottom,r.bottom);}}
    return {left,right,top,bottom,width:right-left,height:bottom-top};
  }
  function textRects(el) {
    if(!visible(el))return [];
    if(el.matches('input,textarea'))return [clippedRect(el,el.getBoundingClientRect())];
    const rects=[];for(const node of el.childNodes){if(node.nodeType!==Node.TEXT_NODE||!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);rects.push(...[...range.getClientRects()].map(r=>clippedRect(el,r)));}
    return rects.filter(r=>r.width>0&&r.height>0);
  }
  function drawText() {
    if(!fonts.checked){$('inspector-text-layer').replaceChildren();return;}
    const items=[];for(const [el,hover] of [[selected,false],[hovered,true]]){if(!el||hover&&el===selected)continue;const {m,style}=readFont(el);textRects(el).forEach((r,i)=>items.push(`<div class="inspector-text-box" data-hover="${hover}" style="left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px">${!hover&&i===0?`<span class="inspector-text-caption" style="${r.top<24?'top:100%;':''}">${esc(style?.name||'Локальный стиль')} · ${m.size} px</span>`:''}</div>`));}
    $('inspector-text-layer').innerHTML=items.join('');
  }
  const spacingToken=value=>data.spacing.find(s=>Math.abs(s.value-value)<.1);
  function drawSpacing() {
    if(!spaces.checked){$('inspector-spacing-layer').replaceChildren();return;}
    measurements=[];const seen=new Set();
    function add(el,x,y,width,height,value,kind,description) {
      if(value<1||width<8||height<1)return;
      const rect=clippedRect(el,{left:x,right:x+width,top:y,bottom:y+height}),key=[kind,Math.round(rect.left),Math.round(rect.top),Math.round(rect.width),Math.round(rect.height)].join(':');
      if(rect.width<8||rect.height<1||seen.has(key))return;seen.add(key);
      const token=spacingToken(value);measurements.push({x:rect.left,y:rect.top,width:rect.width,height:rect.height,value:px(value),kind,token:token?.cssVariable||null,description,element:el.tagName.toLowerCase()+(el.id?'#'+el.id:'.'+el.className)});
    }
    for(const el of document.body.querySelectorAll('*')) {
      if(!visible(el)||el.matches('input,textarea,img,br')||el.closest('.uk-state-stack'))continue;
      const box=el.getBoundingClientRect();if(box.bottom<0||box.top>innerHeight)continue;const s=getComputedStyle(el),top=px(s.paddingTop),bottom=px(s.paddingBottom),borderTop=px(s.borderTopWidth),borderBottom=px(s.borderBottomWidth);
      if(s.display!=='inline'&&box.height>=top+bottom) {
        add(el,box.left,box.top+borderTop,box.width,top,top,'padding','Внутренний отступ сверху');
        add(el,box.left,box.bottom-borderBottom-bottom,box.width,bottom,bottom,'padding','Внутренний отступ снизу');
      }
      const children=[...el.children].filter(child=>visible(child)&&!['absolute','fixed'].includes(getComputedStyle(child).position)).map(child=>({el:child,box:child.getBoundingClientRect()}));
      for(const current of children) {
        const earlier=children.filter(prev=>prev!==current&&prev.box.bottom<=current.box.top+.5&&Math.min(prev.box.right,current.box.right)-Math.max(prev.box.left,current.box.left)>2);
        if(!earlier.length)continue;const previous=earlier.reduce((a,b)=>a.box.bottom>b.box.bottom?a:b),gap=current.box.top-previous.box.bottom;
        const left=Math.max(previous.box.left,current.box.left),right=Math.min(previous.box.right,current.box.right);
        add(el,left,previous.box.bottom,right-left,gap,gap,'gap','Расстояние между элементами');
      }
    }
    $('inspector-spacing-layer').innerHTML=measurements.map(m=>`<div class="inspector-band" data-kind="${m.kind}" data-value="${m.value}" data-token="${esc(m.token||'')}" style="left:${m.x}px;top:${m.y}px;width:${m.width}px;height:${m.height}px"><span class="inspector-measure">${m.value} px${m.width>=120?` <small>${m.token?esc(m.token.replace('--ds-','')):'без токена'}</small>`:''}</span></div>`).join('');
    overlay.dataset.measurementCount=measurements.length;
  }
  function replaceReading(id,html) {
    const node=$(id);if(node.dataset.content===html)return;
    const expanded=[...node.querySelectorAll('details')].map(d=>d.open);node.innerHTML=html;node.dataset.content=html;
    node.querySelectorAll('details').forEach((d,i)=>{if(expanded[i]!==undefined)d.open=expanded[i];});
  }
  function componentLink(item,depth=0) {
    const index=componentLinks.push(item.el)-1;
    return `<button type="button" class="inspector-component-item" data-inspector-component="${index}" style="--inspect-depth:${Math.min(depth,4)}" ${item.el===selectedComponent?'aria-current="true"':''}><strong>${esc(item.name)}</strong><small>${esc(item.label.slice(0,70))}</small></button>`;
  }
  function updateComponentInventory() {
    const groups=new Map();for(const item of extra.elements()){const key=extra.groupKey(item);if(!groups.has(key))groups.set(key,{name:item.name,source:item.source,items:[]});groups.get(key).items.push(item);}
    componentInventory=[...groups.values()];$('inspector-component-count').textContent='· '+componentInventory.length;
    const html=componentInventory.map((entry,i)=>`<button type="button" class="inspector-style-item" data-inspector-component-group="${i}"><span>${esc(entry.name)}<small>${esc(entry.source)}</small></span><span>${entry.items.length}</span></button>`).join('');
    replaceReading('inspector-component-items',html);
  }
  function showComponent() {
    if(!selectedComponent||!extra.visible(selectedComponent)){selectedComponent=null;replaceReading('inspector-component-reading','<h3 class="inspector-section-title">Компоненты</h3><p class="inspector-empty">Границы компонентов подсвечены. Кликните по контролу, чтобы увидеть его состав и другие экземпляры.</p>');return;}
    const info=extra.composition(selectedComponent),item=info.selected,r=selectedComponent.getBoundingClientRect(),style=getComputedStyle(selectedComponent);componentLinks=[];
    const parents=info.ancestors.map(i=>componentLink(i)).join('');
    const children=info.children.map(i=>{let depth=1;for(let node=i.el.parentElement;node&&node!==selectedComponent;node=node.parentElement)if(extra.describe(node))depth++;return componentLink(i,depth);}).join('');
    const file=item.name==='Icon'?(selectedComponent.getAttribute('src')||selectedComponent.querySelector('use')?.getAttribute('href')):item.file;
    const html=`<h3 class="inspector-section-title">${esc(item.name)}</h3><p class="inspector-source">${esc(item.source)}${file?'<br>'+esc(file):''}</p><p class="inspector-sample">${esc(item.label)}</p><dl class="inspector-dl">${row('Вариант',item.variant||'По умолчанию')}${row('Размер',px(r.width)+' × '+px(r.height)+' px')}${row('Скругление',style.borderRadius)}${row('Экземпляров на странице',info.related.length)}</dl><p class="inspector-source">Фиолетовый — все компоненты. Бирюзовый — выбранный компонент и его состав. Пунктир — другие экземпляры того же типа.</p>${parents?'<details class="inspector-more"><summary>Входит в</summary><div class="inspector-component-tree">'+parents+'</div></details>':''}<details class="inspector-more" open><summary>Состав · ${info.children.length+1}</summary><div class="inspector-component-tree">${componentLink(item)}${children}</div></details>`;
    replaceReading('inspector-component-reading',html);
    if(!children)$('inspector-component-reading').querySelector('details:last-child').open=true;
  }
  function drawExtras() {
    $('inspector-component-reading').hidden=!components.checked;$('inspector-color-reading').hidden=!colors.checked;
    $('inspector-reading').hidden=!fonts.checked&&(components.checked||colors.checked);
    const boxes=[],all=components.checked?extra.elements():[],related=selectedComponent?extra.describe(selectedComponent):null,hoveredComponent=components.checked?extra.nearest(hoveredElement)?.el:null;
    for(const item of all) {
      const r=clippedRect(item.el,item.el.getBoundingClientRect());if(r.width<2||r.height<2)continue;
      const selected=item.el===selectedComponent,child=selectedComponent?.contains(item.el)&&!selected,same=related&&extra.groupKey(item)===extra.groupKey(related),hover=hoveredComponent===item.el;
      boxes.push(`<div class="inspector-component-box" data-part="${item.part}" data-selected="${selected}" data-child="${!!child}" data-related="${!!same}" data-hover="${hover}" style="left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px">${selected||hover?`<span class="inspector-component-caption" style="${r.top<24?'top:100%;':''}">${esc(item.name)}</span>`:''}</div>`);
    }
    $('inspector-component-layer').innerHTML=boxes.join('');
    const colorBoxes=[];if(colors.checked)for(const [el,hover] of [[selectedColor,false],[hoveredElement,true]]){if(!el||!extra.visible(el)||hover&&el===selectedColor)continue;const r=clippedRect(el,el.getBoundingClientRect());if(r.width>0&&r.height>0)colorBoxes.push(`<div class="inspector-color-box" data-hover="${hover}" style="left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px"></div>`);}
    $('inspector-color-layer').innerHTML=colorBoxes.join('');
    if(open&&components.checked)showComponent();
    if(open&&colors.checked){if(selectedColor&&extra.visible(selectedColor))replaceReading('inspector-color-reading',extra.colorsHTML(selectedColor,winningProperty));else {selectedColor=null;replaceReading('inspector-color-reading','<h3 class="inspector-section-title">Цвета</h3><p class="inspector-empty">Кликните по тексту, иконке, рамке или свободному участку фона. Здесь появятся HEX и точные токены палитры.</p>');}}
  }
  function syncLayers() {
    const parent=document.querySelector('dialog[open]')||document.body;
    if(parent!==layerParent){if(panel.matches(':popover-open'))panel.hidePopover();if(overlay.matches(':popover-open'))overlay.hidePopover();parent.append(overlay,panel);layerParent=parent;}
    const active=picking()||spaces.checked;if(active&&!overlay.matches(':popover-open')){overlay.showPopover();if(open&&panel.matches(':popover-open'))panel.hidePopover();}else if(!active&&overlay.matches(':popover-open'))overlay.hidePopover();
    if(open&&!panel.matches(':popover-open'))panel.showPopover();else if(!open&&panel.matches(':popover-open'))panel.hidePopover();
    launch.setAttribute('aria-expanded',String(open));launch.dataset.enabled=String(active);document.body.dataset.inspectFonts=String(fonts.checked);document.body.dataset.inspectComponents=String(components.checked);document.body.dataset.inspectColors=String(colors.checked);$('inspector-legend').hidden=!spaces.checked;
  }
  function update() {
    scheduled=false;syncLayers();if(selected&&!selected.isConnected){selected=null;showReading(null);}drawSpacing();drawText();drawExtras();if(open){if(selected)showReading(selected);if($('inspector-style-list').open)updateInventory();if($('inspector-component-list').open)updateComponentInventory();}if(performance.now()<transitionUntil&&picking())schedule();
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(update);}
  function openPanel(focus=false) {open=true;syncLayers();updateInventory();if(focus)fonts.input.focus();schedule();}
  function setModes(){if(!fonts.checked)hovered=null;$('inspector-help').innerHTML=picking()?'Кликните по элементу, чтобы зафиксировать его параметры. Выключите режимы выбора, чтобы пользоваться интерфейсом.':'Выберите режим инспектора. Отступы можно показывать независимо.';syncLayers();schedule();}
  [fonts,spaces,components,colors].forEach(toggle=>toggle.root.addEventListener('ui:change',setModes));
  launch.addEventListener('click',()=>{if(open){open=false;syncLayers();}else openPanel(true);});$('inspector-close').addEventListener('click',()=>{open=false;syncLayers();launch.focus({preventScroll:true});});
  $('inspector-reset').addEventListener('click',()=>{fonts.setChecked(false);spaces.setChecked(false);components.setChecked(false);colors.setChecked(false);selectedComponent=selectedColor=hoveredElement=null;selected=hovered=null;showReading(null);setModes();});
  function targetText(event) {
    let el=event.target instanceof Element?event.target:null;if(excluded(el))return null;
    if(el.matches('input:not([type="checkbox"]):not([type="radio"]),textarea'))return visible(el)?el:null;
    if(document.caretRangeFromPoint&&Number.isFinite(event.clientX)){const range=document.caretRangeFromPoint(event.clientX,event.clientY),node=range?.startContainer,owner=node?.nodeType===Node.TEXT_NODE?node.parentElement:null;if(owner&&el.contains(owner)&&visible(owner)&&text(owner))return owner;}
    if([...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())&&visible(el))return el;
    const parent=el.closest('button,a,label');if(parent&&visible(parent)&&text(parent)){const child=[...parent.querySelectorAll('span')].find(c=>visible(c)&&text(c));return child||parent;}return null;
  }
  function generalTarget(event) {const target=event.target instanceof Element?event.target:null;return target?.closest('svg.icon')||target;}
  function selectTarget(event) {
    const el=generalTarget(event);if(!el||el.closest('[data-inspector-ui]'))return;
    if(fonts.checked){const candidate=targetText(event);if(candidate){selected=candidate;showReading(candidate);}}
    if(components.checked)selectedComponent=extra.nearest(el)?.el||null;
    if(colors.checked&&extra.visible(el))selectedColor=el;
    transitionUntil=performance.now()+200;openPanel();schedule();
  }
  document.addEventListener('pointermove',e=>{if(!picking())return;const next=fonts.checked?targetText(e):null,element=generalTarget(e);if(next!==hovered||element!==hoveredElement){hovered=next;hoveredElement=element;transitionUntil=performance.now()+200;schedule();}},{passive:true});
  document.addEventListener('pointerdown',e=>{if(picking()&&!e.target.closest('[data-inspector-ui]')){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('click',e=>{if(!picking()||e.target.closest('[data-inspector-ui]'))return;e.preventDefault();e.stopImmediatePropagation();selectTarget(e);},true);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&picking()){e.preventDefault();e.stopImmediatePropagation();fonts.setChecked(false);components.setChecked(false);colors.setChecked(false);hovered=hoveredElement=null;setModes();return;}
    if(e.target.closest('[data-inspector-ui]'))return;
    if(picking()&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();selectTarget(e);}
  },true);
  panel.addEventListener('click',async e=>{
    const component=e.target.closest('[data-inspector-component]');if(component){const el=componentLinks[Number(component.dataset.inspectorComponent)];if(el&&extra.visible(el)){selectedComponent=el;if(colors.checked)selectedColor=el;el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});schedule();}return;}
    const group=e.target.closest('[data-inspector-component-group]');if(group){const entry=componentInventory[Number(group.dataset.inspectorComponentGroup)];if(entry){selectedComponent=entry.items[0].el;components.setChecked(true);setModes();selectedComponent.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});schedule();}return;}
    const item=e.target.closest('[data-inspector-item]');if(item){const entry=inventory[Number(item.dataset.inspectorItem)];if(entry&&visible(entry.el)){selected=entry.el;fonts.setChecked(true);setModes();entry.el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});showReading(selected);schedule();}return;}
    const copy=e.target.closest('[data-inspector-copy]');if(!copy)return;let success=false;
    try{await navigator.clipboard.writeText(copy.dataset.inspectorCopy);success=true;}catch{const area=document.createElement('textarea');area.value=copy.dataset.inspectorCopy;area.style.cssText='position:fixed;left:-9999px';panel.append(area);area.select();success=document.execCommand('copy');area.remove();copy.focus({preventScroll:true});}
    $('inspector-copy-status').textContent=success?'Токен скопирован':'Выделите токен для копирования';clearTimeout(copyTimer);copyTimer=setTimeout(()=>$('inspector-copy-status').textContent='',2600);
  });
  $('inspector-style-list').addEventListener('toggle',()=>{if($('inspector-style-list').open)updateInventory();});
  $('inspector-component-list').addEventListener('toggle',()=>{if($('inspector-component-list').open)updateComponentInventory();});
  document.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);document.fonts.ready.then(schedule);
  new MutationObserver(records=>{if(records.some(r=>!(r.target instanceof Element)||!r.target.closest('[data-inspector-ui]')))schedule();}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden','open','data-open','data-state','data-floating','inert']});
  const resize=new ResizeObserver(schedule);resize.observe(document.getElementById('main-content'));resize.observe(document.querySelector('.config-modal'));
  window.TaskInspector={get componentMode(){return components.checked;},get colorMode(){return colors.checked;},get selectedComponent(){return selectedComponent;},get selectedColor(){return selectedColor;},get components(){return extra.elements();},readColors(el){return extra.readColors(el,winningProperty);},get fontMode(){return fonts.checked;},get spacingMode(){return spaces.checked;},get selected(){return selected;},get measurements(){return measurements;},inspect(el){selected=el;fonts.setChecked(true);setModes();openPanel();showReading(el);},readFont,refresh:schedule};
})();
