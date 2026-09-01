/* Проверка генератора карт: разбор описания, играбельность результата
   и то, что карта не нарушает правил редактора и сервера. */
const G = require('./mapGen.js');

const ALLOWED = ['rect','circle','triangle','text','coin','spawn','button','lever','checkpoint','finishline','water'];
const RACE_ONLY = ['checkpoint','finishline'];
const GAP  = [90, 130, 170];
let fails = 0;
const ok = (name, cond, extra) => {
  if (!cond) fails++;
  console.log('  ', (cond ? '✓' : '✗'), name, extra === undefined ? '' : extra);
};

/* ---------- разбор описания ---------- */
console.log('разбор описания:');
const P = [
  ['лабиринт с укрытиями',                    { kind:'maze',    mode:'hideAndSeek' }],
  ['огромная башня, сложно, шипы',            { kind:'tower',   size:'huge', diff:2, traps:true }],
  ['гонка: паркур с батутами',                { kind:'parkour', mode:'race', bounce:true }],
  ['лёгкая арена для пряток, 6 укрытий',      { kind:'arena',   diff:0, hides:6 }],
  ['пещера 40x16, ловушки',                   { kind:'cave',    cellsW:40, cellsH:16, traps:true }],
  ['город с движущимися платформами',         { kind:'city',    movers:true }],
  ['парящие острова, хардкор',                { kind:'islands', diff:2 }],
  ['мост через пропасть, вращающиеся блоки',  { kind:'bridge',  spinners:true }],
  ['maze with traps, hard',                   { kind:'maze',    diff:2, traps:true }],
  ['три монеты на арене',                     { kind:'arena',   coins:3 }]
];
for (const [text, want] of P) {
  const s = G.parse(text);
  const bad = Object.keys(want).filter(k => s[k] !== want[k]);
  ok(text, bad.length === 0, bad.length ? '→ ' + bad.map(k => k + '=' + s[k]).join(', ') : '');
}

/* ---------- карта валидна ---------- */
console.log('\nкарта валидна:');
const CASES = [
  'лабиринт с укрытиями', 'огромная башня, сложно, шипы', 'гонка паркур, большая',
  'арена для пряток, 8 укрытий', 'пещера, ловушки', 'огромный город',
  'парящие острова, хардкор', 'мост через пропасть', 'гонка: башня',
  'маленький лабиринт, легко', '', 'что-то непонятное вообще'
];
let badType = 0, noSpawn = 0, noFinish = 0, tooManyCoins = 0, over = 0, empty = 0, strayRace = 0;
for (const c of CASES) {
  const r = G.generate(c);
  if (!r.objects.some(o => o.type === 'spawn')) noSpawn++;
  if (r.mode === 'race' && !r.objects.some(o => o.type === 'finishline')) noFinish++;
  if (r.mode !== 'race' && r.objects.some(o => RACE_ONLY.includes(o.type))) strayRace++;
  if (r.objects.filter(o => o.type === 'coin').length > 3) tooManyCoins++;
  if (r.objects.length > G.OBJ_CAP) over++;
  if (r.objects.length < 8) empty++;
  if (r.objects.some(o => !ALLOWED.includes(o.type))) badType++;
}
ok('точка старта везде', noSpawn === 0, noSpawn ? noSpawn + ' без старта' : '');
ok('финиш в каждой гонке', noFinish === 0);
ok('гоночных объектов вне гонки нет', strayRace === 0);
ok('монет не больше 3', tooManyCoins === 0);
ok('лимит объектов соблюдён', over === 0);
ok('пустых карт нет', empty === 0);
ok('только разрешённые типы', badType === 0);

/* ---------- укрытия ---------- */
console.log('\nукрытия:');
const hs = G.generate('арена для пряток, 6 укрытий');
const race = G.generate('гонка паркур с укрытиями');
ok('в прятках укрытия есть', hs.objects.filter(o => o.hideSpot).length >= 4,
   hs.objects.filter(o => o.hideSpot).length + ' шт');
ok('в гонке укрытий нет', race.objects.every(o => !o.hideSpot));

/* ---------- проходимость ---------- */
console.log('\nпроходимость (разрывы по горизонтали):');
for (const c of ['гонка паркур, большая', 'парящие острова', 'огромный город']) {
  const r = G.generate(c);
  const limit = GAP[r.spec.diff] + 12;
  /* Считаем не расстояние между соседними объектами, а дыры в объединении
     их проекций на X: площадка внутри здания не создаёт разрыва. */
  const spans = r.objects
    .filter(o => o.type === 'rect' && !o.deadly && !o.hideSpot)
    .map(o => [o.x, o.x + o.w])
    .sort((a, b) => a[0] - b[0]);
  let worst = 0, edge = spans.length ? spans[0][1] : 0;
  for (const [a, b] of spans) {
    if (a > edge) { if (a - edge > worst) worst = a - edge; edge = b; }
    else if (b > edge) edge = b;
  }
  ok(c, worst <= limit, 'худший разрыв ' + Math.round(worst) + ' при пределе ' + limit);
}

/* ---------- вода и гравитация ---------- */
console.log('\nвода:');
const wet  = G.generate('арена с бассейном');
const acid = G.generate('лабиринт с кислотой');
const dry  = G.generate('огромный город');
ok('вода появляется по запросу', wet.objects.some(o => o.type === 'water'));
ok('кислота помечена', acid.objects.some(o => o.type === 'water' && o.acid === true));
ok('без запроса воды нет', dry.objects.every(o => o.type !== 'water'));
ok('вода рядами по 20', wet.objects.filter(o => o.type === 'water').every(o => o.h === 20));
ok('гравитация всегда 9', [wet, acid, dry].every(r => r.gravity === 9));
ok('батутов не осталось', [wet, acid, dry].every(r => r.objects.every(o => !o.bouncy)));

/* ---------- повторяемость ---------- */
console.log('\nповторяемость:');
const a = G.generate('лабиринт с укрытиями');
const b = G.generate('лабиринт с укрытиями');
const c2 = G.generate('лабиринт с укрытиями', { seed: 12345 });
ok('одно описание — одна карта', JSON.stringify(a.objects) === JSON.stringify(b.objects));
ok('другое зерно — другая карта', JSON.stringify(a.objects) !== JSON.stringify(c2.objects));

/* ---------- устойчивость ---------- */
console.log('\nустойчивость:');
let crash = 0;
const junk = [null, undefined, '', '   ', '!!!', '9999x9999', '0x0', 'a'.repeat(5000),
              'лабиринт '.repeat(200), '-5 монет', 'сто укрытий', '<script>'];
for (const j of junk) { try { G.generate(j); } catch (e) { crash++; console.log('   ✗', JSON.stringify(String(j).slice(0,20)), e.message); } }
ok('мусор на входе не роняет генератор', crash === 0);

console.log(fails ? '\nПРОВАЛЕНО проверок: ' + fails : '\nвсе проверки пройдены ✓');
process.exit(fails ? 1 : 0);
