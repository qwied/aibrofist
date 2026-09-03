/* Сценарные тесты течения воды (v73):
   1) стоячая вода в чаше не падает;
   2) куб воды на открытом полу растекается в тонкую лужу;
   3) вода стекает с уступа платформы (кусок откалывается и падает);
   4) вода, налитая в воздух без опоры, падает и исчезает за границей;
   5) сообщающиеся лужи выравнивают уровни;
   6) отдаление в зуме ограничено 20%;
   7) из повёрнутой воды течение не убегает. */
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
function area(list) { return list.reduce((s, o) => s + o.w * o.h, 0); }
function ticks(n) { for (let i = 0; i < n; i++) GAME.stepAlways(); }

const R = (id, x, y, w, h) => ({ id, type: 'rect', x, y, w, h, rot: 0, fill: '#111827' });
const W = (id, x, y, w, h, extra) => Object.assign({ id, type: 'water', x, y, w, h, rot: 0, fill: '#38bdf8', deadly: false }, extra || {});
const SP = (id, x, y) => ({ id, type: 'spawn', x, y, w: 20, h: 60, rot: 0, fill: '#111827' });

console.log('1) стоячая вода в чаше не падает и не уходит сквозь пол');
{
  const floor = R(1, 200, 500, 400, 20), wl = R(2, 180, 400, 20, 120), wr = R(3, 600, 400, 20, 120);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, wl, wr, SP(4, 60, 440), W(5, 220, 470, 360, 30)] });
  ticks(400);
  const ps = pools();
  check('лужа на месте', ps.length >= 1);
  check('не провалилась сквозь пол', ps.every(o => Math.abs(o.y + o.h - 500) < 3), ps.map(o => o.y + o.h).join(','));
  check('не улетела вниз', ps.every(o => o.y < 600));
}

console.log('2) куб воды на открытом полу растекается в тонкую лужу');
{
  const floor = R(1, 100, 500, 800, 40);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, SP(2, 40, 420), W(3, 450, 440, 60, 60)] });
  const a0 = area(pools());
  ticks(600);
  const ps = pools();
  const a1 = area(ps);
  const maxH = Math.max(...ps.map(o => o.h));
  const totW = ps.reduce((s, o) => s + o.w, 0);
  check('растеклась тонко (h <= 10)', maxH <= 10, maxH.toFixed(1));
  check('стала шире исходной', totW > 120, totW.toFixed(0));
  check('площадь сохранилась (±15%)', Math.abs(a1 - a0) / a0 < 0.15, a0.toFixed(0) + '→' + a1.toFixed(0));
  check('не сползла с пола', ps.every(o => o.y + o.h <= 502), ps.map(o => o.y + o.h).join(','));
}

console.log('3) вода стекает с уступа платформы в нижний бассейн');
{
  const ledge = R(1, 300, 500, 200, 30);          // платформа-уступ
  const ground = R(2, 100, 640, 800, 30);         // дно нижнего бассейна
  const gl = R(3, 80, 520, 20, 150);              // стенки бассейна — объём не теряется
  const gr = R(4, 900, 520, 20, 150);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [ledge, ground, gl, gr, SP(5, 140, 440), W(6, 340, 440, 160, 60)] });
  ticks(900);
  const ps = pools();
  const onTop = ps.filter(o => Math.abs(o.y + o.h - 500) < 6);
  /* стекшая вода теперь живёт частицами жидкости на дне бассейна
     (или прямоугольной лужей, если упал крупный кусок); окно по y —
     всё, что ниже подошвы уступа: куча на дне растёт вверх */
  const liqBelow = GAME.liq.filter(p => p.y > 545 && p.y < 648 && p.x > 100 && p.x < 900);
  const below = ps.filter(o => Math.abs(o.y + o.h - 640) < 6);
  check('часть воды стекла в нижний бассейн', below.length >= 1 || liqBelow.length >= 12,
        'снизу: ' + below.length + ', частиц: ' + liqBelow.length);
  check('часть осталась на платформе', onTop.length >= 1, 'сверху: ' + onTop.length);
  // уровень в нижнем бассейне не убежал вверх: верх воды ниже уступа
  const tops = pools().filter(o => o.y + o.h > 600).map(o => o.y);
  const liqTop = liqBelow.length ? Math.min(...liqBelow.map(p => p.y)) : 1e9;
  check('бассейн не переполнен сверху',
        (tops.length && Math.min(...tops) > 530) || liqTop > 530,
        'мин.верх ' + (tops.length ? Math.min(...tops).toFixed(0) : '-') + ', частицы ' + (liqTop < 1e9 ? liqTop.toFixed(0) : '-'));
}

console.log('4) вода без опоры падает и исчезает за нижней границей');
{
  GAME.loadMap({ mode: 'hideAndSeek', objects: [SP(1, 60, 440), W(2, 400, 300, 60, 40)] });
  ticks(3000);
  const ps = pools();
  check('невисимая вода улетела и исчезла', ps.length === 0, 'осталось: ' + ps.length);
}

console.log('5) сообщающиеся лужи выравнивают уровни');
{
  const floor = R(1, 100, 500, 800, 20);
  const wl = R(2, 80, 380, 20, 140);              // стенки бассейна
  const wr = R(3, 900, 380, 20, 140);
  const mid = R(4, 499, 460, 2, 40);              // тонкая перегородка до 460
  GAME.loadMap({ mode: 'hideAndSeek',
    objects: [floor, wl, wr, mid, SP(5, 30, 420), W(6, 110, 440, 389, 60), W(7, 501, 480, 399, 20)] });
  ticks(1500);
  const ps = pools().filter(o => o.w > 50);
  const hs = ps.map(o => o.h).sort((a, b) => b - a);
  const leveled = hs.length === 1 || (hs.length >= 2 && hs[0] - hs[hs.length - 1] < 12);
  check('уровни сблизились', leveled, hs.join(','));
  // вода не убежала из бассейна и не взмыла выше стенок
  const all = pools();
  check('вода в бассейне', all.length >= 1 && all.every(o => o.x >= 78 && o.x + o.w <= 922),
        all.map(o => o.x.toFixed(0)).join(','));
  const top = Math.min(...all.map(o => o.y));
  check('не взмыла выше стенок', top > 390, top.toFixed(0));
}

console.log('6) отдаление ограничено 20%');
{
  GAME.loadMap({ mode: 'hideAndSeek', objects: [R(1, 0, 0, 50, 50)] });
  for (let i = 0; i < 60; i++) GAME.zoomAt(450, 300, 1/1.2);
  check('минимум отдаления 20%', Math.abs(GAME.view.s - 0.2) < 1e-9, GAME.view.s);
  for (let i = 0; i < 10; i++) GAME.zoomAt(450, 300, 1.2);
  check('после этого зум растёт обратно', GAME.view.s > 0.2, GAME.view.s);
}

console.log('7) повёрнутая вода не течёт');
{
  const floor = R(1, 100, 500, 800, 40);
  GAME.loadMap({ mode: 'hideAndSeek', objects: [floor, SP(2, 40, 420), W(3, 450, 440, 60, 60, { rot: 30 })] });
  ticks(200);
  const ps = pools();
  check('повёрнутая вода осталась на месте', ps.length === 1 && Math.abs(ps[0].x - 450) < 0.5 && Math.abs(ps[0].y - 440) < 0.5,
        ps.length + ' шт');
}

console.log('\nИтого: пройдено ' + pass + ', ошибок ' + fail);
process.exit(fail ? 1 : 0);
