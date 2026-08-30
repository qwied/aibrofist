/* Проверка палитры тем: любой набор цветов должен оставаться читаемым
   и не ломать оформление. */
global.window = { addEventListener() {}, dispatchEvent() {} };
global.document = { readyState: 'complete', addEventListener() {},
  createElement: () => ({}), head: { appendChild() {} }, documentElement: { dataset: {} } };
global.localStorage = { getItem: () => null, setItem() {} };
global.fetch = () => Promise.reject(new Error('offline'));
global.CustomEvent = function () {};
require('./theme.js');

const T = window.BFTheme, H = T.helpers;
const MIN = 4.5;                       // порог читаемости текста

// случайные наборы из 1..4 цветов
function rnd() { return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'); }
let bad = 0, checked = 0;
for (let i = 0; i < 400; i++) {
  const n = 1 + (i % 4);
  const set = Array.from({ length: n }, rnd);
  const p = T.palette(set);
  ['brand', 'brand2', 'brand3', 'brand4'].forEach(k => {
    checked++;
    const c = H.contrast(p[k], H.on(p[k]));
    if (c < MIN) { bad++; if (bad < 4) console.log('  ✗', set.join(','), k, p[k], c.toFixed(2)); }
  });
  // текст на фоне страницы тоже должен читаться
  checked++;
  if (H.contrast(p.ink, '#ffffff') < 7) { bad++; console.log('  ✗ бледный текст', p.ink); }
}
console.log(`случайных наборов: 400 | проверок: ${checked} | не прошли: ${bad}`);

// крайние случаи
const edge = [['#000000'], ['#ffffff'], ['#808080'], ['#ff0000', '#ff0001'],
              ['#fefefe', '#fdfdfd', '#fcfcfc', '#fbfbfb']];
console.log('\nкрайние случаи:');
edge.forEach(s => {
  const p = T.palette(s);
  const c = H.contrast(p.brand, H.on(p.brand));
  console.log('  ', s.join(',').padEnd(38), p.brand, '→', H.on(p.brand),
              c.toFixed(2), c >= MIN ? '✓' : '✗');
});

// каждый выбранный цвет должен реально попадать в стиль
console.log('\nраспределение цветов по интерфейсу:');
let spread = 0;
[['#ff0000'], ['#ff0000','#00ff00'], ['#ff0000','#00ff00','#0000ff'],
 ['#ff0000','#00ff00','#0000ff','#ffaa00']].forEach(set => {
  const p = T.palette(set);
  const css = T.css(p);
  const cols = [p.brand, p.brand2, p.brand3, p.brand4].slice(0, set.length);
  const used = cols.filter(c => css.includes(c)).length;
  const bg = /body\{background:/.test(css);
  if (used !== set.length || !bg) spread++;
  console.log('  ', set.length, 'цвет(а):', used + '/' + set.length,
              '| фон страницы:', bg ? '✓' : '✗');
});
console.log(spread ? 'цвета распределены неверно' : 'каждый цвет участвует в оформлении ✓');

// фон страницы должен быть заметно окрашен, но текст на нём — читаем
console.log('\nфон страницы:');
let bgBad = 0;
[['#16a34a','#065f46'], ['#2196F3'], ['#000000'], ['#ffffff'],
 ['#ef4444','#f59e0b','#22c55e','#3b82f6']].forEach(set => {
  const p = T.palette(set);
  const css = T.css(p);
  const bg = /html\{background:(#[0-9a-f]{6})/.exec(css)[1];
  const k = H.contrast(p.ink, bg);
  // насколько фон отличается от чистого белого
  const away = H.contrast(bg, '#ffffff');
  const ok = k >= 7 && away >= 1.06;
  if (!ok) bgBad++;
  console.log('  ', set.join(',').padEnd(34), bg,
              '| текст', k.toFixed(2), '| отличие от белого', away.toFixed(3),
              ok ? '✓' : '✗');
});
console.log(bgBad ? 'фон подобран плохо' : 'фон окрашен и текст читается ✓');

// пустой набор возвращает «без темы»
console.log('\nбез цветов:', T.palette([]) === null ? 'обычное оформление ✓' : '✗');

// в CSS не должно быть undefined
const css = require('fs').readFileSync('./theme.js', 'utf8');
console.log('в шаблоне нет undefined:', !/\$\{undefined\}/.test(css) ? '✓' : '✗');
process.exit(bad ? 1 : 0);
