// ============ КАРТЫ: публикация из редактора и Maps Browser ============
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const MAPS_FILE = path.join(DATA_DIR, 'maps.json');

const MODES = ['hideAndSeek', 'twoPlayer', 'race'];
// в игровые режимы попадают только карты владельца сайта
// (имя можно поменять переменной окружения OWNER_NAME, без правки кода)
const OWNER = process.env.OWNER_NAME || 'AIBrofist';
const OWNER_ALIASES = String(process.env.OWNER_ALIASES || 'AIBrofist,System')
  .split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
if (OWNER_ALIASES.indexOf(OWNER.toLowerCase()) === -1) OWNER_ALIASES.push(OWNER.toLowerCase());
const isOwnerName = n => OWNER_ALIASES.indexOf(String(n || '').toLowerCase()) !== -1;

const DAILY_LIMIT = 3;                 // сколько новых карт можно выложить за сутки
const COIN_LIMIT  = 3;                 // максимум монет в одной карте — защита от накрутки

// сколько монет лежит в карте (mapData — JSON из редактора)
function coinsInMap(raw) {
  try {
    const m = JSON.parse(raw);
    const list = Array.isArray(m) ? m : (m && Array.isArray(m.objects) ? m.objects : []);
    return list.filter(o => o && o.type === 'coin').length;
  } catch (e) { return 0; }
}

// счётчики оценок: голоса игроков + ручная правка владельца
function tally(m) {
  const votes = Object.values(m.votes || {});
  const likes = votes.filter(v => v > 0).length + (m.boostLikes || 0);
  const dislikes = votes.filter(v => v < 0).length + (m.boostDislikes || 0);
  return { likes, dislikes, rating: likes - dislikes };
}
function retally(m) {
  const t = tally(m);
  m.rating = t.rating;
  return t;
}

// сколько новых карт автор выложил сегодня
function todayCount(author) {
  const from = Date.now() - 864e5;
  return maps.filter(m => low(m.author) === low(author) && (m.created || m.date) >= from).length;
}

let maps = [];

function load() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(MAPS_FILE)) maps = JSON.parse(fs.readFileSync(MAPS_FILE, 'utf8'));
  } catch (e) { console.log('maps.json не прочитан, начинаю с нуля'); }
  if (!Array.isArray(maps)) maps = [];
}
let timer = null;
function save() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(MAPS_FILE, JSON.stringify(maps, null, 2));
    } catch (e) { console.log('не смог сохранить maps.json:', e.message); }
  }, 300);
}
load();

const low = s => String(s || '').toLowerCase();

function register(app, getUser) {
  // ---------- публикация карты из редактора ----------
  app.post('/uploadMap', (req, res) => {
    const u = getUser(req);
    if (!u) return res.json({ status: 'error', message: 'Сначала войдите в аккаунт' });

    const mapName = String(req.body.mapName || '').trim();
    const mapType = String(req.body.mapType || 'sandbox');
    const mapData = String(req.body.mapData || '');
    const overwrite = String(req.body.mapOverwrite || '') === 'true';

    if (mapName.length < 2 || mapName.length > 30)
      return res.json({ status: 'error', message: 'Название карты: от 2 до 30 символов' });
    if (MODES.indexOf(mapType) === -1)
      return res.json({ status: 'error', message: 'Неизвестный режим карты' });
    if (!mapData)
      return res.json({ status: 'error', message: 'Карта пустая' });

    const coins = coinsInMap(mapData);
    if (coins > COIN_LIMIT)
      return res.json({
        status: 'error',
        message: 'В карте ' + coins + ' монет. Разрешено не больше ' + COIN_LIMIT +
                 ' — уберите лишние и попробуйте снова.'
      });

    const i = maps.findIndex(m => low(m.author) === low(u.name) && low(m.mapName) === low(mapName));

    // лимит считаем только для новых карт — обновлять свои можно свободно
    if (i === -1) {
      const used = todayCount(u.name);
      if (used >= DAILY_LIMIT) {
        const oldest = maps
          .filter(m => low(m.author) === low(u.name) && (m.created || m.date) >= Date.now() - 864e5)
          .sort((a, b) => (a.created || a.date) - (b.created || b.date))[0];
        const waitMs = oldest ? ((oldest.created || oldest.date) + 864e5 - Date.now()) : 864e5;
        const mins = Math.ceil(waitMs / 60000);
        const h = Math.floor(mins / 60), mn = mins % 60;
        return res.json({
          status: 'error',
          message: 'Лимит ' + DAILY_LIMIT + ' карты в сутки исчерпан. Следующую можно выложить через '
                   + (h > 0 ? h + ' ч ' + mn + ' мин' : mn + ' мин') + '.'
        });
      }
    }

    if (i !== -1) {
      if (!overwrite)
        return res.json({ status: 'exists', message: 'Карта с таким названием уже есть. Перезаписать?' });
      maps[i].mapData = mapData;
      maps[i].mapType = mapType;
      maps[i].date = Date.now();
      save();
      return res.json({ status: 'success', message: 'Карта обновлена' });
    }

    maps.push({
      mapName, mapType, mapData,
      author: u.name, date: Date.now(), created: Date.now(),
      rating: 0, votes: {}, boostLikes: 0, boostDislikes: 0, inGame: false
    });
    save();
    const left = DAILY_LIMIT - todayCount(u.name);
    res.json({
      status: 'success',
      message: 'Карта опубликована в Maps Browser. Осталось сегодня: ' + Math.max(0, left) + ' из ' + DAILY_LIMIT
    });
  });

  app.get('/getUploadLimit', (req, res) => {
    const u = getUser(req);
    if (!u) return res.json({ limit: DAILY_LIMIT, left: DAILY_LIMIT, guest: true });
    res.json({ limit: DAILY_LIMIT, left: Math.max(0, DAILY_LIMIT - todayCount(u.name)), guest: false });
  });

  // ---------- список карт для Maps Browser ----------
  function list(req, res) {
    const mapType = String(req.query.mapType || '');
    const author = low(req.query.author || '');
    const sortBy = String(req.query.sortBy || 'date');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const per = 10;

    let out = maps.slice();
    if (mapType) out = out.filter(m => m.mapType === mapType);
    if (author) out = out.filter(m => low(m.author).indexOf(author) !== -1);

    out.sort((a, b) => sortBy === 'rating'
      ? (b.rating - a.rating) || (b.date - a.date)
      : b.date - a.date);

    const slice = out.slice((page - 1) * per, page * per).map(m => {
      const t = tally(m);
      return {
        mapName: m.mapName, rating: t.rating, likes: t.likes, dislikes: t.dislikes,
        author: m.author, date: m.date, mapType: m.mapType, inGame: !!m.inGame
      };
    });

    res.json({ page: String(page), count: out.length, maps: slice });
  }
  app.get('/getMaps', list);
  app.get('/getMapsForList', list);

  // ---------- данные карты ----------
  app.get('/getMapData', (req, res) => {
    const m = maps.find(x => low(x.author) === low(req.query.author) &&
                             low(x.mapName) === low(req.query.mapName));
    res.json(m ? m.mapData : '');
  });

  // ---------- случайная карта режима (для Sandbox и игр) ----------
  app.get('/getRandomMap', (req, res) => {
    const t = req.query.mapType;
    // sandbox — карты всех режимов и всех авторов
    // остальные режимы — карты владельца плюс те, что владелец добавил
    // в игру кнопкой «Добавить в игру» в Maps Browser
    const pool = (!t || t === 'sandbox')
      ? maps.slice()
      : maps.filter(m => m.mapType === t && (isOwnerName(m.author) || m.inGame === true));
    if (!pool.length) return res.json(null);
    let m = pool[Math.floor(Math.random() * pool.length)];
    // не повторяем ту же карту подряд, если есть выбор
    if (pool.length > 1 && req.query.not) {
      let guard = 0;
      while (m.mapName === req.query.not && guard++ < 8)
        m = pool[Math.floor(Math.random() * pool.length)];
    }
    res.json({ mapName: m.mapName, author: m.author, mapType: m.mapType, mapData: m.mapData });
  });

  // ---------- оценка ----------
  app.post('/uploadVote', (req, res) => {
    const u = getUser(req);
    if (!u) return res.json({ status: 'error', message: 'Сначала войдите в аккаунт' });
    const m = maps.find(x => low(x.author) === low(req.body.author) &&
                             low(x.mapName) === low(req.body.mapName));
    if (!m) return res.json({ status: 'error', message: 'Карта не найдена' });
    const v = parseInt(req.body.vote) > 0 ? 1 : -1;
    m.votes = m.votes || {};
    m.votes[low(u.name)] = v;
    const t = retally(m);
    save();
    res.json({ status: 'success', rating: t.rating, likes: t.likes, dislikes: t.dislikes });
  });

  // ---------- удаление ----------
  function remove(author, mapName) {
    const i = maps.findIndex(x => low(x.author) === low(author) && low(x.mapName) === low(mapName));
    if (i === -1) return false;
    maps.splice(i, 1);
    save();
    return true;
  }
  app.post('/removeMap', (req, res) => {
    const u = getUser(req);
    if (!u) return res.json({ status: 'error', message: 'Сначала войдите в аккаунт' });
    res.json({ status: remove(u.name, req.body.mapName) ? 'success' : 'error' });
  });
  app.post('/map/disable', (req, res) => {
    const u = getUser(req);
    if (!u || low(u.name) !== low(req.body.author_name))
      return res.json({ status: 'error', message: 'Можно удалять только свои карты' });
    res.json({ status: remove(req.body.author_name, req.body.map_name) ? 'success' : 'error' });
  });

  // ---------- карты игрока (вкладка Maps в профиле) ----------
  app.get('/userMaps', (req, res) => {
    const mine = maps.filter(m => low(m.author) === low(req.query.name));
    res.json({ count: mine.length, maps: mine.map(m => {
      const t = tally(m);
      return { mapName: m.mapName, mapType: m.mapType, rating: t.rating,
               likes: t.likes, dislikes: t.dislikes, date: m.date, inGame: !!m.inGame };
    }) });
  });
}

// ---------- доступ для инструментов владельца ----------
function find(author, mapName) {
  return maps.find(x => low(x.author) === low(author) && low(x.mapName) === low(mapName));
}
function setBoost(author, mapName, likes, dislikes) {
  const m = find(author, mapName);
  if (!m) return null;
  if (likes !== null && likes !== undefined) m.boostLikes = Math.max(0, parseInt(likes) || 0);
  if (dislikes !== null && dislikes !== undefined) m.boostDislikes = Math.max(0, parseInt(dislikes) || 0);
  const t = retally(m);
  save();
  return t;
}
function setInGame(author, mapName, on) {
  const m = find(author, mapName);
  if (!m) return null;
  m.inGame = !!on;
  save();
  return { inGame: m.inGame, mapName: m.mapName, author: m.author, mapType: m.mapType };
}
function inGameList() {
  return maps.filter(m => m.inGame)
             .map(m => ({ mapName: m.mapName, author: m.author, mapType: m.mapType }));
}

module.exports = { register, MODES, OWNER, COIN_LIMIT, find, setBoost, setInGame, inGameList, tally };
