/* Component composition and exact colour-token inspection. No product state mutations. */
(() => {
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tokens=UIKitColorTokens.tokens,byVariable=new Map(tokens.map(t=>[t.cssVariable,t]));
  const catalog=[
    ['.field','Field','UIKitControls.Field','form-controls.js'],
    ['.ui-button','Button','UI KIT · Button','components.css'],
    ['.uk-choice','Choice','UIKitComponents','components.js'],
    ['.uk-badge','Badge','UIKitComponents.Badge','components.js'],
    ['.uk-counter','Counter','UIKitComponents.Counter','components.js'],
    ['.uk-status','Status indicator','UIKitComponents.Status','components.js'],
    ['.uk-collapse--section','New Collapse Section','UIKitComponents.CollapseSection','components.js'],
    ['.uk-collapse--string','New Collapse String','UIKitComponents.CollapseString','components.js'],
    ['.uk-tooltip','Tooltip','UIKitComponents.Tooltip','components.js'],
    ['.uk-data-table','Table','UIKitTables.DataTable','tables.js'],
    ['.uk-textarea','Text area','UIKitComponents.TextArea','components.js'],
    ['.uk-tabs','Tabs','UIKitComponents.Tabs','components.js'],
    ['.uk-segment-control','Segment control','UIKitComponents.SegmentControl','components.js'],
    ['.field-clear,.clear-button','Clear button','Часть контрола','form-controls.css',true],
    ['.field-trigger','Field action','Часть Field','form-controls.js',true],
    ['.field-popup','Field popup','Часть Field','form-controls.js'],
    ['.field-option','Menu item','Часть Field','form-controls.js',true],
    ['.uk-table-filter-popup','Column filter','Часть Table','tables.js'],
    ['.uk-table-filter-button','Filter button','Часть Table','tables.js',true],
    ['.uk-table-sort','Sort button','Часть Table','tables.js',true],
    ['.uk-table th','Column header','Часть Table','tables.js',true],
    ['.uk-table tbody tr','Table row','Часть Table','tables.js',true],
    ['.uk-table td','Table cell','Часть Table','tables.js',true],
    ['svg.icon,img[src$=".svg"]','Icon','SVG · ассет','',true],
    ['.config-card','Configuration card','Композиция экрана','task-admin.js'],
    ['.config-strip','Configuration list','Композиция экрана','task-admin.js'],
    ['.configuration-details','Configuration panel','Композиция экрана','task-admin.html'],
    ['.app-header','Application header','Композиция экрана','task-admin.html'],
    ['.side-nav','Side navigation','Композиция экрана','task-admin.html'],
    ['.breadcrumb','Breadcrumb','Композиция экрана','task-admin.html'],
    ['.runs-section','Runs section','Композиция экрана','task-admin.html'],
    ...(window.TaskInspectorCatalog||[]),
    ['.config-modal','Configuration dialog','Композиция экрана','task-admin.html']
  ];
  const ignored=el=>!el||el.closest('[data-inspector-ui],script,style,noscript,[hidden],[inert]');
  function visible(el) {
    if(ignored(el)||!el.isConnected)return false;
    if(el.closest('svg:not(.icon)')||el.matches('use,path,defs,filter,feFlood'))return false;
    const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&(el.checkVisibility?el.checkVisibility({opacityProperty:true,visibilityProperty:true}):getComputedStyle(el).visibility!=='hidden');
  }
  function describe(el) {
    const rule=catalog.find(r=>el.matches(r[0]));if(!rule)return null;
    let name=rule[1],source=rule[2];
    if(name==='Choice'){name={toggle:'Toggle',checkbox:'Checkbox',radio:'Radio button'}[el.dataset.kind]||name;source+='.'+{toggle:'Toggle',checkbox:'Checkbox',radio:'Radio'}[el.dataset.kind];}
    if(name==='Field')name={input:'Input',search:'Search',selector:'Selector',multiselector:'Multiselector',date:'Date picker',time:'Time picker'}[el.dataset.type]||'Input';
    const variant=['type','color','size','kind','style','check','state','open','disabled'].filter(k=>el.dataset[k]!==undefined).map(k=>k+': '+el.dataset[k]).join(' · ');
    return {el,name,source,file:rule[3],part:!!rule[4],variant,label:el.getAttribute('aria-label')||el.querySelector('.field-label,.uk-choice__label')?.textContent||el.textContent?.trim().replace(/\s+/g,' ').slice(0,70)||name};
  }
  function elements(){return [...document.querySelectorAll(catalog.map(r=>r[0]).join(','))].filter(visible).map(describe);}
  function nearest(el){for(let n=el instanceof Element?el:null;n;n=n.parentElement){if(ignored(n))return null;const item=describe(n);if(item&&visible(n))return item;}return null;}
  function groupKey(item){return item.name+'|'+item.source;}
  function composition(el) {
    const all=elements(),selected=describe(el),children=all.filter(i=>el.contains(i.el)&&i.el!==el),ancestors=all.filter(i=>i.el!==el&&i.el.contains(el)).reverse(),related=all.filter(i=>groupKey(i)===groupKey(selected));
    return {selected,children,ancestors,related};
  }
  function parseColor(value) {
    if(!value)return null;value=value.trim();if(value==='transparent')return [0,0,0,0];
    const hex=/^#([\da-f]{3,8})$/i.exec(value);if(hex){let v=hex[1];if(v.length===3||v.length===4)v=[...v].map(c=>c+c).join('');if(v.length!==6&&v.length!==8)return null;return [parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16),v.length===8?parseInt(v.slice(6,8),16)/255:1];}
    const match=/^rgba?\(([^)]+)\)$/.exec(value);if(match){const bits=match[1].replace(/\s*\/\s*/,',').split(/[,\s]+/).filter(Boolean);return bits.slice(0,3).map(v=>v.endsWith('%')?parseFloat(v)*2.55:parseFloat(v)).concat(bits[3]===undefined?1:bits[3].endsWith('%')?parseFloat(bits[3])/100:parseFloat(bits[3]));}
    const srgb=/^color\(srgb\s+([^)]+)\)$/.exec(value);if(srgb){const bits=srgb[1].split(/\s*\/\s*|\s+/).map(Number);return bits.slice(0,3).map(v=>v*255).concat(bits[3]??1);}return null;
  }
  const tokenRGBA=t=>[t.value.r*255,t.value.g*255,t.value.b*255,t.value.a??1];
  const same=(a,b)=>a&&b&&a.slice(0,3).every((v,i)=>Math.round(v)===Math.round(b[i]))&&Math.abs(a[3]-b[3])<.005;
  const hex=rgba=>'#'+rgba.slice(0,3).map(v=>Math.round(v).toString(16).padStart(2,'0')).join('').toUpperCase()+(rgba[3]<.999?Math.round(rgba[3]*255).toString(16).padStart(2,'0').toUpperCase():'');
  function declaration(el,names,winning,inherited=false) {
    for(let node=el;node;node=inherited?node.parentElement:null){const rule=winning(node,names);if(rule&&!['inherit','unset','currentColor'].includes(rule.value))return {rule,node};}return null;
  }
  function boundToken(el,value,winning,seen=new Set()) {
    const vars=[...value.matchAll(/var\(\s*(--[\w-]+)/g)].map(m=>m[1]);
    for(const variable of vars){if(seen.has(variable))continue;seen.add(variable);const token=byVariable.get(variable);if(token)return token;const custom=declaration(el,variable,winning,true);if(custom){const result=boundToken(el,custom.rule.value,winning,seen);if(result)return result;}}return null;
  }
  function paint(label,value,owner,source,winning,explicit=null) {
    const rgba=parseColor(value);if(!rgba||rgba[3]===0)return null;
    const token=explicit|| (source?boundToken(owner,source.rule.value,winning):null),applied=token&&same(rgba,tokenRGBA(token))?token:null;
    const core=tokens.filter(t=>t.collection==='Color, core'&&same(rgba,tokenRGBA(t)));
    const primary=applied?.collection==='Color, core'?applied:core.find(t=>t.name===applied?.alias)||core[0]||null;
    return {label,value,hex:hex(rgba),alpha:Math.round(rgba[3]*100),core:primary,applied,source:source?.rule.source||'',selector:source?.rule.selector||'',owner:owner.tagName.toLowerCase()+(owner.id?'#'+owner.id:'')};
  }
  function readColors(el,winning) {
    const s=getComputedStyle(el),output=[];let owner=el;
    while(owner&&!(parseColor(getComputedStyle(owner).backgroundColor)?.[3]>0))owner=owner.parentElement;
    if(owner){const p=paint(owner===el?'Фон':'Фон под элементом',getComputedStyle(owner).backgroundColor,owner,declaration(owner,['background','background-color'],winning),winning);if(p)output.push(p);}
    if(el.matches('input,textarea')||[...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())||el.matches('button,a,label')){const p=paint('Текст',s.color,el,declaration(el,'color',winning,true),winning);if(p)output.push(p);}
    const borderValues=new Set();for(const side of ['top','right','bottom','left']){const value=s.getPropertyValue('border-'+side+'-color');if(parseFloat(s.getPropertyValue('border-'+side+'-width'))>0&&s.getPropertyValue('border-'+side+'-style')!=='none'&&!borderValues.has(value)){borderValues.add(value);const p=paint(borderValues.size===1?'Рамка':'Рамка · '+side,value,el,declaration(el,['border','border-color','border-'+side,'border-'+side+'-color'],winning),winning);if(p)output.push(p);}}
    if(el.matches('svg.icon')) {
      const use=el.querySelector('use'),ref=use?.getAttribute('href'),original=ref&&document.getElementById(ref.replace('#','')),shape=original?.querySelector('[stroke],[fill]');
      for(const property of ['stroke','fill']){let value=getComputedStyle(use||el)[property];if(value==='none'||property==='fill'&&shape?.getAttribute('fill')==='none')continue;const attr=shape?.getAttribute(property)||original?.getAttribute(property);if(attr==='none')continue;if(attr==='currentColor')value=s.color;else if(attr)value=attr;const p=paint(property==='stroke'?'Иконка · контур':'Иконка · заливка',value,el,declaration(el,attr==='currentColor'?'color':property,winning,true),winning);if(p&&!output.some(i=>i.label.startsWith('Иконка')&&i.hex===p.hex))output.push(p);}
    }
    if(el.matches('img')) {
      const id=s.filter.match(/#([^"')]+)/)?.[1],flood=id&&document.getElementById(id)?.querySelector('feFlood');
      if(flood){const style=getComputedStyle(flood),value=style.floodColor,token=boundToken(flood,flood.getAttribute('style')||flood.getAttribute('flood-color')||'',winning);const p=paint('Иконка',value,el,null,winning,token);if(p){p.source='SVG filter · '+id;output.push(p);}}
      else {const path=el.getAttribute('src');for(const item of TaskInspectorAssetPaints[path]||[]){const p=paint(item.property==='stroke'?'SVG · контур':'SVG · заливка',item.value,el,null,winning);if(p){p.source=path;output.push(p);}}}
    }
    return output;
  }
  function colorsHTML(el,winning) {
    const colors=readColors(el,winning),opacity=getComputedStyle(el).opacity;
    return `<h3 class="inspector-section-title">Цвета выбранного элемента</h3><p class="inspector-source">${esc(el.tagName.toLowerCase()+(el.id?'#'+el.id:''))}${opacity!=='1'?' · прозрачность элемента '+Math.round(opacity*100)+'%':''}</p>${colors.map(c=>`<article class="inspector-color-card"><div class="inspector-color-heading"><i style="--inspect-paint:${esc(c.value)}"></i><div><strong>${esc(c.label)}</strong><span>${esc(c.hex)}${c.alpha<100?' · '+c.alpha+'%':''}</span></div></div><p class="inspector-color-name">${esc(c.core?.name||'Нет точного совпадения в палитре')}</p>${c.core?`<button type="button" class="inspector-token" data-inspector-copy="${esc(c.core.cssVariable)}">${esc(c.core.cssVariable)}</button>`:''}${c.applied&&c.applied!==c.core?`<p class="inspector-source">Применён токен компонента: ${esc(c.applied.name)}</p><button type="button" class="inspector-token" data-inspector-copy="${esc(c.applied.cssVariable)}">${esc(c.applied.cssVariable)}</button>`:c.core?'<p class="inspector-source">'+(c.applied?'Токен применён.':'Точное совпадение по значению.')+'</p>':''}<details class="inspector-more"><summary>Источник цвета</summary><p class="inspector-source">${esc(c.value)}<br>${esc(c.owner)}<br>${esc(c.source||'Вычисленный стиль / SVG')}<br><code>${esc(c.selector)}</code></p><button type="button" class="inspector-token" data-inspector-copy="${esc(c.hex)}">Скопировать ${esc(c.hex)}</button></details></article>`).join('')||'<p class="inspector-empty">У элемента нет видимой заливки, текста или рамки.</p>'}`;
  }
  window.TaskInspectorExtras={visible,describe,elements,nearest,composition,groupKey,readColors,colorsHTML,esc};
})();
