/* Сеть: сглаживание чужих игроков. Гоняем НАСТОЯЩИЙ код из game.js —
   функции вырезаются из файла и исполняются здесь, поэтому тест
   проверяет то, что реально работает в игре, а не его пересказ. */
const fs = require('fs');

let fails = 0;
const ok = (n, c, x) => { if (!c) fails++; console.log('  ', c ? '✓' : '✗', n, x === undefined ? '' : x); };

const game = fs.readFileSync(__dirname + '/game.js', 'utf8');
const srv = fs.readFileSync(__dirname + '/server.js', 'utf8');

/* ---------- достаём сетевые функции из game.js ---------- */
const from = game.indexOf('  var byNid = {};');
const to = game.indexOf('\n  }', game.indexOf('function sample(o, rt)')) + 4;
if (from < 0 || to < 4) { console.log('не нашёл сетевой блок в game.js'); process.exit(1); }

let clock = 1000;
global.window = { performance: { now: () => clock } };
const net = new Function('return (function () {' + game.slice(from, to)
  + '; return { sample: sample, noteSnapshot: noteSnapshot, pushSnap: pushSnap,'
  + ' interp: function () { return interp; } }; })();')();

const feed = (o, times, xs) => times.forEach((t, i) => { net.noteSnapshot(t); net.pushSnap(o, t, xs[i], 0); });

console.log('интерполяция:');
{
  const o = {};
  feed(o, [1000, 1050], [0, 100]);
  ok('середина между кадрами', Math.round(net.sample(o, 1025).x) === 50, net.sample(o, 1025).x);
  ok('точно на кадре — точное значение', net.sample(o, 1050).x === 100);
  ok('до первого кадра не улетает', net.sample(o, 900).x === 0);
  ok('один кадр не роняет', net.sample({ buf: [{ t: 1000, x: 7, y: 7 }] }, 1200).x === 7);
  ok('пустой буфер отдаёт null', net.sample({}, 1200) === null);
}

console.log('\nровность хода:');
{
  /* Живая симуляция: игрок бежит 300 px/с, кадры приходят раз в 50 мс,
     экран рисует 60 раз в секунду. Смотрим на шаг между соседними
     кадрами отрисовки — именно он и есть «плавность». */
  const o = {};
  const steps = [];
  let prev = null, nextSnap = 1000, frame = 0;
  for (let t = 1000; t <= 2000; t += 16.7) {
    while (nextSnap <= t) {                        // пришёл очередной пакет
      net.noteSnapshot(nextSnap);
      net.pushSnap(o, nextSnap, frame++ * 15, 0);
      nextSnap += 50;
    }
    const s = net.sample(o, t - 100);
    if (prev !== null && t > 1200) steps.push(s.x - prev);
    prev = s.x;
  }
  const min = Math.min.apply(null, steps), max = Math.max.apply(null, steps);
  ok('шаг между кадрами одинаковый', max - min < 0.01, 'разброс ' + (max - min).toFixed(4) + ' px');
  ok('игрок реально движется', min > 4, 'шаг ' + min.toFixed(2) + ' px');

  // как было раньше: догоняние цели с коэффициентом 0.3
  let x = 0, target = 0, k = 0, lag = [];
  for (let i = 0; i < 40; i++) {
    if (i % 3 === 0) { target = ++k * 15; }        // пакет раз в ~50 мс при 60 fps
    x += (target - x) * 0.3;
    lag.push(target - x);
  }
  const oldLag = lag.slice(-10).reduce((a, b) => a + b, 0) / 10;
  ok('старое сглаживание отставало от цели', oldLag > 8, 'на ' + oldLag.toFixed(1) + ' px постоянно');
}

console.log('\nпотери и паузы:');
{
  const o = {};
  feed(o, [1000, 1050, 1100], [0, 50, 100]);
  const ext = net.sample(o, 1160);                 // кадр опоздал на 60 мс
  ok('пропущенный кадр продолжает движение', ext.x > 100 && ext.x < 200, 'x=' + Math.round(ext.x));
  const far = net.sample(o, 1400);                 // связь пропала надолго
  ok('экстраполяция ограничена', far.x <= 100 + 120, 'x=' + Math.round(far.x));
  const back = net.sample(o, 4000);                // вкладку свернули и вернули
  ok('после свёрнутой вкладки без телепорта', back.x === 100);
}

console.log('\nбуфер под сеть:');
{
  clock = 1000;
  const o = {};
  for (let i = 0; i < 40; i++) net.noteSnapshot(1000 + i * 50);
  const even = net.interp();
  ok('на ровной сети буфер маленький', even <= 90, even.toFixed(0) + ' мс');
  for (let i = 0; i < 20; i++) net.noteSnapshot(3000 + i * 170);
  const rough = net.interp();
  ok('на дёрганой сети буфер растёт', rough > even, rough.toFixed(0) + ' мс');
  ok('и не выходит за потолок', rough <= 200, rough.toFixed(0) + ' мс');
}

console.log('\nсервер:');
ok('кадр комнаты 20 раз в секунду', /const SNAP_MS = 50;/.test(srv) && /\}, SNAP_MS\)/.test(srv));
ok('позиция больше не рассылается по пакету', !/emit\('playerMoved'/.test(srv));
ok('вместо рассылки — пометка изменения', /player\.dirty = true;/.test(srv));
ok('в кадр попадают только изменившиеся', /if \(!p\.dirty && !key\) return;/.test(srv));
ok('опорный кадр раз в 2 секунды', /const KEY_EVERY = 40;/.test(srv) &&
   /const key = \(\+\+snapTick % KEY_EVERY\) === 0;/.test(srv));
ok('опорный кадр доставляется гарантированно', /if \(key\) io\.to\(room\)\.emit\('state', frame\);/.test(srv));
ok('на вход в комнату состояние шлётся полностью', /roomPlayers\.forEach\(p => \{ p\.sent = \{\}; p\.dirty = true; \}\);/.test(srv));
ok('кадр уходит одним сообщением', /io\.to\(room\)\.volatile\.emit\('state', frame\)/.test(srv));
ok('подвисший клиент не копит очередь', /\.volatile\./.test(srv));
ok('редкие поля только при изменении', /if \(pos\.color !== last\.color\)/.test(srv) && /if \(pos\.sk !== last\.sk\)/.test(srv));
ok('короткий номер вместо socket.id', /nid: \(nidSeq = /.test(srv) && /n: p\.nid/.test(srv));
ok('скин не теряется, если его не прислали', /else if \(player\.position\) pos\.sk = player\.position\.sk;/.test(srv));
ok('сжатие мелких пакетов выключено', /perMessageDeflate: false/.test(srv));
ok('замер задержки на сервере', /socket\.on\('pingCheck'/.test(srv) && /socket\.emit\('pongCheck', t\)/.test(srv));
ok('лимит движения поднят под 20 Гц', /socketLimiter\(60, 500\)/.test(srv));

console.log('\nклиент:');
ok('отправка 20 раз в секунду', /now - lastSent < 50/.test(game));
ok('стоящий игрок не шлёт пакеты', /if \(!moved && !force\) return;/.test(game));
ok('контрольный пакет раз в секунду', /now - lastForce > 1000/.test(game));
ok('скин уходит только при смене', /if \(mySkinStr !== lastSk\)/.test(game));
ok('рисуем по буферу, а не догоняем', /var s = sample\(o, rt\);/.test(game));
ok('старое догоняние осталось запасным', /else \{ o\.x \+= \(o\.tx - o\.x\) \* 0\.3;/.test(game));
ok('снапшоты разбираются по номеру', /var e = list\[i\], o = byNid\[e\.n\];/.test(game));
ok('старый сервер тоже поддержан', /socket\.on\('playerMoved'/.test(game));
ok('пинг виден игроку', /id="gPing"/.test(game) && /socket\.emit\('pingCheck'/.test(game));
ok('скин берётся из списка комнаты', /function applyKnown/.test(game) && /applyKnown\(o, p\.position\);/.test(game));
ok('после переподключения скин уходит заново', /lastSk = null;/.test(game) && /prev\.x = prev\.y = prev\.w = prev\.h = null;/.test(game));
ok('палочки в чате больше нет', !/'▏'/.test(game));

const i18n = fs.readFileSync(__dirname + '/i18n.js', 'utf8');
ok('подпись пинга переводится', /gPing:\s+\[/.test(i18n) && /gPingMs:\s+\[/.test(i18n));

console.log(fails ? '\n✗ ошибок: ' + fails : '\n✓ всё зелено');
process.exit(fails ? 1 : 0);
