/* Прятки: реплики, сброс поимки и досрочный конец раунда.
   Проверяем сам game.js — его логика лежит в одном файле. */
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/game.js', 'utf8');
let fails = 0;
const ok = (n, c, x) => { if (!c) fails++; console.log('  ', c ? '✓' : '✗', n, x === undefined ? '' : x); };

console.log('реплики:');
ok('копятся стопкой',       /var list = spoken\[who\] \|\| \(spoken\[who\] = \[\]\);/.test(src));
ok('старая не затирается',  !/spoken\[who\] = \{ text: text, born: Date\.now\(\) \};/.test(src));
ok('лимит стопки',          /SAY_MAX/.test(src));
ok('рисуются все',          /for \(var si = 0; si < list\.length; si\+\+\)/.test(src));
ok('не наезжают друг на друга', /var lift = \(list\.length - 1 - si\) \* 15;/.test(src));

console.log('\nпоимка:');
ok('сбрасывается функцией', /function clearCaught/.test(src));
ok('сброс в начале раунда', /clearCaught\(\);\s*\/\/ новый раунд/.test(src));
ok('сброс при уходе в лобби', (src.match(/clearCaught\(\);/g) || []).length >= 2);
ok('чужие тоже сбрасываются', /others\[id\]\.caught = false/.test(src));
ok('чужие поимки слышны',   /if \(others\[id\]\.name === who\) others\[id\]\.caught = true;/.test(src));
ok('имя сверяется целиком',  /\^\(\.\+\?\) пойман/.test(src));

console.log('\nконец раунда:');
ok('проверка «все пойманы»', /function checkAllCaught/.test(src));
ok('вызов после поимки',    /checkAllCaught\(\);/.test(src));
ok('один в комнате не считается', /if \(!ids\.length\) return;/.test(src));
ok('раунд переключается',   /switching = false; advance\(\);/.test(src));

console.log(fails ? '\nПРОВАЛЕНО проверок: ' + fails : '\nвсе проверки пройдены ✓');
process.exit(fails ? 1 : 0);
