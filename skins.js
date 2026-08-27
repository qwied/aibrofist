// ============ СКИНЫ: каталог, покупка за монеты, экипировка ============
// Каталог общий для сервера и клиента: клиент забирает его через /skin/catalog,
// поэтому цены нельзя подделать — покупку всегда считает сервер.

const SLOTS = ['color', 'head', 'face', 'body', 'hands', 'feet', 'back'];

// id должен быть уникальным на весь каталог
const CATALOG = [
  // ---------- цвет тела ----------
  { id: 'c_black',   slot: 'color', price: 0,   name: 'Классика',     v: '#191919' },
  { id: 'c_blue',    slot: 'color', price: 0,   name: 'Синий',        v: '#2196F3' },
  { id: 'c_green',   slot: 'color', price: 0,   name: 'Зелёный',      v: '#22a45d' },
  { id: 'c_red',     slot: 'color', price: 40,  name: 'Красный',      v: '#e04141' },
  { id: 'c_orange',  slot: 'color', price: 40,  name: 'Оранжевый',    v: '#f08a24' },
  { id: 'c_purple',  slot: 'color', price: 60,  name: 'Фиолетовый',   v: '#8b5cf6' },
  { id: 'c_pink',    slot: 'color', price: 60,  name: 'Розовый',      v: '#ec4899' },
  { id: 'c_cyan',    slot: 'color', price: 80,  name: 'Бирюзовый',    v: '#06b6d4' },
  { id: 'c_gold',    slot: 'color', price: 250, name: 'Золото',       v: '#d4a017' },
  { id: 'c_silver',  slot: 'color', price: 200, name: 'Серебро',      v: '#9aa3ad' },
  { id: 'c_neon',    slot: 'color', price: 300, name: 'Неон',         v: '#39ff5e' },
  { id: 'c_ice',     slot: 'color', price: 220, name: 'Лёд',          v: '#7dd3fc' },

  // ---------- голова ----------
  { id: 'h_none',    slot: 'head', price: 0,   name: 'Без головного убора' },
  { id: 'h_cap',     slot: 'head', price: 40,  name: 'Кепка',        v: '#e04141' },
  { id: 'h_beanie',  slot: 'head', price: 50,  name: 'Шапка',        v: '#8b5cf6' },
  { id: 'h_bandana', slot: 'head', price: 70,  name: 'Бандана',      v: '#f08a24' },
  { id: 'h_helmet',  slot: 'head', price: 120, name: 'Шлем',         v: '#5b6673' },
  { id: 'h_cowboy',  slot: 'head', price: 150, name: 'Ковбойская шляпа', v: '#8b5a2b' },
  { id: 'h_tophat',  slot: 'head', price: 180, name: 'Цилиндр',      v: '#111827' },
  { id: 'h_horns',   slot: 'head', price: 220, name: 'Рога',         v: '#c2410c' },
  { id: 'h_halo',    slot: 'head', price: 260, name: 'Нимб',         v: '#ffd83d' },
  { id: 'h_crown',   slot: 'head', price: 400, name: 'Корона',       v: '#d4a017' },

  // ---------- лицо ----------
  { id: 'f_none',    slot: 'face', price: 0,   name: 'Без аксессуара' },
  { id: 'f_glasses', slot: 'face', price: 60,  name: 'Очки',         v: '#374151' },
  { id: 'f_shades',  slot: 'face', price: 90,  name: 'Тёмные очки',  v: '#111827' },
  { id: 'f_eyepatch',slot: 'face', price: 100, name: 'Повязка на глаз', v: '#111827' },
  { id: 'f_mask',    slot: 'face', price: 110, name: 'Маска',        v: '#22a45d' },
  { id: 'f_monocle', slot: 'face', price: 140, name: 'Монокль',      v: '#d4a017' },
  { id: 'f_visor',   slot: 'face', price: 190, name: 'Визор',        v: '#06b6d4' },

  // ---------- тело ----------
  { id: 'b_none',    slot: 'body', price: 0,   name: 'Без одежды' },
  { id: 'b_tshirt',  slot: 'body', price: 30,  name: 'Футболка',     v: '#2196F3' },
  { id: 'b_stripes', slot: 'body', price: 60,  name: 'Тельняшка',    v: '#e5e7eb' },
  { id: 'b_hoodie',  slot: 'body', price: 80,  name: 'Худи',         v: '#374151' },
  { id: 'b_overall', slot: 'body', price: 90,  name: 'Комбинезон',   v: '#3b5bdb' },
  { id: 'b_jacket',  slot: 'body', price: 140, name: 'Куртка',       v: '#7c2d12' },
  { id: 'b_suit',    slot: 'body', price: 200, name: 'Костюм',       v: '#111827' },
  { id: 'b_armor',   slot: 'body', price: 300, name: 'Броня',        v: '#94a3b8' },

  // ---------- руки ----------
  { id: 'a_none',    slot: 'hands', price: 0,   name: 'Без перчаток' },
  { id: 'a_gloves',  slot: 'hands', price: 50,  name: 'Перчатки',    v: '#111827' },
  { id: 'a_boxing',  slot: 'hands', price: 120, name: 'Боксёрские',  v: '#e04141' },
  { id: 'a_gaunt',   slot: 'hands', price: 200, name: 'Латные',      v: '#94a3b8' },

  // ---------- ноги ----------
  { id: 'l_none',    slot: 'feet', price: 0,   name: 'Босиком' },
  { id: 'l_sneak',   slot: 'feet', price: 40,  name: 'Кроссовки',    v: '#e5e7eb' },
  { id: 'l_boots',   slot: 'feet', price: 90,  name: 'Ботинки',      v: '#5b3a1e' },
  { id: 'l_rocket',  slot: 'feet', price: 260, name: 'Реактивные',   v: '#f97316' },

  // ---------- за спиной ----------
  { id: 'k_none',    slot: 'back', price: 0,   name: 'Ничего' },
  { id: 'k_bag',     slot: 'back', price: 100, name: 'Рюкзак',       v: '#22a45d' },
  { id: 'k_cape',    slot: 'back', price: 160, name: 'Плащ',         v: '#b91c1c' },
  { id: 'k_jetpack', slot: 'back', price: 280, name: 'Джетпак',      v: '#5b6673' },
  { id: 'k_wings',   slot: 'back', price: 350, name: 'Крылья',       v: '#f8fafc' }
];

const BY_ID = {};
CATALOG.forEach(i => { BY_ID[i.id] = i; });

// что есть у всех бесплатно и стоит по умолчанию
const DEFAULT_SKIN = {
  color: 'c_black', head: 'h_none', face: 'f_none',
  body: 'b_none', hands: 'a_none', feet: 'l_none', back: 'k_none'
};
const FREE_IDS = CATALOG.filter(i => i.price === 0).map(i => i.id);

function ownedList(u) {
  const own = (u && Array.isArray(u.items)) ? u.items : [];
  const set = new Set(FREE_IDS);
  own.forEach(id => { if (BY_ID[id]) set.add(id); });
  return Array.from(set);
}

function skinOf(u) {
  const s = Object.assign({}, DEFAULT_SKIN, (u && u.skin) || {});
  const own = new Set(ownedList(u));
  // если вещь потерялась из каталога или не куплена — откатываем на дефолт
  SLOTS.forEach(sl => {
    if (!BY_ID[s[sl]] || BY_ID[s[sl]].slot !== sl || !own.has(s[sl])) s[sl] = DEFAULT_SKIN[sl];
  });
  return s;
}

function register(app, acc) {
  const { currentUser, getDb, save, key } = acc;

  // ---------- каталог + состояние игрока ----------
  app.get('/skin/catalog', (req, res) => {
    const u = currentUser(req);
    res.json({
      slots: SLOTS,
      items: CATALOG,
      owned: ownedList(u),
      skin: skinOf(u),
      coins: u ? (u.coins || 0) : 0,
      guest: !u
    });
  });

  // ---------- скин любого игрока (для аватарок и профилей) ----------
  app.get('/skin/of', (req, res) => {
    const db = getDb();
    const u = db.users[key(req.query.name)];
    res.json({ skin: skinOf(u), name: u ? u.name : '' });
  });

  // ---------- покупка ----------
  app.post('/skin/buy', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', code: 'guest' });

    const item = BY_ID[String(req.body.id || '')];
    if (!item) return res.json({ status: 'error', code: 'noitem' });

    u.items = Array.isArray(u.items) ? u.items : [];
    if (item.price === 0 || u.items.indexOf(item.id) !== -1)
      return res.json({ status: 'error', code: 'owned' });

    const coins = u.coins || 0;
    if (coins < item.price)
      return res.json({ status: 'error', code: 'poor', need: item.price - coins });

    u.coins = coins - item.price;
    u.items.push(item.id);
    save();
    res.json({ status: 'success', coins: u.coins, owned: ownedList(u) });
  });

  // ---------- надеть ----------
  app.post('/skin/equip', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', code: 'guest' });

    const item = BY_ID[String(req.body.id || '')];
    const slot = String(req.body.slot || '');
    if (!item || item.slot !== slot || SLOTS.indexOf(slot) === -1)
      return res.json({ status: 'error', code: 'noitem' });
    if (ownedList(u).indexOf(item.id) === -1)
      return res.json({ status: 'error', code: 'notowned' });

    u.skin = Object.assign({}, skinOf(u));
    u.skin[slot] = item.id;
    save();
    res.json({ status: 'success', skin: u.skin });
  });

  // ---------- надеть целый комплект за один запрос ----------
  app.post('/skin/save', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', code: 'guest' });
    let want = {};
    try { want = JSON.parse(String(req.body.skin || '{}')); } catch (e) { want = {}; }

    const own = new Set(ownedList(u));
    const next = Object.assign({}, skinOf(u));
    SLOTS.forEach(sl => {
      const id = want[sl];
      if (BY_ID[id] && BY_ID[id].slot === sl && own.has(id)) next[sl] = id;
    });
    u.skin = next;
    save();
    res.json({ status: 'success', skin: next });
  });
}

module.exports = { register, CATALOG, SLOTS, DEFAULT_SKIN, skinOf, ownedList, BY_ID };
