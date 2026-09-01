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
const buttons = ['bSave', 'bOpen', 'bJson', 'bPlay', 'bUndo', 'bRedo',
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

/* ---- вода и рикошет вживую ----
   Строим маленькую сцену через мост GAME и крутим настоящий шаг физики:
   так проверяется не текст исходника, а поведение. */
const GAME = global.window && global.window.GAME;
let phys = 0, physFail = 0;
// harness жал все кнопки подряд, включая пад — снимаем зажатое управление
function clearKeys() {
  if (!GAME) return;
  GAME.keys.l = GAME.keys.r = GAME.keys.u = GAME.keys.d = false;
  GAME.pl.vx = 0;
}
function check(name, cond) {
  if (cond) phys++;
  else { physFail++; console.log('  ✗', name); }
}
if (!GAME) { console.log('  ✗ мост GAME недоступен'); physFail++; }
else {
  const floor = { id: 1, type: 'rect', x: 0, y: 400, w: 600, h: 40, rot: 0, fill: '#111827' };
  const spawn = { id: 2, type: 'spawn', x: 60, y: 340, w: 20, h: 60, rot: 0, fill: '#111827' };
  const pool  = [];
  for (let i = 0; i < 6; i++)
    pool.push({ id: 10 + i, type: 'water', x: 200, y: 280 + i * 20, w: 240, h: 20,
                rot: 0, fill: '#3b82f6', acid: false });

  // 1. падение и приземление на пол
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, spawn] });
  GAME.startPlay();
  clearKeys();
  for (let i = 0; i < 120; i++) GAME.step();
  check('игрок встаёт на пол', GAME.pl.ground && Math.abs(GAME.pl.y + GAME.pl.h - 400) < 2);
  check('размер игрока 20x60', GAME.pl.w === 20 && GAME.pl.h === 60);

  // 2. вода: всплытие и голова над поверхностью
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, spawn, ...pool] });
  GAME.startPlay();
  clearKeys();
  GAME.pl.x = 300; GAME.pl.y = 300; GAME.pl.vy = 0;   // в толще воды, над полом
  for (let i = 0; i < 200; i++) GAME.step();
  check('игрок в воде', GAME.pl.inWater);
  check('всплыл к поверхности', Math.abs(GAME.pl.y - 280) < 40);
  check('голова над водой', !GAME.pl.headUnder);
  check('воздух восстановился', GAME.pl.air > 0);

  // 3. под водой плыть медленнее, чем бежать по суше
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, spawn] });
  GAME.startPlay();
  clearKeys();
  GAME.pl.x = 60; GAME.pl.y = 340; GAME.keys.r = true;
  for (let i = 0; i < 90; i++) GAME.step();
  const landVX = Math.abs(GAME.pl.vx);

  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, spawn, ...pool] });
  GAME.startPlay();
  clearKeys();
  GAME.pl.x = 210; GAME.pl.y = 320; GAME.keys.r = true;
  // держим игрока в бассейне: иначе он выплывет за 90 кадров
  for (let i = 0; i < 90; i++) { GAME.pl.x = 300; GAME.pl.y = 320; GAME.step(); }
  const waterVX = Math.abs(GAME.pl.vx);
  clearKeys();
  check('в воде медленнее, чем на суше', waterVX < landVX && waterVX > landVX * 0.5);

  // 4. воздух кончается под водой и начинается урон
  clearKeys();
  GAME.pl.x = 300; GAME.pl.y = 340; GAME.pl.air = 3; GAME.pl.hp = 100;
  let under = 0;
  for (let i = 0; i < 90; i++) { GAME.pl.y = 340; GAME.step(); if (GAME.pl.headUnder) under++; }
  check('голова под водой считается', under > 60);
  check('без воздуха идёт урон', GAME.pl.hp < 100);

  // 5. кислота жжёт сразу, даже с полным воздухом
  const acid = pool.map(o => Object.assign({}, o, { acid: true }));
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, spawn, ...acid] });
  GAME.startPlay();
  clearKeys();
  GAME.pl.x = 300; GAME.pl.y = 300; GAME.pl.air = 600; GAME.pl.hp = 100;
  for (let i = 0; i < 60; i++) { GAME.pl.y = 300; GAME.step(); }
  check('кислота ранит при касании', GAME.pl.hp < 100);

  // 6. частицы воды: рождаются, держатся в объёме и успокаиваются
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, spawn, ...pool] });
  GAME.startPlay();
  clearKeys();
  const parts = GAME.water;
  check('частицы появились', parts.length > 20 && parts.length <= 700);
  for (let i = 0; i < 240; i++) GAME.step();
  const outside = parts.filter(p =>
    p.x < 200 - 20 || p.x > 440 + 20 || p.y < 280 - 20 || p.y > 400 + 20).length;
  check('вода не выливается за объём', outside === 0, outside + ' сбежало');
  const fast = parts.filter(p => Math.abs(p.vx) > 6.1 || Math.abs(p.vy) > 8.1).length;
  check('рой не разлетается', fast === 0);
  const spread = Math.max(...parts.map(p => p.x)) - Math.min(...parts.map(p => p.x));
  check('частицы расходятся, а не слипаются в точку', spread > 60);

  // 7. затягивание: из яда не выплыть даже с зажатым прыжком
  const acidPool = pool.map(o => Object.assign({}, o,
    { acid: true, sink: true, sinkSpeed: 1.8, fill: '#38d430' }));
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, spawn, ...acidPool] });
  GAME.startPlay();
  clearKeys();
  GAME.pl.x = 300; GAME.pl.y = 290; GAME.pl.hp = 100; GAME.pl.vy = 0;
  const startY = GAME.pl.y;
  GAME.keys.u = true;
  for (let i = 0; i < 60; i++) GAME.step();
  check('затягивает вниз', GAME.pl.sinking && GAME.pl.y > startY + 20);
  check('с зажатым прыжком не выплыть', GAME.pl.y > startY);
  clearKeys();

  // 8. рикошет: падение на отражающий блок отбрасывает вверх
  const rico = { id: 3, type: 'rect', x: 0, y: 400, w: 600, h: 40, rot: 0,
                 fill: '#a855f7', ricochet: true };
  GAME.loadMap({ mode: 'hideAndSeek', objects: [rico, spawn] });
  GAME.startPlay();
  clearKeys();
  GAME.pl.x = 300; GAME.pl.y = 200; GAME.pl.vy = 8;
  let bounced = false;
  for (let i = 0; i < 60; i++) { GAME.step(); if (GAME.pl.vy < -3) bounced = true; }
  check('рикошет отбрасывает вверх', bounced);

  // 7. по стене не забраться, но по ней сползают
  const wall = { id: 4, type: 'rect', x: 320, y: 100, w: 40, h: 300, rot: 0, fill: '#111827' };
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, spawn, wall] });
  GAME.startPlay();
  clearKeys();
  GAME.pl.x = 296; GAME.pl.y = 150; GAME.pl.vy = 0;
  GAME.keys.r = true; GAME.keys.u = true;          // жмём в стену и вверх
  let topY = GAME.pl.y, freeFall = 0;
  for (let i = 0; i < 60; i++) { GAME.step(); if (GAME.pl.y < topY) topY = GAME.pl.y; }
  check('по стене не забраться', topY >= 149);
  const slideVY = GAME.pl.vy;
  clearKeys();
  // то же падение, но в стороне от стены — для сравнения скорости
  GAME.pl.x = 100; GAME.pl.y = 150; GAME.pl.vy = 0;
  for (let i = 0; i < 60; i++) { GAME.pl.y = 150; GAME.step(); freeFall = GAME.pl.vy; }
  check('у стены падение медленнее', slideVY < freeFall, slideVY.toFixed(2) + ' против ' + freeFall.toFixed(2));

  // 8. топление: тянет вниз и вверх не пускает
  const sink = pool.map(o => Object.assign({}, o, { acid: true, sink: true, sinkSpeed: 2.2 }));
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, spawn, ...sink] });
  GAME.startPlay();
  clearKeys();
  GAME.pl.x = 300; GAME.pl.y = 290; GAME.keys.u = true;   // изо всех сил гребём вверх
  let sinkY0 = GAME.pl.y, wentUp = false;
  for (let i = 0; i < 120; i++) { GAME.step(); if (GAME.pl.y < sinkY0 - 1) wentUp = true; }
  check('из топящей воды не выплыть', !wentUp);
  check('затягивает вниз', GAME.pl.y > sinkY0 + 20);
  clearKeys();
  GAME.stop();
}
// ---- нагрузка: большой бассейн на полный потолок частиц ----
if (GAME) {
  const big = [{ id: 1, type: 'rect', x: 0, y: 900, w: 2000, h: 40, rot: 0, fill: '#111827' },
               { id: 2, type: 'spawn', x: 60, y: 840, w: 20, h: 60, rot: 0, fill: '#111827' }];
  for (let r = 0; r < 30; r++)
    big.push({ id: 100 + r, type: 'water', x: 100, y: 300 + r * 20, w: 1600, h: 20,
               rot: 0, fill: '#3b82f6' });
  GAME.loadMap({ mode: 'hideAndSeek', objects: big });
  GAME.startPlay();
  clearKeys();
  const t0 = Date.now();
  for (let i = 0; i < 300; i++) GAME.step();
  const ms = (Date.now() - t0) / 300;
  console.log(`Нагрузка: ${GAME.water.length} частиц, ${ms.toFixed(2)} мс на кадр физики`);
  check('шаг физики укладывается в кадр', ms < 8, ms.toFixed(2) + ' мс');
  GAME.stop();
}

console.log(`Физика: пройдено ${phys}, ошибок ${physFail}`);

process.exit(failed || toolFail || physFail ? 1 : 0);
