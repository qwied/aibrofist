const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" },
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

// служебные файлы наружу не отдаём
const PRIVATE = ['/server.js','/accounts.js','/maps.js','/skins.js','/userskins.js','/lang.js','/themes.js','/extras.js','/package.json','/package-lock.json','/readme-v36.md','/audit-ui.js','/test-ui.js','/test-avatar.js','/test-i18n.js','/test-theme.js','/check-domain.js','/domain-pp-ua.md'];
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (PRIVATE.indexOf(p) !== -1 || p.indexOf('/data') === 0 || p.indexOf('/node_modules') === 0)
    return res.status(404).send('Not found');
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

// картинки скинов лежат в data/skinimg — отдаём только их, остальная data закрыта
app.use('/skinimg', express.static(path.join(__dirname, 'data', 'skinimg'), {
  maxAge: '7d', fallthrough: true
}));

// иконки сайта: браузер запрашивает /favicon.ico ещё до загрузки страницы
app.get('/favicon.ico', (req, res) => {
  res.set('Cache-Control', 'public, max-age=604800');
  res.sendFile(path.join(__dirname, 'favicon.ico'));
});

app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

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
app.get('/skinEditor/index.html', (req, res) => res.redirect('/skinEditor.html'));
app.get('/skinsBrowser/index.html', (req, res) => res.redirect('/skinsBrowser.html'));
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

// Инициализация
io.on('connection', (socket) => {
  gameState.stats.totalPlayers++;

  socket.on('join', (data) => {
    // режим входит в ключ комнаты, поэтому Two Player и Hide and Seek не пересекаются
    const room = (data.gameMode || 'main') + ':' + (data.room || 'main');
    const player = {
      id: socket.id,
      name: data.playerName,
      gameMode: data.gameMode,
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

    console.log(`✅ [${room}] ${data.playerName} (${data.gameMode}) | Total: ${gameState.stats.totalPlayers}`);
  });

  socket.on('movePlayer', (data) => {
    const player = gameState.players.get(socket.id);
    if (player) {
      player.seen = Date.now();
      player.position = data.position;
      const room = player.room;
      socket.to(room).emit('playerMoved', {
        playerId: socket.id,
        position: data.position
      });
    }
  });

  socket.on('saveMap', (data) => {
    const player = gameState.players.get(socket.id);
    if (player) {
      gameState.maps.push({
        id: Date.now() + Math.random(),
        creator: player.name,
        room: player.room,
        mapData: data.mapData,
        timestamp: new Date().toLocaleTimeString('ru-RU'),
        createdAt: Date.now()
      });

      if (gameState.maps.length > 1000) {
        gameState.maps = gameState.maps.slice(-1000);
      }

      io.to(player.room).emit('mapSaved', gameState.maps[gameState.maps.length - 1]);
      io.emit('newMapInSandbox', gameState.maps[gameState.maps.length - 1]);
    }
  });

  socket.on('getMaps', () => {
    socket.emit('mapsList', gameState.maps);
  });

  socket.on('sendChat', (data) => {
    const player = gameState.players.get(socket.id);
    if (player) {
      const room = player.room;
      const message = {
        playerId: socket.id,
        playerName: player.name,
        text: data.text,
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
      console.log(`❌ ${player.name} | Осталось: ${gameState.stats.totalPlayers}`);
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
    console.log('🧹 убран зависший игрок', p.name);
  });
}, 20000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║   🎮 AIBROFIST MULTIPLAYER SERVER                        ║
  ║   ✅ Запущен на http://localhost:${PORT}                   ║
  ║   👥 До 2000+ игроков одновременно                         ║
  ║   🎮 Map Editor + Two Player + Hide and Seek + Sandbox     ║
  ║   🚀 Оптимизирован для экстремальных нагрузок              ║
  ╚════════════════════════════════════════════════════════════╝
  `);
});
