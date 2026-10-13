(() => {
  'use strict';
  const {Field,Menu} = UIKitControls;
  const types = {input:'Input',selector:'Selector',multiselector:'Multiselector',search:'Search',date:'Date picker',time:'Time picker'};
  const sizes = {l:'L / 40',m:'M / 32',s:'S / 24'};
  const states = {default:'Default','default-error':'Default error',hover:'Hover',active:'Active',filled:'Filled',error:'Error','disabled-default':'Disabled','disabled-filled':'Disabled filled'};
  const cities = ['Москва','Санкт-Петербург','Казань','Нижний Новгород','Самара','Екатеринбург','Новосибирск','Сочи','Владивосток'];
  const searchOptions = [
    {value:'Кнопки',label:'Кнопки',description:'Primary, secondary, outline и ghost'},
    {value:'Поля ввода',label:'Поля ввода',description:'Input и автокомплит'},
    {value:'Таблицы',label:'Таблицы',description:'Строки, колонки и сортировка'},
    {value:'Иконки',label:'Иконки',description:'Библиотека SVG'},
    {value:'Календарь',label:'Календарь',description:'Выбор дня, месяца и года'}
  ];
  const defaults = {input:'Simple text',selector:'Item name',multiselector:['Item name','Item name 2','Item name 3'],search:'Кнопки',date:'07.10.2026',time:'09:30'};
  const calendarModes = {single:'Одна дата',range:'Диапазон'};
  let live = {type:'input',size:'l',state:'default',label:true,required:true,hint:true,clear:true,leading:false,suffix:false,autocomplete:true,save:false,calendarMode:'single',twoMonths:true};
  let liveField, matrixType = 'input', matrixCalendarMode = 'single', matrixFields = [];
  const segmentButtons = (map,value,attr) => Object.entries(map).map(([key,label])=>`<button type="button" class="segment" ${attr}="${key}" aria-pressed="${key===value}">${label}</button>`).join('');
  function configFor(type,size,state='default',calendarMode='single') {
    return {type,size,state,label:'Label',required:true,hint:'Подсказка',errorHint:'Подсказка',selectionMode:calendarMode,value:['filled','error','disabled-filled','filled-hover'].includes(state) ? type==='date' && calendarMode==='range' ? '13.06.2024 – 13.07.2024' : defaults[type] : '',autocomplete:type==='search',options:type==='search'?searchOptions:Array.from({length:12},(_,i)=>i===0?'Item name':`Item name ${i+1}`)};
  }
  function updateLive() {
    liveField?.destroy();
    document.querySelector('#field-type-controls').innerHTML = segmentButtons(types,live.type,'data-live-type');
    document.querySelector('#field-size-controls').innerHTML = segmentButtons(sizes,live.size,'data-live-size');
    document.querySelector('#field-state-controls').innerHTML = segmentButtons(states,live.state,'data-live-state');
    const config = {...configFor(live.type,live.size,live.state,live.calendarMode),monthsToShow:live.twoMonths?2:1,label:live.label?'Label':'',required:live.required,hint:live.hint?'Подсказка':'',clear:live.clear,leading:live.leading,suffix:live.suffix && live.type==='input'?'лет':'',autocomplete:['input','search'].includes(live.type) && live.autocomplete,commit:live.type==='multiselector' && live.save?'save':'immediate',options:live.type==='input'?cities:live.type==='search'?searchOptions:configFor(live.type,live.size).options};
    liveField = new Field(document.querySelector('#field-live-mount'),config);
    document.querySelector('#field-preview-caption').textContent = `${types[live.type]}${live.type==='date'?' / '+calendarModes[live.calendarMode]:''} · ${sizes[live.size]} · 300 px · ${states[live.state]}`;
    document.querySelector('#field-keyboard-note').innerHTML = live.type === 'input' && !live.autocomplete ? 'Введите текст или очистите поле.' : '<kbd>↑</kbd> <kbd>↓</kbd> выбор · <kbd>Enter</kbd> подтвердить · <kbd>Esc</kbd> закрыть';
    document.querySelector('#field-autocomplete-setting').hidden = !['input','search'].includes(live.type);
    document.querySelector('#field-suffix-setting').hidden = live.type !== 'input';
    document.querySelector('#field-save-setting').hidden = live.type !== 'multiselector';
    document.querySelector('#field-calendar-settings').hidden = live.type !== 'date';
    document.querySelector('#field-calendar-mode-controls').innerHTML = segmentButtons(calendarModes,live.calendarMode,'data-live-calendar-mode');
    document.querySelector('#field-two-months-setting').hidden = live.calendarMode !== 'range';
    if (live.type==='date' && live.calendarMode==='range') document.querySelector('#field-keyboard-note').innerHTML = 'Первый клик — точка A, второй — B. <kbd>Esc</kbd> закрыть · крестик сбрасывает обе даты.';
    document.querySelector('#field-live-status').textContent = '';
    liveField.root.addEventListener('ui:change',event => {
      const value = Array.isArray(event.detail.value) ? event.detail.value.join(', ') : event.detail.value;
      document.querySelector('#field-live-status').textContent = value ? `Выбрано: ${value}` : 'Поле очищено';
    });
    liveField.root.addEventListener('ui:draft',()=>{document.querySelector('#field-live-status').textContent='Изменения ждут сохранения';});
    liveField.root.addEventListener('ui:cancel',()=>{document.querySelector('#field-live-status').textContent='Изменения отменены';});
    liveField.root.addEventListener('ui:input',event=>{
      if(event.detail.range)document.querySelector('#field-live-status').textContent=`A: ${event.detail.range.start || 'не выбрана'} · B: ${event.detail.range.end || 'выберите конец'}`;
    });
    liveField.root.addEventListener('ui:search',event => {
      document.querySelector('#field-live-status').textContent = event.detail.value ? `Поиск: ${event.detail.value}` : 'Введите поисковый запрос';
    });
    if (live.state === 'active') { liveField.input.focus({preventScroll:true}); if(liveField.hasPopup && live.type!=='input' && live.type!=='search')liveField.open(); }
  }
  function renderMatrix() {
    matrixFields.forEach(field=>field.destroy());matrixFields=[];
    document.querySelector('#field-matrix-types').innerHTML = segmentButtons(types,matrixType,'data-matrix-type');
    document.querySelector('#field-matrix-title').textContent = types[matrixType];
    document.querySelector('#field-matrix-calendar-settings').hidden = matrixType !== 'date';
    document.querySelector('#field-matrix-calendar-modes').innerHTML = segmentButtons(calendarModes,matrixCalendarMode,'data-matrix-calendar-mode');
    const mount=document.querySelector('#field-matrix-mount');
    mount.innerHTML='';
    for (const [state,label] of Object.entries(states)) {
      const row=document.createElement('div');row.className='field-matrix-row';row.dataset.matrixState=state;
      const name=document.createElement('span');name.className='field-state-name';name.textContent=label;row.append(name);
      for (const size of Object.keys(sizes)) {
        const cell=document.createElement('div');row.append(cell);
        matrixFields.push(new Field(cell,configFor(matrixType,size,state,matrixCalendarMode)));
      }
      mount.append(row);
    }
  }
  document.querySelector('#fields-panel').addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.liveType){live.type=button.dataset.liveType;updateLive();}
    if(button.dataset.liveSize){live.size=button.dataset.liveSize;updateLive();}
    if(button.dataset.liveState){live.state=button.dataset.liveState;updateLive();}
    if(button.dataset.liveCalendarMode){live.calendarMode=button.dataset.liveCalendarMode;updateLive();}
    if(button.dataset.matrixType){matrixType=button.dataset.matrixType;renderMatrix();}
    if(button.dataset.matrixCalendarMode){matrixCalendarMode=button.dataset.matrixCalendarMode;renderMatrix();}
  });
  document.querySelectorAll('[data-field-setting]').forEach(input=>input.addEventListener('change',()=>{live[input.dataset.fieldSetting]=input.checked;updateLive();}));
  const panelNames=['fields','buttons','colors','components','foundations','tables'];
  function showPanel(name,updateURL=true) {
    document.querySelectorAll('[data-kit-panel]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.kitPanel===name)));
    panelNames.forEach(panel=>{document.getElementById(panel+'-panel').hidden=panel!==name;});
    liveField.close();matrixFields.forEach(field=>field.close());
    menuExamples.forEach(field=>field.close());
    calendarExamples.forEach(field=>field.close());
    document.dispatchEvent(new CustomEvent('ui:panel-change',{detail:{name}}));
    if(updateURL){history.replaceState(null,'','#'+name);window.scrollTo(0,0);}
  }
  document.querySelectorAll('[data-kit-panel]').forEach(button=>button.addEventListener('click',()=>showPanel(button.dataset.kitPanel)));
  function followHash() {
    const id=location.hash.slice(1),target=document.getElementById(id),panel=target?.closest('main.page');
    const name=panelNames.includes(id)?id:panel?.id.replace(/-panel$/,'');
    if(!panelNames.includes(name))return;
    showPanel(name,false);
    requestAnimationFrame(()=>{if(target)target.scrollIntoView({block:'start'});else window.scrollTo(0,0);});
  }
  window.addEventListener('hashchange',followHash);
  updateLive();renderMatrix();
  const calendarExamples = [
    new Field(document.querySelector('#example-calendar-single'),{type:'date',label:'Дата',hint:'Выберите одну дату',value:'13.06.2024'}),
    new Field(document.querySelector('#example-calendar-range'),{type:'date',selectionMode:'range',label:'Диапазон дат',hint:'Кликните начало A, затем конец B',value:{start:'13.06.2024',end:'13.07.2024'}})
  ];
  const showCalendarValues=()=>{
    document.querySelector('#calendar-single-status').textContent=calendarExamples[0].value?`Выбрано: ${calendarExamples[0].value}`:'Дата не выбрана';
    const range=calendarExamples[1].range;
    document.querySelector('#calendar-range-start').textContent=range.start || 'не выбрана';
    document.querySelector('#calendar-range-end').textContent=range.end || 'не выбрана';
  };
  calendarExamples.forEach(field=>['ui:input','ui:change'].forEach(event=>field.root.addEventListener(event,showCalendarValues)));
  showCalendarValues();
  new Field(document.querySelector('#example-city'),{label:'Город',hint:'Выберите из списка или введите свой',type:'input',autocomplete:true,options:cities});
  new Field(document.querySelector('#example-search'),{label:'Поиск компонентов',hint:'Название или описание',type:'search',autocomplete:true,options:searchOptions,required:false});
  const menuIcon = {default:'assets/icons/b0b35.svg',selected:'assets/icons/045bb.svg',hover:'assets/icons/6386a.svg'};
  const industries = ['Кибербезопасность','Облачные сервисы','Базы данных','IT интеграторы','Искусственный интеллект','Связь и телекоммуникации','Data Science','Системы виртуализации','Здравоохранение'];
  const industryGroups = [
    {label:'Агропромышленность',children:[{value:'Сельское хозяйство',label:'Сельское хозяйство',description:'Выращивание и переработка',icon:menuIcon},'Агрооборудование']},
    {label:'Информационные технологии',expanded:true,children:industries.slice(0,8).map((label,i)=>({value:label,label,icon:i===0 || i===4 ? menuIcon : undefined,description:i===0?'Защита данных и инфраструктуры':i===4?'Модели, обучение и автоматизация':undefined}))},
    {label:'Здравоохранение',children:['Медицинское оборудование','Цифровая медицина']}
  ];
  const initialIndustries = ['Кибербезопасность','Облачные сервисы','Искусственный интеллект'];
  const menuExamples = [
    new Field(document.querySelector('#example-multi'),{type:'multiselector',label:'Отрасли',hint:'Можно выбрать несколько',options:industries,value:initialIndustries}),
    new Field(document.querySelector('#example-multi-save'),{type:'multiselector',label:'Отрасли',hint:'Подтвердите выбор кнопкой',options:industries,value:initialIndustries,commit:'save'}),
    new Field(document.querySelector('#example-multi-groups'),{type:'multiselector',label:'Отрасли',hint:'Выберите направления',options:industryGroups,value:initialIndustries,bulkActions:false})
  ];
  ['multi-status','multi-save-status','multi-groups-status'].forEach((id,index)=>{
    const field=menuExamples[index],status=document.getElementById(id);
    const showValue=()=>{status.textContent=field.value.length?`Выбрано: ${field.value.length}`:'Ничего не выбрано';};
    field.root.addEventListener('ui:change',showValue);
    field.root.addEventListener('ui:draft',()=>{status.textContent='Изменения ждут сохранения';});
    field.root.addEventListener('ui:cancel',()=>{status.textContent=`Изменения отменены · выбрано: ${field.value.length}`;});
    showValue();
  });
  new Menu(document.querySelector('#example-menu-content'),{label:'Содержимое строк',value:['both'],options:[
    {value:'plain',label:'Только название'},
    {value:'icon',label:'С иконкой слева',icon:menuIcon},
    {value:'description',label:'С описанием',description:'Дополнительная информация'},
    {value:'both',label:'Иконка и описание',description:'Обе настройки в одной строке',icon:menuIcon}
  ]});
  const statesMenu = new Menu(document.querySelector('#example-menu-states'),{label:'Состояния строк',value:['selected'],options:[
    {value:'default',label:'Обычная строка',description:'Description',icon:menuIcon},
    {value:'selected',label:'Выбранная строка',description:'Description',icon:menuIcon},
    {value:'hover',label:'Наведение / клавиатура',description:'Description',icon:menuIcon}
  ]});
  statesMenu.highlight(2);
  new Menu(document.querySelector('#example-menu-collapse'),{label:'Раскрываемые группы',value:['cyber'],options:[
    {label:'Закрытая группа',children:['Первый пункт','Второй пункт']},
    {label:'Открытая группа',expanded:true,children:[{value:'cyber',label:'Кибербезопасность',icon:menuIcon},{label:'Вложенная группа',children:['Облачные сервисы','Базы данных']},'Связь и телекоммуникации']}
  ]});
  const meetingType=new Field(document.querySelector('#example-meeting-type'),{label:'Формат встречи',type:'selector',hint:'Выберите формат',options:['Видеозвонок','В офисе','Телефонный звонок']});
  const date=new Field(document.querySelector('#example-date'),{label:'Дата',type:'date',hint:'дд.мм.гггг · можно ввести вручную'});
  const time=new Field(document.querySelector('#example-time'),{label:'Время',type:'time',hint:'чч:мм · список с шагом 15 минут'});
  document.querySelector('#meeting-form').addEventListener('submit',event=>{
    event.preventDefault();
    const fields=[meetingType,date,time],valid=fields.map(field=>field.validate());
    const result=document.querySelector('#meeting-result');
    if(valid.every(Boolean))result.textContent=`${meetingType.value} · ${date.value} · ${time.value}`;
    else {result.textContent='Проверьте поля';fields[valid.indexOf(false)].input.focus();}
  });
  followHash();
})();
