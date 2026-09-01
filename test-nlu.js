/* Разбор запроса по словам: каждое слово должно получить роль,
   а перечисленные объекты — попасть в карту с нужными свойствами. */
const N = require('./mapNLU.js');
const G = require('./mapGen.js');
let fails = 0;
const ok = (n, c, x) => { if (!c) fails++; console.log('  ', c ? '✓' : '✗', n, x === undefined ? '' : x); };
const roles = r => Object.fromEntries(r.tokens.filter(t => t.role !== 'stop').map(t => [t.word, t.role]));

console.log('слова в любой форме:');
for (const [w, want] of [
  ['треугольник','type'], ['треугольниками','type'], ['треугольных','type'],
  ['блок','type'], ['блоками','type'], ['платформы','type'], ['стену','type'],
  ['круги','type'], ['шара','type'], ['монетку','type'], ['кнопке','type'],
  ['рычагом','type'], ['чекпоинты','type'], ['финишу','type'], ['надписью','type'],
  ['красных','color'], ['зелёными','color'], ['фиолетовый','color'],
  ['вращающихся','prop'], ['движущимися','prop'], ['ядовитые','prop'],
  ['проходимый','prop'], ['отражающих','prop'], ['затягивающая','prop'],
  ['сверху','pos'], ['внизу','pos'], ['посередине','pos'], ['по','stop'], ['краям','pos'],
  ['огромными','size'], ['крошечный','size'], ['двенадцать','number'], ['пять','number']
]) {
  const t = N.analyze(w).tokens[0];
  ok(w, t && t.role === want, '→ ' + (t ? t.role : 'нет'));
}

console.log('\nсборка заказов:');
const a = N.analyze('12 красных вращающихся треугольников сверху, синяя вода снизу с ядом, три монеты в центре');
ok('заказов три', a.orders.length === 3, a.orders.length);
ok('12 треугольников', a.orders[0].count === 12 && a.orders[0].type === 'triangle');
ok('красные', a.orders[0].color === '#ef4444');
ok('вращаются', a.orders[0].props.spins === true);
ok('сверху', a.orders[0].pos === 'top');
ok('вода синяя с ядом', a.orders[1].type === 'water' && a.orders[1].color === '#3b82f6' && a.orders[1].props.acid);
ok('вода снизу', a.orders[1].pos === 'bottom');
ok('три монеты в центре', a.orders[2].count === 3 && a.orders[2].pos === 'center');

console.log('\nчисло по умолчанию:');
ok('единственное → 1', N.analyze('платформа').orders[0].plural === false);
ok('множественное → много', N.analyze('платформы').orders[0].plural === true);

console.log('\nнепонятые слова видны:');
const u = N.analyze('поставь абракадабра квадрат зюзюка');
ok('лишние слова названы', u.unknown.includes('абракадабра') && u.unknown.includes('зюзюка'), u.unknown.join(','));
ok('нужное всё равно понято', u.orders.length === 1 && u.orders[0].type === 'rect');
ok('в отчёте есть «не понял»', u.report.indexOf('не понял') !== -1);

console.log('\nвсе типы объектов строятся:');
const WANT = {
  'блоки': 'rect', 'круги': 'circle', 'треугольники': 'triangle', 'надписи': 'text',
  'монеты': 'coin', 'вода': 'water', 'старт': 'spawn', 'кнопки': 'button',
  'рычаги': 'lever', 'чекпоинты': 'checkpoint', 'финиш': 'finishline'
};
for (const [word, type] of Object.entries(WANT)) {
  const r = G.generate('арена, ' + word);
  ok(word, r.objects.some(o => o.type === type), '→ ' + type);
}

console.log('\nсвойства доезжают до объектов:');
const cases = [
  ['ядовитые блоки',        o => o.type === 'rect' && o.deadly],
  ['проходимые круги',      o => o.type === 'circle' && o.ghost],
  ['отражающие блоки',      o => o.type === 'rect' && o.ricochet],
  ['блоки укрытия',         o => o.type === 'rect' && o.hideSpot],
  ['вращающиеся квадраты',  o => o.type === 'rect' && o.spins],
  ['движущиеся платформы',  o => o.type === 'rect' && o.moves],
  ['огромные круги',        o => o.type === 'circle' && o.w >= 110],
  ['крошечные треугольники',o => o.type === 'triangle' && o.w <= 12],
  ['затягивающая вода',     o => o.type === 'water' && o.sink],
  ['жёлтые монеты',         o => o.type === 'coin']
];
for (const [txt, pred] of cases) {
  const r = G.generate('арена, ' + txt);
  ok(txt, r.objects.some(pred));
}

console.log('\nбез лимитов на количество:');
const many = G.generate('арена, 200 маленьких блоков');
ok('200 блоков поставлено', many.objects.filter(o => o.type === 'rect').length >= 200,
   many.objects.filter(o => o.type === 'rect').length);
ok('лимит карты не превышен', many.objects.length <= 2000, many.objects.length);
const gold = G.generate('арена, 50 монет');
ok('монет всё равно максимум 3', gold.objects.filter(o => o.type === 'coin').length === 3);

console.log('\nустойчивость:');
let crash = 0;
for (const j of [null, undefined, '', '   ', '?!#', 'a'.repeat(4000), 42, {}, 'блок '.repeat(500)])
  { try { N.analyze(j); G.generate(j); } catch (e) { crash++; console.log('   ✗', e.message); } }
ok('мусор не роняет разбор', crash === 0);

console.log(fails ? '\nПРОВАЛЕНО проверок: ' + fails : '\nвсе проверки пройдены ✓');
process.exit(fails ? 1 : 0);
