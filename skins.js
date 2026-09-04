// ============ СКИНЫ: каталог деталей и экипировка ============
// Всё бесплатно: цена нужна только для скинов, которые владелец
// вручную выкладывает в Avatar (см. userSkins.js).

// Цвет персонажа задаёт игра (в прятках он показывает роль),
// поэтому в редакторе только аксессуары.
const SLOTS = ['head', 'face', 'body', 'back'];

const CATALOG = [
  // ---------- голова ----------
  { id: 'h_none',     slot: 'head', price: 0, name: 'Ничего' },
  { id: 'h_cap',      slot: 'head', price: 0, name: 'Кепка',        v: '#e04141' },
  { id: 'h_beanie',   slot: 'head', price: 0, name: 'Шапка',        v: '#8b5cf6' },
  { id: 'h_bandana',  slot: 'head', price: 0, name: 'Бандана',      v: '#f08a24' },
  { id: 'h_helmet',   slot: 'head', price: 0, name: 'Шлем',         v: '#5b6673' },
  { id: 'h_cowboy',   slot: 'head', price: 0, name: 'Шляпа',        v: '#8b5a2b' },
  { id: 'h_tophat',   slot: 'head', price: 0, name: 'Цилиндр',      v: '#1f2937' },
  { id: 'h_horns',    slot: 'head', price: 0, name: 'Рога',         v: '#c2410c' },
  { id: 'h_halo',     slot: 'head', price: 0, name: 'Нимб',         v: '#ffd83d' },
  { id: 'h_crown',    slot: 'head', price: 0, name: 'Корона',       v: '#d4a017' },
  { id: 'h_ears',     slot: 'head', price: 0, name: 'Ушки',         v: '#f472b6' },
  { id: 'h_antenna',  slot: 'head', price: 0, name: 'Антенна',      v: '#06b6d4' },
  { id: 'h_hair',     slot: 'head', price: 0, name: 'Причёска',     v: '#4b2e1e' },
  { id: 'h_bowler',   slot: 'head', price: 0, name: 'Котелок',      v: '#1f2937' },
  { id: 'h_straw',    slot: 'head', price: 0, name: 'Соломенная шляпа', v: '#eab308' },
  { id: 'h_pirate',   slot: 'head', price: 0, name: 'Пиратская шляпа',  v: '#111827' },
  { id: 'h_wizard',   slot: 'head', price: 0, name: 'Шляпа волшебника', v: '#6d28d9' },
  { id: 'h_army',     slot: 'head', price: 0, name: 'Армейская каска',  v: '#4d7c0f' },
  { id: 'h_hardhat',  slot: 'head', price: 0, name: 'Строительная каска', v: '#f59e0b' },
  { id: 'h_chef',     slot: 'head', price: 0, name: 'Колпак повара',    v: '#f8fafc' },
  { id: 'h_police',   slot: 'head', price: 0, name: 'Фуражка',      v: '#1e3a8a' },
  { id: 'h_viking',   slot: 'head', price: 0, name: 'Шлем викинга', v: '#6b7280' },
  { id: 'h_ushanka',  slot: 'head', price: 0, name: 'Ушанка',       v: '#8b5a2b' },
  { id: 'h_santa',    slot: 'head', price: 0, name: 'Шапка Деда Мороза', v: '#e04141' },
  { id: 'h_bucket',   slot: 'head', price: 0, name: 'Панама',       v: '#22a45d' },
  { id: 'h_mohawk',   slot: 'head', price: 0, name: 'Ирокез',       v: '#ec4899' },
  { id: 'h_headphones', slot: 'head', price: 0, name: 'Наушники',   v: '#111827' },
  { id: 'h_headband', slot: 'head', price: 0, name: 'Спортивная повязка', v: '#2563eb' },
  { id: 'h_bow',      slot: 'head', price: 0, name: 'Бантик',       v: '#f472b6' },
  { id: 'h_flower',   slot: 'head', price: 0, name: 'Цветок',       v: '#fb7185' },
  { id: 'h_propeller', slot: 'head', price: 0, name: 'Пропеллер',   v: '#06b6d4' },
  { id: 'h_unicorn',  slot: 'head', price: 0, name: 'Рог единорога', v: '#fbbf24' },

  // ---------- лицо ----------
  { id: 'f_none',     slot: 'face', price: 0, name: 'Ничего' },
  { id: 'f_glasses',  slot: 'face', price: 0, name: 'Очки',        v: '#374151' },
  { id: 'f_shades',   slot: 'face', price: 0, name: 'Тёмные очки', v: '#111827' },
  { id: 'f_visor',    slot: 'face', price: 0, name: 'Визор',       v: '#06b6d4' },
  { id: 'f_mask',     slot: 'face', price: 0, name: 'Маска',       v: '#22a45d' },
  { id: 'f_eyepatch', slot: 'face', price: 0, name: 'Повязка',     v: '#111827' },
  { id: 'f_scarf',    slot: 'face', price: 0, name: 'Шарф',        v: '#b91c1c' },
  { id: 'f_snorkel',  slot: 'face', price: 0, name: 'Маска для ныряния', v: '#f59e0b' },
  { id: 'f_round',    slot: 'face', price: 0, name: 'Круглые очки', v: '#374151' },
  { id: 'f_monocle',  slot: 'face', price: 0, name: 'Монокль',      v: '#d4a017' },
  { id: 'f_ninja',    slot: 'face', price: 0, name: 'Маска ниндзя', v: '#111827' },
  { id: 'f_war',      slot: 'face', price: 0, name: 'Боевая раскраска', v: '#16a34a' },
  { id: 'f_freckles', slot: 'face', price: 0, name: 'Веснушки',     v: '#b45309' },
  { id: 'f_blush',    slot: 'face', price: 0, name: 'Румянец',      v: '#fb7185' },
  { id: 'f_beard',    slot: 'face', price: 0, name: 'Борода',       v: '#4b2e1e' },
  { id: 'f_mustache', slot: 'face', price: 0, name: 'Усы',          v: '#4b2e1e' },
  { id: 'f_pipe',     slot: 'face', price: 0, name: 'Трубка',       v: '#8b5a2b' },
  { id: 'f_lolli',    slot: 'face', price: 0, name: 'Леденец',      v: '#e04141' },
  { id: 'f_bandage',  slot: 'face', price: 0, name: 'Пластырь',     v: '#fde68a' },
  { id: 'f_gas',      slot: 'face', price: 0, name: 'Противогаз',   v: '#5b6673' },

  // ---------- тело ----------
  { id: 'b_none',     slot: 'body', price: 0, name: 'Ничего' },
  { id: 'b_tie',      slot: 'body', price: 0, name: 'Галстук',      v: '#b91c1c' },
  { id: 'b_belt',     slot: 'body', price: 0, name: 'Ремень',       v: '#3f3f46' },
  { id: 'b_stripes',  slot: 'body', price: 0, name: 'Полоски',      v: '#e5e7eb' },
  { id: 'b_vest',     slot: 'body', price: 0, name: 'Жилет',        v: '#f59e0b' },
  { id: 'b_number',   slot: 'body', price: 0, name: 'Номер',        v: '#2563eb' },
  { id: 'b_hoodie',   slot: 'body', price: 0, name: 'Худи',         v: '#374151' },
  { id: 'b_armor',    slot: 'body', price: 0, name: 'Броня',        v: '#94a3b8' },
  { id: 'b_suit',     slot: 'body', price: 0, name: 'Костюм',       v: '#1f2937' },
  { id: 'b_overall',  slot: 'body', price: 0, name: 'Комбинезон',   v: '#3b5bdb' },
  { id: 'b_bowtie',   slot: 'body', price: 0, name: 'Бабочка',      v: '#111827' },
  { id: 'b_button',   slot: 'body', price: 0, name: 'Пуговицы',     v: '#f8fafc' },
  { id: 'b_zip',      slot: 'body', price: 0, name: 'Молния',       v: '#e5e7eb' },
  { id: 'b_star',     slot: 'body', price: 0, name: 'Звезда',       v: '#fbbf24' },
  { id: 'b_heart',    slot: 'body', price: 0, name: 'Сердце',       v: '#e04141' },
  { id: 'b_skull',    slot: 'body', price: 0, name: 'Череп',        v: '#f8fafc' },
  { id: 'b_bolt',     slot: 'body', price: 0, name: 'Молния-шрам',  v: '#fde047' },
  { id: 'b_pocket',   slot: 'body', price: 0, name: 'Карманы',      v: '#e5e7eb' },
  { id: 'b_splash',   slot: 'body', price: 0, name: 'Кляксы',       v: '#22a45d' },
  { id: 'b_camo',     slot: 'body', price: 0, name: 'Камуфляж',     v: '#4d7c0f' },
  { id: 'b_suspenders', slot: 'body', price: 0, name: 'Подтяжки',   v: '#111827' },
  { id: 'b_sash',     slot: 'body', price: 0, name: 'Лента',        v: '#b91c1c' },
  { id: 'b_medal',    slot: 'body', price: 0, name: 'Медаль',       v: '#d4a017' },
  { id: 'b_bandolier', slot: 'body', price: 0, name: 'Патронташ',  v: '#8b5a2b' },
  { id: 'b_chain',    slot: 'body', price: 0, name: 'Цепь',         v: '#d4a017' },

  // ---------- за спиной ----------
  { id: 'k_none',     slot: 'back', price: 0, name: 'Ничего' },
  { id: 'k_cape',     slot: 'back', price: 0, name: 'Плащ',         v: '#b91c1c' },
  { id: 'k_wings',    slot: 'back', price: 0, name: 'Крылья',       v: '#f8fafc' },
  { id: 'k_jetpack',  slot: 'back', price: 0, name: 'Джетпак',      v: '#5b6673' },
  { id: 'k_bag',      slot: 'back', price: 0, name: 'Рюкзак',       v: '#22a45d' },
  { id: 'k_tail',     slot: 'back', price: 0, name: 'Хвост',        v: '#f97316' },
  { id: 'k_shell',    slot: 'back', price: 0, name: 'Панцирь',      v: '#16a34a' },
  { id: 'k_butterfly', slot: 'back', price: 0, name: 'Крылья бабочки', v: '#f472b6' },
  { id: 'k_bat',      slot: 'back', price: 0, name: 'Крылья мыши',  v: '#374151' },
  { id: 'k_quiver',   slot: 'back', price: 0, name: 'Колчан',       v: '#8b5a2b' },
  { id: 'k_sword',    slot: 'back', price: 0, name: 'Меч',          v: '#94a3b8' },
  { id: 'k_shield',   slot: 'back', price: 0, name: 'Щит',          v: '#2563eb' },
  { id: 'k_axe',      slot: 'back', price: 0, name: 'Топор',        v: '#94a3b8' },
  { id: 'k_balloon',  slot: 'back', price: 0, name: 'Воздушный шар', v: '#e04141' },
  { id: 'k_parrot',   slot: 'back', price: 0, name: 'Попугай',      v: '#22a45d' },
  { id: 'k_fairy',    slot: 'back', price: 0, name: 'Крылья феи',   v: '#a5f3fc' },
  { id: 'k_skateboard', slot: 'back', price: 0, name: 'Скейтборд', v: '#f59e0b' }
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
      img: (u && u.skinImg) || '',
      coins: u ? (u.coins || 0) : 0,
      guest: !u,
      free: true
    });
  });

  app.get('/skin/of', (req, res) => {
    const db = getDb();
    const u = db.users[key(req.query.name)];
    res.json({ skin: skinOf(u), img: (u && u.skinImg) || '', name: u ? u.name : '' });
  });

  // скины сразу нескольких игроков — для списков друзей и таблиц
  app.get('/skins/many', (req, res) => {
    const db = getDb();
    const names = String(req.query.names || '')
      .split(',').map(n => n.trim()).filter(Boolean).slice(0, 60);
    const out = {};
    names.forEach(n => {
      const u = db.users[key(n)];
      if (!u) return;
      const sk = skinOf(u);
      if (u.skinImg) sk.img = u.skinImg;   // скин-картинка от владельца
      out[n] = sk;
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
    u.wearing = ''; delete u.skinImg;   // сняли готовый скин из Avatar
    save();
    res.json({ status: 'success', skin: u.skin });
  });

  app.post('/skin/save', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', code: 'guest' });
    let want = {};
    try { want = JSON.parse(String(req.body.skin || '{}')); } catch (e) {}
    u.skin = normalize(want);
    u.wearing = ''; delete u.skinImg;
    save();
    res.json({ status: 'success', skin: u.skin });
  });
}

module.exports = {
  register, CATALOG, SLOTS, DEFAULT_SKIN, BY_ID,
  skinOf, ownedList, normalize, signature
};
