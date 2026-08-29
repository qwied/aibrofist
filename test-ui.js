/* Прогон интерфейса редактора на самодельном DOM.
   Настоящего браузера здесь нет, поэтому поднимаем минимальный DOM
   с canvas-заглушкой, грузим весь inline-скрипт редактора и жмём кнопки —
   включая касания на телефоне. Если хоть один обработчик упадёт, будет видно. */
const fs = require('fs');

const listeners = new Map();
const byId = {};
const all = [];

function mkEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    style: new Proxy({}, { get: (t, k) => t[k] || '', set: (t, k, v) => (t[k] = v, true) }),
    dataset: {}, children: [], attrs: {}, _text: '',
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, on) { on === undefined ? (this._s.has(c) ? this._s.delete(c) : this._s.add(c)) : (on ? this._s.add(c) : this._s.delete(c)); },
      contains(c) { return this._s.has(c); }
    },
    get className() { return [...this.classList._s].join(' '); },
    set className(v) { this.classList._s = new Set(String(v).split(/\s+/).filter(Boolean)); },
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); },
    get innerHTML() { return this._text; },
    set innerHTML(v) { this._text = String(v); this.children = []; },
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    append(...c) { c.forEach(x => this.appendChild(x)); },
    insertBefore(c) { this.children.unshift(c); return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); },
    remove() {},
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = v; },
    getAttribute(k) { return this.attrs[k] === undefined ? null : this.attrs[k]; },
    removeAttribute(k) { delete this.attrs[k]; },
    addEventListener(t, fn) {
      if (!listeners.has(this)) listeners.set(this, {});
      (listeners.get(this)[t] = listeners.get(this)[t] || []).push(fn);
    },
    removeEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 600 }; },
    closest(sel) {
      const cls = sel.replace(/^\./, '');
      let n = this;
      while (n) { if (n.classList && n.classList.contains(cls)) return n; n = n.parentNode; }
      return null;
    },
    // разметку внутри элементов харнесс не строит целиком,
    // поэтому отдаём заглушку — важно, что цепочка вызовов не падает
    querySelector(sel) {
      this._stubs = this._stubs || {};
      if (!this._stubs[sel]) { const e = mkEl('div'); all.push(e); this._stubs[sel] = e; }
      return this._stubs[sel];
    },
    querySelectorAll() { return []; },
    focus() {}, select() {}, blur() {}, click() { fire(this, 'click', {}); },
    getContext() { return ctx2d; },
    width: 900, height: 600, value: '', checked: false, files: []
  };
  // элементы, созданные скриптом, тоже должны находиться по id
  let _id = '';
  Object.defineProperty(el, 'id', {
    get() { return _id; },
    set(v) { _id = String(v); byId[_id] = el; },
    configurable: true
  });
  return el;
}

// canvas-контекст: считает вызовы, ничего не рисует
const ctx2d = new Proxy({}, {
  get(t, k) {
    if (k === 'canvas') return { width: 900, height: 600 };
    if (k === 'measureText') return () => ({ width: 10 });
    if (k === 'createLinearGradient' || k === 'createRadialGradient')
      return () => ({ addColorStop() {} });
    if (typeof t[k] === 'undefined') return () => {};
    return t[k];
  },
  set(t, k, v) { t[k] = v; return true; }
});

function fire(el, type, ev) {
  const ls = (listeners.get(el) || {})[type] || [];
  const e = Object.assign({
    target: el, currentTarget: el, preventDefault() {}, stopPropagation() {},
    button: 0, offsetX: 100, offsetY: 100, clientX: 100, clientY: 100,
    touches: [], key: '', code: '', deltaY: 0
  }, ev);
  ls.forEach(fn => fn.call(el, e));
  return ls.length;
}

const doc = {
  readyState: 'complete',
  documentElement: mkEl('html'),
  head: mkEl('head'),
  body: mkEl('body'),
  createElement(t) { const e = mkEl(t); all.push(e); return e; },
  createElementNS(_, t) { return this.createElement(t); },
  createTextNode(t) { const e = mkEl('#text'); e._text = t; return e; },
  createTreeWalker() { return { nextNode: () => null }; },
  getElementById(id) { return byId[id] || null; },
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
  querySelectorAll(sel) {
    if (sel.startsWith('.')) {
      const c = sel.slice(1).split('[')[0];
      return all.filter(e => e.classList.contains(c));
    }
    const m = sel.match(/\[data-tool="([^"]+)"\]/);
    if (m) return all.filter(e => e.dataset.tool === m[1]);
    return [];
  },
  addEventListener(t, fn) { doc._l = doc._l || {}; (doc._l[t] = doc._l[t] || []).push(fn); },
  removeEventListener() {},
  activeElement: null
};
doc.documentElement.appendChild(doc.body);

// разбираем разметку страницы: нам нужны только элементы с id
function collectIds(html) {
  for (const m of html.matchAll(/<(\w+)([^>]*\sid="([\w-]+)")[^>]*>/g)) {
    const el = mkEl(m[1]);
    el.id = m[3];
    for (const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g)) {
      if (a[1].startsWith('data-')) el.dataset[a[1].slice(5).replace(/-(\w)/g, (x, c) => c.toUpperCase())] = a[2];
      else el.setAttribute(a[1], a[2]);
    }
    for (const c of (m[0].match(/class="([^"]*)"/) || [, ''])[1].split(/\s+/)) if (c) el.classList.add(c);
    byId[el.id] = el;
    all.push(el);
    doc.body.appendChild(el);
  }
}

const html = fs.readFileSync('/home/claude/work/editor.html', 'utf8');
collectIds(html);

global.document = doc;
global.window = {
  addEventListener(t, fn) { global.window._l = global.window._l || {}; (global.window._l[t] = global.window._l[t] || []).push(fn); },
  removeEventListener() {}, matchMedia: () => ({ matches: false, addListener() {} }),
  innerWidth: 900, innerHeight: 600, devicePixelRatio: 1,
  requestAnimationFrame() { return 1; }, cancelAnimationFrame() {},
  location: { href: '', pathname: '/editor.html', search: '' },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  Image: function () { return { src: '', complete: false, naturalWidth: 0 }; },
  fetch: () => Promise.reject(new Error('offline')),
  navigator: { language: 'ru', languages: ['ru'] },
  Path2D: function () {}, TextDecoder: function () { this.decode = () => ''; }
};
const G = {
  addEventListener: global.window.addEventListener,
  requestAnimationFrame: global.window.requestAnimationFrame,
  localStorage: global.window.localStorage,
  matchMedia: global.window.matchMedia,
  innerWidth: 900, innerHeight: 600, devicePixelRatio: 1,
  Image: global.window.Image, Path2D: global.window.Path2D,
  fetch: global.window.fetch, navigator: global.window.navigator,
  location: global.window.location, alert: () => {}, prompt: () => null,
  confirm: () => true, FileReader: function () { this.readAsText = () => {}; },
  Blob: function () {}, URL: { createObjectURL: () => '', revokeObjectURL() {} },
  CompressionStream: undefined, DecompressionStream: undefined,
  // socket.io на сервере подключается отдельным файлом — заглушаем
  io: () => ({ on() {}, emit() {}, connected: false }),
  URLSearchParams: global.URLSearchParams,
  BFSkinCanvas: undefined, BFSkin: undefined, BFImport: undefined, BFLZMA: undefined
};
for (const k of Object.keys(G)) {
  try { Object.defineProperty(global, k, { value: G[k], writable: true, configurable: true }); }
  catch (e) {}
}

const code = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)]
  .map(m => m[1]).join('\n');

let bootError = null;
try {
  new Function(code)();
} catch (e) { bootError = e; }

console.log(bootError
  ? '✗ Редактор упал при загрузке: ' + bootError.message
  : '✓ Редактор загрузился без ошибок');
if (bootError) { console.log(bootError.stack.split('\n').slice(0, 4).join('\n')); process.exit(1); }

// ---- жмём каждую кнопку ----
const buttons = ['bSave', 'bOpen', 'bImport', 'bJson', 'bPlay', 'bUndo', 'bRedo',
                 'bCopy', 'bDel', 'bGrid', 'zIn', 'zOut', 'inspClose', 'dOk', 'dNo'];
// эти кнопки обрабатываются делегированием на родителе (в браузере — всплытие)
const DELEGATED = { inspClose: 'inspHead' };
let clicked = 0, failed = 0, missing = 0;
for (const id of buttons) {
  const el = byId[id];
  if (!el) { console.log(`  ? ${id}: нет на странице`); missing++; continue; }
  const host = DELEGATED[id] ? byId[DELEGATED[id]] : el;
  try {
    const n = fire(host, 'click', { target: el });
    if (n === 0) { console.log(`  ✗ ${id}: обработчик не назначен`); failed++; }
    else clicked++;
  } catch (e) { console.log(`  ✗ ${id}: ${e.message}`); failed++; }
}
console.log(`\nКнопки панелей: нажато ${clicked}, без обработчика ${failed}, отсутствует ${missing}`);

// ---- инструменты ----
const toolsEl = byId['tools'];
let tools = 0, toolFail = 0;
if (toolsEl) {
  for (const t of toolsEl.children) {
    try { fire(toolsEl, 'click', { target: t }); tools++; }
    catch (e) { console.log(`  ✗ инструмент ${t.dataset.tool}: ${e.message}`); toolFail++; }
  }
}
console.log(`Инструментов в палитре: ${tools}, ошибок ${toolFail}`);

// ---- режимы ----
const modesEl = byId['modes'];
let modes = 0;
if (modesEl) {
  for (const b of modesEl.children) {
    try { fire(modesEl, 'click', { target: b }); modes++; } catch (e) { console.log('  ✗ режим:', e.message); }
  }
}
console.log(`Кнопок режимов: ${modes}`);

// ---- касания по холсту: рисование и панорамирование ----
const cv = byId['c'];
let touchOk = 0;
try {
  fire(cv, 'touchstart', { touches: [{ clientX: 120, clientY: 140 }] }); touchOk++;
  fire(cv, 'touchmove', { touches: [{ clientX: 260, clientY: 210 }] }); touchOk++;
  fire(cv, 'touchend', { touches: [] }); touchOk++;
  fire(cv, 'mousedown', { button: 0, offsetX: 120, offsetY: 140 }); touchOk++;
  fire(cv, 'mousemove', { offsetX: 300, offsetY: 260 }); touchOk++;
  fire(cv, 'mousedown', { button: 2, offsetX: 120, offsetY: 140 }); touchOk++;
  fire(cv, 'wheel', { offsetX: 100, offsetY: 100, deltaY: -100 }); touchOk++;
  console.log(`Холст: касание, перетаскивание и колесо — ${touchOk}/7 событий прошли`);
} catch (e) {
  console.log('  ✗ холст:', e.message); failed++;
}

process.exit(failed || toolFail ? 1 : 0);
