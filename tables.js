/* Reusable local table: one-column sorting and independent typed column filters. */
(() => {
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const asset=(file,attrs)=>`<img src="assets/tables/${file}" alt="" aria-hidden="true" width="18" height="18" ${attrs}>`;
 const normalize=s=>String(s??'').trim().toLocaleLowerCase('ru').replace(/ё/g,'е');
 const numeric=s=>{const cleaned=String(s??'').replace(/[\s\u00a0₽]/g,'').replace(',','.');return cleaned&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned)?Number(cleaned):null;};
 const dateKey=s=>{
  const match=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(s??''));if(!match)return null;
  const [,d,m,y]=match,probe=new Date(Number(y),Number(m)-1,Number(d));
  return probe.getFullYear()===Number(y)&&probe.getMonth()===Number(m)-1&&probe.getDate()===Number(d)?Number(y+m+d):null;
 };
 let serial=0;
 class DataTable {
  constructor(mount,config={}) {
   this.config={label:'Таблица',columns:[],rows:[],...config};this.columns=this.config.columns;this.rows=[...this.config.rows];this.filters=new Map();this.sort=null;this.filterFields=[];this.id=`uk-table-${++serial}`;
   this.collator=new Intl.Collator('ru',{numeric:true,sensitivity:'base'});
   this.mount=mount;this.render();this.attach();this.update();
  }
  render() {
   const width=this.columns.reduce((sum,c)=>sum+(c.width||180),0);
   this.mount.innerHTML=`<div class="uk-component uk-data-table" style="--table-min-width:${width}px"><div class="uk-table-toolbar"><p class="uk-table-status" role="status" aria-live="polite" aria-atomic="true"></p><button class="ui-button" type="button" data-type="secondary" data-color="neutral" data-size="m" data-table-reset disabled>Сбросить всё</button></div><div class="uk-table-scroll" tabindex="0" role="region" aria-label="${esc(this.config.label)}: прокручиваемая таблица"><table class="uk-table"><caption>${esc(this.config.label)}</caption><colgroup>${this.columns.map(c=>`<col style="width:${c.width||180}px">`).join('')}</colgroup><thead><tr>${this.columns.map((c,i)=>`<th scope="col" data-column="${i}" aria-sort="none"><div class="uk-table-heading"><button type="button" class="uk-table-sort" data-sort-column="${i}" aria-label="${esc(c.label)}: сортировать по возрастанию"><span>${esc(c.label)}</span><span class="uk-table-sort-icons">${asset('f8650.svg','data-sort-icon="none"')}${asset('bd951.svg','data-sort-icon="ascending"')}${asset('eb027.svg','data-sort-icon="descending"')}</span></button><button type="button" class="uk-table-filter-button" data-filter-column="${i}" data-active="false" aria-label="Фильтр: ${esc(c.label)}" aria-haspopup="dialog" aria-expanded="false" aria-controls="${this.id}-filter">${asset('5c8a8.svg','data-filter-icon="default"')}${asset('3f4da.svg','data-filter-icon="hover"')}${asset('68730.svg','data-filter-icon="active"')}</button></div></th>`).join('')}</tr></thead><tbody></tbody></table></div><div class="uk-table-footer">Сортировка и фильтры применяются ко всем строкам таблицы.</div></div>`;
   this.root=this.mount.firstElementChild;this.body=this.root.querySelector('tbody');this.status=this.root.querySelector('[role=status]');this.resetButton=this.root.querySelector('[data-table-reset]');this.scroll=this.root.querySelector('.uk-table-scroll');
   this.popup=document.createElement('div');this.popup.id=this.id+'-filter';this.popup.className='uk-component uk-table-filter-popup';this.popup.setAttribute('role','dialog');this.popup.hidden=true;document.body.append(this.popup);
  }
  attach() {
   this.root.addEventListener('click',event=>{
    const sort=event.target.closest('[data-sort-column]'),filter=event.target.closest('[data-filter-column]');
    if(sort){const c=this.columns[Number(sort.dataset.sortColumn)],direction=this.sort?.key===c.key?(this.sort.direction==='ascending'?'descending':null):'ascending';this.setSort(c.key,direction);}
    else if(filter){const index=Number(filter.dataset.filterColumn);if(this.openColumn===index)this.closeFilter();else this.openFilter(index);}
    else if(event.target.closest('[data-table-reset]'))this.reset();
   });
   this.onOutside=event=>{if(!this.popup.hidden&&!this.popup.contains(event.target)&&!this.anchor?.contains(event.target))this.closeFilter(false);};
   this.onFocus=event=>{if(!this.popup.hidden&&!this.popup.contains(event.target)&&!this.anchor?.contains(event.target))this.closeFilter(false);};
   this.onKey=event=>{if(event.key==='Escape'&&!this.popup.hidden){event.preventDefault();this.closeFilter();}};
   this.onPanel=()=>this.closeFilter(false);this.onPosition=()=>{if(!this.popup.hidden)this.positionFilter();};
   document.addEventListener('pointerdown',this.onOutside);document.addEventListener('focusin',this.onFocus);document.addEventListener('keydown',this.onKey);document.addEventListener('ui:panel-change',this.onPanel);
   window.addEventListener('resize',this.onPosition);window.addEventListener('scroll',this.onPosition,true);
   this.popup.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.matches('.field-control')&&!this.filterFields.some(f=>f.opened)){event.preventDefault();this.closeFilter();}});
  }
  format(row,column) {const value=row[column.key];return column.format?String(column.format(value,row)):String(value??'');}
  get visibleRows() {
   let rows=this.rows.map((row,index)=>({row,index})).filter(({row})=>this.columns.every(c=>{
    const filter=this.filters.get(c.key);if(filter===undefined)return true;const value=row[c.key];
    if(c.filter==='number'){const number=numeric(value);return number!==null&&(filter.min===null||number>=filter.min)&&(filter.max===null||number<=filter.max);}
    if(c.filter==='date')return dateKey(value)===dateKey(filter);
    if(c.filter==='select')return String(value??'')===filter;
    return normalize(this.format(row,c)).includes(normalize(filter));
   }));
   if(this.sort){const c=this.columns.find(c=>c.key===this.sort.key),direction=this.sort.direction==='ascending'?1:-1;rows.sort((a,b)=>{
    let left=a.row[c.key],right=b.row[c.key];
    if(c.filter==='number'){left=numeric(left);right=numeric(right);}else if(c.filter==='date'){left=dateKey(left);right=dateKey(right);}
    const leftEmpty=left===null||left===undefined||left==='',rightEmpty=right===null||right===undefined||right==='';
    if(leftEmpty!==rightEmpty)return leftEmpty?1:-1;
    const comparison=leftEmpty?0:c.compare?c.compare(a.row[c.key],b.row[c.key],a.row,b.row):typeof left==='number'&&typeof right==='number'?left-right:this.collator.compare(String(left),String(right));return comparison*direction||a.index-b.index;
   });}
   return rows.map(x=>x.row);
  }
  update() {
   const rows=this.visibleRows;
   this.body.innerHTML=rows.length?rows.map(row=>`<tr>${this.columns.map(c=>{const text=this.format(row,c);return `<td data-key="${esc(c.key)}" data-numeric="${c.filter==='number'}"><span class="uk-table-cell" title="${esc(text)}">${esc(text)}</span></td>`;}).join('')}</tr>`).join(''):`<tr><td class="uk-table-empty" colspan="${this.columns.length}"><strong>Ничего не найдено</strong>Измените фильтр или сбросьте условия.</td></tr>`;
   this.columns.forEach((c,i)=>{
    const state=this.sort?.key===c.key?this.sort.direction:'none',head=this.root.querySelector(`[data-column="${i}"]`),sort=head.querySelector('[data-sort-column]'),filter=head.querySelector('[data-filter-column]');
    head.setAttribute('aria-sort',state);sort.setAttribute('aria-label',`${c.label}: ${state==='none'?'сортировать по возрастанию':state==='ascending'?'сортировать по убыванию':'вернуть исходный порядок'}`);
    filter.dataset.active=String(this.filters.has(c.key));filter.setAttribute('aria-label',`Фильтр: ${c.label}${this.filters.has(c.key)?', применён':''}`);
   });
   const sortLabel=this.sort?` · ${this.columns.find(c=>c.key===this.sort.key).label}: ${this.sort.direction==='ascending'?'по возрастанию':'по убыванию'}`:'';
   this.status.textContent=`Показано ${rows.length} из ${this.rows.length}${this.filters.size?' · Фильтров: '+this.filters.size:''}${sortLabel}`;this.resetButton.disabled=!this.filters.size&&!this.sort;
   this.root.dispatchEvent(new CustomEvent('ui:table-change',{bubbles:true,detail:{count:rows.length,total:this.rows.length,sort:this.sort?{...this.sort}:null,filters:Object.fromEntries(this.filters)}}));
  }
  setSort(key,direction) {
   if(!this.columns.some(c=>c.key===key))return;this.sort=['ascending','descending'].includes(direction)?{key,direction}:null;this.update();
  }
  setFilter(key,value) {
   const column=this.columns.find(c=>c.key===key);if(!column)return false;
   if(value===null||value===undefined||value===''){this.filters.delete(key);this.update();return true;}
   if(column.filter==='date'&&dateKey(value)===null)return false;
   if(column.filter==='number'){
    if(typeof value!=='object')return false;const min=value.min===null||value.min===''||value.min===undefined?null:numeric(value.min),max=value.max===null||value.max===''||value.max===undefined?null:numeric(value.max);
    if(value.min!==null&&value.min!==''&&value.min!==undefined&&min===null||value.max!==null&&value.max!==''&&value.max!==undefined&&max===null||min!==null&&max!==null&&min>max)return false;
    if(min===null&&max===null)this.filters.delete(key);else this.filters.set(key,{min,max});
   }else {const text=String(value).trim();if(text)this.filters.set(key,text);else this.filters.delete(key);}
   this.update();return true;
  }
  openFilter(index) {
   this.closeFilter(false);const c=this.columns[index];if(!c)return;
   this.openColumn=index;this.anchor=this.root.querySelector(`[data-filter-column="${index}"]`);this.anchor.setAttribute('aria-expanded','true');this.popup.setAttribute('aria-label','Фильтр: '+c.label);this.popup.innerHTML='<div class="uk-table-filter-body"></div>';this.popup.hidden=false;
   const holder=this.popup.firstElementChild,value=this.filters.get(c.key);
   const make=(config)=>{const mount=document.createElement('div');holder.append(mount);const f=new UIKitControls.Field(mount,{size:'m',label:'Введите значение',required:false,hint:'',...config});this.filterFields.push(f);return f;};
   if(c.filter==='number'){
    const min=make({label:'Сумма от',value:value?.min??'',suffix:'₽'}),max=make({label:'Сумма до',value:value?.max??'',suffix:'₽'});min.mount.dataset.numberFilter='min';max.mount.dataset.numberFilter='max';
    for(const f of [min,max]){f.input.inputMode='decimal';f.root.addEventListener('ui:input',()=>apply());f.root.addEventListener('ui:change',()=>apply());}
    const apply=()=>{const raw={min:min.value,max:max.value},valid=this.setFilter(c.key,raw);min.error=max.error=valid?'':'Проверьте диапазон';min.sync();max.sync();this.positionFilter();};
   }else{
    const config=c.filter==='select'?{type:'selector',label:'Значение',options:c.options||[...new Set(this.rows.map(r=>String(r[c.key]??'')))].filter(Boolean).sort(this.collator.compare),value:value||''}:c.filter==='date'?{type:'date',label:'Дата',value:value||''}:{type:'search',label:'Введите значение',value:value||''};
    const field=make(config);const apply=()=>{this.setFilter(c.key,field.value);this.positionFilter();};field.root.addEventListener('ui:input',apply);field.root.addEventListener('ui:change',apply);
   }
   this.positionFilter();this.filterFields[0].input.focus({preventScroll:true});
  }
  positionFilter() {
   if(this.popup.hidden||!this.anchor)return;
   const anchor=this.anchor.getBoundingClientRect(),scroll=this.scroll.getBoundingClientRect();
   if(anchor.right<scroll.left||anchor.left>scroll.right||anchor.bottom<0||anchor.top>innerHeight){this.closeFilter(false);return;}
   const popup=this.popup.getBoundingClientRect(),left=Math.max(8,Math.min(innerWidth-popup.width-8,anchor.right-popup.width));
   const below=anchor.bottom+10,top=below+popup.height>innerHeight-8?Math.max(8,anchor.top-popup.height-10):below;
   this.popup.style.left=left+'px';this.popup.style.top=top+'px';this.filterFields.forEach(f=>{if(f.opened)f.position();});
  }
  closeFilter(restoreFocus=true) {
   if(this.popup.hidden)return;const anchor=this.anchor;this.popup.hidden=true;anchor?.setAttribute('aria-expanded','false');this.filterFields.forEach(f=>f.destroy());this.filterFields=[];this.popup.replaceChildren();this.openColumn=null;this.anchor=null;if(restoreFocus)anchor?.focus({preventScroll:true});
  }
  reset() {this.closeFilter(false);this.filters.clear();this.sort=null;this.update();}
  setRows(rows) {this.closeFilter(false);this.rows=[...rows];this.update();}
  destroy() {
   this.closeFilter(false);document.removeEventListener('pointerdown',this.onOutside);document.removeEventListener('focusin',this.onFocus);document.removeEventListener('keydown',this.onKey);document.removeEventListener('ui:panel-change',this.onPanel);window.removeEventListener('resize',this.onPosition);window.removeEventListener('scroll',this.onPosition,true);this.popup.remove();this.root.remove();
  }
 }
 window.UIKitTables={DataTable};
})();
