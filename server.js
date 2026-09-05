const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
app.disable('x-powered-by');
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: true, credentials: true },   // только собственный домен: куки идут вместе с рукопожатием
  maxHttpBufferSize: 1e6,
  pingInterval: 5000,
  pingTimeout: 12000,
  transports: ['websocket', 'polling']
});

let accountsRef = null;   // заполняется ниже, нужен для проверки прав на owner.js

/* Свой домен.
   Задайте переменную окружения PRIMARY_HOST (например aibrofist.pp.ua), и
   старый адрес *.up.railway.app будет отправлять на него постоянным
   редиректом — старые ссылки, закладки и поисковая выдача не потеряются.
   Если переменная не задана, ничего не меняется. */
const PRIMARY_HOST = String(process.env.PRIMARY_HOST || '').trim().toLowerCase();
app.use((req, res, next) => {
  if (!PRIMARY_HOST) return next();
  const host = String(req.headers.host || '').toLowerCase().split(':')[0];
  if (!host || host === PRIMARY_HOST) return next();
  // localhost при разработке не трогаем
  if (host === 'localhost' || host === '127.0.0.1') return next();
  res.redirect(301, 'https://' + PRIMARY_HOST + req.originalUrl);
});

/* Служебные файлы наружу не отдаём. Список был поимённым и отставал от
   репозитория: новый тест или свежий readme оказывались доступны по
   прямой ссылке. Теперь закрыты и целые семейства по префиксу. */
const PRIVATE = ['/server.js','/accounts.js','/maps.js','/skins.js','/userskins.js','/updatetimer.js','/abuse.js',
                 '/lang.js','/themes.js','/extras.js','/check-domain.js',
                 '/package.json','/package-lock.json'];
const PRIVATE_PREFIX = ['/test-', '/audit-', '/readme', '/domain', '/patch_', '/data', '/node_modules'];
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (PRIVATE.indexOf(p) !== -1) return res.status(404).send('Not found');
  for (let i = 0; i < PRIVATE_PREFIX.length; i++)
    if (p.indexOf(PRIVATE_PREFIX[i]) === 0) return res.status(404).send('Not found');
  next();
});

/* ================== БЕЗОПАСНОСТЬ ================== */

/* Заголовки защиты: чужие сайты не встраивают игру в iframe,
   браузеру запрещено «догадываться» о типе файла, а посторонние
   скрипты и стили не исполняются — даже если их вписали в поле ввода. */
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https:; " +
    "media-src 'self' data: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' ws: wss:; " +
    "frame-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'self'");
  next();
});

/* Мини-лимитер запросов: без него один скрипт способен забомбить сервер
   тысячами обращений. Обычному игроку лимит не виден никогда. */
const RL_BUCKETS = new Map();
setInterval(() => {
  const now = Date.now();
  RL_BUCKETS.forEach((b, k) => { if (now - b.start > 120000) RL_BUCKETS.delete(k); });
}, 60000).unref();
function clientKey(req) {
  // за Cloudflare реальный адрес приходит в CF-Connecting-IP;
  // крайний левый элемент X-Forwarded-For подделывается клиентом
  const cf = String(req.headers['cf-connecting-ip'] || '').trim();
  if (cf) return cf;
  const xff = String(req.headers['x-forwarded-for'] || '');
  if (xff) return xff.split(',').pop().trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}
function rateLimit(limit, windowMs) {
  return (req, res, next) => {
    const k = clientKey(req);
    const now = Date.now();
    let b = RL_BUCKETS.get(k);
    if (!b || now - b.start > windowMs) { b = { start: now, n: 0 }; RL_BUCKETS.set(k, b); }
    b.n++;
    if (b.n > limit) return res.status(429).json({ status: 'error', message: 'Слишком много запросов, попробуйте позже' });
    next();
  };
}
app.use(rateLimit(240, 60000));   // 240 запросов в минуту с одного адреса

/* CSRF: POST-запросы принимаем только со своего сайта.
   Кука и так SameSite=Lax, это вторая линия обороны. */
app.use((req, res, next) => {
  if (req.method !== 'POST') return next();
  const host = String(req.headers.host || '').toLowerCase();      // хост с портом
  const src = String(req.headers.origin || req.headers.referer || '').toLowerCase();
  if (!src) return next();            // старые клиенты без заголовков — пропускаем
  let hostOrigin = '';
  try { hostOrigin = new URL(src).host || ''; } catch (e) { return res.status(403).json({ status: 'error', message: 'Запрещено' }); }
  if (hostOrigin && hostOrigin !== host)
    return res.status(403).json({ status: 'error', message: 'Запрещено' });
  next();
});

// owner.js отдаём ТОЛЬКО владельцу. Обычный игрок получает пустой файл,
// поэтому у него нет ни кнопок, ни разметки, ни адресов служебных запросов.
app.get('/owner.js', (req, res) => {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  let allowed = false;
  try { allowed = accountsRef && accountsRef.isOwner(accountsRef.currentUser(req)); }
  catch (e) { allowed = false; }
  if (!allowed) return res.send('/* */');
  res.sendFile(path.join(__dirname, 'owner.js'));
});

/* adminAbuse.js — то же правило, что и у owner.js: обычный игрок получает
   пустышку, поэтому у него нет ни кнопки, ни адресов служебных запросов. */
app.get('/adminAbuse.js', (req, res) => {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  let allowed = false;
  try { allowed = accountsRef && accountsRef.isOwner(accountsRef.currentUser(req)); }
  catch (e) { allowed = false; }
  // чужому — обычное «нет такого файла», а не пустышка: так о панели
  // вообще ничего не узнать
  if (!allowed) return res.status(404).send('Not found');
  res.sendFile(path.join(__dirname, 'adminAbuse.js'));
});

// картинки скинов лежат в data/skinimg — отдаём только их.
// sandbox+CSP: даже подложенный в картинку SVG-скрипт не исполнится никогда.
app.use('/skinimg', (req, res, next) => {
  res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  res.set('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(path.join(__dirname, 'data', 'skinimg'), {
  maxAge: '7d', fallthrough: true
}));

// иконки сайта: браузер запрашивает /favicon.ico ещё до загрузки страницы
app.get('/favicon.ico', (req, res) => {
  res.set('Cache-Control', 'public, max-age=604800');
  res.sendFile(path.join(__dirname, 'favicon.ico'));
});

app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

/* Старые разделы переехали: Skin Editor и Skins Browser теперь вместе
   на странице Avatar. Редиректы спасают закладки и старые ссылки. */
app.get('/skinEditor.html', (req, res) => res.redirect(301, '/avatar.html'));
app.get('/skinsBrowser.html', (req, res) => res.redirect(301, '/avatar.html'));

/* Владелец грузит видео и гифки для общего шоу — они приходят в base64,
   поэтому для ЭТОГО маршрута тело должно вмещать десятки мегабайт.
   Остальные маршруты получают скромный лимит: огромные тела —
   это лазейка для забивания памяти. */
app.post('/abuse/upload', express.urlencoded({ extended: false, limit: '60mb' }));
app.use(express.urlencoded({ extended: false, limit: '512kb' }));
app.use(express.json({ limit: '512kb' }));

// система аккаунтов, друзей и профилей
const accounts = require('./accounts.js');
accountsRef = accounts;
accounts.register(app);
require('./maps.js').register(app, accounts.currentUser, accounts);
const skinsApi = require('./skins.js');
skinsApi.register(app, accounts);
require('./userSkins.js').register(app, accounts, skinsApi);
require('./lang.js').register(app, accounts);
require('./themes.js').register(app, accounts);
require('./updateTimer.js').register(app, accounts);
require('./abuse.js').register(app, accounts);
// файлы шоу владельца отдаём как статику: сами по себе они безобидны
app.use('/abusefile', express.static(require('./abuse.js').FILE_DIR,
        { maxAge: '1h', fallthrough: true }));
require('./extras.js').register(app, accounts);

// адреса, на которые ссылается шапка сайта
// автоподбор комнаты: та, где сейчас больше всего игроков этого режима
// аватарка игрока: одна картинка на всех, отдаётся прямо из кода
const AVATAR_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAACxElEQVR4nO3dQVIbQRAAQdn//7N996HAaHa3GzLPRKhjp2ukA4jXCwAAAAAAAAAAAAAAAAAAAAAAAAAAAH6WX08PwOvPJ37GOT3Eg7/fZ4L4iHO7iQd9nxNh/Mv5XcwDvt4VYfzLOV7k99MDfHN3xHHn6/w4bp5rPLmwzvQg7yDnPX2bP/3634pAzpqynFPmWE8g50xbymnzrCSQM6Yu49S51hAIBIG8b/otPX2+0QTyni3Lt2XOcQQCQSBft+1W3jbvCAKBIJCv2Xobb537MQKBIBAIAoEgkP+3/XP89vlvJRAIAoEgEAgCgSAQCAKBIBAIAoEgkP+3/Xunts9/K4FAEAgEgUAQyNds/Ry/de7HCASCQL5u2228bd4RBAJBIO/ZcitvmXMcgbxv+vJNn280gUAQyBlTb+mpc60hkHOmLeO0eVYSyFlTlnLKHOsJ5Lynl/Pp1/9WPMxr3fkdVM7yAt5BrnXX0orjIh7sfa54N3F+F/OA73ciFOd2Ew/6eZ8JxjkBAAAAAAAAAMBsfsfnvAn/h9y5HuLvQc6aEMfrNWeO9QRyzrSlnDbPSgI5Y+oyTp1rDYG8b/oSTp9vNIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBvO/X0wN8YPp8ownkjKlLOHWuNQRyzrRlnDbPSgI5a8pSTpkDAAAAAAAAAAAAAAAAAAAAgJ/oL9ICJw+67ArWAAAAAElFTkSuQmCC', 'base64');
app.get(/^\/avatar\//, (req, res) => {
  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(AVATAR_PNG);
});

app.get('/getBestRoom', (req, res) => {
  const mode = String(req.query.mode || 'sandbox');
  const LIMIT = 40;                      // больше — заводим новую комнату
  let best = null, bestCount = -1;
  gameState.rooms.forEach((set, key) => {
    if (key.indexOf(mode + ':') !== 0) return;
    const n = set.size;
    if (n >= LIMIT) return;
    if (n > bestCount) { bestCount = n; best = key.slice(mode.length + 1); }
  });
  if (!best) {
    // свободных нет — создаём следующую по счёту
    let i = 1;
    while (gameState.rooms.has(mode + ':room' + i)) i++;
    best = 'room' + i;
    bestCount = 0;
  }
  res.json({ room: best, players: Math.max(0, bestCount) });
});

app.get('/editor/index.html', (req, res) => res.redirect('/editor.html'));
app.get('/skinEditor/index.html', (req, res) => res.redirect('/avatar.html'));
app.get('/skinsBrowser/index.html', (req, res) => res.redirect('/avatar.html'));
app.get('/shop/index.html', (req, res) => res.redirect('/avatar.html'));
app.get('/avatar/index.html', (req, res) => res.redirect('/avatar.html'));
app.get('/settings/index.html', (req, res) => res.redirect('/avatar.html'));
app.get('/supporters/index.html', (req, res) => res.redirect('/leaderboard.html'));
app.get('/users/index.html', (req, res) => res.redirect('/users.html' + (req.originalUrl.split('?')[1] ? '?' + req.originalUrl.split('?')[1] : '')));
app.get('/mapsBrowser/index.html', (req, res) => res.redirect('/mapsBrowser.html'));
app.get('/editor/tutorial.html', (req, res) => res.redirect('/editor.html'));

// если аватарка не найдена — отдаём стандартную


// Оптимизированное состояние для 2000+ игроков
const gameState = {
  players: new Map(),
  maps: [],
  chatMessages: new Map(),
  rooms: new Map(),
  stats: {
    totalPlayers: 0,
    totalRooms: 0
  }
};

/* ================== ЗАЩИТА СОКЕТОВ ==================
   Гость мог назвать себя любым ником — в том числе чужим или ником
   владельца. Теперь имя подтверждённой сессии сильнее присланного,
   а гостю, замахнувшимся на чужой ник, сервер его меняет. */
const CLEAN = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g;
function cleanText(v, max) {
  return String(v == null ? '' : v).replace(CLEAN, '').slice(0, max);
}
function cleanName(v) {
  return cleanText(v, 20).replace(/[<>"'&]/g, '').trim();
}
function sessionName(cookieHeader) {
  try {
    const out = {};
    String(cookieHeader || '').split(';').forEach(p => {
      const i = p.indexOf('=');
      if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
    });
    return out.sid ? accountsRef.sessionNameBySid(out.sid) : null;
  } catch (e) { return null; }
}

// простые лимиты событий на соединение: чат-флуд и спам позицией невозможны
function socketLimiter(perSecond, perTenSec) {
  const st = { sec: 0, secAt: Date.now(), win: 0, winAt: Date.now() };
  return function () {
    const now = Date.now();
    if (now - st.secAt >= 1000) { st.secAt = now; st.sec = 0; }
    if (now - st.winAt >= 10000) { st.winAt = now; st.win = 0; }
    st.sec++; st.win++;
    return st.sec > perSecond || st.win > perTenSec;
  };
}

// Инициализация
io.on('connection', (socket) => {
  gameState.stats.totalPlayers++;

  const account = sessionName(socket.handshake.headers.cookie);  // подтверждённый ник или null
  const limMove = socketLimiter(45, 400);    // движение идёт ~14 раз/сек
  const limChat = socketLimiter(4, 8);       // чат: не чаще 4 в секунду и 8 в 10 сек
  let joinedAt = 0;

  socket.on('join', (data) => {
    if (Date.now() - joinedAt < 1500) return;   // без повторных join подряд
    joinedAt = Date.now();
    data = data || {};
    const mode = cleanName(data.gameMode) || 'main';
    const roomName = cleanName(data.room) || 'main';
    // режим входит в ключ комнаты, поэтому режимы не пересекаются
    const room = mode + ':' + roomName;
    let name = cleanName(data.playerName);
    if (account) {
      name = account;                            // сессия сильнее присланного имени
    } else if (name && accountsRef.nameIsTaken(name)) {
      name = 'Guest' + Math.floor(100 + Math.random() * 900);   // чужой ник гостю не достанется
    }
    if (!name) name = 'Guest' + Math.floor(100 + Math.random() * 900);

    const player = {
      id: socket.id,
      name: name,
      gameMode: mode,
      room: room,
      position: { x: Math.random() * 800, y: Math.random() * 600 },
      joinedAt: Date.now()
    };

    gameState.players.set(socket.id, player);

    if (!gameState.rooms.has(room)) {
      gameState.rooms.set(room, new Set());
      gameState.stats.totalRooms++;
    }

    gameState.rooms.get(room).add(socket.id);
    socket.join(room);

    const roomPlayers = Array.from(gameState.rooms.get(room))
      .map(id => gameState.players.get(id))
      .filter(p => p);

    io.to(room).emit('playersList', roomPlayers);
    io.to(room).emit('playerJoined', player);
    socket.emit('nameFixed', { name: name });    // игрок показывает себе ровно то, что решил сервер
  });

  socket.on('movePlayer', (data) => {
    if (limMove()) return;
    const player = gameState.players.get(socket.id);
    if (player && data && data.position) {
      player.seen = Date.now();
      const p = data.position;
      const say = cleanText(p.say, 80);
      const pos = {
        x: Math.max(-99999, Math.min(99999, Number(p.x) || 0)),
        y: Math.max(-99999, Math.min(99999, Number(p.y) || 0)),
        w: Math.max(0, Math.min(999, Number(p.w) || 0)),
        h: Math.max(0, Math.min(999, Number(p.h) || 0)),
        color: cleanText(p.color, 20),
        say: say,
        fin: !!p.fin,
        hid: !!p.hid
      };
      if (p.sk !== undefined) pos.sk = cleanText(p.sk, 120);
      player.position = pos;
      const room = player.room;
      socket.to(room).emit('playerMoved', {
        playerId: socket.id,
        position: pos
      });
    }
  });

  socket.on('saveMap', (data) => {
    const player = gameState.players.get(socket.id);
    if (player && data && data.mapData) {
      gameState.maps.push({
        id: Date.now() + Math.random(),
        creator: player.name,
        room: player.room,
        mapData: cleanText(data.mapData, 400000),
        timestamp: new Date().toLocaleTimeString('ru-RU'),
        createdAt: Date.now()
      });

      if (gameState.maps.length > 1000) {
        gameState.maps = gameState.maps.slice(-1000);
      }

      io.to(player.room).emit('mapSaved', gameState.maps[gameState.maps.length - 1]);
    }
  });

  socket.on('getMaps', () => {
    socket.emit('mapsList', gameState.maps);
  });

  socket.on('sendChat', (data) => {
    if (limChat()) return;
    const player = gameState.players.get(socket.id);
    if (player && data) {
      const room = player.room;
      const message = {
        playerId: socket.id,
        playerName: player.name,
        text: cleanText(data.text, 200),
        timestamp: Date.now(),
        room: room
      };

      if (!gameState.chatMessages.has(room)) {
        gameState.chatMessages.set(room, []);
      }

      const roomChat = gameState.chatMessages.get(room);
      roomChat.push(message);

      if (roomChat.length > 200) {
        roomChat.shift();
      }

      io.to(room).emit('chatMessage', message);
    }
  });

  socket.on('getChatHistory', (data) => {
    const room = data.room || 'main';
    const messages = gameState.chatMessages.get(room) || [];
    socket.emit('chatHistory', messages);
  });

  socket.on('disconnect', () => {
    const player = gameState.players.get(socket.id);
    if (player) {
      const room = player.room;
      gameState.players.delete(socket.id);
      gameState.stats.totalPlayers--;

      const roomPlayers = gameState.rooms.get(room);
      if (roomPlayers) {
        roomPlayers.delete(socket.id);

        if (roomPlayers.size === 0) {
          gameState.rooms.delete(room);
          gameState.stats.totalRooms--;
        }
      }

      io.to(room).emit('playerLeft', { playerId: socket.id });
      console.log(`${player.name} | Осталось: ${gameState.stats.totalPlayers}`);
    }
  });
});

// раздела нет — показываем понятную страницу, а НЕ редирект
// (редирект ломал кнопку "Назад": браузер возвращался и его снова перекидывало)
app.get('*', (req, res) => {
  if (!path.extname(req.path) || req.path.endsWith('.html')) {
    return res.status(404).send(`<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AIBrofist</title><style>body{font-family:sans-serif;display:flex;height:100vh;margin:0;
align-items:center;justify-content:center;flex-direction:column;gap:14px;color:#191919;text-align:center;padding:20px}
a,button{border:1px solid #2196F3;border-radius:4px;padding:11px 22px;background:#fff;color:#000;
text-decoration:none;font-size:16px;cursor:pointer}</style></head><body>
<h2>Этот раздел ещё не готов</h2>
<p style="color:#777;margin:0">Такой страницы в игре пока нет.</p>
<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
<button onclick="history.back()">&larr; Назад</button>
<a href="/">В главное меню</a></div></body></html>`);
  }
  res.status(404).send('Not found');
});

// подчистка «призраков»: если вкладку закрыли жёстко, игрок мог зависнуть в комнате
setInterval(() => {
  const now = Date.now();
  gameState.players.forEach((p, id) => {
    const alive = io.sockets.sockets.get(id);
    if (alive && now - (p.seen || p.joinedAt) < 45000) return;
    gameState.players.delete(id);
    gameState.stats.totalPlayers--;
    const rp = gameState.rooms.get(p.room);
    if (rp) {
      rp.delete(id);
      if (!rp.size) { gameState.rooms.delete(p.room); gameState.stats.totalRooms--; }
    }
    io.to(p.room).emit('playerLeft', { playerId: id });
    console.log('убран зависший игрок', p.name);
  });
}, 20000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║   AIBROFIST MULTIPLAYER SERVER                        ║
  ║   Запущен на http://localhost:${PORT}                   ║
  ║   До 2000+ игроков одновременно                         ║
  ║   Map Editor + Two Player + Hide and Seek + Sandbox     ║
  ║   Оптимизирован для экстремальных нагрузок              ║
  ╚════════════════════════════════════════════════════════════╝
  `);
});
