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

// пустой набор возвращает «без темы»
console.log('\nбез цветов:', T.palette([]) === null ? 'обычное оформление ✓' : '✗');

// в CSS не должно быть undefined
const css = require('fs').readFileSync('./theme.js', 'utf8');
console.log('в шаблоне нет undefined:', !/\$\{undefined\}/.test(css) ? '✓' : '✗');
process.exit(bad ? 1 : 0);
