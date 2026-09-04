/* Сценарные тесты воды v74 — правки «растекается кубами» и «проваливается
   сквозь объекты»:
   8) узкий высокий столб воды схлопывается в лужу быстро, а не стоит кубом;
   9) плита воды, севшая на лужу, сливается с ней и расплывается;
   10) вода не утекает через стык двух соседних блоков пола (щель 0 и 1px);
   11) быстрая капля не прошивает тонкий блок насквозь;
   12) узкий кусок, сорвавшийся с уступа, падает каплями и оседает на полу;
   13) капли, налитые во время игры, тоже доливаются в лужу. */
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
      toggle(c, on) { on === undefined ? (this._s.has(c) ? this._s.delete(c) : this._s.add(c)) : (on ? this._s.add(c) : this._s.delete(c)); },
      contains(c) { return this._s.has(c); } },
    get className() { return [...this.classList._s].join(' '); },
    set className(v) { this.classList._s = new Set(String(v).split(/\s+/).filter(Boolean)); },
    get textContent() { return this._text; }, set textContent(v) { this._text = String(v); },
    get innerHTML() { return this._text; }, set innerHTML(v) { this._text = String(v); this.children = []; },
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    append(...c) { c.forEach(x => this.appendChild(x)); },
    insertBefore(c) { this.children.unshift(c); return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); },
    remove() {},
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = v; },
    getAttribute(k) { return this.attrs[k] === undefined ? null : this.attrs[k]; },
    removeAttribute(k) { delete this.attrs[k]; },
    addEventListener() {}, removeEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 600 }; },
    closest() { return null; },
    querySelector(sel) { return mkEl('div'); },
    querySelectorAll() { return []; },
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
  const cm = m[0].match(/class="([^"]*)"/);
  if (cm) for (const c of cm[1].split(/\s+/)) if (c) el.classList.add(c);
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
  addEventListener: global.window.addEventListener,
  requestAnimationFrame: global.window.requestAnimationFrame,
  localStorage: global.window.localStorage, matchMedia: global.window.matchMedia,
  innerWidth: 900, innerHeight: 600, devicePixelRatio: 1,
  Image: global.window.Image, Path2D: global.window.Path2D,
  fetch: global.window.fetch, navigator: global.window.navigator,
  location: global.window.location, alert: () => {}, prompt: () => null, confirm: () => true,
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
function pools() { return GAME.objects.filter(o => o.type === 'water'); }
function ticks(n) { for (let i = 0; i < n; i++) GAME.stepAlways(); }

const R = (id, x, y, w, h) => ({ id, type: 'rect', x, y, w, h, rot: 0, fill: '#111827' });
const W = (id, x, y, w, h, extra) => Object.assign({ id, type: 'water', x, y, w, h, rot: 0, fill: '#38bdf8', deadly: false }, extra || {});
const SP = (id, x, y) => ({ id, type: 'spawn', x, y, w: 20, h: 60, rot: 0, fill: '#111827' });

console.log('8) узкий столб воды быстро схлопывается в лужу (не стоит кубом)');
{
  const floor = R(1, 100, 500, 800, 40);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, SP(2, 40, 420), W(3, 450, 430, 14, 70)] });
  const a0 = 14 * 70;
  ticks(150);                                     // 2.5 секунды
  const ps = pools();
  const maxH = Math.max(...ps.map(o => o.h));
  const totW = ps.reduce((s, o) => s + o.w, 0);
  const a1 = ps.reduce((s, o) => s + o.w * o.h, 0);
  check('столб расплющился (h <= 12) за 2.5с', maxH <= 12, maxH.toFixed(1));
  check('расползлась по полу', totW > 80, totW.toFixed(0));
  check('площадь сохранилась (±15%)', Math.abs(a1 - a0) / a0 < 0.15, a0 + '→' + a1.toFixed(0));
  check('не провалилась под пол', ps.every(o => o.y + o.h <= 503), ps.map(o => o.y + o.h).join(','));
}

console.log('9) плита, севшая на лужу, сливается с ней и расплывается');
{
  const floor = R(1, 100, 500, 800, 40);
  const pool = W(2, 380, 484, 120, 16);           // лужа на полу
  const slab = W(3, 420, 330, 50, 14);            // плита падает сверху
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, SP(4, 40, 420), pool, slab] });
  ticks(700);
  const ps = pools();
  const maxH = Math.max(...ps.map(o => o.h));
  const onFloor = ps.filter(o => Math.abs(o.y + o.h - 500) < 5);
  check('вся вода легла на пол', onFloor.length === ps.length && ps.length >= 1,
        ps.map(o => (o.y + o.h).toFixed(0)).join(','));
  check('стопки плит не осталось (h <= 12)', maxH <= 12, maxH.toFixed(1));
}

console.log('10) вода не утекает через стык соседних блоков пола');
for (const gap of [0, 1]) {
  const l = R(1, 100, 500, 350 - gap / 2, 20);
  const r = R(2, 450 + gap / 2, 500, 350, 20);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [l, r, SP(3, 40, 420), W(4, 300, 484, 200, 16)] });
  ticks(600);
  const ps = pools();
  const below = ps.filter(o => o.y + o.h > 522);
  check(`щель ${gap}px: вода осталась на полу`, ps.length >= 1 && below.length === 0,
        'ушло вниз: ' + below.length + ' из ' + ps.length);
  const still = ps.filter(o => Math.abs(o.y + o.h - 500) < 5);
  check(`щель ${gap}px: лужа на месте уровня пола`, still.length >= 1,
        still.length + ' шт');
}

console.log('11) быстрая капля не прошивает тонкий блок насквозь');
{
  const thin = R(1, 400, 500, 120, 5);            // плита толщиной 5px
  GAME.loadMap({ mode: 'hideAndSeek', objects: [thin, SP(2, 40, 420)] });
  /* Сквозную протечку ловим в узкой полосе ПРЯМО ПОД плитой
     (y 506..545, x 406..514): капля от струи (x=460), прошьющая плиту,
     обязана пересечь её у поверхности. Струйки, стёкшие с кромок
     (x<400 / x>520), появляются у самых краёв, а вглубь пролёта
     дрейфуют за сотни px падения — в полосу не попадают, так что
     проверка не зависит от того, где частицы окажутся в конце. */
  let stitch = false;
  const watch = () => {
    if (GAME.liq.some(p => p.y > 506 && p.y < 545 && p.x > 406 && p.x < 514)) stitch = true;
  };
  GAME.startPour(460, 100);                       // льём с высоты — капли летят на предельной скорости
  for (let i = 0; i < 240; i++) { GAME.stepAlways(); watch(); }   // каждый тик: полосу пересекают за ~2 тика
  GAME.stopPour();
  /* каплям с краёв — упасть в пустоту и исчезнуть: ждём до 8с,
     пока струя и капли полностью иссякнут */
  for (let k = 0; k < 500 && (GAME.pourParts.length || pools().some(o => o._wvy)); k++) { ticks(16); watch(); }
  const onTop = GAME.liq.filter(p => p.y < 501 && p.x > 398 && p.x < 522);
  check('капли осели НА плите', onTop.length >= 10, 'сверху: ' + onTop.length);
  check('сквозь плиту ничего не протекло', !stitch, 'полоса под плитой была пересечена');
  check('капли долились, не зависли', GAME.pourParts.length === 0, GAME.pourParts.length);
}

console.log('12) узкий кусок срывается каплями и оседает на полу');
{
  const ledge = R(1, 300, 400, 200, 20);
  const floor = R(2, 100, 640, 800, 30);
  // кусок свисает с правого края уступа: часть на уступе, часть в воздухе
  GAME.loadMap({ mode: 'hideAndSeek', objects: [ledge, floor, SP(3, 140, 340), W(4, 490, 370, 22, 30)] });
  ticks(900);
  /* капли долетают до нижнего пола и становятся жидкостью */
  const onFloor = GAME.liq.filter(p => p.y > 630 && p.y < 646);
  check('капли долетели до нижнего пола', onFloor.length >= 1, 'внизу: ' + onFloor.length);
  check('прошедшая вода исчезла или осела', GAME.liq.every(p => p.y < 2000), GAME.liq.length);
}

console.log('13) капли от течения оседают и во время игры');
{
  const ledge = R(1, 300, 400, 200, 20);
  const floor = R(2, 100, 640, 800, 30);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [ledge, floor, SP(3, 140, 340), W(4, 490, 370, 22, 30)] });
  GAME.startPlay();                               // игра идёт — течение воды не замирает
  ticks(900);
  const onFloor = GAME.liq.filter(p => p.y > 630 && p.y < 646);
  check('капли осели на нижнем полу в игре', onFloor.length >= 1, 'внизу: ' + onFloor.length);
  GAME.stop();
}

console.log('\nИтого: пройдено ' + pass + ', ошибок ' + fail);
process.exit(fail ? 1 : 0);
