// ====== Новости, монеты, таблица лидеров и инструменты владельца ======
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

let logs = [];

function load() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(LOGS_FILE)) logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
  } catch (e) { console.log('logs.json не прочитан'); }
  if (!Array.isArray(logs)) logs = [];
}
let t = null;
function save() {
  clearTimeout(t);
  t = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
    } catch (e) { console.log('не смог сохранить logs.json:', e.message); }
  }, 300);
}
load();

function register(app, acc) {
  const { currentUser, isOwner, getDb, save: saveUsers, newSession, hash, key, checkName } = acc;

  const ownerOnly = (req, res) => {
    const u = currentUser(req);
    if (!isOwner(u)) { res.json({ status: 'error', message: 'Недоступно' }); return null; }
    return u;
  };

  // ---------- новости ----------
  app.get('/getLogs', (req, res) => {
    const u = currentUser(req);
    res.json({ owner: isOwner(u), logs: logs.slice().sort((a, b) => b.date - a.date).slice(0, 100) });
  });

  app.post('/addLog', (req, res) => {
    if (!ownerOnly(req, res)) return;
    const title = String(req.body.title || '').trim().slice(0, 120);
    const text = String(req.body.text || '').trim().slice(0, 4000);
    if (!title && !text) return res.json({ status: 'error', message: 'Пустая запись' });
    logs.push({ id: Date.now(), title, text, date: Date.now() });
    save();
    res.json({ status: 'success' });
  });

  app.post('/deleteLog', (req, res) => {
    if (!ownerOnly(req, res)) return;
    const id = parseInt(req.body.id);
    const i = logs.findIndex(l => l.id === id);
    if (i > -1) { logs.splice(i, 1); save(); }
    res.json({ status: 'success' });
  });

  // ---------- монеты ----------
  app.post('/addCoins', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'guest', coins: 0 });
    let n = parseInt(req.body.coins) || 0;
    if (n <= 0) return res.json({ status: 'success', coins: u.coins || 0 });
    if (n > 50) n = 50;                       // защита от накрутки за один заход
    u.coins = (u.coins || 0) + n;
    saveUsers();
    res.json({ status: 'success', coins: u.coins });
  });

  // ---------- таблица лидеров ----------
  app.get('/getLeaderboard', (req, res) => {
    const db = getDb();
    const top = Object.values(db.users)
      .map(u => ({ name: u.name, coins: u.coins || 0 }))
      .sort((a, b) => b.coins - a.coins || a.name.localeCompare(b.name))
      .slice(0, 10);
    const me = currentUser(req);
    let myPlace = 0;
    if (me) {
      const all = Object.values(db.users).sort((a, b) => (b.coins || 0) - (a.coins || 0));
      myPlace = all.findIndex(u => key(u.name) === key(me.name)) + 1;
    }
    res.json({ top, me: me ? { name: me.name, coins: me.coins || 0, place: myPlace } : null });
  });

  // ---------- смена ника: только владелец ----------
  app.post('/renameUser', (req, res) => {
    if (!ownerOnly(req, res)) return;
    const db = getDb();
    const from = String(req.body.from || '').trim();
    const to = String(req.body.to || '').trim();
    const err = checkName(to);
    if (err) return res.json({ status: 'error', message: err });
    const u = db.users[key(from)];
    if (!u) return res.json({ status: 'error', message: 'Игрок «' + from + '» не найден' });
    if (db.users[key(to)] && key(to) !== key(from))
      return res.json({ status: 'error', message: 'Логин «' + to + '» уже занят' });

    const old = u.name;
    u.name = to;
    if (key(to) !== key(from)) {
      delete db.users[key(from)];
      db.users[key(to)] = u;
    }
    // чиним связи в друзьях
    const fix = list => (list || []).map(n => (key(n) === key(old) ? to : n));
    Object.values(db.users).forEach(x => {
      x.friends = fix(x.friends); x.incoming = fix(x.incoming); x.outgoing = fix(x.outgoing);
    });
    Object.keys(db.sessions).forEach(sid => {
      if (key(db.sessions[sid]) === key(old)) db.sessions[sid] = to;
    });
    saveUsers();
    res.json({ status: 'success', message: '«' + old + '» теперь «' + to + '»' });
  });

  // ---------- связанные аккаунты владельца ----------
  app.get('/owner/accounts', (req, res) => {
    const u = currentUser(req);
    if (!isOwner(u)) return res.json({ status: 'error' });
    const db = getDb();
    const linked = (u.linked || []).map(n => {
      const x = db.users[key(n)];
      return x ? { name: x.name, coins: x.coins || 0 } : null;
    }).filter(Boolean);
    res.json({ status: 'success', linked });
  });

  app.post('/owner/link', (req, res) => {
    const u = ownerOnly(req, res); if (!u) return;
    const db = getDb();
    const name = String(req.body.name || '').trim();
    const pass = String(req.body.password || '');
    const target = db.users[key(name)];
    if (!target) return res.json({ status: 'error', message: 'Аккаунт не найден' });
    if (hash(pass, target.salt) !== target.hash)
      return res.json({ status: 'error', message: 'Неверный пароль от этого аккаунта' });
    u.linked = u.linked || [];
    if (!u.linked.some(n => key(n) === key(target.name))) u.linked.push(target.name);
    saveUsers();
    res.json({ status: 'success', message: '«' + target.name + '» привязан' });
  });

  app.post('/owner/unlink', (req, res) => {
    const u = ownerOnly(req, res); if (!u) return;
    u.linked = (u.linked || []).filter(n => key(n) !== key(String(req.body.name || '')));
    saveUsers();
    res.json({ status: 'success' });
  });

  app.post('/owner/switch', (req, res) => {
    const u = ownerOnly(req, res); if (!u) return;
    const db = getDb();
    const name = String(req.body.name || '').trim();
    if (!(u.linked || []).some(n => key(n) === key(name)))
      return res.json({ status: 'error', message: 'Этот аккаунт не привязан' });
    const target = db.users[key(name)];
    if (!target) return res.json({ status: 'error', message: 'Аккаунт не найден' });
    newSession(res, target.name);
    res.json({ status: 'success', message: 'Вошли как ' + target.name });
  });
}

module.exports = { register };
