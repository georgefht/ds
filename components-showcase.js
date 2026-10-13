(() => {
  'use strict';
  const {TextArea,Toggle,Checkbox,Radio,Badge,Counter,Status,Tabs,SegmentControl,CollapseSection,CollapseString,CollapseButton,Tooltip}=UIKitComponents;
  const get=id=>document.getElementById(id);
  function sample(parent,caption='') {const box=document.createElement('div');box.className='component-sample';if(caption){const label=document.createElement('span');label.className='component-caption';label.textContent=caption;box.append(label);}const mount=document.createElement('div');box.append(mount);parent.append(box);return mount;}
  function text(content){const p=document.createElement('p');p.className='component-demo-content';p.textContent=content;return p;}
  const textarea=new TextArea(get('component-textarea-live'),{label:'Комментарий',hint:'Кратко опишите детали',name:'comment'});
  new TextArea(get('textarea-filled'),{label:'Комментарий',value:'Simple text',hint:'Подсказка'});
  new TextArea(get('textarea-error'),{label:'Комментарий',state:'error',value:'Simple text',errorHint:'Проверьте комментарий'});
  new TextArea(get('textarea-disabled'),{label:'Комментарий',value:'Simple text',state:'disabled-filled'});
  for(const state of ['default','hover','active','disabled-default'])new TextArea(sample(get('textarea-states'),state),{label:'Label',state});
  get('textarea-validate').addEventListener('click',()=>{const valid=textarea.validate();get('textarea-result').textContent=valid?'Комментарий заполнен':'Введите комментарий';if(!valid)textarea.input.focus();});
  get('textarea-reset').addEventListener('click',()=>{textarea.setValue('');get('textarea-result').textContent='Поле очищено';textarea.input.focus();});
  const toggleOptions=[{label:'Уведомления',checked:true},{label:'Автосохранение',position:'right'},{label:'',accessibleLabel:'Компактный переключатель',checked:false}];
  toggleOptions.forEach(config=>{const c=new Toggle(sample(get('toggle-live')),config);c.root.addEventListener('ui:change',()=>get('toggle-result').textContent=`${config.label || 'Переключатель'}: ${c.checked?'включено':'выключено'}`);});
  for(const state of ['hover','disabled'])for(const checked of [false,true])new Toggle(sample(get('toggle-states'),`${state} · ${checked?'on':'off'}`),{state,checked,label:'Text'});
  const parent=new Checkbox(sample(get('checkbox-live')),{label:'Выбрать всё',indeterminate:true,name:'choose-all'});
  const children=['Дизайн','Разработка','Аналитика'].map((label,i)=>new Checkbox(sample(get('checkbox-live')),{label,checked:i===0,name:'directions',value:label}));
  function updateCheckGroup(){const count=children.filter(c=>c.checked).length;parent.setChecked(count===children.length,{indeterminate:count>0&&count<children.length});get('checkbox-result').textContent=`Выбрано: ${count} из ${children.length}`;}
  children.forEach(c=>c.root.addEventListener('ui:change',updateCheckGroup));parent.root.addEventListener('ui:change',()=>{children.forEach(c=>c.setChecked(parent.checked));updateCheckGroup();});updateCheckGroup();
  for(const state of ['hover','disabled'])for(const checked of [false,true])new Checkbox(sample(get('checkbox-states'),`${state} · ${checked?'on':'off'}`),{state,checked,label:'Text'});
  for(const state of ['default','hover','disabled'])new Checkbox(sample(get('checkbox-states'),`${state} · multi`),{state,indeterminate:true,label:'Text'});
  ['Видеозвонок','В офисе','Телефон'].forEach((label,i)=>{const c=new Radio(sample(get('radio-live')),{label,value:label,name:'meeting-format',checked:i===0});c.root.addEventListener('ui:change',e=>get('radio-result').textContent=`Выбрано: ${e.detail.value}`);});get('radio-result').textContent='Выбрано: Видеозвонок';
  for(const state of ['hover','disabled'])for(const checked of [false,true])new Radio(sample(get('radio-states'),`${state} · ${checked?'on':'off'}`),{state,checked,label:'Text',name:`radio-example-${state}-${checked}`});
  const stringExamples=[
    new CollapseString(get('collapse-string-h2'),{title:'Основные сведения',nearAction:'Изменить',actions:['Копировать','Сохранить'],open:true,content:text('Содержимое раскрывается под строкой, без рамки и подложки.')}),
    new CollapseString(get('collapse-string-body'),{title:'Дополнительные сведения',size:'body',nearAction:'Изменить',actions:['Сохранить'],content:text('Компактная строка Body с отступом до содержимого 8 px.')})
  ];
  stringExamples.forEach(c=>{c.root.addEventListener('ui:change',e=>get('collapse-string-result').textContent=`${c.config.title}: ${e.detail.open?'открыто':'закрыто'}`);c.root.addEventListener('ui:action',e=>get('collapse-string-result').textContent=`Нажато «${e.detail.label}»`);});
  const collapseExamples=[new CollapseSection(get('collapse-h2'),{title:'Основные сведения',nearAction:'Изменить',actions:['Копировать','Сохранить'],content:text('Здесь можно разместить поля формы, текст или другие компоненты.'),open:true}),new CollapseSection(get('collapse-body'),{title:'Дополнительные сведения',size:'body',nearAction:'Изменить',actions:['Сохранить'],content:text('Компактный заголовок Body. Действия работают отдельно от раскрытия.')}),new CollapseSection(get('collapse-plain'),{title:'Раздел без дополнительных действий',trailing:false,content:text('Раскрытие доступно мышью и клавишами Enter или Space.')})];
  collapseExamples.forEach(c=>{c.root.addEventListener('ui:change',e=>get('collapse-result').textContent=`${c.config.title}: ${e.detail.open?'открыто':'закрыто'}`);c.root.addEventListener('ui:action',e=>get('collapse-result').textContent=`Нажато «${e.detail.label}»`);});
  for(const color of ['neutral','accent'])new CollapseButton(get('collapse-button-'+color),{label:'Подробнее',color,content:text('Содержимое раскрыто отдельной компактной кнопкой.')});
  const tones={neutral:'Neutral',accent:'Accent',green:'Green',yellow:'Yellow',purple:'Purple',critical:'Critical'};
  Object.entries(tones).forEach(([tone,label])=>new Badge(sample(get('badge-tones'),label),{tone,text:'Badge'}));
  new Badge(sample(get('badge-states'),'Hover'),{tone:'accent',state:'hover'});new Badge(sample(get('badge-states'),'Без иконок и счётчика'),{tone:'green',leading:false,trailing:false,counter:false,text:'Готово'});new Badge(sample(get('badge-states'),'Loading'),{tone:'loading'});
  const counterColors=['critical','warning','neutral','accent','secondary','green','yellow','purple','red','loading'];
  for(const size of [18,24])counterColors.forEach(tone=>new Counter(sample(get(size===18?'counter-small':'counter-large')),{tone,size}));
  let count=98;const counter=new Counter(get('counter-live'),{tone:'accent',value:count,size:24});get('counter-plus').addEventListener('click',()=>counter.setValue(++count));get('counter-minus').addEventListener('click',()=>{count=Math.max(0,count-1);counter.setValue(count);});
  const statusTones={success:'Готово',critical:'Ошибка',progress:'В работе',caution:'Внимание',neutral:'Не задано',purple:'Проверка',blue:'Информация'};let statusSize=24;
  function renderStatuses(){get('status-tones').replaceChildren();get('status-states').replaceChildren();Object.entries(statusTones).forEach(([tone,label])=>{new Status(sample(get('status-tones')),{tone,text:label,size:statusSize});new Status(sample(get('status-tones')),{tone,text:label,style:'text',size:statusSize});});new Status(sample(get('status-states'),'Hover'),{tone:'success',text:'Готово',state:'hover',size:statusSize});new Status(sample(get('status-states'),'Disabled'),{tone:'success',text:'Готово',disabled:true,size:statusSize});new Status(sample(get('status-states'),'Text · Hover'),{tone:'critical',text:'Ошибка',style:'text',state:'hover',size:statusSize});}
  document.querySelectorAll('[data-status-size]').forEach(b=>b.addEventListener('click',()=>{statusSize=Number(b.dataset.statusSize);document.querySelectorAll('[data-status-size]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderStatuses();}));renderStatuses();
  new Tabs(get('tabs-live'),{label:'Сведения',value:'overview',items:[{value:'overview',label:'Обзор',counter:3,content:text('Обзор: основные сведения о выбранном объекте.')},{value:'documents',label:'Документы',counter:12,content:text('Документы: список прикреплённых файлов и материалов.')},{value:'history',label:'История',counter:'99+',content:text('История: изменения и события.')},{value:'archive',label:'Архив',disabled:true,counter:false,content:text('Архив недоступен.')} ]});
  ['default','hover','active','disabled'].forEach(state=>new Tabs(sample(get('tabs-states'),state),{items:[{value:state,label:'Item 1',state,disabled:state==='disabled',content:''}]}));
  const placements={'top':'Top','top-left':'TopLeft','top-right':'TopRight','left':'Left','right':'Right','bottom':'Bottom','bottom-left':'BottomLeft','bottom-right':'BottomRight'};
  Object.entries(placements).forEach(([placement,label])=>{const b=document.createElement('button');b.className='segment';b.type='button';b.textContent=label;b.dataset.tooltipPlacement=placement;get('tooltip-triggers').append(b);new Tooltip(b,{placement,text:'Tip text'});});
  const segment=new SegmentControl(get('segment-live'),{label:'Представление',value:'configuration',items:[{value:'configuration',label:'Конфигурация',counter:'99+'},{value:'activity',label:'Активность',counter:12},{value:'reports',label:'Отчёты',counter:3,disabled:true}]});
  segment.root.addEventListener('ui:change',e=>get('segment-result').textContent=`Выбрано: ${segment.config.items.find(i=>i.value===e.detail.value).label}`);get('segment-result').textContent='Выбрано: Конфигурация';
  ['default','hover','active','disabled'].forEach(state=>new SegmentControl(sample(get('segment-states'),state),{items:[{value:state,label:'Конфигурация',state,trailing:true,disabled:state==='disabled'}]}));
})();
