// ============ СКИНЫ ИГРОКОВ: публикация, оценки, витрина Avatar ============
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'userskins.json');

const DAILY_LIMIT = 5;      // сколько скинов можно выложить за сутки
const REWARD = 10;          // монет за каждый опубликованный скин

let list = [];

function load() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(FILE)) list = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) { console.log('userskins.json не прочитан'); }
  if (!Array.isArray(list)) list = [];
}
let timer = null;
function save() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
    } catch (e) { console.log('не смог сохранить userskins.json:', e.message); }
  }, 300);
}
load();

const low = s => String(s || '').toLowerCase();

function tally(s) {
  const votes = Object.values(s.votes || {});
  const likes = votes.filter(v => v > 0).length + (s.boostLikes || 0);
  const dislikes = votes.filter(v => v < 0).length + (s.boostDislikes || 0);
  return { likes, dislikes, rating: likes - dislikes };
}
function retally(s) { const t = tally(s); s.rating = t.rating; return t; }

function todayCount(author) {
  const from = Date.now() - 864e5;
  return list.filter(s => low(s.author) === low(author) && (s.created || s.date) >= from).length;
}

function pub(s, me) {
  const t = tally(s);
  return {
    id: s.id, skinName: s.skinName, author: s.author, skin: s.skin,
    date: s.date, likes: t.likes, dislikes: t.dislikes, rating: t.rating,
    inAvatar: !!s.inAvatar, price: s.price || 0,
    myVote: me ? (s.votes || {})[low(me)] || 0 : 0
  };
}

// отрисовка скина на сервере — нужна, чтобы отдавать картинку по ссылке
let RENDER = null;
function renderer() {
  if (RENDER) return RENDER;
  try {
    const host = {};
    const code = fs.readFileSync(path.join(__dirname, 'skinRender.js'), 'utf8');
    new Function('window', code)(host);
    RENDER = host.BFSkin;
  } catch (e) { RENDER = null; }
  return RENDER;
}

function register(app, acc, skinsApi) {
  const { currentUser, isOwner, save: saveUsers, getDb, key } = acc;
  const ownerOnly = (req, res) => {
    const u = currentUser(req);
    if (!isOwner(u)) { res.json({ status: 'error', message: 'Недоступно' }); return null; }
    return u;
  };

  // ---------- публикация ----------
  app.post('/skins/publish', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', message: 'Сначала войдите в аккаунт' });

    const skinName = String(req.body.skinName || '').trim();
    if (skinName.length < 2 || skinName.length > 30)
      return res.json({ status: 'error', message: 'Название скина: от 2 до 30 символов' });

    let raw = null;
    try { raw = JSON.parse(String(req.body.skin || 'null')); } catch (e) {}
    const skin = skinsApi.normalize(raw || skinsApi.skinOf(u));
    const sig = skinsApi.signature(skin);

    if (list.some(s => low(s.skinName) === low(skinName) && low(s.author) === low(u.name)))
      return res.json({ status: 'error', message: 'У вас уже есть скин с таким названием' });

    // каждый скин должен отличаться от уже выложенных
    const twin = list.find(s => skinsApi.signature(s.skin) === sig);
    if (twin)
      return res.json({
        status: 'error',
        message: 'Такой набор уже выложен — «' + twin.skinName + '» от ' + twin.author +
                 '. Поменяйте хотя бы одну деталь.'
      });

    const used = todayCount(u.name);
    if (used >= DAILY_LIMIT) {
      const oldest = list
        .filter(s => low(s.author) === low(u.name) && (s.created || s.date) >= Date.now() - 864e5)
        .sort((a, b) => (a.created || a.date) - (b.created || b.date))[0];
      const waitMs = oldest ? ((oldest.created || oldest.date) + 864e5 - Date.now()) : 864e5;
      const mins = Math.ceil(waitMs / 60000);
      const h = Math.floor(mins / 60), mn = mins % 60;
      return res.json({
        status: 'error',
        message: 'Лимит ' + DAILY_LIMIT + ' скинов в сутки исчерпан. Следующий можно выложить через ' +
                 (h > 0 ? h + ' ч ' + mn + ' мин' : mn + ' мин') + '.'
      });
    }

    const item = {
      id: 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      skinName, author: u.name, skin,
      date: Date.now(), created: Date.now(),
      votes: {}, boostLikes: 0, boostDislikes: 0, rating: 0,
      inAvatar: false, price: 0
    };
    list.push(item);
    save();

    u.coins = (u.coins || 0) + REWARD;
    saveUsers();

    res.json({
      status: 'success',
      reward: REWARD,
      coins: u.coins,
      left: Math.max(0, DAILY_LIMIT - todayCount(u.name)),
      limit: DAILY_LIMIT,
      message: 'Скин опубликован. +' + REWARD + ' монет  ·  сегодня осталось: ' +
               Math.max(0, DAILY_LIMIT - todayCount(u.name)) + ' из ' + DAILY_LIMIT
    });
  });

  app.get('/skins/limit', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ limit: DAILY_LIMIT, left: DAILY_LIMIT, reward: REWARD, guest: true });
    res.json({
      limit: DAILY_LIMIT, reward: REWARD, guest: false,
      left: Math.max(0, DAILY_LIMIT - todayCount(u.name))
    });
  });

  // ---------- список для Skins Browser ----------
  app.get('/skins/list', (req, res) => {
    const me = currentUser(req);
    const author = low(req.query.author || '');
    const nameQ = low(req.query.skinName || '');
    const sortBy = String(req.query.sortBy || 'date');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const per = 12;

    let out = list.slice();
    if (author) out = out.filter(s => low(s.author).indexOf(author) !== -1);
    if (nameQ) out = out.filter(s => low(s.skinName).indexOf(nameQ) !== -1);
    out.sort((a, b) => sortBy === 'rating'
      ? (tally(b).rating - tally(a).rating) || (b.date - a.date)
      : b.date - a.date);

    const total = Math.max(1, Math.ceil(out.length / per));
    res.json({
      page: Math.min(page, total), pages: total, count: out.length,
      owner: isOwner(me),
      skins: out.slice((Math.min(page, total) - 1) * per, Math.min(page, total) * per)
                .map(s => pub(s, me && me.name))
    });
  });

  // ---------- оценка ----------
  app.post('/skins/vote', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', message: 'Сначала войдите в аккаунт' });
    const s = list.find(x => x.id === String(req.body.id || ''));
    if (!s) return res.json({ status: 'error', message: 'Скин не найден' });
    if (low(s.author) === low(u.name))
      return res.json({ status: 'error', message: 'Свой скин оценивать нельзя' });

    const v = parseInt(req.body.vote) > 0 ? 1 : -1;
    s.votes = s.votes || {};
    if (s.votes[low(u.name)] === v) delete s.votes[low(u.name)];   // повторный клик снимает оценку
    else s.votes[low(u.name)] = v;
    const t = retally(s);
    save();
    res.json({ status: 'success', likes: t.likes, dislikes: t.dislikes, rating: t.rating,
               myVote: s.votes[low(u.name)] || 0 });
  });

  // ---------- удаление ----------
  app.post('/skins/remove', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', message: 'Сначала войдите в аккаунт' });
    const i = list.findIndex(x => x.id === String(req.body.id || ''));
    if (i === -1) return res.json({ status: 'error', message: 'Скин не найден' });
    if (low(list[i].author) !== low(u.name) && !isOwner(u))
      return res.json({ status: 'error', message: 'Можно удалять только свои скины' });
    list.splice(i, 1);
    save();
    res.json({ status: 'success' });
  });

  // ---------- примерить чужой скин ----------
  app.post('/skins/wear', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', message: 'Сначала войдите в аккаунт' });
    const s = list.find(x => x.id === String(req.body.id || ''));
    if (!s) return res.json({ status: 'error', message: 'Скин не найден' });

    // скины из витрины Avatar с ценой нужно сначала купить
    if (s.inAvatar && (s.price || 0) > 0 && low(s.author) !== low(u.name)) {
      u.boughtSkins = Array.isArray(u.boughtSkins) ? u.boughtSkins : [];
      if (u.boughtSkins.indexOf(s.id) === -1)
        return res.json({ status: 'error', code: 'buy', price: s.price,
                          message: 'Сначала купите этот скин за ' + s.price + ' монет' });
    }

    u.skin = skinsApi.normalize(s.skin);
    u.wearing = s.id;
    saveUsers();
    res.json({ status: 'success', skin: u.skin, author: s.author, skinName: s.skinName });
  });

  // ---------- витрина Avatar ----------
  app.get('/skins/avatar', (req, res) => {
    const u = currentUser(req);
    const bought = new Set((u && u.boughtSkins) || []);
    res.json({
      owner: isOwner(u),
      coins: u ? (u.coins || 0) : 0,
      wearing: (u && u.wearing) || '',
      skins: list.filter(s => s.inAvatar)
        .sort((a, b) => (a.price || 0) - (b.price || 0) || b.date - a.date)
        .map(s => {
          const o = pub(s, u && u.name);
          o.owned = bought.has(s.id) || (u && low(s.author) === low(u.name));
          return o;
        })
    });
  });

  app.post('/skins/buy', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', message: 'Сначала войдите в аккаунт' });
    const s = list.find(x => x.id === String(req.body.id || ''));
    if (!s || !s.inAvatar) return res.json({ status: 'error', message: 'Скин не продаётся' });

    u.boughtSkins = Array.isArray(u.boughtSkins) ? u.boughtSkins : [];
    if (u.boughtSkins.indexOf(s.id) !== -1 || low(s.author) === low(u.name))
      return res.json({ status: 'error', message: 'Этот скин уже ваш' });

    const price = s.price || 0;
    if ((u.coins || 0) < price)
      return res.json({ status: 'error', message: 'Не хватает ' + (price - (u.coins || 0)) + ' монет' });

    u.coins = (u.coins || 0) - price;
    u.boughtSkins.push(s.id);
    saveUsers();
    res.json({ status: 'success', coins: u.coins });
  });

  // ---------- владелец: выложить скин в Avatar и назначить цену ----------
  app.post('/owner/skinToAvatar', (req, res) => {
    if (!ownerOnly(req, res)) return;
    const s = list.find(x => x.id === String(req.body.id || ''));
    if (!s) return res.json({ status: 'error', message: 'Скин не найден' });

    const on = String(req.body.on || 'true') === 'true';
    s.inAvatar = on;
    if (on) s.price = Math.max(0, parseInt(req.body.price) || 0);
    save();
    res.json({
      status: 'success', inAvatar: s.inAvatar, price: s.price || 0,
      message: on
        ? '«' + s.skinName + '» в Avatar за ' + (s.price || 0) + ' монет'
        : '«' + s.skinName + '» убран из Avatar'
    });
  });

  // ---------- владелец: накрутка оценок скина ----------
  app.post('/owner/skinVotes', (req, res) => {
    if (!ownerOnly(req, res)) return;
    const s = list.find(x => x.id === String(req.body.id || ''));
    if (!s) return res.json({ status: 'error', message: 'Скин не найден' });
    if (req.body.likes !== undefined && req.body.likes !== '')
      s.boostLikes = Math.max(0, parseInt(req.body.likes) || 0);
    if (req.body.dislikes !== undefined && req.body.dislikes !== '')
      s.boostDislikes = Math.max(0, parseInt(req.body.dislikes) || 0);
    const t = retally(s);
    save();
    res.json({ status: 'success', likes: t.likes, dislikes: t.dislikes, rating: t.rating });
  });

  // ---------- вендорные страницы ждут именно этот формат ----------
  const vendorList = (req, res) => {
    const me = currentUser(req);
    const author = low(req.query.author || '');
    const nameQ = low(req.query.skinName || '');
    const sortBy = String(req.query.sortBy || 'date');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const per = 12;

    let out = list.slice();
    if (author) out = out.filter(s => low(s.author).indexOf(author) !== -1);
    if (nameQ) out = out.filter(s => low(s.skinName).indexOf(nameQ) !== -1);
    out.sort((a, b) => sortBy === 'rating'
      ? (tally(b).rating - tally(a).rating) || (b.date - a.date)
      : b.date - a.date);

    const pages = Math.max(1, Math.ceil(out.length / per));
    const p = Math.min(page, pages);
    res.json({
      page: p + '/' + pages,
      count: out.length,
      skins: out.slice((p - 1) * per, p * per).map(s => ({
        skinName: s.skinName, author: s.author,
        rating: tally(s).rating, skinId: s.id, date: s.date
      }))
    });
  };
  app.get('/getSkins', vendorList);
  app.get('/getSkinsForList', vendorList);

  // картинка скина по ссылке из профиля
  app.get('/usersSkins/:id.png', (req, res) => {
    const s = list.find(x => x.id === String(req.params.id || ''));
    const R = renderer();
    if (!s || !R) return res.status(404).send('not found');
    const byId = {};
    skinsApi.CATALOG.forEach(i => { byId[i.id] = i; });
    res.set('Content-Type', 'image/svg+xml; charset=utf-8');
    res.set('Cache-Control', 'no-cache');
    res.send(R.svg(s.skin, byId, { height: 420 }));
  });

  // вендорные кнопки удаления и оценки
  app.post('/removeSkin', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ code: 0 });
    const i = list.findIndex(x => low(x.skinName) === low(req.body.skinName) &&
                                  low(x.author) === low(u.name));
    if (i === -1) return res.json({ code: 1 });
    list.splice(i, 1); save();
    res.json({ code: 2 });
  });

  app.post('/uploadSkinVote', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ code: 1 });
    const s = list.find(x => low(x.skinName) === low(req.body.skinName) &&
                             low(x.author) === low(req.body.author));
    if (!s) return res.json({ code: 2, val: 'Скин не найден' });
    if (low(s.author) === low(u.name)) return res.json({ code: 2, val: 'Свой скин оценивать нельзя' });
    const v = parseInt(req.body.vote) > 0 ? 1 : -1;
    s.votes = s.votes || {};
    if (s.votes[low(u.name)] === v) delete s.votes[low(u.name)];
    else s.votes[low(u.name)] = v;
    retally(s); save();
    res.json({ code: 0 });
  });

  // ---------- скины игрока (вкладка Skins в профиле) ----------
  app.get('/userSkins', (req, res) => {
    const me = currentUser(req);
    const mine = list.filter(s => low(s.author) === low(req.query.name));
    res.json({ count: mine.length, skins: mine.map(s => pub(s, me && me.name)) });
  });

  // автор надетого скина — для страницы Avatar и профиля
  app.get('/skins/wornBy', (req, res) => {
    const db = getDb();
    const u = db.users[key(req.query.name)];
    if (!u || !u.wearing) return res.json({ author: '', skinName: '' });
    const s = list.find(x => x.id === u.wearing);
    res.json(s ? { author: s.author, skinName: s.skinName, id: s.id } : { author: '', skinName: '' });
  });
}

module.exports = { register, DAILY_LIMIT, REWARD };
