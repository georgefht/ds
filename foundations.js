(() => {
 'use strict';
 const data=UIKitFoundations,panel=document.getElementById('foundations-panel');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const copy=(token,label=token)=>`<button type="button" class="foundation-token" data-foundation-copy="${esc(token)}" aria-label="Скопировать ${esc(token)}">${esc(label)}</button>`;
 document.getElementById('foundation-type-list').innerHTML=data.typography.map((t,i)=>`<article class="foundation-type-row" data-type-token="${esc(t.name)}"><p class="foundation-type-sample uk-type-${slug(t.name)}">${esc(t.name)}</p><div class="foundation-type-meta"><span>${t.fontSize} / ${t.lineHeightPx} px</span><small>Размер / строка</small></div><div class="foundation-type-meta"><span>${t.weight}</span><small>Абзац ${t.paragraphSpacing} px</small></div>${copy(t.cssVariable)}</article>${i===2||i>=3&&i<9?`<div class="foundation-divider" aria-hidden="true"><img src="assets/foundations/${i===2?'cead8.svg':'08a2b.svg'}" alt=""></div>`:''}`).join('');
 document.getElementById('foundation-link-list').innerHTML=data.typography.slice(3).map(t=>`<div class="foundation-link-sample uk-type-${slug(t.name)}"><a href="#foundation-typography">${esc(t.name)}</a><span class="is-hover" aria-label="Цвет при наведении">Hover</span></div>`).join('');
 document.getElementById('foundation-spacing-scale').innerHTML=data.spacing.map(t=>`<article class="foundation-space-item" data-value="${t.value}" style="--space:var(${t.cssVariable})"><div class="foundation-space-bar" aria-hidden="true"><span></span></div><span class="foundation-space-value">${t.value} px</span>${copy(t.cssVariable,t.name)}</article>`).join('');
 const controls=document.getElementById('foundation-gap-controls');controls.innerHTML=[4,8,12,16,24].map(n=>`<button class="segment" type="button" data-gap="${n}" aria-pressed="${n===12}">${n} px</button>`).join('');
 controls.addEventListener('click',event=>{const b=event.target.closest('[data-gap]');if(!b)return;controls.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const stage=document.getElementById('foundation-gap-preview');stage.style.gap=`var(--ds-spacing-${b.dataset.gap})`;stage.setAttribute('aria-label',`Отступ между элементами ${b.dataset.gap} пикселей`);});
 document.getElementById('foundation-radius-grid').innerHTML=data.radii.map(t=>`<article class="foundation-radius-card" data-value="${t.value}"><div class="foundation-radius-sample" style="--radius:var(${t.cssVariable})" aria-hidden="true"></div><h3>${t.value===999?'Round · 999':t.value} px</h3>${copy(t.cssVariable,t.name)}${t.value===4?'<p>Поля и кнопки</p>':''}</article>`).join('');
 document.getElementById('foundation-extra-dimensions').innerHTML=data.dimensions.map(t=>`<p>${copy(t.cssVariable,t.name)} · ${t.value} px · ${esc(t.alias.name)} → ${esc(t.alias.targetName)}</p>`).join('');
 document.getElementById('foundation-shadow-grid').innerHTML=data.shadows.map(t=>`<article class="foundation-shadow-card"><div class="foundation-shadow-stage"><div class="foundation-shadow-sample" style="--shadow:var(${t.cssVariable})">${esc(t.name.split('/')[1])}</div></div><h3>${esc(t.name)}</h3>${copy(t.cssVariable)}<p>${t.effects.length===1?'Один слой':t.effects.length+' слоёв'}</p><details><summary>Параметры тени</summary>${t.effects.map((e,i)=>`<dl><dt>Слой ${i+1} · X / Y</dt><dd>${e.offset.x} / ${e.offset.y} px</dd><dt>Blur / Spread</dt><dd>${e.radius} / ${e.spread} px</dd><dt>Цвет / Opacity</dt><dd>#000000 / ${Math.round(e.color.a*100)}%</dd></dl>`).join('')}<code class="foundation-shadow-code">${esc(t.cssValue)}</code></details></article>`).join('');
 let timer;
 panel.addEventListener('click',async event=>{
  const button=event.target.closest('[data-foundation-copy]');if(!button)return;const value=button.dataset.foundationCopy;let copied=false;
  try{await navigator.clipboard.writeText(value);copied=true;}catch{
   const focused=document.activeElement,area=document.createElement('textarea');area.value=value;area.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(area);area.select();copied=document.execCommand('copy');area.remove();focused?.focus({preventScroll:true});
  }
  const status=document.getElementById('foundation-copy-status');status.textContent=copied?'Скопировано: '+value:'Токен: '+value;status.hidden=false;clearTimeout(timer);timer=setTimeout(()=>status.hidden=true,2600);
 });
})();
