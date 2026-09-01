// ============ ГЕНЕРАТОР КАРТ В MAP EDITOR ============
// Сама генерация целиком в браузере (mapGen.js) — сервер только хранит,
// кто уже оплатил доступ. Покупка разовая, дальше без ограничений.

const UNLOCK_PRICE = 100;

function unlockedFor(u) {
  return !!(u && u.mapGenUnlocked);
}

function register(app, acc) {
  const { currentUser, save } = acc;

  app.get('/mapgen/get', (req, res) => {
    const u = currentUser(req);
    res.json({
      guest: !u,
      unlocked: unlockedFor(u),
      price: UNLOCK_PRICE,
      coins: u ? (u.coins || 0) : 0
    });
  });

  app.post('/mapgen/unlock', (req, res) => {
    const u = currentUser(req);
    if (!u) return res.json({ status: 'error', code: 'guest',
                              message: 'Сначала войдите в аккаунт' });
    if (u.mapGenUnlocked)
      return res.json({ status: 'success', unlocked: true, coins: u.coins || 0 });

    const coins = u.coins || 0;
    if (coins < UNLOCK_PRICE)
      return res.json({
        status: 'error',
        message: 'Не хватает ' + (UNLOCK_PRICE - coins) + ' монет из ' + UNLOCK_PRICE
      });

    u.coins = coins - UNLOCK_PRICE;
    u.mapGenUnlocked = true;
    save();
    res.json({ status: 'success', unlocked: true, coins: u.coins,
               message: 'Генератор карт открыт' });
  });
}

module.exports = { register, UNLOCK_PRICE };
