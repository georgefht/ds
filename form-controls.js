/* Vanilla controls; no framework or external network dependency. */
(() => {
  'use strict';
  const svgRoot = 'assets/icons/';
  const icons = {
    placeholder: ['f1634.svg', 'd44b0.svg'],
    trailing: ['1032a.svg', '719b2.svg'],
    selector: ['01025.svg', '66d7a.svg'],
    selectorOpen: ['47e5b.svg', '28429.svg'],
    search: ['e8a7f.svg', '9308f.svg'],
    date: ['f78da.svg', 'ad542.svg'],
    time: ['ec629.svg', '51e46.svg'],
    close: '865ea.svg',
    check: '461aa.svg',
    collapse: '6e755.svg',
    collapseOpen: '51b54.svg',
    save: 'c02a7.svg',
    calendarLeft: '01322b16-dc3e-4a1a-b060-3f79d18cf238.svg',
    calendarRight: 'ad073328-c955-49dd-843f-afaa95963346.svg'
  };
  const escapeHTML = value => String(value).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const reactiveIcons = new Set(['placeholder','trailing','selector','selectorOpen','search','date','time']);
  const icon = (name, small = false, cls = 'field-icon') => `<img class="${cls}${cls === 'field-icon' && reactiveIcons.has(name) ? ' field-icon--reactive' : ''}${name === 'close' ? ' field-icon--clear' : ''}" data-icon="${name}" src="${svgRoot}${Array.isArray(icons[name]) ? icons[name][small ? 1 : 0] : icons[name]}" alt="" aria-hidden="true" draggable="false">`;
  // Tint the original SVGs with Colors tokens, preserving their geometry.
  // Document-local filters also work when the kit is opened without a server.
  if (!document.getElementById('ui-kit-icon-filters')) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.id = 'ui-kit-icon-filters';
    svg.setAttribute('width','0'); svg.setAttribute('height','0');
    svg.setAttribute('aria-hidden','true'); svg.setAttribute('focusable','false');
    svg.style.position = 'absolute'; svg.style.pointerEvents = 'none';
    svg.innerHTML = `<defs>${['clear','default','hover','active','disabled-default'].map(state => `<filter id="ui-kit-icon-${state}" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%"><feFlood style="flood-color:var(--ds-inputbased-icon-${state})" result="iconColor"/><feComposite in="iconColor" in2="SourceAlpha" operator="in"/></filter>`).join('')}</defs>`;
    document.body.prepend(svg);
  }
  const pad = n => String(n).padStart(2, '0');
  const formatDate = d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  function parseDate(value) {
    const match = /^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/.exec(value.trim());
    if (!match) return null;
    const [, day, month, year] = match.map(Number);
    if (year < 1900 || year > 2099 || month < 1 || month > 12 || day < 1) return null;
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day ? d : null;
  }
  function parseDateRange(value) {
    const parts = Array.isArray(value) ? value : value && typeof value === 'object' ? [value.start,value.end] : String(value ?? '').trim().split(/\s*[–—-]\s*/);
    if (parts.length > 2) return null;
    const first = String(parts[0] ?? '').trim(), last = String(parts[1] ?? '').trim();
    if (!first && !last) return {start:null,end:null};
    const start = parseDate(first), end = last ? parseDate(last) : null;
    return start && (!last || end) ? {start,end} : null;
  }
  const formatDateRange = range => !range?.start ? '' : `${formatDate(range.start)}${range.end ? ' – '+formatDate(range.end) : ''}`;
  function parseTime(value) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    return match && +match[1] < 24 && +match[2] < 60 ? `${pad(+match[1])}:${pad(+match[2])}` : null;
  }
  const sameDate = (a,b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const today = new Date();
  let counter = 0;
  let openField = null;

  class Field {
    constructor(mount, config = {}) {
      this.config = { type:'input', size:'l', label:'Label', required:true, hint:'Подсказка', value:'', state:'default', clear:true, autocomplete:false, leading:false, trailing:false, suffix:'', options:[], commit:'immediate', ...config };
      this.isRange = this.config.type === 'date' && this.config.selectionMode === 'range';
      this.closeOnSelect = this.config.closeOnSelect ?? !this.isRange;
      this.isSelector = ['selector','multiselector'].includes(this.config.type);
      this.multiple = this.config.type === 'multiselector' || (this.isSelector && this.config.multiple === true);
      this.deferred = this.multiple && this.config.commit === 'save';
      this.bulkActions = this.multiple && this.config.bulkActions !== false;
      this.grouped = this.config.options.some(x => Array.isArray(x.children));
      this.expanded = new Map();
      this.draftValue = null;
      this.id = `ui-field-${++counter}`;
      this.mount = mount;
      this.value = this.normalizeValue(this.config.value);
      this.error = '';
      this.focused = false;
      this.pointerInteraction = false;
      this.opened = false;
      this.activeIndex = -1;
      this.calendarMode = 'day';
      const initialRange = this.isRange ? parseDateRange(this.value) : null;
      this.rangeAnchor = initialRange?.start && !initialRange.end ? initialRange.start : null;
      this.rangePreview = null;
      this.calendarDate = (this.isRange ? initialRange?.start : !this.multiple && parseDate(this.value)) || new Date(today.getFullYear(), today.getMonth(), today.getDate());
      this.calendarFocus = new Date(this.calendarDate);
      this.disabled = this.config.state.startsWith('disabled') || this.config.disabled === true;
      this.hasList = this.isSelector || this.config.type === 'time' || (['input','search'].includes(this.config.type) && this.config.autocomplete);
      this.hasPopup = this.hasList || this.config.type === 'date';
      this.render();
      this.attach();
      this.sync();
      if (this.multiple && window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => this.syncSummary());
        this.resizeObserver.observe(this.root.querySelector('.field-textbox'));
      }
      if (this.multiple) document.fonts?.ready.then(() => this.root.isConnected && this.syncSummary());
      if (this.config.inlineMenu) this.open();
    }
    normalizeValue(value) {
      if (this.isRange && value && typeof value === 'object') return formatDateRange(parseDateRange(value));
      return this.multiple ? [...new Set((Array.isArray(value) ? value : value ? [value] : []).map(String))] : String(value ?? '');
    }
    get range() {
      const range = this.isRange && parseDateRange(this.value);
      return {start:range?.start ? formatDate(range.start) : '',end:range?.end ? formatDate(range.end) : ''};
    }
    currentValue() { return this.draftValue ?? this.value; }
    selectedLabels() {
      const options = this.leafOptions();
      return this.currentValue().map(value => options.find(x => x.value === value)?.label || value);
    }
    render() {
      const c = this.config, small = c.size === 's';
      const listAttrs = this.hasPopup ? `role="combobox" aria-expanded="false" aria-autocomplete="${['input','search'].includes(c.type) ? 'list' : 'none'}" aria-haspopup="${c.type === 'date' ? 'dialog' : this.grouped ? 'tree' : 'listbox'}" aria-controls="${this.id}-${c.type === 'date' ? 'popup' : 'list'}"` : '';
      const clearHTML = `<span class="field-clear-divider" aria-hidden="true"></span>${icon('close',small)}`;
      this.mount.innerHTML = `<div class="field" data-type="${c.type}" data-selection-mode="${this.isRange ? 'range' : 'single'}" data-multiple="${this.multiple}" data-inline-menu="${!!c.inlineMenu}" data-size="${c.size}" data-size-caption="${({l:'L / 40',m:'M / 32',s:'S / 24'})[c.size]}" data-state="${c.state}" data-label="${!!c.label}" data-disabled="${this.disabled}">
        <div class="field-shell">
          ${c.leading ? icon('placeholder',small) : ''}
          <div class="field-textbox">
            ${c.label ? `<label class="field-label" for="${this.id}">${escapeHTML(c.label)}${c.required ? '<span class="field-required" aria-hidden="true">*</span>' : ''}</label>` : ''}
            <div class="field-value-line"><input class="field-control" id="${this.id}" ${this.multiple ? '' : `name="${escapeHTML(c.name || this.id)}"`} type="text" value="${escapeHTML(this.multiple ? this.selectedLabels().join(', ') : this.value)}" autocomplete="off" spellcheck="false" aria-label="${escapeHTML(c.label || c.accessibleLabel || 'Поле ввода')}" aria-describedby="${this.id}-hint" ${listAttrs} ${this.isSelector ? 'readonly' : ''} ${['date','time'].includes(c.type) ? 'inputmode="numeric"' : ''} ${c.required ? 'required' : ''} ${this.disabled ? 'disabled' : ''}>${this.multiple ? '<span class="field-more" aria-hidden="true" hidden></span>' : ''}</div>
          </div>
          ${c.suffix ? `<span class="field-suffix">${escapeHTML(c.suffix)}</span>` : ''}
          ${c.type === 'input' ? (c.trailing ? icon('trailing',small) : '') : `<button type="button" class="field-action field-trigger" aria-label="${({selector:'Открыть список',multiselector:'Открыть список',search:'Искать',date:'Открыть календарь',time:'Выбрать время'})[c.type]}" ${this.disabled ? 'disabled' : ''}>${icon(this.isSelector ? 'selector' : c.type,small)}</button>`}
          ${c.clear ? `<button type="button" class="field-action field-clear" aria-label="Очистить ${escapeHTML(c.label || 'поле')}" ${this.disabled ? 'disabled' : ''}>${clearHTML}</button>` : ''}
        </div>
        <span class="field-hint" id="${this.id}-hint"></span>
        ${this.multiple ? '<div class="field-form-values" hidden></div>' : ''}
        ${this.hasPopup ? `<div class="field-popup ${c.type === 'date' ? 'field-popup--calendar' : 'field-popup--menu'}" id="${this.id}-popup" role="${c.type === 'date' ? 'dialog' : 'presentation'}" ${c.type === 'date' ? 'aria-label="Выбор даты"' : ''} hidden></div>` : ''}
      </div>`;
      this.root = this.mount.firstElementChild;
      this.input = this.root.querySelector('.field-control');
      this.hint = this.root.querySelector('.field-hint');
      this.clearButton = this.root.querySelector('.field-clear');
      this.trigger = this.root.querySelector('.field-trigger');
      this.popup = this.root.querySelector('.field-popup');
      this.more = this.root.querySelector('.field-more');
    }
    attach() {
      this.root.addEventListener('pointerdown', () => { this.pointerInteraction = true; this.syncInteraction(); }, true);
      this.root.addEventListener('keydown', () => { this.pointerInteraction = false; this.syncInteraction(); }, true);
      this.input.addEventListener('focus', () => {
        this.focused = true;
        this.sync();
        if (this.hasList && ['input','search'].includes(this.config.type) && this.value) this.open();
      });
      this.input.addEventListener('blur', () => {
        if (this.value && ['date','time'].includes(this.config.type) && !(this.isRange && this.opened)) this.validate(false);
      });
      this.root.addEventListener('focusout', () => {
        window.setTimeout(() => {
          if (!this.root.contains(document.activeElement)) {
            this.focused = false;
            this.pointerInteraction = false;
            this.close();
            if (this.value && ['date','time'].includes(this.config.type)) this.validate(false);
            this.sync();
          }
        }, 0);
      });
      this.input.addEventListener('click', () => {
        if (this.isSelector || ['date','time'].includes(this.config.type)) this.open();
      });
      this.input.addEventListener('input', () => {
        this.value = this.input.value;
        this.error = '';
        if (['date','time'].includes(this.config.type) && this.input.selectionStart === this.value.length && /^\d+$/.test(this.value)) {
          const digits = this.value;
          const dateDigits = value => value.slice(0,8).replace(/^(\d{2})(\d{0,2})(\d{0,4})$/,(_,a,b,d) => a + (b ? '.'+b : '') + (d ? '.'+d : ''));
          const formatted = this.config.type === 'date' ? this.isRange ? dateDigits(digits.slice(0,8)) + (digits.length > 8 ? ' – '+dateDigits(digits.slice(8,16)) : '') : dateDigits(digits) : digits.slice(0,4).replace(/^(\d{2})(\d{1,2})$/, '$1:$2');
          this.value = formatted;
          this.input.value = formatted;
        }
        if (this.isRange) {
          const range = parseDateRange(this.value);
          this.rangeAnchor = range?.start && !range.end ? range.start : null;
          this.rangePreview = null;
          if (range?.start) { this.calendarDate = new Date(range.start); this.calendarFocus = new Date(range.start); }
          if (this.opened) { this.renderCalendar(); this.position(); }
        }
        this.activeIndex = -1;
        this.sync();
        if (this.hasList && !this.isSelector) {
          if (this.value || this.config.type === 'time') this.open(); else this.close();
        }
        this.emit('input');
      });
      this.input.addEventListener('keydown', event => this.onKeydown(event));
      this.clearButton?.addEventListener('mousedown', event => event.preventDefault());
      this.clearButton?.addEventListener('click', () => {
        if (this.disabled) return;
        this.close();
        this.setValue(this.multiple ? [] : '');
        this.input.focus();
      });
      this.trigger?.addEventListener('mousedown', event => event.preventDefault());
      this.trigger?.addEventListener('click', () => {
        if (this.disabled) return;
        this.input.focus();
        if (this.config.type === 'search' && this.value.trim()) { this.close(); this.emit('search'); return; }
        if (this.hasPopup) {
          if (this.opened) this.close(); else this.open();
        } else this.emit('search');
      });
      this.popup?.addEventListener('mousedown', event => { if (this.config.type !== 'date' && !event.target.closest('button') && !this.config.inlineMenu) event.preventDefault(); });
      this.popup?.addEventListener('click', event => {
        const action = event.target.closest('[data-menu-action]');
        if (action) { this.menuAction(action.dataset.menuAction); return; }
        const option = event.target.closest('[data-option-index]');
        if (option) this.choose(+option.dataset.optionIndex);
        const calendar = event.target.closest('[data-calendar]');
        if (calendar) this.calendarAction(calendar.dataset.calendar, calendar.dataset.value, +(calendar.dataset.panel || 0));
      });
      if (this.isRange) {
        const preview = event => {
          const day = event.target.closest('[data-calendar="day"]');
          if (!this.rangeAnchor || !day || day.disabled) return;
          this.rangePreview = parseDate(day.dataset.value);
          this.paintRange();
        };
        this.popup.addEventListener('pointerover',preview);
        this.popup.addEventListener('focusin',preview);
        this.popup.addEventListener('pointerleave',()=>{this.rangePreview=null;this.paintRange();});
      }
      this.popup?.addEventListener('keydown', event => {
        if (this.config.type === 'date') this.calendarKeydown(event);
        else if (event.key === 'Escape') { event.preventDefault(); this.close(); this.input.focus(); }
        else if (event.key === 'Tab' && event.shiftKey && !this.config.inlineMenu && event.target === this.popup.querySelector('.field-menu-footer button:not(:disabled)')) { event.preventDefault(); this.input.focus(); }
        else if (this.config.inlineMenu && !event.target.closest('button')) this.onKeydown(event);
      });
    }
    syncInteraction() {
      // CSS :hover ends pointer feedback even when choosing an option hides the hovered popup.
      // Keyboard feedback is independent of the pointer; editing and focus stay intact.
      this.root.dataset.visualActive = !this.disabled && (this.focused || this.opened) ? this.pointerInteraction ? 'pointer' : 'keyboard' : 'false';
    }
    sync() {
      const c = this.config;
      const active = this.focused || c.state === 'active';
      this.root.dataset.focused = String(this.focused);
      const hasValue = this.multiple ? this.currentValue().length > 0 : !!this.value;
      this.root.dataset.floating = String(hasValue || active);
      this.root.dataset.open = String(this.opened);
      this.syncInteraction();
      const error = !!this.error || ['error','default-error'].includes(c.state);
      this.root.dataset.error = String(error);
      this.input.setAttribute('aria-invalid', String(error));
      this.input.setCustomValidity(this.error || (error ? 'Проверьте значение' : ''));
      this.hint.textContent = this.error || (error ? c.errorHint || 'Проверьте значение' : c.hint);
      this.hint.hidden = !c.hint && !error;
      if (this.clearButton) this.clearButton.hidden = !hasValue && !(['date','time'].includes(c.type) && this.opened);
      if (this.trigger && this.isSelector) this.trigger.innerHTML = icon(this.opened ? 'selectorOpen' : 'selector', c.size === 's');
      if (['date','time'].includes(c.type)) this.input.placeholder = active ? (c.type === 'date' ? this.isRange ? 'дд.мм.гггг – дд.мм.гггг' : 'дд.мм.гггг' : 'чч:мм') : '';
      if (this.isRange) this.input.title = this.value;
      this.input.setAttribute('aria-expanded', String(this.opened));
      if (!this.hasPopup) this.input.removeAttribute('aria-expanded');
      if (this.isSelector && !this.multiple) this.input.value = this.leafOptions().find(x=>x.value===this.value)?.label || this.value;
      if (this.multiple) {
        this.syncSummary();
        this.root.querySelector('.field-form-values').innerHTML = this.value.map(value => `<input type="hidden" name="${escapeHTML(c.name || this.id)}" value="${escapeHTML(value)}" ${this.disabled ? 'disabled' : ''}>`).join('');
      }
    }
    syncSummary() {
      if (!this.more) return;
      const labels = this.selectedLabels();
      const text = labels.join(', ');
      this.input.value = text;
      this.input.title = text;
      this.more.hidden = true;
      const width = this.root.querySelector('.field-value-line').clientWidth;
      if (!width || labels.length < 2) return;
      const style = getComputedStyle(this.input);
      const context = Field.measureContext ||= document.createElement('canvas').getContext('2d');
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const measure = text => context.measureText(text).width + text.length * (parseFloat(style.letterSpacing) || 0);
      if (measure(text) <= width) return;
      let visible = 1;
      while (visible < labels.length && measure(labels.slice(0,visible+1).join(', ')) + measure(`еще ${labels.length-visible-1}`) + 8 <= width) visible++;
      if (visible < labels.length) {
        this.more.textContent = `еще ${labels.length-visible}`;
        this.more.hidden = false;
      }
    }
    emit(type) {
      const value = this.multiple ? [...(type === 'draft' ? this.currentValue() : this.value)] : this.value;
      this.root.dispatchEvent(new CustomEvent(`ui:${type}`, {bubbles:true,detail:{value,type:this.config.type,...(this.isRange ? {range:this.range} : {})}}));
      if (type === 'change') this.config.onChange?.(value);
    }
    setValue(value, emit = true) {
      this.value = this.normalizeValue(value);
      if (this.deferred && this.opened) this.draftValue = [...this.value];
      if (!this.multiple) this.input.value = this.value;
      this.error = '';
      if (this.isRange) {
        const range = parseDateRange(this.value);
        this.rangeAnchor = range?.start && !range.end ? range.start : null;
        this.rangePreview = null;
      }
      const date = this.isRange ? parseDateRange(this.value)?.start : !this.multiple && parseDate(this.value);
      if (date) { this.calendarDate = date; this.calendarFocus = new Date(date); }
      this.sync();
      if (this.opened && this.hasList) this.renderOptions();
      if (this.opened && this.isRange) { this.renderCalendar(); this.position(); }
      if (emit) this.emit('change');
    }
    validate(checkRequired = true) {
      this.error = '';
      if (this.multiple ? !this.value.length : !this.value.trim()) {
        if (checkRequired && this.config.required) this.error = 'Заполните поле';
      } else if (this.config.type === 'date') {
        if (this.isRange) {
          const range = parseDateRange(this.value);
          if (!range) this.error = 'Укажите две даты в формате дд.мм.гггг (1900–2099)';
          else if (!range.end) this.error = 'Выберите точку B — конец диапазона';
          else {
            if (range.start > range.end) [range.start,range.end] = [range.end,range.start];
            this.setValue(formatDateRange(range),false);
          }
        } else {
          const date = parseDate(this.value);
          if (!date) this.error = 'Укажите дату в формате дд.мм.гггг (1900–2099)';
          else this.setValue(formatDate(date),false);
        }
      } else if (this.config.type === 'time') {
        const time = parseTime(this.value);
        if (!time) this.error = 'Укажите время от 00:00 до 23:59';
        else this.setValue(time,false);
      }
      this.sync();
      return !this.error;
    }
    options() {
      if (this.config.type === 'time') return Array.from({length:96},(_,i) => ({value:`${pad(Math.floor(i/4))}:${pad(i%4*15)}`,label:`${pad(Math.floor(i/4))}:${pad(i%4*15)}`}));
      const normalize = (items,path='',disabled=false) => items.map((x,i) => {
        const option = typeof x === 'string' ? {value:x,label:x} : x;
        const key = `${path}${i}`;
        return {...option, value:String(option.value ?? option.label), label:String(option.label ?? option.value ?? ''), key, disabled:disabled || option.disabled === true,
          ...(Array.isArray(option.children) ? {children:normalize(option.children,`${key}.`,disabled || option.disabled === true)} : {})};
      });
      return normalize(this.config.options);
    }
    leafOptions() {
      const leaves = [];
      const visit = items => items.forEach(x => x.children ? visit(x.children) : leaves.push(x));
      visit(this.options());
      return leaves;
    }
    filteredOptions() {
      const options = this.options();
      const query = ['input','search'].includes(this.config.type) ? this.value.trim().toLocaleLowerCase('ru') : '';
      const matches = x => `${x.label} ${x.description || ''}`.toLocaleLowerCase('ru').includes(query);
      const result = [];
      const visit = (items,depth=0,parent=null) => items.forEach(x => {
        if (x.children) {
          const hasMatch = descendants => descendants.some(child => child.children ? hasMatch(child.children) : matches(child));
          if (query && !hasMatch(x.children)) return;
          const expanded = query ? true : this.expanded.get(x.key) ?? x.expanded === true;
          result.push({...x,depth,parent,expanded});
          if (expanded) visit(x.children,depth+1,x.key);
        } else if (!query || matches(x)) result.push({...x,depth,parent});
      });
      visit(options);
      return result;
    }
    open() {
      if (this.disabled || !this.popup) return;
      if (!this.config.inlineMenu) {
        if (openField && openField !== this) openField.close();
        openField = this;
      }
      const wasOpen = this.opened;
      if (!wasOpen && this.deferred) this.draftValue = [...this.value];
      this.opened = true;
      this.popup.hidden = false;
      if (this.config.type === 'date') {
        if (!wasOpen) {
          this.calendarMode = 'day';
          this.calendarDate = (this.isRange ? parseDateRange(this.value)?.start : parseDate(this.value)) || this.calendarDate;
          this.calendarFocus = new Date(this.calendarDate);
        }
        this.renderCalendar();
      } else this.renderOptions();
      this.sync();
      this.position();
      if (this.config.type === 'time' && !wasOpen) {
        const index = this.filtered.findIndex(x => x.value === this.value);
        if (index >= 0) this.highlight(index);
      }
    }
    close() {
      if (this.config.inlineMenu) return;
      if (!this.opened) return;
      const cancelled = this.deferred && JSON.stringify(this.draftValue) !== JSON.stringify(this.value);
      this.opened = false;
      this.popup.hidden = true;
      this.input.removeAttribute('aria-activedescendant');
      this.activeIndex = -1;
      this.rangePreview = null;
      this.draftValue = null;
      if (openField === this) openField = null;
      this.sync();
      if (cancelled) this.emit('cancel');
    }
    position() {
      if (!this.opened || this.config.inlineMenu) return;
      const box = this.root.querySelector('.field-shell').getBoundingClientRect();
      if (this.config.type === 'date' && this.renderedMonths !== this.calendarMonthCount()) this.renderCalendar();
      const width = this.config.type === 'date' ? Math.min(264*this.calendarMonthCount(),innerWidth-16) : Math.min(box.width,innerWidth-16);
      this.popup.style.width = `${width}px`;
      if (this.config.type === 'date') {
        // Measure the full calendar before applying the viewport limit.
        this.popup.style.maxHeight = 'none';
        this.popup.style.overflowY = 'visible';
      }
      const desired = this.config.type === 'date' ? this.popup.offsetHeight : Math.min(this.menuList.scrollHeight + (this.popup.querySelector('.field-menu-footer')?.offsetHeight || 0) + 2,306);
      const below = innerHeight - box.bottom - 12, above = box.top - 12;
      const useAbove = below < desired && above > below;
      this.popup.style.setProperty('--ui-popup-enter-y',useAbove ? '-2px' : '2px');
      const available = Math.max(64,useAbove ? above : below);
      this.popup.style.maxHeight = `${Math.min(desired,available)}px`;
      this.popup.style.overflowY = this.config.type === 'date' ? (available >= desired ? 'visible' : 'auto') : 'hidden';
      this.popup.style.left = `${Math.max(8,Math.min(box.left,innerWidth-width-8))}px`;
      this.popup.style.top = `${useAbove ? Math.max(8,box.top-Math.min(desired,available)-4) : box.bottom+4}px`;
    }
    renderOptions() {
      this.filtered = this.filteredOptions();
      const query = ['input','search'].includes(this.config.type) ? this.value.trim().toLocaleLowerCase('ru') : '';
      const highlight = label => {
        const i = label.toLocaleLowerCase('ru').indexOf(query);
        return query && i >= 0 ? `${escapeHTML(label.slice(0,i))}<mark>${escapeHTML(label.slice(i,i+query.length))}</mark>${escapeHTML(label.slice(i+query.length))}` : escapeHTML(label);
      };
      const scrollTop = this.menuList?.scrollTop || 0;
      const listFocused = document.activeElement === this.menuList;
      const focusedAction = this.popup.querySelector(':focus')?.dataset.menuAction;
      const selected = this.currentValue();
      const rows = this.filtered.map((x,i) => {
        const group = !!x.children;
        const checked = !group && (this.multiple ? selected.includes(x.value) : x.value === selected);
        const itemIcon = x.icon ? this.optionIcon(x.icon) : '';
        const collapse = group ? `<span class="field-collapse" data-expanded="${x.expanded}">${icon(x.expanded ? 'collapseOpen' : 'collapse')}</span>` : '';
        return `<div class="field-option ${group ? 'field-option--group' : ''}" id="${this.id}-option-${i}" role="${this.grouped ? 'treeitem' : 'option'}" ${this.grouped ? `aria-level="${x.depth+1}"` : ''} ${group ? `aria-expanded="${x.expanded}"` : `aria-selected="${checked}"`} aria-disabled="${!!x.disabled || this.disabled}" data-option-index="${i}" data-selected="${checked}" style="--menu-depth:${x.depth}">${collapse}${itemIcon}<span class="field-option-text"><span class="field-option-name">${highlight(x.label)}</span>${x.description && !group ? `<span class="field-option-description">${escapeHTML(x.description)}</span>` : ''}</span>${checked ? icon('check',false,'field-option-check') : ''}</div>`;
      }).join('');
      const footer = this.bulkActions || this.deferred ? `<div class="field-menu-footer">${this.bulkActions ? `<div class="field-menu-bulk"><button type="button" data-menu-action="all" ${this.disabled || !this.leafOptions().some(x=>!x.disabled) ? 'disabled' : ''}>Выбрать все</button><button type="button" data-menu-action="reset" ${this.disabled ? 'disabled' : ''}>Сбросить все</button></div>` : ''}${this.deferred ? `<div class="field-menu-save"><button type="button" data-menu-action="save" ${this.disabled ? 'disabled' : ''}>Сохранить${icon('save')}</button></div>` : ''}</div>` : '';
      this.popup.innerHTML = `<div class="field-menu-options" id="${this.id}-list" role="${this.grouped ? 'tree' : 'listbox'}" aria-label="${escapeHTML(this.config.label || 'Варианты')}" ${this.multiple ? 'aria-multiselectable="true"' : ''} tabindex="${this.config.inlineMenu && !this.disabled ? '0' : '-1'}">${rows || '<div class="field-empty" role="status">Ничего не найдено</div>'}</div>${footer}`;
      this.menuList = this.popup.querySelector('.field-menu-options');
      this.menuList.scrollTop = scrollTop;
      if (this.activeIndex >= this.filtered.length) this.activeIndex = -1;
      if (this.activeIndex >= 0) this.highlight(this.activeIndex);
      else (this.config.inlineMenu ? this.menuList : this.input).removeAttribute('aria-activedescendant');
      if (focusedAction) this.popup.querySelector(`[data-menu-action="${focusedAction}"]`)?.focus();
      else if (listFocused) this.menuList.focus({preventScroll:true});
    }
    optionIcon(source) {
      if (typeof source === 'string') return `<span class="field-option-icon"><img src="${escapeHTML(source)}" alt="" aria-hidden="true" draggable="false"></span>`;
      return `<span class="field-option-icon">${['default','selected','hover'].map(state => `<img data-icon-state="${state}" src="${escapeHTML(source[state] || source.default)}" alt="" aria-hidden="true" draggable="false">`).join('')}</span>`;
    }
    highlight(index) {
      if (!this.filtered.length) return;
      this.activeIndex = Math.max(0,Math.min(index,this.filtered.length-1));
      this.popup.querySelectorAll('[data-option-index]').forEach((el,i) => { el.dataset.active = String(i === this.activeIndex); });
      const el = this.popup.querySelector(`[data-option-index="${this.activeIndex}"]`);
      (this.config.inlineMenu ? this.menuList : this.input).setAttribute('aria-activedescendant',el.id);
      const top = el.offsetTop, bottom = top + el.offsetHeight;
      if (top < this.menuList.scrollTop) this.menuList.scrollTop = top;
      else if (bottom > this.menuList.scrollTop + this.menuList.clientHeight) this.menuList.scrollTop = bottom - this.menuList.clientHeight;
    }
    choose(index) {
      const option = this.filtered[index];
      if (!option || option.disabled || this.disabled) return;
      if (option.children) { this.toggleGroup(index); return; }
      if (this.multiple) {
        const values = this.currentValue();
        this.updateSelection(values.includes(option.value) ? values.filter(x => x !== option.value) : [...values,option.value]);
        return;
      }
      this.setValue(option.value);
      this.close();
      this.input.focus();
      // Focus can reopen an autocomplete, so finish the selection explicitly.
      this.close();
    }
    updateSelection(values) {
      if (this.deferred) {
        this.draftValue = this.normalizeValue(values);
        this.error = '';
        this.sync(); this.renderOptions(); this.emit('draft');
      } else this.setValue(values);
      this.position();
    }
    toggleGroup(index,expanded) {
      const option = this.filtered[index];
      if (!option?.children || option.disabled || this.disabled) return;
      this.expanded.set(option.key,expanded ?? !option.expanded);
      this.activeIndex = index;
      this.renderOptions(); this.position();
    }
    menuAction(action) {
      if (this.disabled) return;
      if (action === 'all') this.updateSelection(this.leafOptions().filter(x=>!x.disabled).map(x=>x.value));
      if (action === 'reset') this.updateSelection([]);
      if (action === 'save' && this.deferred) {
        this.setValue(this.draftValue || []);
        this.close();
        if (!this.config.inlineMenu) this.input.focus();
      }
    }
    onKeydown(event) {
      if (event.key === 'Escape') { this.close(); event.preventDefault(); return; }
      if (event.key === 'Tab') {
        const first = this.opened && !event.shiftKey && this.popup?.querySelector('.field-menu-footer button:not(:disabled)');
        if (first) { event.preventDefault(); first.focus(); }
        else this.close();
        return;
      }
      if (this.isSelector && ['ArrowLeft','ArrowRight'].includes(event.key) && this.opened && this.grouped) {
        event.preventDefault();
        const item = this.filtered[this.activeIndex];
        if (!item) return;
        if (event.key === 'ArrowRight' && item.children) {
          if (!item.expanded) this.toggleGroup(this.activeIndex,true);
          else if (this.filtered[this.activeIndex+1]?.depth > item.depth) this.highlight(this.activeIndex+1);
        } else if (event.key === 'ArrowLeft') {
          if (item.children && item.expanded) this.toggleGroup(this.activeIndex,false);
          else if (item.parent !== null) this.highlight(this.filtered.findIndex(x => x.key === item.parent));
        }
        return;
      }
      if (this.isSelector && event.key === ' ') { event.preventDefault(); if (!this.opened) this.open(); else this.choose(this.activeIndex); return; }
      if (this.config.type === 'date') {
        if (event.key === 'ArrowDown' || (event.key === 'Enter' && this.opened)) {
          event.preventDefault(); this.open(); this.popup.querySelector('[tabindex="0"]')?.focus();
        } else if (event.key === 'Enter') { event.preventDefault(); this.validate(); }
        return;
      }
      if (this.hasList && ['ArrowDown','ArrowUp','Home','End','Enter'].includes(event.key)) {
        if (event.key === 'Enter' && !this.opened) {
          if (this.isSelector) { this.open(); this.highlight(0); event.preventDefault(); }
          else { this.validate(); this.emit(this.config.type === 'search' ? 'search' : 'change'); }
          return;
        }
        event.preventDefault();
        if (!this.opened) this.open();
        if (event.key === 'ArrowDown') this.highlight(this.activeIndex + 1);
        if (event.key === 'ArrowUp') this.highlight(this.activeIndex < 0 ? this.filtered.length - 1 : this.activeIndex - 1);
        if (event.key === 'Home') this.highlight(0);
        if (event.key === 'End') this.highlight(this.filtered.length - 1);
        if (event.key === 'Enter') {
          if (this.activeIndex >= 0) this.choose(this.activeIndex);
          else if (this.config.type === 'time') { this.validate(); this.close(); }
          else if (['input','search'].includes(this.config.type)) { this.close(); this.emit(this.config.type === 'search' ? 'search' : 'change'); }
        }
      } else if (this.isSelector && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        this.open();
        const match = this.filtered.findIndex(x => x.label.toLocaleLowerCase('ru').startsWith(event.key.toLocaleLowerCase('ru')));
        if (match >= 0) this.highlight(match);
        event.preventDefault();
      } else if (event.key === 'Enter') { this.validate(); this.emit(this.config.type === 'search' ? 'search' : 'change'); }
    }
    calendarMonthCount() {
      return this.isRange && this.calendarMode === 'day' && this.config.monthsToShow !== 1 && innerWidth >= 560 ? 2 : 1;
    }
    renderCalendar() {
      const count = this.calendarMonthCount();
      if (count === 2 && this.calendarDate.getFullYear() === 2099 && this.calendarDate.getMonth() === 11) this.calendarDate = new Date(2099,10,1);
      const d = this.calendarDate;
      this.renderedMonths = count;
      this.popup.classList.toggle('field-popup--range',this.isRange);
      const rowsFor = date => Math.ceil(((new Date(date.getFullYear(),date.getMonth(),1).getDay()+6)%7 + new Date(date.getFullYear(),date.getMonth()+1,0).getDate())/7);
      const views = Array.from({length:count},(_,i)=>new Date(d.getFullYear(),d.getMonth()+i,1));
      const commonRows = Math.max(...views.map(rowsFor));
      const panels = views.map((view,panel)=>{
        const year = view.getFullYear(), month = view.getMonth(), yearStart = Math.floor(year/16)*16;
        const header = this.calendarMode === 'year' ? `${yearStart} — ${yearStart+15}` : `<button class="calendar-button" type="button" data-calendar="month-mode" data-panel="${panel}">${months[month]}</button><button class="calendar-button" type="button" data-calendar="year-mode" data-panel="${panel}">${year}</button>`;
        let body = '';
        if (this.calendarMode === 'day') {
          const start = new Date(year,month,1);
          start.setDate(start.getDate() - (start.getDay()+6)%7);
          const selected = !this.isRange && parseDate(this.value);
          const rows = count === 2 ? commonRows : rowsFor(view);
          body = `<div class="calendar-weekdays" aria-hidden="true">${['пн','вт','ср','чт','пт','сб','вс'].map(x=>`<span>${x}</span>`).join('')}</div><div class="calendar-grid" role="grid" aria-label="${months[month]} ${year}${this.isRange ? ', выбор диапазона' : ''}" ${this.isRange ? 'aria-multiselectable="true"' : ''}>${Array.from({length:rows*7},(_,i)=>{
            const day = new Date(start); day.setDate(start.getDate()+i);
            const value = formatDate(day), focused = sameDate(day,this.calendarFocus) && day.getMonth()===month;
            return `<button type="button" role="gridcell" class="calendar-day" data-calendar="day" data-panel="${panel}" data-value="${value}" data-weekend="${day.getDay()===0 || day.getDay()===6}" data-other="${day.getMonth()!==month}" data-today="${sameDate(day,today)}" aria-label="${value}" aria-selected="${!!sameDate(day,selected)}" tabindex="${focused ? '0' : '-1'}" ${day.getFullYear()<1900 || day.getFullYear()>2099 ? 'disabled' : ''}>${day.getDate()}</button>`;
          }).join('')}</div>`;
        } else {
          body = `<div class="calendar-choices">${Array.from({length:this.calendarMode==='month'?12:16},(_,i)=>{
            const value = this.calendarMode==='month' ? i : yearStart+i;
            const label = this.calendarMode==='month' ? months[i].slice(0,3).toLocaleLowerCase('ru') : value;
            return `<button type="button" class="calendar-day calendar-choice" data-calendar="${this.calendarMode}" data-value="${value}" ${this.calendarMode==='year' && (value<1900 || value>2099) ? 'disabled' : ''}>${label}</button>`;
          }).join('')}</div>`;
        }
        return `<div class="calendar-header"><button type="button" class="calendar-button calendar-arrow" data-calendar="previous" aria-label="Назад"><span class="calendar-icon-slot">${icon('calendarLeft')}</span></button><div class="calendar-titles">${header}</div><button type="button" class="calendar-button calendar-arrow" data-calendar="next" aria-label="Вперёд"><span class="calendar-icon-slot">${icon('calendarRight')}</span></button></div>${body}`;
      });
      this.popup.innerHTML = this.isRange ? `<div class="calendar-panels" data-months="${count}" style="--calendar-columns:${count}">${panels.map(panel=>`<div class="calendar-panel">${panel}</div>`).join('')}</div>` : panels[0];
      if (!this.popup.querySelector('[tabindex="0"]') && this.calendarMode === 'day') this.popup.querySelector('.calendar-day[data-other="false"]:not(:disabled)')?.setAttribute('tabindex','0');
      if (this.isRange) this.paintRange();
    }
    paintRange() {
      if (!this.isRange || !this.popup) return;
      const range = parseDateRange(this.value);
      const anchor = this.rangeAnchor || range?.start;
      const end = this.rangeAnchor ? this.rangePreview : range?.end;
      const low = anchor && end ? Math.min(+anchor,+end) : null;
      const high = anchor && end ? Math.max(+anchor,+end) : null;
      this.popup.querySelectorAll('[data-calendar="day"]').forEach(button=>{
        const day = parseDate(button.dataset.value), own = button.dataset.other === 'false' && !button.disabled;
        const startEdge = own && !!sameDate(day,anchor);
        const endEdge = own && !this.rangeAnchor && !!sameDate(day,end);
        const candidate = own && !!this.rangeAnchor && !!sameDate(day,this.rangePreview) && !startEdge;
        const between = own && low !== null && +day > low && +day < high;
        button.dataset.rangeStart = String(startEdge);
        button.dataset.rangeEnd = String(endEdge);
        button.dataset.inRange = String(between || candidate);
        button.dataset.rangePreview = String(candidate);
        button.setAttribute('aria-selected',String(startEdge || endEdge || (between && !this.rangeAnchor)));
        button.setAttribute('aria-label',`${button.dataset.value}${startEdge && endEdge ? ', начало A и конец B диапазона' : startEdge ? ', начало диапазона A' : endEdge ? ', конец диапазона B' : between || candidate ? this.rangeAnchor ? ', предварительный диапазон' : ', в выбранном диапазоне' : ''}`);
      });
    }
    calendarAction(action,value,panel = 0) {
      let refocus = '';
      if (action === 'day') {
        const day = parseDate(value);
        if (!day || this.disabled) return;
        if (!this.isRange) {
          this.setValue(value); this.close(); this.input.focus(); return;
        }
        const view = new Date(this.calendarDate);
        if (this.rangeAnchor) {
          const a = this.rangeAnchor;
          this.setValue(formatDateRange(a <= day ? {start:a,end:day} : {start:day,end:a}));
          if (this.closeOnSelect) { this.close(); this.input.focus(); return; }
        } else {
          this.setValue(formatDate(day),false);
          this.emit('input');
        }
        this.calendarDate = view;
        this.calendarFocus = new Date(day);
        this.renderCalendar(); this.position();
        this.popup.querySelector(`[data-calendar="day"][data-other="false"][data-value="${value}"]`)?.focus({preventScroll:true});
        return;
      }
      if (panel && ['month-mode','year-mode'].includes(action)) this.calendarDate = new Date(this.calendarDate.getFullYear(),this.calendarDate.getMonth()+panel,1);
      if (action === 'month-mode') { this.calendarMode = 'month'; refocus = `[data-calendar="month"][data-value="${this.calendarDate.getMonth()}"]`; }
      if (action === 'year-mode') { this.calendarMode = 'year'; refocus = `[data-calendar="year"][data-value="${this.calendarDate.getFullYear()}"]`; }
      if (action === 'month') { this.calendarDate.setDate(1); this.calendarDate.setMonth(+value); this.calendarMode = 'day'; }
      if (action === 'year') { this.calendarDate.setDate(1); this.calendarDate.setFullYear(+value); this.calendarMode = 'month'; }
      if (action === 'previous' || action === 'next') {
        const step = action === 'previous' ? -1 : 1;
        const d = new Date(this.calendarDate); d.setDate(1);
        if (this.calendarMode === 'day') d.setMonth(d.getMonth()+step);
        else d.setFullYear(d.getFullYear()+step*(this.calendarMode==='year'?16:1));
        if (d.getFullYear() < 1900 || d.getFullYear() > 2099 || (this.calendarMonthCount() === 2 && d.getFullYear() === 2099 && d.getMonth() === 11)) return;
        this.calendarDate = d;
        refocus = `[data-calendar="${action}"]`;
      }
      this.calendarFocus = new Date(this.calendarDate.getFullYear(),this.calendarDate.getMonth(),1);
      this.renderCalendar(); this.position();
      this.popup.querySelector(refocus || '[tabindex="0"],.calendar-choice:not(:disabled)')?.focus();
    }
    calendarKeydown(event) {
      if (this.config.type !== 'date') return;
      if (event.key === 'Escape') { event.preventDefault(); this.close(); this.input.focus(); return; }
      const button = event.target.closest('[data-calendar="day"]');
      if (!button) return;
      const date = parseDate(button.dataset.value);
      const delta = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key];
      if (delta !== undefined) date.setDate(date.getDate()+delta);
      else if (event.key === 'Home') date.setDate(date.getDate()-(date.getDay()+6)%7);
      else if (event.key === 'End') date.setDate(date.getDate()+6-(date.getDay()+6)%7);
      else if (event.key === 'PageUp' || event.key === 'PageDown') {
        const oldDay = date.getDate();date.setDate(1);date.setMonth(date.getMonth()+(event.key==='PageUp'?-1:1));date.setDate(Math.min(oldDay,new Date(date.getFullYear(),date.getMonth()+1,0).getDate()));
      } else return;
      event.preventDefault();
      if (date.getFullYear()<1900 || date.getFullYear()>2099) return;
      this.calendarFocus = date;
      if (this.isRange) {
        if (this.rangeAnchor) this.rangePreview = new Date(date);
        const first = new Date(this.calendarDate.getFullYear(),this.calendarDate.getMonth(),1);
        const after = new Date(first.getFullYear(),first.getMonth()+this.calendarMonthCount(),1);
        if (date < first || date >= after) this.calendarDate = new Date(date.getFullYear(),date.getMonth(),1);
      } else this.calendarDate = new Date(date);
      this.renderCalendar(); this.position();
      this.popup.querySelector(`[data-value="${formatDate(date)}"][data-other="false"]`)?.focus({preventScroll:true});
    }
    destroy() {
      this.close();
      this.resizeObserver?.disconnect();
      this.mount.innerHTML = '';
    }
  }
  class Menu extends Field {
    constructor(mount,config = {}) {
      super(mount,{type:'multiselector',inlineMenu:true,label:'Варианты меню',required:false,hint:'',clear:false,bulkActions:false,...config});
    }
  }
  document.addEventListener('pointerdown',event => { if (openField && !openField.root.contains(event.target)) openField.close(); });
  window.addEventListener('resize',()=>openField?.position());
  document.addEventListener('scroll',event=> { if (openField && !openField.popup.contains(event.target)) openField.position(); },true);
  window.UIKitControls = {Field,Menu,parseDate,parseDateRange,parseTime,formatDate,formatDateRange};
})();
