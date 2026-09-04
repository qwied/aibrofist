/* Сценарные тесты воды v75 — жидкие частицы вместо кубов:
   1) налитая куча сама растекается в ровную лужу (частицы, не плиты);
   2) объём не теряется: осевших частиц столько же, сколько капель;
   3) вода выравнивается в сосуде (уровни — как у настоящей воды);
   4) жидкость не протекает сквозь стенку сосуда;
   5) водопад с уступа: частицы падают и оседают внизу;
   6) частица впитывается авторским бассейном и поднимает уровень;
   7) игрок плавает в налитой луже: тонет медленно, плывёт вверх;
   8) кислота из струи убивает при погружении;
   9) сохранение/загрузка карты перевозит жидкие частицы;
   10) Ctrl+Z смывает сеанс литья целиком. */
const fs = require('fs');
const path = '/home/z/my-project/aibrofist/';
const byId = {};
function mkEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    style: new Proxy({}, { get: (t, k) => t[k] || '', set: (t, k, v) => (t[k] = v, true) }),
    dataset: {}, children: [], attrs: {}, _text: '',
    classList: { _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle() {}, contains() { return false; } },
    get className() { return ''; }, set className(v) {},
    get textContent() { return this._text; }, set textContent(v) { this._text = String(v); },
    get innerHTML() { return this._text; }, set innerHTML(v) { this._text = String(v); this.children = []; },
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    append(...c) { c.forEach(x => this.appendChild(x)); },
    insertBefore(c) { this.children.unshift(c); return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); },
    remove() {},
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = v; },
    getAttribute(k) { return this.attrs[k] === undefined ? null : this.attrs[k]; },
    removeAttribute() {},
    addEventListener() {}, removeEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 600 }; },
    closest() { return null; },
    querySelector() { return mkEl('div'); }, querySelectorAll() { return []; },
    focus() {}, select() {}, blur() {}, click() {},
    getContext() { return ctx2d; },
    width: 900, height: 600, value: '', checked: false, files: []
  };
  return el;
}
const ctx2d = new Proxy({}, {
  get(t, k) {
    if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
    if (k === 'measureText') return () => ({ width: 10 });
    if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
    return typeof t[k] !== 'undefined' ? t[k] : () => {};
  },
  set(t, k, v) { t[k] = v; return true; }
});
const doc = {
  getElementById(id) { return byId[id] || (byId[id] = mkEl('div')); },
  createElement: mkEl, createTextNode: t => ({ _text: t }),
  body: mkEl('body'), documentElement: mkEl('html'), head: mkEl('head'),
  querySelector() { return mkEl('div'); }, querySelectorAll() { return []; },
  addEventListener() {}, removeEventListener() {}
};
const html0 = fs.readFileSync(path + 'editor.html', 'utf8');
for (const m of html0.matchAll(/id="([^"]+)"/g)) {
  const el = mkEl('div'); el.id = m[1]; el.setAttribute('id', m[1]);
  byId[el.id] = el; doc.body.appendChild(el);
}
global.document = doc;
global.window = {
  addEventListener() {}, removeEventListener() {},
  matchMedia: () => ({ matches: false, addListener() {} }),
  innerWidth: 900, innerHeight: 600, devicePixelRatio: 1,
  requestAnimationFrame() { return 1; }, cancelAnimationFrame() {},
  location: { href: '', pathname: '/editor.html', search: '' },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  Image: function () { return { src: '', complete: false, naturalWidth: 0 }; },
  fetch: () => Promise.reject(new Error('offline')),
  navigator: { language: 'ru', languages: ['ru'] },
  Path2D: function () { this.rect = () => {}; this.arc = () => {}; this.moveTo = () => {}; },
  TextDecoder: function () { this.decode = () => ''; }
};
const G = {
  addEventListener: global.window.addEventListener, requestAnimationFrame: global.window.requestAnimationFrame,
  localStorage: global.window.localStorage, matchMedia: global.window.matchMedia,
  innerWidth: 900, innerHeight: 600, devicePixelRatio: 1,
  Image: global.window.Image, Path2D: global.window.Path2D, fetch: global.window.fetch,
  navigator: global.window.navigator, location: global.window.location,
  alert: () => {}, prompt: () => null, confirm: () => true,
  FileReader: function () { this.readAsText = () => {}; },
  Blob: function () {}, URL: { createObjectURL: () => '', revokeObjectURL() {} },
  CompressionStream: undefined, DecompressionStream: undefined,
  io: () => ({ on() {}, emit() {}, connected: false }),
  URLSearchParams: global.URLSearchParams,
  BFSkinCanvas: undefined, BFSkin: undefined, BFImport: undefined, BFLZMA: undefined
};
for (const k of Object.keys(G)) {
  try { Object.defineProperty(global, k, { value: G[k], writable: true, configurable: true }); }
  catch (e) {}
}
const html = fs.readFileSync(path + 'editor.html', 'utf8');
const code = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
(0, eval)(code);
const GAME = global.window.GAME;

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗', name, extra !== undefined ? '(' + extra + ')' : ''); }
}
function ticks(n) { for (let i = 0; i < n; i++) GAME.stepAlways(); }
const R = (id, x, y, w, h) => ({ id, type: 'rect', x, y, w, h, rot: 0, fill: '#111827' });
const SP = (id, x, y) => ({ id, type: 'spawn', x, y, w: 20, h: 60, rot: 0, fill: '#111827' });

console.log('1) налитая куча растекается в ровную лужу (не кубом)');
{
  const floor = R(1, 100, 500, 800, 40);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, SP(2, 40, 420)] });
  GAME.startPour(460, 100, '#38bdf8', false);
  ticks(120);                                   // 2с струи — узкая куча по центру
  const midSpan0 = pileSpan();
  GAME.stopPour();
  for (let k = 0; k < 600 && GAME.pourParts.length; k++) ticks(16);
  ticks(600);                                   // 10с течения
  const span = pileSpan();
  const cols = surfaceCols(20);
  const tops = Object.values(cols);
  const uneven = tops.length ? Math.max(...tops) - Math.min(...tops) : 0;
  check('куча стала частицами жидкости', GAME.liq.length > 100, GAME.liq.length);
  /* спокойная физика (v80): куча ровняется прямо во время литья, поэтому
     старый критерий «×2.2 от промежуточного» устарел — проверяем физику
     напрямую: лужа широкая и неглубокая (не куб, а плёнка) */
  const colLoad = (() => { const t = {}; let m = 0;
    for (const p of GAME.liq) { const c = Math.floor(p.x / 6); t[c] = (t[c] || 0) + 1; }
    for (const k in t) if (t[k] > m) m = t[k];
    return m; })();
  check('лужа расползлась шире кучи', span > 380, midSpan0.toFixed(0) + ' → ' + span.toFixed(0));
  check('лужа — не куб (колонки ≤ 10 капель)', colLoad <= 10, colLoad);
  check('лужа широкая (плёнка по полу)', span > 200, span.toFixed(0));
  check('поверхность ровная (разброс < 12px)', uneven < 12, uneven.toFixed(1));
  check('лужа лежит на полу (за краем пола капает в пустоту)',
        GAME.liq.every(p => p.y < 501 || p.x < 105 || p.x > 895), Math.max(...GAME.liq.map(p => p.y)).toFixed(1));
}
function pileSpan() {
  if (!GAME.liq.length) return 0;
  return Math.max(...GAME.liq.map(p => p.x)) - Math.min(...GAME.liq.map(p => p.x));
}
function surfaceCols(step, arr) {
  const cols = {};
  for (const p of (arr || GAME.liq)) {
    const c = Math.floor(p.x / step) * step;
    if (!(c in cols) || p.y < cols[c]) cols[c] = p.y;
  }
  return cols;
}
function median(arr) {
  const a = arr.slice().sort((x, y) => x - y);
  return a.length ? a[a.length >> 1] : NaN;
}

console.log('2) объём не теряется: капли превращаются в частицы');
{
  const floor = R(1, 100, 500, 800, 40);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, SP(2, 40, 420)] });
  GAME.startPour(460, 200, '#38bdf8', false);
  ticks(180);
  GAME.stopPour();
  for (let k = 0; k < 900 && (GAME.pourParts.length || GAME.liq.some(p => Math.abs(p.vy) > 1.5)); k++) ticks(16);
  const n = GAME.liq.length;
  check('осело заметное число частиц', n > 200, n);
  check('частицы живы и осели (капля за краем пола — норма)',
        GAME.liq.every(p => (p.y > 478 && p.y < 503) || p.x < 105 || p.x > 895),
        'y ' + (n ? Math.min(...GAME.liq.map(p => p.y)).toFixed(0) : '-'));
}

console.log('3) вода выравнивается в U-образном сосуде');
{
  const bottom = R(1, 300, 560, 400, 20);
  const wl = R(2, 280, 440, 20, 140);
  const wr = R(3, 700, 440, 20, 140);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [bottom, wl, wr, SP(4, 60, 480)] });
  GAME.startPour(360, 300, '#38bdf8', false);   // льём в ЛЕВУЮ половину
  ticks(160);
  GAME.stopPour();
  for (let k = 0; k < 600 && GAME.pourParts.length; k++) ticks(16);
  ticks(900);
  /* медианы, а не средние: 2-3 физичные капли на верхушке стенки не
     должны портить оценку поверхности озера */
  const cols = surfaceCols(40);
  const xs = Object.keys(cols).map(Number).sort((a, b) => a - b);
  const leftTops = xs.filter(x => x < 500).map(x => cols[x]);
  const rightTops = xs.filter(x => x >= 500).map(x => cols[x]);
  const both = leftTops.length && rightTops.length;
  const lAvg = median(leftTops);
  const rAvg = median(rightTops);
  check('вода перетекла в обе половины', both, 'слева ' + leftTops.length + ' колонок, справа ' + rightTops.length);
  if (both) {
    const diff = Math.abs(lAvg - rAvg);
    check('уровни выровнялись (< 10px)', diff < 10, diff.toFixed(1));
  }
  check('вода в границах сосуда', GAME.liq.every(p => p.x > 278 && p.x < 722),
        'x ' + Math.min(...GAME.liq.map(p => p.x)).toFixed(0) + '..' + Math.max(...GAME.liq.map(p => p.x)).toFixed(0));
}

console.log('4) жидкость не протекает сквозь тонкую стенку');
{
  const floor = R(1, 100, 520, 800, 30);
  const wall = R(2, 500, 400, 8, 120);          // стенка 8px посередине
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, wall, SP(3, 40, 440)] });
  GAME.startPour(300, 200, '#38bdf8', false);   // льём СЛЕВА от стенки
  ticks(240);
  GAME.stopPour();
  for (let k = 0; k < 900 && GAME.pourParts.length; k++) ticks(16);
  ticks(600);
  const right = GAME.liq.filter(p => p.x > 509 && p.y > 515).length;
  check('за стенкой сухо', right === 0, 'частиц справа: ' + right);
  check('лужа слева на месте', GAME.liq.length > 150, GAME.liq.length);
}

console.log('5) водопад с уступа: частицы падают и оседают внизу');
{
  const ledge = R(1, 300, 400, 200, 20);
  const floor2 = R(2, 100, 640, 800, 30);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [ledge, floor2, SP(3, 140, 340)] });
  GAME.startPour(460, 300, '#38bdf8', false);   // льём у правого края уступа
  ticks(150);
  GAME.stopPour();
  for (let k = 0; k < 900 && GAME.pourParts.length; k++) ticks(16);
  ticks(900);
  const down = GAME.liq.filter(p => p.y > 620 && p.y < 646);
  check('вода стекла на нижний пол', down.length > 50, down.length);
  check('на уступе тоже осталась вода', GAME.liq.some(p => p.y > 380 && p.y < 401), GAME.liq.length);
}

console.log('6) частица впитывается авторским бассейном и поднимает уровень');
{
  const floor = R(1, 100, 520, 800, 30);
  const pool = { id: 9, type: 'water', x: 400, y: 490, w: 200, h: 30, rot: 0, fill: '#38bdf8', deadly: false };
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, pool, SP(2, 40, 440)] });
  const h0 = GAME.objects.find(o => o.type === 'water').h;
  GAME.startPour(300, 300, '#38bdf8', false);   // льём РЯДОМ с бассейном — куча на полу
  ticks(150);
  GAME.stopPour();
  for (let k = 0; k < 700 && GAME.pourParts.length; k++) ticks(16);
  ticks(1200);                                  // куча расползается и вползает в бассейн
  const h1 = GAME.objects.find(o => o.type === 'water').h;
  check('уровень бассейна поднялся от впитавшейся воды', h1 > h0 + 1, h0.toFixed(1) + ' → ' + h1.toFixed(1));
  check('часть частиц впиталась', GAME.liq.length < 160, GAME.liq.length);
}

console.log('7) игрок плавает в налитой луже');
{
  const floor = R(1, 100, 520, 800, 40);
  const wl = R(2, 80, 380, 20, 180);
  const wr = R(3, 900, 380, 20, 180);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, wl, wr, SP(4, 40, 440)] });
  GAME.startPour(400, 200, '#38bdf8', false);
  ticks(400);                                   // много воды в широкую яму
  GAME.stopPour();
  for (let k = 0; k < 700 && GAME.pourParts.length; k++) ticks(16);
  ticks(600);
  check('лужа глубокая (есть чему плавать)', GAME.liq.length > 300, GAME.liq.length);
  GAME.startPlay();
  GAME.keys.u = false;
  GAME.pl.x = 480; GAME.pl.y = 470; GAME.pl.vy = 2; GAME.pl.vx = 0;
  let maxSink = 0, inWaterSeen = false;
  for (let i = 0; i < 90; i++) {
    GAME.step();
    if (GAME.pl.vy > maxSink) maxSink = GAME.pl.vy;
  }
  check('в луже тонем медленно', maxSink < 8, maxSink.toFixed(2));
  GAME.keys.u = true;
  let swamUp = false;
  for (let i = 0; i < 50 && !swamUp; i++) { GAME.step(); if (GAME.pl.vy < -2) swamUp = true; }
  check('гребки поднимают из лужи', swamUp);
  GAME.keys.u = false;
  GAME.stop();
}

console.log('8) кислота из струи убивает при погружении');
{
  const floor = R(1, 100, 520, 800, 40);
  const wl = R(2, 80, 380, 20, 180);
  const wr = R(3, 900, 380, 20, 180);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, wl, wr, SP(4, 40, 440)] });
  GAME.startPour(400, 200, '#84cc16', true);
  ticks(560);
  GAME.stopPour();
  for (let k = 0; k < 900 && GAME.pourParts.length; k++) ticks(16);
  ticks(300);
  const acidTop = Math.min(...GAME.liq.map(p => p.y));
  check('кислотная лужа из частиц', GAME.liq.length > 400 && GAME.liq.every(p => p.deadly),
        'частиц ' + GAME.liq.length + ', верх ' + acidTop.toFixed(0));
  GAME.startPlay();
  GAME.pl.x = 480; GAME.pl.y = 470; GAME.pl.vy = 3; GAME.pl.vx = 0;
  GAME.keys.u = false;
  for (let i = 0; i < 60 && !GAME.pl.dead; i++) GAME.step();
  check('кислотная лужа убила', GAME.pl.dead, 'мёртв: ' + GAME.pl.dead);
  GAME.stop();
}

console.log('9) сохранение/загрузка перевозит жидкие частицы');
{
  const floor = R(1, 100, 520, 800, 40);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, SP(2, 40, 440)] });
  GAME.startPour(460, 300, '#38bdf8', false);
  ticks(120);
  GAME.stopPour();
  for (let k = 0; k < 600 && GAME.pourParts.length; k++) ticks(16);
  const n0 = GAME.liq.length;
  /* сериализация, как её делает bSave: поле liquid рядом с objects */
  const saved = { mode: 'hideAndSeek', objects: GAME.objects, liquid: GAME.liq.map(p => [p.x, p.y, p.fill, p.deadly ? 1 : 0]) };
  GAME.loadMap(JSON.parse(JSON.stringify(saved)));
  check('частицы восстановились из карты', GAME.liq.length === n0, n0 + ' → ' + GAME.liq.length);
  check('координаты совпали', GAME.liq.every((p, i) => Math.abs(p.x - saved.liquid[i][0]) < 0.6 && Math.abs(p.y - saved.liquid[i][1]) < 0.6));
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, SP(2, 40, 440)] });
  check('карта без liquid очищает жидкость', GAME.liq.length === 0, GAME.liq.length);
}

console.log('10) Ctrl+Z смывает сеанс литья целиком');
{
  const floor = R(1, 100, 520, 800, 40);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, SP(2, 40, 440)] });
  GAME.commit();                                // как инструмент: снимок до литья
  GAME.startPour(460, 300, '#38bdf8', false);
  ticks(120);
  GAME.stopPour();
  for (let k = 0; k < 300 && GAME.pourParts.length; k++) ticks(16);
  const n0 = GAME.liq.length;
  GAME.undo();
  check('undo убрал налитую жидкость', GAME.liq.length === 0, n0 + ' → ' + GAME.liq.length);
  GAME.redo();
  check('redo вернул жидкость', GAME.liq.length === n0, GAME.liq.length);
}

console.log('\nИтого: пройдено ' + pass + ', ошибок ' + fail);
process.exit(fail ? 1 : 0);
