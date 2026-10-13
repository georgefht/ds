(() => {
  'use strict';
  const {tokens,experimental,backgrounds}=window.UIKitColorTokens;
  const {Field}=window.UIKitControls;
  const panel=document.getElementById('colors-panel');
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={dark:'Нейтральные',accent:'Акцентные',success:'Успех',caution:'Предупреждение',critical:'Ошибка',adv1:'Дополнительные · фиолетовые',adv2:'Дополнительные · синие'};
  const byName=new Map(tokens.map(t=>[t.name,t]));
  const isCore=token=>token.collection==='Color, core';
  const groupKey=token=>(isCore(token)?'core:':'semantic:')+token.name.split('/')[0];
  const allGroups=[...new Set(tokens.map(groupKey))];
  const alpha=token=>token.opacity<1?` · ${Math.round(token.opacity*100)}%`:'';
  const copy=(value,label,cls='')=>`<button type="button" class="color-copy ${cls}" data-color-copy="${esc(value)}" aria-label="Скопировать ${esc(label)}">${esc(value)}</button>`;
  const swatch=token=>`<button type="button" class="color-swatch-button" data-color-copy="${esc(token.referenceHex||(token.opacity<1?token.cssValue:token.hex))}" aria-label="Скопировать цвет ${esc(token.name)}: ${token.referenceHex||token.hex}${alpha(token)}">${token.asset?`<img src="assets/colors/${esc(token.asset)}" alt="" aria-hidden="true" loading="lazy">`:`<span class="color-dynamic-swatch" style="--swatch-color:var(${token.cssVariable})"><span></span></span>`}</button>`;
  const coreCard=token=>`<article class="color-core-card" data-color-token="${esc(token.name)}" data-main="${token.name.endsWith('/main')}">${swatch(token)}${copy(token.name,'токен '+token.name,'color-copy--name')}${copy(token.hex,'HEX токена '+token.hex,'color-copy--hex')}${token.referenceHex?`<span class="color-opacity">Образец Colors: ${token.referenceHex}</span>`:''}${token.opacity<1?`<span class="color-opacity">Прозрачность ${Math.round(token.opacity*100)}%</span>`:''}${copy(token.cssVariable,'CSS-переменную '+token.cssVariable,'color-copy--css')}</article>`;
  const tokenRow=token=>`<article class="color-token-row" data-color-token="${esc(token.name)}">${swatch(token)}<div>${copy(token.name,'токен '+token.name,'color-copy--name')}${token.alias?`<p class="color-token-alias">↳ ${esc(token.alias)}</p>`:''}</div><div>${copy(token.hex,'HEX '+token.hex,'color-copy--hex')}${token.opacity<1?`<span class="color-opacity">Прозрачность ${Math.round(token.opacity*100)}%</span>`:''}</div><div>${copy(token.cssVariable,'CSS-переменную '+token.cssVariable,'color-copy--css')}${copy(token.cssValue,'значение цвета '+token.cssValue,'color-copy--css')}</div></article>`;
  document.getElementById('color-backgrounds').innerHTML=backgrounds.map(bg=>{
    const token=byName.get(bg.token);
    return `<article class="color-bg-card"><div class="color-bg-sample" data-bg="${bg.name}" aria-label="${bg.name}: ${token.hex}${alpha(token)}"></div><h3>${bg.name} · ${bg.name==='White'?'Белый':bg.name==='Grey'?'Серый':'Граница'}</h3>${copy(token.name,'токен '+token.name,'color-copy--name')}${copy(token.cssValue,'цвет '+token.cssValue,'color-copy--hex')}${copy(token.cssVariable,'CSS-переменную '+token.cssVariable,'color-copy--css')}${bg.name==='Border'?'<p class="color-bg-description">#36393E · прозрачность 13%. Без заливки.</p>':''}</article>`;
  }).join('');
  let collection='core',group='all',query='',toastTimer;
  const search=new Field(document.getElementById('color-search'),{type:'search',label:'Найти цвет или токен',required:false,hint:'',accessibleLabel:'Найти цвет или токен'});
  const groupFilter=new Field(document.getElementById('color-group-filter'),{type:'selector',label:'Группа цветов',required:false,hint:'',clear:false,value:'all',options:[]});
  function updateGroupOptions() {
    const groups=allGroups.filter(key=>collection==='all'||key.startsWith(collection+':'));
    if(!groups.includes(group))group='all';
    groupFilter.config.options=[{value:'all',label:'Все группы'},...groups.map(key=>{const name=key.split(':')[1];return {value:key,label:name+(labels[name]?' · '+labels[name]:'')};})];
    groupFilter.setValue(group,false);
  }
  function render() {
    const visible=tokens.filter(token=>(collection==='all'||isCore(token)===(collection==='core'))&&(group==='all'||groupKey(token)===group)&&(!query||[token.name,token.hex,token.cssVariable,token.cssValue,token.alias,labels[token.name.split('/')[0]]].some(value=>String(value||'').toLowerCase().includes(query))));
    const groups=new Map();
    visible.forEach(token=>{const key=groupKey(token);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(token);});
    document.getElementById('color-token-groups').innerHTML=[...groups].map(([key,items])=>{
      const [kind,name]=key.split(':');
      return `<section class="color-group" data-color-group="${esc(key)}"><div class="color-group-header"><h3>${esc(name)}</h3><span>${esc(labels[name]||'Токены компонентов')} · ${items.length}</span></div><div class="${kind==='core'?'color-core-grid':'color-token-list'}">${items.map(kind==='core'?coreCard:tokenRow).join('')}</div></section>`;
    }).join('');
    document.getElementById('color-result-count').textContent=`Показано ${visible.length} из ${collection==='core'?78:collection==='semantic'?661:739} · групп: ${groups.size}`;
    document.getElementById('color-empty').hidden=visible.length>0;
    const showWip=collection!=='semantic'&&group==='all';
    const wip=experimental.filter(s=>showWip&&(!query||`${s.group} ${s.color}`.toLowerCase().includes(query)));
    document.getElementById('color-experimental').innerHTML=wip.length?`<section class="color-wip"><h2>Work In Progress</h2><p>Образцы из отдельного блока Colors. У них нет отдельных цветовых токенов в Figma.</p>${['dark2','dark updated'].map(name=>{const samples=wip.filter(s=>s.group===name);return samples.length?`<div class="color-group"><div class="color-group-header"><h3>${name}</h3></div><div class="color-core-grid">${samples.map(s=>`<article class="color-core-card"><button type="button" class="color-swatch-button" data-color-copy="${s.color}" aria-label="Скопировать ${name}: ${s.color}"><img src="assets/colors/${s.asset}" alt="" aria-hidden="true" loading="lazy"></button>${copy(s.color,'HEX '+s.color,'color-copy--hex')}<span class="color-wip-note">Без отдельного токена</span></article>`).join('')}</div></div>`:'';}).join('')}</section>`:'';
  }
  async function copyValue(value) {
    try {
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);
      else throw new Error('Clipboard unavailable');
    } catch(error) {
      const active=document.activeElement,selection=document.getSelection(),ranges=selection?[...Array(selection.rangeCount)].map((_,i)=>selection.getRangeAt(i).cloneRange()):[];
      const area=document.createElement('textarea');area.value=value;area.setAttribute('aria-label','Копируемое значение');area.style.cssText='position:fixed;top:0;left:-9999px;';document.body.append(area);area.select();
      const copied=document.execCommand('copy');area.remove();active?.focus({preventScroll:true});if(selection){selection.removeAllRanges();ranges.forEach(range=>selection.addRange(range));}
      if(!copied){showToast('Не удалось скопировать: '+value);return;}
    }
    showToast('Скопировано: '+value);
  }
  function showToast(message) { const status=document.getElementById('color-copy-status');status.textContent=message;status.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{status.hidden=true;},2600); }
  panel.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.colorCopy!==undefined)copyValue(button.dataset.colorCopy);
    if(button.dataset.colorCollection){collection=button.dataset.colorCollection;panel.querySelectorAll('[data-color-collection]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));updateGroupOptions();render();}
    if(button.dataset.colorCanvas){panel.querySelector('.color-inspector').dataset.canvas=button.dataset.colorCanvas;panel.querySelectorAll('[data-color-canvas]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
  });
  search.root.addEventListener('ui:input',event=>{query=event.detail.value.trim().toLowerCase();render();});
  search.root.addEventListener('ui:change',event=>{query=event.detail.value.trim().toLowerCase();render();});
  groupFilter.root.addEventListener('ui:change',event=>{group=event.detail.value||'all';render();});
  document.querySelectorAll('[data-kit-panel]').forEach(button=>button.addEventListener('click',()=>{search.close();groupFilter.close();}));
  updateGroupOptions();render();
})();
