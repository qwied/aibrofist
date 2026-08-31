// ============ ТЕМЫ ОФОРМЛЕНИЯ ============
// Игрок выбирает от одного до четырёх цветов, из них собирается палитра
// всего интерфейса. Функция открывается один раз за монеты.

const UNLOCK_PRICE = 100;
const MAX_COLORS = 4;

const HEX = /^#[0-9a-f]{6}$/i;

// готовые наборы — чтобы не собирать палитру с нуля
const PRESETS = [
  { id: 'classic',  name: 'Классика',      colors: ['#2196F3'] },
  { id: 'ocean',    name: 'Океан',         colors: ['#0ea5e9', '#0f766e'] },
  { id: 'sunset',   name: 'Закат',         colors: ['#f97316', '#e11d48', '#7c3aed'] },
  { id: 'forest',   name: 'Лес',           colors: ['#16a34a', '#065f46'] },
  { id: 'grape',    name: 'Виноград',      colors: ['#7c3aed', '#db2777'] },
  { id: 'gold',     name: 'Золото',        colors: ['#d4a017', '#7c2d12'] },
  { id: 'ice',      name: 'Лёд',           colors: ['#38bdf8', '#a78bfa', '#e0f2fe'] },
  { id: 'candy',    name: 'Карамель',      colors: ['#ec4899', '#f59e0b', '#22d3ee', '#a3e635'] },
  { id: 'mint',     name: 'Мята',          colors: ['#10b981', '#38bdf8'] },
  { id: 'coal',     name: 'Графит',        colors: ['#334155', '#0ea5e9'] },
  { id: 'cherry',   name: 'Вишня',         colors: ['#be123c', '#f43f5e', '#fda4af'] },
  { id: 'rainbow',  name: 'Радуга',        colors: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'] }
];

function cleanColors(raw) {
  let list = raw;
  if (typeof raw === 'string') {
    try { list = JSON.parse(raw); } catch (e) { list = String(raw).split(','); }
  }
  if (!Array.isArray(list)) return null;
  const out = [];
  for (const c of list) {
    const v = String(c || '').trim();
    if (!HEX.test(v)) continue;
    const low = v.toLowerCase();
    if (out.indexOf(low) === -1) out.push(low);
    if (out.length >= MAX_COLORS) break;
  }
  return out.length ? out : null;
}

const MODES = ['light', 'dark'];

function modeOf(u) {
  return (u && MODES.indexOf(u.themeMode) !== -1) ? u.themeMode : 'light';
}

function themeOf(u) {
  if (!u || !Array.isArray(u.themeColors) || !u.themeColors.length) return null;
  return { colors: u.themeColors.slice(0, MAX_COLORS) };
}

function register(app, acc) {
  const { currentUser, save } = acc;

  app.get('/theme/get', (req, res) => {
    const u = currentUser(req);
    res.json({
      guest: !u,
      unlocked: !!(u && u.themeUnlocked),
      price: UNLOCK_PRICE,
      coins: u ? (u.coins || 0) : 0,
      max: MAX_COLORS,
      mode: modeOf(u),
      modes: MODES,
      theme: themeOf(u),
      presets: PRESETS
    });
  });

  /* Светлая и тёмная тема бесплатны для всех: это не украшение,
     а удобство чтения. За монеты открывается только выбор цветов. */
  app.post('/theme/mode', (req, res) => {
    const want = String(req.body.mode || '').toLowerCase();
    if (MODES.indexOf(want) === -1)
      return res.json({ status: 'error', message: 'Неизвестная тема' });

    const u = currentUser(req);
    if (u) { u.themeMode = want; save(); }
    // гостю тему не сохраняем, но и не запрещаем — она ляжет в браузер
    res.json({ status: 'success', mode: want, saved: !!u });
  });

  app.post('/theme/unlock', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', message: 'Сначала войдите в аккаунт' });
    if (u.themeUnlocked)
      return res.json({ status: 'success', unlocked: true, coins: u.coins || 0 });

    const coins = u.coins || 0;
    if (coins < UNLOCK_PRICE)
      return res.json({
        status: 'error',
        message: 'Не хватает ' + (UNLOCK_PRICE - coins) + ' монет из ' + UNLOCK_PRICE
      });

    u.coins = coins - UNLOCK_PRICE;
    u.themeUnlocked = true;
    save();
    res.json({ status: 'success', unlocked: true, coins: u.coins,
               message: 'Темы открыты' });
  });

  app.post('/theme/set', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', message: 'Сначала войдите в аккаунт' });
    if (!u.themeUnlocked)
      return res.json({ status: 'error', code: 'locked',
                        message: 'Темы ещё не открыты' });

    // пустой список — вернуться к оформлению по умолчанию
    const raw = String(req.body.colors || '').trim();
    if (!raw || raw === '[]') {
      delete u.themeColors;
      save();
      return res.json({ status: 'success', theme: null });
    }

    const colors = cleanColors(raw);
    if (!colors)
      return res.json({ status: 'error', message: 'Нужен хотя бы один цвет в виде #rrggbb' });

    u.themeColors = colors;
    save();
    res.json({ status: 'success', theme: { colors } });
  });

  // тема другого игрока не нужна никому, кроме него самого —
  // отдельного публичного маршрута нет
}

module.exports = { register, PRESETS, UNLOCK_PRICE, MAX_COLORS, MODES, themeOf, modeOf };
