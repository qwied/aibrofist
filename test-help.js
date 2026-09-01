/* Помощник редактора: попадает ли вопрос в нужную тему и отличает ли
   вопрос от просьбы собрать карту. */
const H = require('./editorHelp.js');
let fails = 0;
const ok = (n, c, x) => { if (!c) fails++; console.log('  ', c ? '✓' : '✗', n, x === undefined ? '' : x); };

console.log('темы:');
const Q = [
  ['какие горячие клавиши?',            'hotkeys'],
  ['как скопировать объект быстро',     'hotkeys'],
  ['как сделать воду?',                 'water'],
  ['сколько можно быть под водой',      'water'],
  ['как включить кислоту',              'water'],
  ['что такое рикошет',                 'ricochet'],
  ['куда делся батут',                  'ricochet'],
  ['как спрятаться от искателя',        'hide'],
  ['как связать кнопку с воротами',     'links'],
  ['какой размер у игрока',             'size'],
  ['можно ли менять гравитацию',        'size'],
  ['сколько монет разрешено',           'coins'],
  ['как сделать финиш в гонке',         'race'],
  ['какой максимальный разрыв прыжка',  'jump'],
  ['как сделать шипы',                  'traps'],
  ['как заставить платформу двигаться', 'move'],
  ['как опубликовать карту',            'publish'],
  ['что умеет генератор',               'generator']
];
for (const [q, want] of Q) {
  const a = H.ask(q);
  ok(q, a && a.topic === want, a ? '→ ' + a.topic : '→ null');
}

console.log('\nвопрос или заказ карты:');
const BUILD = ['сделай лабиринт с водой', 'создай башню', 'построй арену для пряток',
               'сгенерируй паркур', 'лабиринт с укрытиями', 'make a maze'];
const ASK = ['как сделать лабиринт?', 'что такое башня', 'какие горячие клавиши',
             'сколько монет можно', 'как работает вода?'];
let bad = 0;
for (const b of BUILD) if (!H.isBuildRequest(b)) { bad++; console.log('   ✗ не распознан заказ:', b); }
for (const a of ASK)   if (H.isBuildRequest(a))  { bad++; console.log('   ✗ вопрос принят за заказ:', a); }
ok('заказы и вопросы различаются', bad === 0);

console.log('\nустойчивость:');
let crash = 0;
for (const j of [null, undefined, '', '   ', '???', 'a'.repeat(3000), 42, {}])
  { try { H.ask(j); H.isBuildRequest(j); } catch (e) { crash++; console.log('   ✗', e.message); } }
ok('мусор не роняет помощника', crash === 0);
ok('на непонятное есть ответ', H.ask('абракадабра').answer === H.FALLBACK);
ok('пустое даёт null', H.ask('') === null);

console.log(fails ? '\nПРОВАЛЕНО проверок: ' + fails : '\nвсе проверки пройдены ✓');
process.exit(fails ? 1 : 0);
