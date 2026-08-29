// ============ СКИНЫ: каталог деталей и экипировка ============
// Всё бесплатно: цена нужна только для скинов, которые владелец
// вручную выкладывает в Avatar (см. userSkins.js).

// Цвет персонажа задаёт игра (в прятках он показывает роль),
// поэтому в редакторе только аксессуары.
const SLOTS = ['head', 'face', 'body', 'back'];

const CATALOG = [
  // ---------- голова ----------
  { id: 'h_none',    slot: 'head', price: 0, name: 'Ничего' },
  { id: 'h_cap',     slot: 'head', price: 0, name: 'Кепка',       v: '#e04141' },
  { id: 'h_beanie',  slot: 'head', price: 0, name: 'Шапка',       v: '#8b5cf6' },
  { id: 'h_bandana', slot: 'head', price: 0, name: 'Бандана',     v: '#f08a24' },
  { id: 'h_helmet',  slot: 'head', price: 0, name: 'Шлем',        v: '#5b6673' },
  { id: 'h_cowboy',  slot: 'head', price: 0, name: 'Шляпа',       v: '#8b5a2b' },
  { id: 'h_tophat',  slot: 'head', price: 0, name: 'Цилиндр',     v: '#1f2937' },
  { id: 'h_horns',   slot: 'head', price: 0, name: 'Рога',        v: '#c2410c' },
  { id: 'h_halo',    slot: 'head', price: 0, name: 'Нимб',        v: '#ffd83d' },
  { id: 'h_crown',   slot: 'head', price: 0, name: 'Корона',      v: '#d4a017' },
  { id: 'h_ears',    slot: 'head', price: 0, name: 'Ушки',        v: '#f472b6' },
  { id: 'h_antenna', slot: 'head', price: 0, name: 'Антенна',     v: '#06b6d4' },
  { id: 'h_hair',    slot: 'head', price: 0, name: 'Причёска',    v: '#4b2e1e' },

  // ---------- лицо ----------
  { id: 'f_none',     slot: 'face', price: 0, name: 'Ничего' },
  { id: 'f_glasses',  slot: 'face', price: 0, name: 'Очки',       v: '#374151' },
  { id: 'f_shades',   slot: 'face', price: 0, name: 'Тёмные очки',v: '#111827' },
  { id: 'f_visor',    slot: 'face', price: 0, name: 'Визор',      v: '#06b6d4' },
  { id: 'f_mask',     slot: 'face', price: 0, name: 'Маска',      v: '#22a45d' },
  { id: 'f_eyepatch', slot: 'face', price: 0, name: 'Повязка',    v: '#111827' },
  { id: 'f_scarf',    slot: 'face', price: 0, name: 'Шарф',       v: '#b91c1c' },
  { id: 'f_snorkel',  slot: 'face', price: 0, name: 'Маска для ныряния', v: '#f59e0b' },

  // ---------- тело ----------
  { id: 'b_none',    slot: 'body', price: 0, name: 'Ничего' },
  { id: 'b_tie',     slot: 'body', price: 0, name: 'Галстук',     v: '#b91c1c' },
  { id: 'b_belt',    slot: 'body', price: 0, name: 'Ремень',      v: '#3f3f46' },
  { id: 'b_stripes', slot: 'body', price: 0, name: 'Полоски',     v: '#e5e7eb' },
  { id: 'b_vest',    slot: 'body', price: 0, name: 'Жилет',       v: '#f59e0b' },
  { id: 'b_number',  slot: 'body', price: 0, name: 'Номер',       v: '#2563eb' },
  { id: 'b_hoodie',  slot: 'body', price: 0, name: 'Худи',        v: '#374151' },
  { id: 'b_armor',   slot: 'body', price: 0, name: 'Броня',       v: '#94a3b8' },
  { id: 'b_suit',    slot: 'body', price: 0, name: 'Костюм',      v: '#1f2937' },
  { id: 'b_overall', slot: 'body', price: 0, name: 'Комбинезон',  v: '#3b5bdb' },

  // ---------- за спиной ----------
  { id: 'k_none',    slot: 'back', price: 0, name: 'Ничего' },
  { id: 'k_cape',    slot: 'back', price: 0, name: 'Плащ',        v: '#b91c1c' },
  { id: 'k_wings',   slot: 'back', price: 0, name: 'Крылья',      v: '#f8fafc' },
  { id: 'k_jetpack', slot: 'back', price: 0, name: 'Джетпак',     v: '#5b6673' },
  { id: 'k_bag',     slot: 'back', price: 0, name: 'Рюкзак',      v: '#22a45d' },
  { id: 'k_tail',    slot: 'back', price: 0, name: 'Хвост',       v: '#f97316' },
  { id: 'k_shell',   slot: 'back', price: 0, name: 'Панцирь',     v: '#16a34a' }
];

const BY_ID = {};
CATALOG.forEach(i => { BY_ID[i.id] = i; });

const DEFAULT_SKIN = { head: 'h_none', face: 'f_none', body: 'b_none', back: 'k_none' };

// всё бесплатное, поэтому доступно всем без покупки
function ownedList() { return CATALOG.map(i => i.id); }

function normalize(raw) {
  const s = Object.assign({}, DEFAULT_SKIN, raw || {});
  SLOTS.forEach(sl => {
    if (!BY_ID[s[sl]] || BY_ID[s[sl]].slot !== sl) s[sl] = DEFAULT_SKIN[sl];
  });
  // лишние слоты из старых версий выкидываем
  const out = {};
  SLOTS.forEach(sl => { out[sl] = s[sl]; });
  return out;
}

function skinOf(u) { return normalize(u && u.skin); }

// подпись комплекта — по ней ловим повторы при публикации
function signature(skin) {
  const s = normalize(skin);
  return SLOTS.map(sl => s[sl]).join('|');
}

function register(app, acc) {
  const { currentUser, getDb, save, key } = acc;

  app.get('/skin/catalog', (req, res) => {
    const u = currentUser(req);
    res.json({
      slots: SLOTS,
      items: CATALOG,
      owned: ownedList(),
      skin: skinOf(u),
      coins: u ? (u.coins || 0) : 0,
      guest: !u,
      free: true
    });
  });

  app.get('/skin/of', (req, res) => {
    const db = getDb();
    const u = db.users[key(req.query.name)];
    res.json({ skin: skinOf(u), name: u ? u.name : '' });
  });

  // скины сразу нескольких игроков — для списков друзей и таблиц
  app.get('/skins/many', (req, res) => {
    const db = getDb();
    const names = String(req.query.names || '')
      .split(',').map(n => n.trim()).filter(Boolean).slice(0, 60);
    const out = {};
    names.forEach(n => {
      const u = db.users[key(n)];
      if (u) out[n] = skinOf(u);
    });
    res.json({ skins: out });
  });

  app.post('/skin/equip', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', code: 'guest' });
    const item = BY_ID[String(req.body.id || '')];
    const slot = String(req.body.slot || '');
    if (!item || item.slot !== slot) return res.json({ status: 'error', code: 'noitem' });

    u.skin = skinOf(u);
    u.skin[slot] = item.id;
    u.wearing = '';                 // сняли готовый скин из Avatar
    save();
    res.json({ status: 'success', skin: u.skin });
  });

  app.post('/skin/save', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', code: 'guest' });
    let want = {};
    try { want = JSON.parse(String(req.body.skin || '{}')); } catch (e) {}
    u.skin = normalize(want);
    u.wearing = '';
    save();
    res.json({ status: 'success', skin: u.skin });
  });
}

module.exports = {
  register, CATALOG, SLOTS, DEFAULT_SKIN, BY_ID,
  skinOf, ownedList, normalize, signature
};
