/* Task administration example composed from the existing UI KIT. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=(name,small=false)=>`<svg class="icon${small?' icon-small':''}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const {Badge,Status,Tooltip,CollapseSection,Toggle,Checkbox}=UIKitComponents;
  const {Field}=UIKitControls;
  const configs=[
    {id:'default',name:'default',timeout:0,party:'PHYSICAL',terminate:false,pageSize:1000,background:true,locked:true,creator:'system',created:'20.12.2022 23:06:09'},
    {id:'config-1',name:'32132123',timeout:0,party:'PHYSICAL',terminate:false,pageSize:1000,background:true,creator:'admin_performer',created:'20.12.2022 23:06:09'},
    {id:'config-2',name:'Проверка организаций',timeout:30,party:'LEGAL',terminate:false,pageSize:500,background:true,creator:'admin_performer',created:'19.01.2026 12:20:41'},
    {id:'config-3',name:'32132124',timeout:0,party:'PHYSICAL',terminate:false,pageSize:1000,background:true,creator:'admin_performer',created:'19.01.2026 12:31:07'},
    {id:'config-4',name:'Ночная проверка',timeout:120,party:'ALL',terminate:true,pageSize:2000,background:true,creator:'admin_performer',created:'19.01.2026 12:40:22'},
    {id:'config-5',name:'32132125',timeout:0,party:'PHYSICAL',terminate:false,pageSize:1000,background:true,creator:'admin_performer',created:'19.01.2026 12:44:16'},
    {id:'config-6',name:'Контрольная выборка',timeout:15,party:'ALL',terminate:false,pageSize:100,background:false,creator:'admin_performer',created:'19.01.2026 13:01:12'}
  ];
  const skipped='resultPartyFnsInnActualizeTaskPerformer: processed 0 entities; 0 with errors; took 1 seconds or 47 ms;';
  let rows=Array.from({length:16},(_,i)=>({id:'run-'+i,config:i%2?'Разовый запуск':'riskLevelActualiz',configId:i%2?'default':'config-1',trigger:i%3?'diagnosticMetrics…':'detectPopular…',start:'19.01.2026',startTime:`13:${String(33-i).padStart(2,'0')}:08`,end:'19.01.2026',endTime:`13:${String(45-i).padStart(2,'0')}:08`,duration:407+i*37,initiator:'admin_performer',status:i%2?'Успешно':'Пропущена',comment:i%2?'partyType is not specified':skipped}));
  rows.forEach(row=>{row.configuration={...configs.find(c=>c.id===row.configId)};});
  let selectedId='config-1',view='tasks',currentTable,secondaryTable,collapse,running=false,runTimer;
  let carouselTips=[],formFields=[],editor=null,popoverAnchor=null,toastTimer;
  const events=[{time:'19.01.2026 13:33',text:'Запущена проверка по чёрным спискам',user:'admin_performer'},{time:'19.01.2026 12:44',text:'Добавлена конфигурация «32132125»',user:'admin_performer'},{time:'19.01.2026 12:20',text:'Изменены параметры проверки организаций',user:'admin_performer'}];
  const settings={notify:true,retry:true,interval:'30'};
  const formatNow=()=>new Intl.DateTimeFormat('ru',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date()).replace(',','');
  const selected=()=>configs.find(c=>c.id===selectedId)||configs[0];
  const button=(label,action,type='secondary')=>`<button class="ui-button" type="button" data-type="${type}" data-size="s" data-${action}>${esc(label)}</button>`;
  function toast(message) {clearTimeout(toastTimer);$('app-toast').textContent=message;$('app-toast').hidden=false;toastTimer=setTimeout(()=>$('app-toast').hidden=true,4000);}
  function addEvent(text) {events.unshift({time:formatNow(),text,user:'performer_consent'});}
  const parameters=c=>[['executionTimeout',c.timeout],['partyType',c.party],['terminateOnErrors',String(c.terminate)],['pageSize',c.pageSize],['background',String(c.background)],['closeMissedAttributes',120],['iteratorRefreshPeriodMin',30],['forceUpdateAttributeTypes',1000]];
  function parameterList(c) {return `<dl class="popover-dl">${parameters(c).map(([key,value])=>`<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;}
  function parameterContent() {
    const content=document.createElement('div'),c=selected();
    content.innerHTML=`<dl class="parameter-grid">${parameters(c).map(([key,value])=>`<div class="parameter-item"><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><p class="parameter-note">${c.locked?'Базовая конфигурация защищена от изменений. Создайте копию, чтобы задать свои параметры.':`Создал ${esc(c.creator)} · ${esc(c.created)}`}</p>`;
    return content;
  }
  function renderParameters() {
    const open=collapse?.opened||false;collapse?.destroy();
    collapse=new CollapseSection($('config-collapse'),{title:'Параметры конфигурации',size:'body',leading:false,trailing:true,open,actions:selected().locked?['Дублировать']:['Изменить','Дублировать'],content:parameterContent()});
    collapse.root.addEventListener('ui:action',e=>openEditor(e.detail.label==='Изменить'?'edit':'copy'));
    $('selected-config-caption').textContent='Конфигурация: '+selected().name;
  }
  function renderConfigurations(scrollToSelected=false) {
    carouselTips.forEach(t=>t.destroy());carouselTips=[];
    const card=c=>`<button class="config-card" data-id="${esc(c.id)}" type="button" aria-pressed="${c.id===selectedId}" aria-label="Конфигурация ${esc(c.name)}"><strong>${esc(c.name)}${c.locked?icon('lock',true):''}</strong><p>${c.locked?'Базовая<br>конфигурация':`executionTimeout = ${c.timeout}<br>partyType = ${esc(c.party)}<br>terminateOnErrors = ${c.terminate}`}</p></button>`;
    $('config-strip').innerHTML=card(configs[0])+`<button class="config-card config-add" id="add-config" type="button">${icon('plus')}<p>Задать свои<br>параметры для<br>задачи</p></button>`+configs.slice(1).map(card).join('');
    for(const c of configs)carouselTips.push(new Tooltip($('config-strip').querySelector(`[data-id="${c.id}"]`),{text:`создал\n${c.creator}\n${c.created}`,delay:400}));
    if(scrollToSelected)$('config-strip').querySelector(`[data-id="${selectedId}"]`)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest',inline:'nearest'});
    requestAnimationFrame(updateCarousel);renderParameters();
  }
  function updateCarousel() {const strip=$('config-strip');$('config-prev').disabled=strip.scrollLeft<2;$('config-next').disabled=strip.scrollLeft+strip.clientWidth>=strip.scrollWidth-2;}
  function chooseConfig(id) {if(running){toast('Дождитесь завершения текущего запуска');return;}if(!configs.some(c=>c.id===id))return;selectedId=id;closePopover(false);renderConfigurations();$('run-feedback').textContent='';}
  $('config-strip').addEventListener('click',event=>{if(event.target.closest('#add-config'))openEditor('new');else {const card=event.target.closest('[data-id]');if(card)chooseConfig(card.dataset.id);}});
  $('config-strip').addEventListener('scroll',updateCarousel,{passive:true});window.addEventListener('resize',updateCarousel);
  for(const [id,dir] of [['config-prev',-1],['config-next',1]])$(id).addEventListener('click',()=>$('config-strip').scrollBy({left:dir*450,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
  for(const [text,tone,name] of [['неконфликтная','green','smile'],['возобновляемая','accent','repeat'],['фоновая','neutral','background'],['бесконечная','purple','infinity']]) {
    const mount=document.createElement('span');$('task-badges').append(mount);const badge=new Badge(mount,{text,tone,leading:false,trailing:false,counter:false});badge.root.insertAdjacentHTML('afterbegin',icon(name,true));
  }
  const chronological=(key)=>(left,right,a,b)=>{
    const sortable=(date,time)=>date.split('.').reverse().join('')+' '+time;
    return sortable(left,a[key+'Time']).localeCompare(sortable(right,b[key+'Time']));
  };
  const columns=[
    {key:'config',label:'Конфигурация',width:180,filter:'text'},
    {key:'trigger',label:'Триггер',width:155,filter:'select'},
    {key:'start',label:'Начало',width:175,filter:'date',format:(v,r)=>v+' '+r.startTime,compare:chronological('start')},
    {key:'end',label:'Конец',width:175,filter:'date',format:(v,r)=>v+' '+r.endTime,compare:chronological('end')},
    {key:'duration',label:'Длительность',width:165,filter:'text',format:v=>v+' мс'},
    {key:'initiator',label:'Инициатор',width:155,filter:'select'},
    {key:'status',label:'Статус',width:130,filter:'select',options:['Успешно','Пропущена','В работе']},
    {key:'comment',label:'Комментарий',width:340,filter:'text'}
  ];
  function decorateTable(table) {
    const visible=table.visibleRows;
    table.body.querySelectorAll('tr').forEach((tr,i)=>{
      const row=visible[i];if(!row)return;tr.dataset.run=row.id;if(row.new)tr.dataset.new='true';
      const cell=tr.querySelector('[data-key="config"]');cell.innerHTML=`<div class="config-cell"><button class="row-link" type="button" data-run-details="${esc(row.id)}">${esc(row.config)}</button><button class="info-button" type="button" aria-label="Параметры запуска ${esc(row.config)}" aria-haspopup="dialog" aria-expanded="false" data-run-details="${esc(row.id)}">${icon('info',true)}</button></div>`;
      const status=tr.querySelector('[data-key="status"]');new Status(status,{text:row.status,tone:row.status==='Успешно'?'success':row.status==='В работе'?'progress':'caution',style:'text',trailing:false});
      const trigger=tr.querySelector('[data-key="trigger"]');trigger.innerHTML=`<button type="button" class="text-link" data-trigger="${row.trigger.startsWith('diagnostic')?'diagnosticMetricsForPreviousMonthTrigger':'detectPopularAttributesTrigger'}">${icon('layers',true)}<span>${esc(row.trigger)}</span></button>`;
      tr.querySelector('[data-key="comment"] .uk-table-cell').dataset.wrap='true';
    });
  }
  function makeTable(mount,all=false) {
    const table=new UIKitTables.DataTable(mount,{label:all?'Все запуски задачи':'Последние запуски задачи',columns,rows:all?rows:rows.slice(0,5)});
    table.root.addEventListener('ui:table-change',()=>decorateTable(table));decorateTable(table);return table;
  }
  currentTable=makeTable($('task-runs'));
  function refreshTables(){closePopover(false);currentTable.setRows(rows.slice(0,5));if(secondaryTable)secondaryTable.setRows(rows);}
  function closePopover(restore=true) {if($('app-popover').hidden)return;const anchor=popoverAnchor;$('app-popover').hidden=true;popoverAnchor=null;anchor?.setAttribute('aria-expanded','false');if(restore&&anchor?.isConnected)anchor.focus({preventScroll:true});}
  function positionPopover() {
    const popup=$('app-popover');if(popup.hidden||!popoverAnchor)return;
    const a=popoverAnchor.getBoundingClientRect(),p=popup.getBoundingClientRect();
    if(a.bottom<0||a.top>innerHeight||a.right<0||a.left>innerWidth){closePopover(false);return;}
    popup.style.left=Math.max(8,Math.min(innerWidth-p.width-8,a.left))+'px';
    popup.style.top=(a.bottom+8+p.height<innerHeight-8?a.bottom+8:Math.max(8,a.top-p.height-8))+'px';
  }
  function openPopover(anchor,title,html) {
    if(popoverAnchor===anchor&&!$('app-popover').hidden){closePopover();return;}
    closePopover(false);carouselTips.forEach(t=>t.close());currentTable.closeFilter(false);secondaryTable?.closeFilter(false);
    popoverAnchor=anchor;anchor.setAttribute('aria-expanded','true');$('app-popover').setAttribute('aria-label',title);
    $('app-popover').innerHTML=`<div class="popover-heading"><strong>${esc(title)}</strong><button class="icon-button clear-button" type="button" data-popover-close aria-label="Закрыть"><img src="assets/icons/865ea.svg" width="18" height="18" alt=""></button></div>${html}`;
    $('app-popover').hidden=false;positionPopover();$('app-popover').focus({preventScroll:true});
  }
  document.addEventListener('pointerdown',e=>{if(!$('app-popover').hidden&&!$('app-popover').contains(e.target)&&!popoverAnchor?.contains(e.target))closePopover(false);});
  document.addEventListener('focusin',e=>{if(!$('app-popover').hidden&&!$('app-popover').contains(e.target)&&!popoverAnchor?.contains(e.target))closePopover(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('app-popover').hidden){e.preventDefault();closePopover();}});
  window.addEventListener('resize',positionPopover);window.addEventListener('scroll',positionPopover,true);
  function showTrigger(anchor,name) {openPopover(anchor,'Параметры триггера',`<p class="popover-muted" style="margin:0 0 12px;overflow-wrap:anywhere">${esc(name)}</p>${parameterList(selected())}<p class="popover-muted">Триггер использует выбранную конфигурацию: ${esc(selected().name)}</p>${button('Открыть триггеры','view="triggers"')}`);}
  $('stages-button').addEventListener('click',e=>openPopover(e.currentTarget,'Этапы задачи',`<ol class="stage-list">${['Получить контрагентов для актуализации','Проверить по чёрным спискам','Обновить атрибуты контрагента','Сохранить результат проверки'].map((s,i)=>`<li><span class="stage-number">${i+1}</span><span>${s}</span></li>`).join('')}</ol><p class="popover-muted">Этапы выполняются последовательно при каждом запуске.</p>`));
  function openEditor(mode) {
    if(running){toast('Дождитесь завершения текущего запуска');return;}
    closePopover(false);currentTable.closeFilter(false);carouselTips.forEach(t=>t.close());formFields.forEach(f=>f.destroy());formFields=[];
    const original=mode==='new'?configs[0]:selected(),c={...original,name:mode==='new'?'':mode==='copy'?original.name+' — копия':original.name};editor={mode,id:original.id};
    $('modal-title').textContent=mode==='edit'?'Изменить конфигурацию':mode==='copy'?'Копия конфигурации':'Новая конфигурация';$('modal-save').textContent=mode==='edit'?'Сохранить':'Создать конфигурацию';$('config-form-error').textContent='';
    const field=(id,options)=>{const f=new Field($(id),{size:'l',hint:'',...options});formFields.push(f);return f;};
    editor.name=field('config-name-field',{label:'Название конфигурации',value:c.name,required:true});editor.name.input.maxLength=80;
    editor.timeout=field('config-timeout-field',{label:'Таймаут',value:c.timeout,required:true,suffix:'сек'});editor.timeout.input.inputMode='numeric';
    editor.party=field('config-party-field',{type:'selector',label:'Тип контрагента',value:c.party,options:[{value:'PHYSICAL',label:'Физическое лицо'},{value:'LEGAL',label:'Юридическое лицо'},{value:'ALL',label:'Все типы'}]});
    editor.page=field('config-page-field',{label:'Размер страницы',value:c.pageSize,required:true});editor.page.input.inputMode='numeric';
    editor.terminate=new Checkbox($('config-terminate-field'),{label:'Остановить задачу при ошибке',checked:c.terminate});
    editor.background=new Toggle($('config-background-field'),{label:'Выполнять в фоне',checked:c.background});
    $('config-modal').showModal();editor.name.input.focus();
  }
  function closeEditor(){formFields.forEach(f=>f.close());$('config-modal').close();}
  $('modal-close').addEventListener('click',closeEditor);$('modal-cancel').addEventListener('click',closeEditor);
  $('config-modal').addEventListener('cancel',e=>{if(formFields.some(f=>f.opened)){e.preventDefault();formFields.forEach(f=>f.close());}});
  $('config-form').addEventListener('submit',e=>{
    e.preventDefault();const name=editor.name.value.trim(),timeout=Number(editor.timeout.value),pageSize=Number(editor.page.value);
    for(const f of formFields){f.error='';f.sync();}
    let bad;
    const invalid=(field,message)=>{field.error=message;field.sync();bad??=field;};
    if(!name)invalid(editor.name,'Введите название');else if(configs.some(c=>c.name.toLocaleLowerCase('ru')===name.toLocaleLowerCase('ru')&&(editor.mode!=='edit'||c.id!==editor.id)))invalid(editor.name,'Такое название уже есть');
    if(!/^\d+$/.test(editor.timeout.value)||timeout>86400)invalid(editor.timeout,'От 0 до 86400 секунд');
    if(!/^\d+$/.test(editor.page.value)||pageSize<1||pageSize>100000)invalid(editor.page,'От 1 до 100000');
    if(!editor.party.value)invalid(editor.party,'Выберите тип контрагента');
    if(bad){$('config-form-error').textContent='Проверьте выделенные поля';bad.input.focus();return;}
    const value={name,timeout,party:editor.party.value,terminate:editor.terminate.checked,pageSize,background:editor.background.checked};
    if(editor.mode==='edit'){Object.assign(configs.find(c=>c.id===editor.id),value);addEvent(`Изменена конфигурация «${name}»`);}else {selectedId='config-'+Date.now();configs.push({...value,id:selectedId,creator:'performer_consent',created:formatNow()});addEvent(`Создана конфигурация «${name}»`);}
    closeEditor();renderConfigurations(true);toast(editor.mode==='edit'?'Конфигурация сохранена':'Конфигурация создана');
  });
  $('run-button').addEventListener('click',()=>{
    if(running)return;running=true;closePopover(false);const c={...selected()},started=new Date();
    $('run-button').disabled=true;$('run-button').dataset.state='all-loading';$('run-button').setAttribute('aria-busy','true');$('run-feedback').textContent='Проверяем контрагентов…';
    const date=d=>new Intl.DateTimeFormat('ru').format(d),time=d=>new Intl.DateTimeFormat('ru',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(d);
    runTimer=setTimeout(()=>{
      const end=new Date(),duration=Math.max(1,end-started);rows.unshift({id:'run-'+Date.now(),config:c.name,configId:c.id,configuration:c,trigger:'Разовый запуск',start:date(started),startTime:time(started),end:date(end),endTime:time(end),duration,initiator:'performer_consent',status:'Успешно',comment:`Проверка завершена. Обработано ${Math.min(c.pageSize,128)} контрагентов; ошибок: 0.`,new:true});
      addEvent(`Завершён запуск конфигурации «${c.name}»`);running=false;$('run-button').disabled=false;$('run-button').dataset.state='default';$('run-button').removeAttribute('aria-busy');$('run-feedback').textContent='Задача выполнена · ошибок нет';refreshTables();toast('Проверка завершена. Результат добавлен в журнал.');
    },1100);
  });
  function eventContent(audit=false){const box=document.createElement('div');box.className='content-card';box.innerHTML=`<ul class="event-list">${events.map(e=>`<li><time>${esc(e.time)}</time><span>${esc(e.text)}</span><small>${esc(e.user)}</small></li>`).join('')}</ul>`;return box;}
  function showView(next,updateHash=true) {
    const allowed=['tasks','runs','triggers','history','nodes','settings','audit'];if(!allowed.includes(next))next='tasks';view=next;closePopover(false);document.dispatchEvent(new Event('ui:panel-change'));secondaryTable?.destroy();secondaryTable=null;
    $('task-view').hidden=next!=='tasks';$('secondary-view').hidden=next==='tasks';
    document.querySelectorAll('.side-nav [data-view]').forEach(b=>{if(b.dataset.view===next||(next==='runs'&&b.dataset.view==='history'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    if(updateHash)history.replaceState(null,'','#'+next);
    if(next==='tasks'){$('breadcrumb-label').textContent='Маркетинговые кампании';window.scrollTo({top:0});return;}
    const names={runs:['Все запуски','Полный журнал запусков этой задачи. Сортируйте столбцы и сочетайте фильтры.'],triggers:['Триггеры задачи','Два события, по которым запускается проверка контрагентов.'],history:['История изменений','Изменения конфигураций и последние действия с задачей.'],nodes:['Ноды','Исполнители, на которых выполняются фоновые задачи.'],settings:['Настройки задачи','Уведомления и параметры повторного запуска.'],audit:['Аудит','Действия пользователей с текущей задачей.']};
    $('secondary-title').textContent=names[next][0];$('secondary-description').textContent=names[next][1];$('breadcrumb-label').textContent=names[next][0];const content=$('secondary-content');content.replaceChildren();
    if(next==='runs'){const wrapper=document.createElement('div');wrapper.className='runs-section';content.append(wrapper);secondaryTable=makeTable(wrapper,true);}
    if(['history','audit'].includes(next))content.append(eventContent(next==='audit'));
    if(next==='triggers')content.innerHTML=`<div class="card-grid">${[['diagnosticMetricsForPreviousMonthTrigger','Метрики предыдущего месяца','По расписанию · каждый день в 02:00'],['detectPopularAttributesTrigger','Популярные атрибуты','При обновлении атрибутов контрагента']].map(([id,title,schedule])=>`<article class="content-card"><h2>${title}</h2><p style="overflow-wrap:anywhere">${id}</p><p>${schedule}</p><button class="ui-button" type="button" data-trigger="${id}">Параметры триггера</button></article>`).join('')}</div>`;
    if(next==='nodes'){content.innerHTML=`<div class="card-grid">${['task-worker-01','task-worker-02','task-worker-03'].map((name,i)=>`<article class="content-card"><h2>${name}</h2><div data-node-status="${i}"></div><p>${i===2?'Резервный исполнитель':'Фоновые проверки контрагентов'}</p><dl class="popover-dl"><div><dt>Задач в очереди</dt><dd>${i===2?0:i+1}</dd></div><div><dt>Последний сигнал</dt><dd>Только что</dd></div></dl></article>`).join('')}</div>`;content.querySelectorAll('[data-node-status]').forEach(m=>new Status(m,{text:'Доступна',tone:'success',trailing:false}));}
    if(next==='settings'){
      content.innerHTML='<form class="content-card settings-form" id="settings-form" novalidate><h2>Параметры выполнения</h2><div class="settings-row" id="setting-notify"></div><div class="settings-row" id="setting-retry"></div><div class="settings-row"><span>Интервал повторной проверки</span><div id="setting-interval"></div></div><button class="ui-button" data-type="primary" data-color="accent" type="submit">Сохранить настройки</button></form>';
      const notify=new Toggle($('setting-notify'),{label:'Уведомлять о завершении',checked:settings.notify}),retry=new Toggle($('setting-retry'),{label:'Повторять при ошибке',checked:settings.retry}),interval=new Field($('setting-interval'),{size:'m',label:'Интервал',suffix:'мин',value:settings.interval,required:true,hint:''});
      $('settings-form').addEventListener('submit',e=>{e.preventDefault();if(!/^\d+$/.test(interval.value)||Number(interval.value)<1||Number(interval.value)>1440){interval.error='От 1 до 1440 минут';interval.sync();interval.input.focus();return;}Object.assign(settings,{notify:notify.checked,retry:retry.checked,interval:interval.value});interval.error='';interval.sync();addEvent('Обновлены настройки задачи');toast('Настройки сохранены');});
    }
    window.scrollTo({top:0});
  }
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-view]');if(nav){showView(nav.dataset.view);return;}
    const close=e.target.closest('[data-popover-close]');if(close){closePopover();return;}
    const trigger=e.target.closest('[data-trigger]');if(trigger){showTrigger(trigger,trigger.dataset.trigger);return;}
    const info=e.target.closest('[data-run-details]');if(info){const row=rows.find(r=>r.id===info.dataset.runDetails);if(!row)return;const c=row.configuration||configs.find(c=>c.id===row.configId)||configs[0];openPopover(info,'Параметры конфигурации',parameterList(c)+`<p class="popover-muted">${esc(row.config)} · ${esc(row.status)}<br>${esc(row.start)} ${esc(row.startTime)}</p>`);return;}
    const module=e.target.closest('[data-module]');if(module)openPopover(module,module.dataset.module,`<p class="popover-muted" style="margin:0 0 12px">Проверки контрагентов связаны с задачами актуализации и журналом результатов.</p><div class="popover-links">${button('Проверки по чёрным спискам','view="tasks"')}${button('Журнал запусков','view="runs"')}${button('Аудит изменений','view="audit"')}</div>`);
    const support=e.target.closest('[data-support]');if(support)openPopover(support,'Поддержка',`<p>Для проверки выберите конфигурацию и нажмите «Запустить». Результат появится в журнале.</p><div class="popover-links"><a href="ui-kit.html#components">Компоненты дизайн-системы</a><a href="ui-kit.html#tables">Примеры таблиц</a></div>`);
    const account=e.target.closest('[data-account]');if(account)openPopover(account,'performer_consent','<p class="popover-muted" style="margin:0 0 12px">Роль: администратор задач</p><div class="popover-links">'+button('Настройки задачи','view="settings"')+button('Мои действия','view="audit"')+'</div>');
  });
  $('back-button').addEventListener('click',()=>{if(view!=='tasks')showView('tasks');else openPopover($('back-button'),'Маркетинговые кампании',`<div class="popover-links">${button('Проверки по чёрным спискам','view="tasks"')}${button('Журнал запусков','view="runs"')}</div>`);});
  window.addEventListener('hashchange',()=>showView(location.hash.slice(1),false));
  renderConfigurations();showView(location.hash.slice(1)||'tasks',false);
  window.TaskAdminDemo={get configurations(){return configs;},get runs(){return rows;},get selectedId(){return selectedId;},get running(){return running;},get table(){return view==='runs'?secondaryTable:currentTable;},showView,chooseConfig};
})();
