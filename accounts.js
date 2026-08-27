// ============ СИСТЕМА АККАУНТОВ AIBROFIST ============
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'users.json');

const OWNER = process.env.OWNER_NAME || 'AIBrofist';
// ссылка в задаче вела на профиль System — считаем оба ника владельцем,
// чтобы права не потерялись при переименовании аккаунта
const OWNER_ALIASES = String(process.env.OWNER_ALIASES || 'AIBrofist,System')
  .split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
if (OWNER_ALIASES.indexOf(OWNER.toLowerCase()) === -1) OWNER_ALIASES.push(OWNER.toLowerCase());

const isOwner = u => !!u && OWNER_ALIASES.indexOf(String(u.name).toLowerCase()) !== -1;

let db = { users: {}, sessions: {} };

function load() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) { console.log('users.json не прочитан, начинаю с нуля'); }
  if (!db.users) db.users = {};
  if (!db.sessions) db.sessions = {};
}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } catch (e) { console.log('не смог сохранить users.json:', e.message); }
  }, 300);
}
load();

const key = n => String(n || '').toLowerCase();

function hash(password, salt) {
  return crypto.scryptSync(String(password), salt, 32).toString('hex');
}

// логин: 2-20 символов, русские и английские буквы, цифры, - _ .
function checkName(name) {
  if (typeof name !== 'string') return 'Введите логин';
  name = name.trim();
  if (name.length < 2) return 'Логин должен быть не короче 2 символов';
  if (name.length > 20) return 'Логин должен быть не длиннее 20 символов';
  if (!/^[A-Za-zА-Яа-яЁё0-9._-]+$/.test(name))
    return 'В логине можно использовать русские и английские буквы, цифры, а также - _ .';
  if (!/^[A-Za-zА-Яа-яЁё0-9]/.test(name)) return 'Логин должен начинаться с буквы или цифры';
  return '';
}
function checkPassword(pw) {
  if (typeof pw !== 'string' || pw.length === 0) return 'Введите пароль';
  return '';
}

// один аккаунт на устройство: IP храним хешем, сам адрес не сохраняем
function ipKey(req) {
  const raw = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
           || (req.socket && req.socket.remoteAddress) || '';
  return raw ? crypto.createHash('sha256').update(raw).digest('hex').slice(0, 24) : '';
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function currentUser(req) {
  const sid = parseCookies(req).sid;
  if (!sid) return null;
  const name = db.sessions[sid];
  if (!name) return null;
  return db.users[key(name)] || null;
}
function newSession(res, name) {
  const sid = crypto.randomBytes(24).toString('hex');
  db.sessions[sid] = name;
  res.setHeader('Set-Cookie', `sid=${sid}; Path=/; Max-Age=31536000; SameSite=Lax`);
  save();
}

function publicUser(u) {
  return { name: u.name, avatar: u.avatar, lastSeen: u.lastSeen };
}
function paginate(list, page) {
  const per = 10;
  page = Math.max(1, parseInt(page) || 1);
  const total = Math.max(1, Math.ceil(list.length / per));
  if (page > total) page = total;
  return { slice: list.slice((page - 1) * per, page * per), label: page + '/' + total };
}

function register(app) {
  // ---------- регистрация / вход ----------
  app.post('/signUp', (req, res) => {
    const name = String(req.body.name || '').trim();
    const password = String(req.body.password || '');
    let err = checkName(name) || checkPassword(password);
    if (err) return res.json({ status: 'error', message: err });
    if (db.users[key(name)]) return res.json({ status: 'error', message: 'Такой логин уже занят' });

    const ip = ipKey(req);
    if (ip) {
      const owned = Object.values(db.users).some(u => u.ip === ip && isOwner(u));
      const taken = Object.values(db.users).find(u => u.ip === ip);
      if (taken && !owned)
        return res.json({ status: 'error', message: 'С этого устройства уже создан аккаунт «' + taken.name + '»' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    db.users[key(name)] = {
      name, salt, hash: hash(password, salt),
      joined: Date.now(), lastSeen: Date.now(), ip: ipKey(req),
      coins: 0, about: '', avatar: '0',
      items: [], skin: {}, lang: '',
      friends: [], incoming: [], outgoing: []
    };
    newSession(res, name);
    save();
    res.json({ status: 'success', message: 'Аккаунт создан' });
  });

  const doLogin = (req, res) => {
    const name = String(req.body.username || req.body.name || '').trim();
    const password = String(req.body.password || '');
    const u = db.users[key(name)];
    if (!u) return res.json({ status: 'error', message: 'Неверный логин или пароль' });
    if (hash(password, u.salt) !== u.hash)
      return res.json({ status: 'error', message: 'Неверный логин или пароль' });
    u.lastSeen = Date.now();
    newSession(res, u.name);
    save();
    res.json({ status: 'success', message: 'Вход выполнен' });
  };
  app.post('/login/password', doLogin);
  app.post('/signIn', doLogin);

  app.post('/logOut', (req, res) => {
    const sid = parseCookies(req).sid;
    if (sid) delete db.sessions[sid];
    res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0');
    save();
    res.json({ status: 'success' });
  });

  // ---------- состояние ----------
  app.get('/iSigned', (req, res) => {
    const u = currentUser(req);
    res.json({ data: u ? { guest: false, name: u.name, nameChange: false }
                       : { guest: true, name: '', nameChange: false } });
  });
  app.get('/amISigned', (req, res) => {
    const u = currentUser(req);
    res.json({ data: { guest: !u, name: u ? u.name : '' } });
  });
  app.get('/getMyName', (req, res) => {
    const u = currentUser(req);
    res.json(u ? u.name : '');
  });
  app.post('/setLastSeenDate', (req, res) => {
    const u = currentUser(req);
    if (u) { u.lastSeen = Date.now(); save(); }
    res.json({ status: 'success' });
  });

  // ---------- профиль ----------
  app.get('/getAvatar', (req, res) => {
    const u = db.users[key(req.query.name)];
    res.json({ avatar: u ? u.avatar : '0' });
  });
  app.get('/getJoinDate', (req, res) => {
    const u = db.users[key(req.query.name)];
    res.json(u ? u.joined : Date.now());
  });
  app.get('/getCoins', (req, res) => {
    const u = db.users[key(req.query.name)];
    res.json(u ? u.coins : 0);
  });
  app.get('/getAboutMe', (req, res) => {
    const u = db.users[key(req.query.name)];
    res.json(u ? (u.about || '') : '');
  });
  app.post('/setAboutMe', (req, res) => {
    const u = currentUser(req);
    if (u) { u.about = String(req.body.aboutMe || '').slice(0, 300); save(); }
    res.json({ status: 'success' });
  });
  app.get('/getMyBio', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ name: '', avatar: '0', chatColor: '#000000', whatBro: 'none' });
    res.json({
      name: u.name,
      avatar: u.avatar || '0',
      chatColor: u.chatColor || '#000000',
      whatBro: u.whatBro || 'none'
    });
  });

  // сохранение аватара и цвета чата
  app.post('/setMyBio', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', message: 'Войдите в аккаунт' });
    const avatar = String(req.body.avatar || '').trim();
    const chatColor = String(req.body.chatColor || '').trim();
    if (avatar) u.avatar = avatar.slice(0, 40);
    if (/^#[0-9a-fA-F]{6}$/.test(chatColor)) u.chatColor = chatColor;
    save();
    res.json({ status: 'success' });
  });
  app.get('/getMySettings', (req, res) => res.json({ data: {} }));
  app.get('/getMyOldMapsLink', (req, res) => res.json({ link: '' }));

  // ---------- поиск ----------
  app.get('/searchUser', (req, res) => {
    const q = key(req.query.name);
    if (!q) return res.json([]);
    res.json(Object.values(db.users)
      .filter(u => key(u.name).indexOf(q) !== -1)
      .slice(0, 20)
      .map(u => ({ name: u.name })));
  });

  // ---------- отношения ----------
  // "0" гость | "1" нет такого пользователя | "2" это я
  // {type:"0"} не друзья | {type:"1"} друзья | {type:"2", init} заявка
  function relation(req) {
    const me = currentUser(req);
    const target = db.users[key(req.query.name)];
    if (!target) return '1';
    if (!me) return '0';
    if (key(me.name) === key(target.name)) return '2';
    if (me.friends.some(n => key(n) === key(target.name))) return { type: '1' };
    if (me.outgoing.some(n => key(n) === key(target.name))) return { type: '2', init: me.name };
    if (me.incoming.some(n => key(n) === key(target.name))) return { type: '2', init: target.name };
    return { type: '0' };
  }
  app.get('/getRelation', (req, res) => res.json(relation(req)));
  app.get('/getMyRelation', (req, res) => res.json(relation(req)));
  app.get('/myRelations', (req, res) => res.json(relation(req)));

  const pull = (arr, n) => { const i = arr.findIndex(x => key(x) === key(n)); if (i > -1) arr.splice(i, 1); };
  const push = (arr, n) => { if (!arr.some(x => key(x) === key(n))) arr.push(n); };

  app.post('/friendRequest', (req, res) => {
    const me = currentUser(req);
    const other = db.users[key(req.body.name)];
    if (!me || !other || key(me.name) === key(other.name)) return res.json('1');
    if (me.friends.some(n => key(n) === key(other.name))) return res.json('1');
    push(me.outgoing, other.name);
    push(other.incoming, me.name);
    save();
    res.json('0');
  });
  app.post('/acceptFriendRequest', (req, res) => {
    const me = currentUser(req);
    const other = db.users[key(req.body.name)];
    if (!me || !other) return res.json('1');
    if (!me.incoming.some(n => key(n) === key(other.name))) return res.json('1');
    pull(me.incoming, other.name); pull(other.outgoing, me.name);
    push(me.friends, other.name); push(other.friends, me.name);
    save();
    res.json('0');
  });
  app.post('/cancelFriendRequest', (req, res) => {
    const me = currentUser(req);
    const other = db.users[key(req.body.name)];
    if (!me || !other) return res.json('1');
    pull(me.outgoing, other.name); pull(other.incoming, me.name);
    pull(me.incoming, other.name); pull(other.outgoing, me.name);
    save();
    res.json('0');
  });
  app.post('/unfriend', (req, res) => {
    const me = currentUser(req);
    const other = db.users[key(req.body.name)];
    if (!me || !other) return res.json('1');
    pull(me.friends, other.name); pull(other.friends, me.name);
    save();
    res.json('0');
  });

  app.get('/getFriendsList', (req, res) => {
    const owner = db.users[key(req.query.name)];
    const me = currentUser(req);
    const guest = !me || !owner || key(me.name) !== key(owner.name);
    if (!owner) return res.json({ page: '1/1', count: 0, guest: true, relation: [] });
    const type = req.query.type;
    let names = type === 'requests' ? owner.incoming
              : type === 'pending'  ? owner.outgoing
              : owner.friends;
    if (guest && type !== 'friends') names = [];
    const list = names.map(n => db.users[key(n)]).filter(Boolean).map(publicUser);
    const p = paginate(list, req.query.page);
    res.json({ page: p.label, count: list.length, guest, relation: p.slice });
  });

  // ---------- кто я (для клиентских инструментов владельца) ----------
  app.get('/whoAmI', (req, res) => {
    const u = currentUser(req);
    const owner = isOwner(u);
    const out = { guest: !u, name: u ? u.name : '', owner: owner, coins: u ? (u.coins || 0) : 0 };
    if (owner) out.ownerName = OWNER;   // посторонним ник владельца не раскрываем
    res.json(out);
  });

  // ---------- заглушки вендорных страниц ----------
  app.get('/getSkins', (req, res) => res.json({ skins: [], page: '1/1', count: 0 }));
  app.get('/getSkinsForList', (req, res) => res.json({ skins: [], page: '1/1', count: 0 }));
  app.get('/getStoreCosmetics', (req, res) => {
    // старый магазин вендора: отдаём наш каталог в его формате
    const skins = require('./skins.js');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const per = 12;
    const all = skins.CATALOG.filter(i => i.price > 0);
    res.json({ page: page, cosmetics: all.slice((page - 1) * per, page * per)
      .map(i => ({ name: i.name, id: i.id, price: i.price, slot: i.slot })) });
  });
  app.get('/getMyAssets', (req, res) => {
    const skins = require('./skins.js');
    const u = currentUser(req);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const per = 12;
    const mine = skins.ownedList(u);
    res.json({ page: page, skins: mine.slice((page - 1) * per, page * per)
      .map(id => ({ assetName: id, name: (skins.BY_ID[id] || {}).name || id })) });
  });
  app.post('/buyStoreItem', (req, res) => {
    // вендорная кнопка покупки — переиспользуем нашу логику
    const u = currentUser(req);
    if (!u) return res.json({ code: 0 });
    const skins = require('./skins.js');
    const item = skins.BY_ID[String(req.body.id || '')];
    if (!item) return res.json({ code: 1 });
    u.items = Array.isArray(u.items) ? u.items : [];
    if (item.price === 0 || u.items.indexOf(item.id) !== -1) return res.json({ code: 3 });
    if ((u.coins || 0) < item.price) return res.json({ code: 2 });
    u.coins = (u.coins || 0) - item.price;
    u.items.push(item.id);
    save();
    res.json({ code: 4, coins: u.coins });
  });
  app.get('/getAllSupporters', (req, res) => res.json([]));
  app.get('/getGamingServersInfo', (req, res) => res.json([]));
  app.post('/reportUser', (req, res) => res.json({ code: 2 }));
  app.get('/captcha/getCaptcha', (req, res) => res.json({}));
}

module.exports = { register, currentUser, isOwner, OWNER, OWNER_ALIASES, getDb: () => db, save, newSession, hash, key, checkName };
