(() => {
  'use strict';
  const assetSizes = {"60402.svg":{"width":18.0,"height":18.0},"71dfc.svg":{"width":14.0,"height":14.0},"b826a.svg":{"width":18.0,"height":18.0},"c340a.svg":{"width":18.0,"height":18.0},"48d6f.svg":{"width":18.0,"height":18.0},"0a7b1.svg":{"width":18.0,"height":18.0},"6fc14.svg":{"width":18.0,"height":18.0},"3d94a.svg":{"width":18.0,"height":18.0},"cec8d.svg":{"width":18.0,"height":18.0},"10fae.svg":{"width":14.0,"height":14.0},"966a5.svg":{"width":18.0,"height":18.0},"52d98.svg":{"width":18.0,"height":18.0},"228aa.svg":{"width":18.0,"height":18.0},"519e5.svg":{"width":18.0,"height":18.0},"1e25b.svg":{"width":18.0,"height":18.0},"5685a.svg":{"width":18.0,"height":18.0},"5b569.svg":{"width":16.0,"height":16.0},"be8b5.svg":{"width":22.0,"height":22.0},"4fc0d.svg":{"width":22.0,"height":22.0},"d9baa.svg":{"width":22.0,"height":22.0},"698a1.svg":{"width":12.0,"height":12.0},"21a3c.svg":{"width":12.0,"height":12.0},"f2122.svg":{"width":12.0,"height":12.0},"aad04.svg":{"width":12.0,"height":12.0},"d1159.svg":{"width":12.0,"height":12.0},"6e237.svg":{"width":12.0,"height":12.0},"339a0.svg":{"width":18.0,"height":18.0},"d9e81.svg":{"width":18.0,"height":18.0},"85904.svg":{"width":22.0,"height":22.0},"ca67d.svg":{"width":22.0,"height":22.0},"9276d.svg":{"width":185.0,"height":2.0},"93fe4.svg":{"width":22.0,"height":22.0},"c76b8.svg":{"width":22.0,"height":22.0},"50685.svg":{"width":185.0,"height":2.0},"fc0ef.svg":{"width":22.0,"height":22.0},"44cc2.svg":{"width":22.0,"height":22.0},"693cb.svg":{"width":185.0,"height":2.0},"8311a.svg":{"width":22.0,"height":22.0},"a52a8.svg":{"width":22.0,"height":22.0},"0b870.svg":{"width":185.0,"height":2.0},"2df09.svg":{"width":29.0,"height":18.0},"0d0b8.svg":{"width":29.0,"height":18.0},"da5bc.svg":{"width":29.0,"height":18.0},"1ddcd.svg":{"width":29.0,"height":18.0},"95dd3.svg":{"width":29.0,"height":18.0},"3a64c.svg":{"width":29.0,"height":18.0},"4b605.svg":{"width":29.0,"height":18.0},"76d10.svg":{"width":22.0,"height":22.0},"fff27.svg":{"width":22.0,"height":22.0},"c0785.svg":{"width":22.0,"height":22.0},"2cdd2.svg":{"width":22.0,"height":22.0},"30dba.svg":{"width":22.0,"height":22.0},"0749e.svg":{"width":593.0,"height":1.0},"7258e.svg":{"width":24.0,"height":24.0},"d7375.svg":{"width":24.0,"height":24.0},"5140b.svg":{"width":16.0,"height":16.0},"146c1.svg":{"width":16.0,"height":16.0},"4f516.svg":{"width":20.0,"height":20.0},"8d540.svg":{"width":20.0,"height":20.0},"6739b.svg":{"width":20.0,"height":20.0},"ee95a.svg":{"width":16.0,"height":16.0},"710da.svg":{"width":16.0,"height":16.0},"cc92e.svg":{"width":24.0,"height":24.0},"35f89.svg":{"width":24.0,"height":24.0},"fbf7f.svg":{"width":20.0,"height":20.0},"3f670.svg":{"width":20.0,"height":20.0},"12dd7.svg":{"width":14.0,"height":14.0},"collapse-right-24.svg":{"width":24.0,"height":24.0},"collapse-right-20.svg":{"width":20.0,"height":20.0},"collapse-right-hover-20.svg":{"width":20.0,"height":20.0},"collapse-right-hover-24.svg":{"width":24.0,"height":24.0},"d4274.svg":{"width":24.0,"height":24.0},"77356.svg":{"width":24.0,"height":24.0},"8eec5.svg":{"width":20.0,"height":20.0},"ee6f6.svg":{"width":20.0,"height":20.0},"90769.svg":{"width":20.0,"height":20.0},"b4f0c.svg":{"width":20.0,"height":20.0}};
  const prefix = 'assets/components/';
  let serial = 0;
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const asset = (file,attributes='') => {
    const extraClass=attributes.match(/class="([^"]*)"/)?.[1] || '';attributes=attributes.replace(/class="[^"]*"/,'');
    const size=assetSizes[file];if(!size)throw new Error('Unknown component asset: '+file);
    return `<img class="uk-asset ${extraClass}" src="${prefix+file}" width="${size.width}" height="${size.height}" alt="" aria-hidden="true" ${attributes}>`;
  };
  const stack = (states,className='') => {
    const size=assetSizes[Object.values(states)[0]];
    return `<span class="uk-state-stack ${className}" style="width:${size.width}px;height:${size.height}px" aria-hidden="true">${Object.entries(states).map(([state,file])=>asset(file,`data-asset-state="${state}"`)).join('')}</span>`;
  };
  const paintStacks = (root,state) => root.querySelectorAll('[data-asset-state]').forEach(img=>{img.dataset.visible=String(img.dataset.assetState===state);});
  const token = (root,name,source) => root.style.setProperty(name,`var(--ds-${source})`);
  const appendContent = (target,content) => {
    if(content instanceof Node)target.append(content);else target.textContent=String(content ?? '');
  };
  class Component {
    emit(name,detail={}) { this.root.dispatchEvent(new CustomEvent(`ui:${name}`,{bubbles:true,detail})); }
    destroy() { this.root.remove(); }
  }
  const choices = new WeakMap();
  class Choice extends Component {
    constructor(mount,options={}) {
      super();this.config={kind:'checkbox',label:'Text',checked:false,indeterminate:false,state:'default',position:'left',...options};
      const c=this.config;this.disabled=c.disabled===true||c.state==='disabled';this.hovered=false;
      const id=`uk-choice-${++serial}`;
      const glyph=c.kind==='toggle' ? `<span class="uk-toggle-track" aria-hidden="true">${['2df09.svg','0d0b8.svg','da5bc.svg','1ddcd.svg','95dd3.svg','3a64c.svg','4b605.svg'].map(file=>asset(file)).join('')}</span>` : `<span class="uk-choice__glyph" aria-hidden="true">${c.kind==='checkbox' ? stack({default:'4f516.svg',hover:'8d540.svg',disabled:'6739b.svg'})+`<span class="uk-checkbox-mark">${['5140b.svg','ee95a.svg','710da.svg','146c1.svg'].map(file=>asset(file)).join('')}</span>` : ''}</span>`;
      mount.innerHTML=`<label class="uk-component uk-choice" data-kind="${escape(c.kind)}" data-position="${escape(c.position)}" for="${id}"><input class="uk-choice__input" id="${id}" type="${c.kind==='radio'?'radio':'checkbox'}" ${c.kind==='toggle'?'role="switch"':''} ${c.name?`name="${escape(c.name)}"`:''} value="${escape(c.value ?? 'on')}" ${c.checked?'checked':''} ${this.disabled?'disabled':''} ${!c.label?`aria-label="${escape(c.accessibleLabel || 'Переключатель')}"`:''}>${glyph}${c.label?`<span class="uk-choice__label">${escape(c.label)}</span>`:''}</label>`;
      this.root=mount.firstElementChild;this.input=this.root.querySelector('input');this.input.indeterminate=!!c.indeterminate;choices.set(this.input,this);
      this.input.addEventListener('change',()=>{this.syncGroup();this.emit('change',{checked:this.input.checked,value:this.input.value,indeterminate:this.input.indeterminate});});
      this.root.addEventListener('mouseenter',()=>{this.hovered=true;this.sync();});this.root.addEventListener('mouseleave',()=>{this.hovered=false;this.sync();});
      this.sync();
    }
    syncGroup() {
      if(this.config.kind==='radio'&&this.input.name){document.getElementsByName(this.input.name).forEach(input=>choices.get(input)?.sync());}else this.sync();
    }
    sync() {
      const c=this.config,check=this.input.indeterminate?'multi':this.input.checked?'on':'off';
      const state=this.disabled?'disabled':c.state==='hover'||this.hovered?'hover':'default';
      this.root.dataset.check=check;this.root.dataset.state=state;
      if(c.kind==='toggle') {
        const file=check==='on' ? ({default:'0d0b8.svg',hover:'95dd3.svg',disabled:'4b605.svg'})[state] : ({default:'2df09.svg',hover:c.position==='right'?'1ddcd.svg':'da5bc.svg',disabled:'3a64c.svg'})[state];
        this.root.querySelectorAll('.uk-toggle-track img').forEach(img=>{img.dataset.visible=String(img.getAttribute('src')===prefix+file);});
      } else if(c.kind==='checkbox') {
        this.root.querySelectorAll('[data-asset-state]').forEach(img=>{img.dataset.visible=String(check==='off'&&img.dataset.assetState===state);});
        const file=check==='multi'?'146c1.svg':({default:'5140b.svg',hover:'ee95a.svg',disabled:'710da.svg'})[state];
        this.root.querySelectorAll('.uk-checkbox-mark img').forEach(img=>{img.dataset.visible=String(check!=='off'&&img.getAttribute('src')===prefix+file);});
      }
    }
    setChecked(checked,{indeterminate=false,emit=false}={}) { this.input.checked=!!checked;this.input.indeterminate=!!indeterminate;this.syncGroup();if(emit)this.emit('change',{checked:this.input.checked,value:this.input.value,indeterminate:this.input.indeterminate}); }
    setIndeterminate(value) { this.input.indeterminate=!!value;this.sync(); }
    get checked() { return this.input.checked; }
  }
  class Toggle extends Choice { constructor(mount,config={}) {super(mount,{...config,kind:'toggle'});} }
  class Checkbox extends Choice { constructor(mount,config={}) {super(mount,{...config,kind:'checkbox'});} }
  class Radio extends Choice { constructor(mount,config={}) {super(mount,{...config,kind:'radio'});} }
  class TextArea extends Component {
    constructor(mount,options={}) {
      super();this.config={label:'Label',required:true,hint:'Подсказка',value:'',maxLength:64,state:'default',...options};const c=this.config;const id=`uk-textarea-${++serial}`;
      this.disabled=c.disabled===true||c.state.startsWith('disabled');this.error=c.state==='error';
      mount.innerHTML=`<div class="uk-component uk-textarea" data-state="${escape(c.state)}"><div class="uk-textarea__box"><label class="uk-textarea__label" for="${id}">${escape(c.label)}${c.required?'<span class="uk-textarea__required" aria-hidden="true">*</span>':''}</label><textarea class="uk-textarea__control" id="${id}" name="${escape(c.name || id)}" maxlength="${Math.max(1,Number(c.maxLength)||64)}" aria-describedby="${id}-hint ${id}-counter" ${this.disabled?'disabled':''} ${c.required?'required':''} spellcheck="false"></textarea><span class="uk-textarea__counter" id="${id}-counter"></span></div><div class="uk-textarea__hint" id="${id}-hint"></div></div>`;
      this.root=mount.firstElementChild;this.input=this.root.querySelector('textarea');this.input.value=String(c.value);this.focused=false;this.pointerInteraction=false;
      this.root.addEventListener('pointerdown',()=>{this.pointerInteraction=true;this.syncInteraction();},true);
      this.root.addEventListener('keydown',()=>{this.pointerInteraction=false;this.syncInteraction();},true);
      this.input.addEventListener('input',()=>{this.error=false;this.sync();this.emit('input',{value:this.input.value});});
      this.input.addEventListener('change',()=>this.emit('change',{value:this.input.value}));
      this.input.addEventListener('focus',()=>{this.focused=true;this.sync();});this.input.addEventListener('blur',()=>{this.focused=false;this.pointerInteraction=false;this.sync();});this.sync();
    }
    syncInteraction() {
      // Pointer feedback ends on leave; keyboard focus and the actual caret remain independent.
      this.root.dataset.visualActive=!this.disabled&&this.focused?(this.pointerInteraction?'pointer':'keyboard'):'false';
    }
    sync() {
      const c=this.config;this.root.dataset.floating=String(!!this.input.value||this.focused||c.state==='active');this.root.dataset.empty=String(!this.input.value);this.root.dataset.disabled=String(this.disabled);this.root.dataset.error=String(this.error);
      this.syncInteraction();
      this.input.setAttribute('aria-invalid',String(this.error));this.root.querySelector('.uk-textarea__counter').textContent=`${this.input.value.length}/${this.input.maxLength}`;
      this.root.querySelector('.uk-textarea__hint').textContent=this.error?(c.errorHint || 'Заполните поле'):c.hint;
    }
    setValue(value) { this.input.value=String(value ?? '').slice(0,this.input.maxLength);this.error=false;this.sync(); }
    validate() { this.error=!this.disabled&&this.config.required&&!this.input.value.trim();this.sync();return !this.error; }
    get value() { return this.input.value; }
  }
  const counterTones={critical:'critical',warning:'warning',accent:'accent',neutral:'secondary',secondary:'secondary-brand',green:'cgreen',yellow:'cyellow',purple:'cpurple',red:'cred'};
  const countLabel = value => typeof value==='number'?String(Math.min(99,Math.max(0,value)))+(value>99?'+':''):String(value ?? '99+');
  class Counter extends Component {
    constructor(mount,options={}) {
      super();this.config={value:'99+',tone:'neutral',size:18,...options};const c=this.config;
      mount.innerHTML=`<span class="uk-component uk-counter" data-size="${c.size===24?'24':'18'}" data-tone="${escape(c.tone)}">${c.tone==='loading'?asset('5b569.svg','class="uk-asset uk-loader"'):escape(countLabel(c.value))}</span>`;
      this.root=mount.firstElementChild;if(c.tone!=='loading'){token(this.root,'--uk-counter-bg','badge-counter-bg-'+(counterTones[c.tone]||'secondary'));token(this.root,'--uk-counter-fg','badge-counter-text-'+(['critical','warning','accent'].includes(c.tone)?'critical':'neutral'));}
    }
    setValue(value) { this.config.value=value;if(this.config.tone!=='loading')this.root.textContent=countLabel(value); }
  }
  const counterMarkup = (value='99+',tone='neutral',size=18) => {
    const mount=document.createElement('span');new Counter(mount,{value,tone,size});return mount.innerHTML;
  };
  class Badge extends Component {
    constructor(mount,options={}) {
      super();this.config={text:'Badge',tone:'neutral',counter:'99+',leading:true,trailing:true,state:'default',...options};const c=this.config,tone=c.tone==='critical'?'red':c.tone;
      mount.innerHTML=`<span class="uk-component uk-badge" data-tone="${escape(c.tone)}" data-state="${escape(c.state)}">${c.tone==='loading'?asset('5b569.svg','class="uk-asset uk-loader"'):`${c.leading?asset('339a0.svg'):''}<span>${escape(c.text)}</span>${c.counter!==false?counterMarkup(c.counter,c.tone==='neutral'?'neutral':c.tone==='accent'?'secondary':tone):''}${c.trailing?asset('d9e81.svg'):''}`}</span>`;
      this.root=mount.firstElementChild;token(this.root,'--uk-bg-default',`badge-badge-bg-${c.tone==='loading'?'neutral':tone}-default`);token(this.root,'--uk-bg-hover',`badge-badge-bg-${c.tone==='loading'?'neutral':tone}-hover`);
    }
  }
  const statusFiles={success:['60402.svg','cec8d.svg'],critical:['b826a.svg','966a5.svg'],progress:['c340a.svg','52d98.svg'],caution:['48d6f.svg','228aa.svg'],neutral:['0a7b1.svg','519e5.svg'],purple:['6fc14.svg','1e25b.svg'],blue:['3d94a.svg','5685a.svg']};
  class Status extends Component {
    constructor(mount,options={}) {
      super();this.config={text:'Text Label',tone:'success',style:'round',size:24,trailing:true,state:'default',disabled:false,...options};const c=this.config;const disabled=c.disabled||c.state==='disabled';
      mount.innerHTML=`<span class="uk-component uk-status" data-style="${escape(c.style)}" data-state="${disabled?'disabled':escape(c.state)}" data-disabled="${!!disabled}" data-size="${c.size===18?'18':'24'}">${c.style==='round'?asset((statusFiles[c.tone] || statusFiles.success)[disabled?1:0]):''}<span class="uk-status__text"><span>${escape(c.text)}</span>${c.trailing&&c.size!==18?asset(c.style==='text'?'12dd7.svg':disabled?'10fae.svg':'71dfc.svg'):''}</span></span>`;
      this.root=mount.firstElementChild;if(c.style==='text'){
        for(const state of ['default','hover']){token(this.root,`--uk-bg-${state}`,`statustext-${c.tone}-bg-${state}`);token(this.root,`--uk-fg-${state}`,`statustext-${c.tone}-label-${state}`);}token(this.root,'--uk-stroke',`statustext-${c.tone}-stroke`);
      }
    }
  }
  const tabFiles={left:{default:'85904.svg',hover:'93fe4.svg',active:'fc0ef.svg',disabled:'8311a.svg'},right:{default:'ca67d.svg',hover:'c76b8.svg',active:'44cc2.svg',disabled:'a52a8.svg'},line:{default:'9276d.svg',hover:'50685.svg',active:'693cb.svg',disabled:'0b870.svg'}};
  const segmentFiles={left:{default:'4fc0d.svg',hover:'fff27.svg',active:'be8b5.svg',disabled:'d9baa.svg'},right:{default:'76d10.svg',hover:'c0785.svg',active:'2cdd2.svg',disabled:'30dba.svg'}};
  class Navigation extends Component {
    constructor(mount,options={}) {
      super();this.config={items:[],value:null,kind:'tabs',...options};const c=this.config;this.value=c.value ?? c.items.find(i=>!i.disabled)?.value;const id=`uk-nav-${++serial}`;
      const isTabs=c.kind==='tabs',files=isTabs?tabFiles:segmentFiles;
      mount.innerHTML=`<div class="uk-component ${isTabs?'uk-tabs':'uk-segment-control'}"><div class="${isTabs?'uk-tablist-scroll':'uk-segment-scroll'}"><div class="${isTabs?'uk-tablist':'uk-segment-list'}" role="${isTabs?'tablist':'radiogroup'}" aria-label="${escape(c.label || (isTabs?'Вкладки':'Переключение вида'))}">${c.items.map((item,i)=>`<button class="${isTabs?'uk-tab':'uk-segment'}" type="button" id="${id}-${i}" role="${isTabs?'tab':'radio'}" data-value="${escape(item.value)}" ${item.disabled?'disabled':''} ${isTabs?`aria-controls="${id}-panel-${i}"`:''}>${isTabs?'<span class="uk-tab__content">':''}${item.leading!==false?stack(files.left):''}<span>${escape(item.label)}</span>${!isTabs&&item.trailing?stack(files.right):''}${item.counter!==false?counterMarkup(item.counter??'99+',isTabs?'neutral':'critical'):''}${isTabs&&item.trailing!==false?stack(files.right):''}${isTabs?'</span>'+stack(files.line,'uk-tab__line'):''}</button>`).join('')}</div></div>${isTabs?c.items.map((item,i)=>`<div class="uk-tabpanel" id="${id}-panel-${i}" role="tabpanel" aria-labelledby="${id}-${i}" tabindex="0" hidden></div>`).join(''):''}</div>`;
      this.root=mount.firstElementChild;this.buttons=[...this.root.querySelectorAll('button')];this.panels=[...this.root.querySelectorAll('[role="tabpanel"]')];
      this.panels.forEach((p,i)=>appendContent(p,c.items[i].content));
      this.buttons.forEach((button,i)=>{
        button.addEventListener('click',()=>this.setValue(c.items[i].value,{emit:true}));
        button.addEventListener('mouseenter',()=>this.paint(i,true));button.addEventListener('mouseleave',()=>this.paint(i,false));
        button.addEventListener('keydown',event=>{
          const keys=['ArrowRight','ArrowLeft','Home','End'];if(!keys.includes(event.key))return;event.preventDefault();const available=this.buttons.filter(b=>!b.disabled);let next=event.key==='Home'?0:event.key==='End'?available.length-1:(available.indexOf(button)+(event.key==='ArrowRight'?1:-1)+available.length)%available.length;
          const target=available[next];target.focus();this.setValue(target.dataset.value,{emit:true});target.scrollIntoView({block:'nearest',inline:'nearest'});
        });
      });this.sync();
    }
    paint(index,hovered) {
      const button=this.buttons[index],selected=button.dataset.value===String(this.value),forced=this.config.items[index].state;
      const actual=button.disabled?'disabled':forced || (selected?'active':hovered?'hover':'default');button.dataset.state=actual;paintStacks(button,actual);
    }
    sync() { const tabs=this.config.kind==='tabs';this.buttons.forEach((b,i)=>{const selected=b.dataset.value===String(this.value);b.setAttribute(tabs?'aria-selected':'aria-checked',String(selected));b.tabIndex=selected&&!b.disabled?0:-1;this.paint(i,false);if(this.panels[i])this.panels[i].hidden=!selected;}); }
    setValue(value,{emit=false}={}) { const item=this.config.items.find(i=>String(i.value)===String(value));if(!item||item.disabled)return;this.value=item.value;this.sync();if(emit)this.emit('change',{value:this.value}); }
  }
  class Tabs extends Navigation { constructor(mount,config={}){super(mount,{...config,kind:'tabs'});} }
  class SegmentControl extends Navigation { constructor(mount,config={}){super(mount,{...config,kind:'segment'});} }
  const smallButton = (label,size='m',color='neutral',className='') => `<button class="ui-button ${className}" data-type="secondary" data-color="${color}" data-size="${size}" data-state="default" type="button"><span class="ui-button__label">${escape(label)}</span></button>`;
  class CollapseBase extends Component {
    constructor(mount, options={}, kind='section') {
      super();
      this.config={title:'Collapse Item Text',size:'h2',leading:true,trailing:true,actions:[],state:'default',...options};
      const c=this.config,id=`uk-collapse-${++serial}`,size=c.size==='body'?20:24;
      this.kind=kind;this.hovered=false;
      const section=kind==='section';
      const active=section ? (size===24?['7258e.svg','d7375.svg']:['8eec5.svg','ee6f6.svg']) : (size===24?['cc92e.svg','35f89.svg']:['fbf7f.svg','3f670.svg']);
      const activeHover=size===24?['d4274.svg','77356.svg']:['90769.svg','b4f0c.svg'];
      const arrows=side=>({default:`collapse-right-${size}.svg`,hover:`collapse-right-hover-${size}.svg`,active:active[side],...(section?{'active-hover':activeHover[side]}:{})});
      mount.innerHTML=`<section class="uk-component uk-collapse uk-collapse--${kind}" data-kind="${kind}" data-size="${c.size==='body'?'body':'h2'}"><div class="uk-collapse__heading"><div class="uk-collapse__header"><div class="uk-collapse__left"><button type="button" class="uk-collapse__trigger" aria-expanded="false" aria-controls="${id}" id="${id}-trigger">${c.leading?stack(arrows(0)):''}<span class="uk-collapse__title">${escape(c.title)}</span>${c.trailing?stack(arrows(1)):''}</button>${c.nearAction?smallButton(c.nearAction,c.size==='body'?'s':'m'):''}</div><div class="uk-collapse__actions">${c.actions.map(a=>smallButton(a,c.size==='body'?'s':'m')).join('')}</div></div></div><div class="uk-collapse__body" id="${id}" role="region" aria-labelledby="${id}-trigger"><div class="uk-collapse__clip">${section?`<div class="uk-collapse__divider">${asset('0749e.svg')}</div>`:''}<div class="uk-collapse__content"></div></div></div></section>`;
      this.root=mount.firstElementChild;this.trigger=this.root.querySelector('.uk-collapse__trigger');this.body=this.root.querySelector('.uk-collapse__body');
      this.heading=this.root.querySelector('.uk-collapse__heading');appendContent(this.root.querySelector('.uk-collapse__content'),c.content);
      this.heading.addEventListener('click',event=>{if(!event.target.closest('.ui-button'))this.setOpen(!this.opened,{emit:true});});
      this.heading.addEventListener('mouseenter',()=>{this.hovered=true;this.paint();});this.heading.addEventListener('mouseleave',()=>{this.hovered=false;this.paint();});
      this.root.querySelectorAll('.ui-button').forEach(button=>button.addEventListener('click',()=>this.emit('action',{label:button.textContent.trim()})));
      this.setOpen(c.open ?? c.state.startsWith('active'));
    }
    paint() {
      const hover=this.hovered||this.config.state.includes('hover');
      const state=this.opened?(this.kind==='section'&&hover?'active-hover':'active'):(hover?'hover':'default');
      this.root.dataset.state=state;paintStacks(this.trigger,state);
    }
    setOpen(open,{emit=false}={}) {
      this.opened=!!open;this.root.dataset.open=String(this.opened);this.trigger.setAttribute('aria-expanded',String(this.opened));
      this.body.setAttribute('aria-hidden',String(!this.opened));this.body.inert=!this.opened;this.paint();
      if(emit)this.emit('change',{open:this.opened});
    }
  }
  class CollapseSection extends CollapseBase { constructor(mount,config={}){super(mount,config,'section');} }
  class CollapseString extends CollapseBase { constructor(mount,config={}){super(mount,config,'string');} }
  const Collapse=CollapseSection;
  class CollapseButton extends Component {
    constructor(mount,options={}) {
      super();this.config={label:'Button1',color:'neutral',open:false,...options};const c=this.config,id=`uk-collapse-button-${++serial}`;
      mount.innerHTML=`<div class="uk-component"><button class="ui-button uk-collapse-button" data-type="secondary" data-color="${escape(c.color)}" data-size="s" data-state="default" aria-expanded="false" aria-controls="${id}" type="button"><span>${escape(c.label)}</span>${stack({default:'d9e81.svg',active:'d9e81.svg'})}</button><div class="uk-collapse-button-panel" id="${id}" hidden></div></div>`;
      this.root=mount.firstElementChild;this.trigger=this.root.querySelector('button');this.body=this.root.querySelector('.uk-collapse-button-panel');appendContent(this.body,c.content);this.trigger.addEventListener('click',()=>this.setOpen(!this.opened));this.setOpen(c.open);
    }
    setOpen(open) {this.opened=!!open;this.trigger.setAttribute('aria-expanded',String(this.opened));this.body.hidden=!this.opened;paintStacks(this.trigger,'default');this.trigger.querySelector('.uk-state-stack').style.transform=this.opened?'rotate(180deg)':'none';this.emit('change',{open:this.opened});}
  }
  const tooltips=new Set();
  class Tooltip extends Component {
    constructor(trigger,options={}) {
      super();this.trigger=trigger;this.config={text:'Tip text',placement:'top',delay:90,...options};this.timer=0;this.opened=false;
      this.root=document.createElement('div');this.root.className='uk-component uk-tooltip';this.root.id=`uk-tooltip-${++serial}`;this.root.setAttribute('role','tooltip');this.root.hidden=true;
      this.root.innerHTML='<div class="uk-tooltip__body"></div><div class="uk-tooltip__arrow-area"><span class="uk-tooltip__arrow-slot"></span></div>';this.root.querySelector('.uk-tooltip__body').textContent=this.config.text;document.body.append(this.root);tooltips.add(this);
      this.handlers={mouseenter:()=>{clearTimeout(this.timer);this.timer=setTimeout(()=>this.show(),this.config.delay);},mouseleave:()=>{clearTimeout(this.timer);this.timer=setTimeout(()=>this.close(),90);},focus:()=>this.show(),blur:()=>this.close(),click:()=>this.show()};
      Object.entries(this.handlers).forEach(([event,fn])=>trigger.addEventListener(event,fn));
      this.root.addEventListener('mouseenter',()=>clearTimeout(this.timer));this.root.addEventListener('mouseleave',()=>this.close());
    }
    show() { clearTimeout(this.timer);if(this.trigger.disabled||!this.trigger.checkVisibility())return;tooltips.forEach(t=>{if(t!==this)t.close();});this.opened=true;this.root.hidden=false;const ids=new Set((this.trigger.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));ids.add(this.root.id);this.trigger.setAttribute('aria-describedby',[...ids].join(' '));this.position(); }
    close() { clearTimeout(this.timer);this.opened=false;this.root.hidden=true;const ids=(this.trigger.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==this.root.id);if(ids.length)this.trigger.setAttribute('aria-describedby',ids.join(' '));else this.trigger.removeAttribute('aria-describedby'); }
    position() {
      if(!this.opened)return;if(!this.trigger.checkVisibility()){this.close();return;}const box=this.trigger.getBoundingClientRect();let placement=this.config.placement.toLowerCase();
      this.root.dataset.placement=placement;this.setArrow(placement);let w=this.root.offsetWidth,h=this.root.offsetHeight;
      if(placement.startsWith('top')&&box.top<h)placement=placement.replace('top','bottom');else if(placement.startsWith('bottom')&&innerHeight-box.bottom<h)placement=placement.replace('bottom','top');else if(placement==='left'&&box.left<w)placement='right';else if(placement==='right'&&innerWidth-box.right<w)placement='left';
      this.root.dataset.placement=placement;this.setArrow(placement);w=this.root.offsetWidth;h=this.root.offsetHeight;
      const vertical=placement.startsWith('top')||placement.startsWith('bottom');let left=vertical?placement.endsWith('left')?box.right-w:placement.endsWith('right')?box.left:box.left+(box.width-w)/2:placement==='left'?box.left-w:box.right;
      let top=vertical?placement.startsWith('top')?box.top-h:box.bottom:box.top+(box.height-h)/2;
      left=Math.max(8,Math.min(left,innerWidth-w-8));top=Math.max(8,Math.min(top,innerHeight-h-8));this.root.style.left=left+'px';this.root.style.top=top+'px';
      this.root.style.setProperty('--uk-arrow-offset',Math.max(12,Math.min(w-12,box.left+box.width/2-left))+'px');
    }
    setArrow(placement) { const files={'top':'698a1.svg','top-left':'21a3c.svg','top-right':'21a3c.svg','bottom':'aad04.svg','bottom-left':'d1159.svg','bottom-right':'d1159.svg','left':'f2122.svg','right':'6e237.svg'};this.root.querySelector('.uk-tooltip__arrow-slot').innerHTML=asset(files[placement]||files.top); }
    destroy() {this.close();Object.entries(this.handlers).forEach(([event,fn])=>this.trigger.removeEventListener(event,fn));tooltips.delete(this);super.destroy();}
  }
  document.addEventListener('keydown',event=>{if(event.key==='Escape')tooltips.forEach(t=>t.close());});
  document.addEventListener('ui:panel-change',()=>tooltips.forEach(t=>t.close()));
  window.addEventListener('resize',()=>tooltips.forEach(t=>t.position()));document.addEventListener('scroll',()=>tooltips.forEach(t=>t.position()),true);
  window.UIKitComponents={TextArea,Toggle,Checkbox,Radio,Counter,Badge,Status,Tabs,SegmentControl,Collapse,CollapseString,CollapseSection,CollapseButton,Tooltip};
})();
