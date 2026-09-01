/* ======= Панель генератора карт в Map Editor =======
   Кнопка в верхней панели редактора. Доступ разовый — 100 монет,
   дальше без ограничений: генерация идёт в браузере и ничего не стоит. */
(function () {
  'use strict';

  var PRICE = 100;
  var state = { unlocked: false, guest: true, price: PRICE, coins: 0, loaded: false };
  var seed = null;
  var last = null;

  var EXAMPLES = [
    '20 красных вращающихся треугольников по краям',
    'синяя вода снизу с ядом',
    'лабиринт с укрытиями',
    'огромная башня, сложно, шипы',
    'гонка: паркур с батутами и финишем',
    'арена для пряток, 6 укрытий',
    'город, движущиеся платформы',
    'парящие острова, хардкор',
    'пещера 40x16, ловушки',
    'мост через пропасть, вращающиеся'
  ];

  /* ---------- стили ---------- */
  var css = ''
    + '#genBox{position:fixed;top:64px;left:50%;transform:translateX(-50%);width:390px;max-width:94vw;'
    + 'z-index:40;display:none;flex-direction:column;padding:0;overflow:hidden}'
    + '#genBox.on{display:flex}'
    + '#genHead{display:flex;align-items:center;gap:8px;padding:11px 13px;border-bottom:1px solid var(--line);'
    + 'font-weight:700;font-size:13px;letter-spacing:.3px;text-transform:uppercase;color:var(--accent)}'
    + '#genHead .x{margin-left:auto;color:#94a3b8;cursor:pointer;font-size:15px;line-height:1;padding:2px 6px}'
    + '#genHead .x:hover{color:#ef4444}'
    + '#genBody{padding:12px 13px;font-size:12.5px;color:var(--ink)}'
    + '#genText{width:100%;box-sizing:border-box;min-height:70px;resize:vertical;padding:9px 10px;'
    + 'border:1px solid var(--line);border-radius:9px;font:inherit;font-size:13px;background:#fafbfd;'
    + 'color:var(--ink);outline:none}'
    + '#genText:focus{border-color:var(--accent);background:#fff}'
    + '#genChips{display:flex;flex-wrap:wrap;gap:5px;margin:9px 0 4px}'
    + '.genChip{font-size:11px;padding:4px 9px;border:1px solid var(--line);border-radius:20px;'
    + 'cursor:pointer;color:#5b6673;background:#f6f8fb;white-space:nowrap}'
    + '.genChip:hover{border-color:var(--accent);color:var(--accent)}'
    + '#genActs{display:flex;gap:7px;margin-top:11px}'
    + '#genActs button{flex:1;padding:9px 0;border-radius:9px;border:1px solid var(--line);background:#fff;'
    + 'color:var(--ink);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer}'
    + '#genActs button.go{background:var(--accent);border-color:var(--accent);color:#fff}'
    + '#genActs button:disabled{opacity:.5;cursor:default}'
    + '#genOut{margin-top:9px;font-size:11.5px;line-height:1.6;color:#5b6673;min-height:16px}'
    + '#genOut.bad{color:#dc2626}'
    + '#genHint{margin-top:8px;font-size:11px;line-height:1.6;color:#8a95a3}'
    + '.genLock{text-align:center;padding:6px 2px}'
    + '.genLock h4{margin:0 0 6px;font-size:15px;color:var(--ink)}'
    + '.genLock p{margin:0 0 12px;font-size:12px;line-height:1.6;color:#5b6673}'
    + '.genLock .price{font-size:22px;font-weight:800;color:#d4a017;margin-bottom:11px}'
    + '.genLock button{width:100%;padding:10px 0;border-radius:9px;border:none;background:var(--accent);'
    + 'color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer}'
    + '.genLock button:disabled{opacity:.5;cursor:default}'
    + '#genTabs{display:flex;gap:2px;padding:5px 6px 0}'
    + '.genTab{flex:1;text-align:center;padding:7px 0;border-radius:8px;font-size:12px;'
    + 'font-weight:600;color:#8a95a3;cursor:pointer}'
    + '.genTab.on{background:#eef2f8;color:var(--ink)}'
    + '#chatLog{max-height:38vh;overflow-y:auto;display:flex;flex-direction:column;gap:7px;'
    + 'padding:2px 1px 4px}'
    + '.chatMsg{padding:8px 10px;border-radius:10px;font-size:12.5px;line-height:1.6;white-space:pre-wrap}'
    + '.chatMsg.me{background:var(--accent);color:#fff;align-self:flex-end;max-width:85%}'
    + '.chatMsg.bot{background:#f4f6fa;color:var(--ink);align-self:flex-start;border:1px solid var(--line)}'
    + '#chatRow{display:flex;gap:6px;margin-top:9px}'
    + '#chatIn{flex:1;padding:9px 10px;border:1px solid var(--line);border-radius:9px;font:inherit;'
    + 'font-size:12.5px;background:#fafbfd;color:var(--ink);outline:none}'
    + '#chatIn:focus{border-color:var(--accent);background:#fff}'
    + '#chatSend{padding:0 14px;border-radius:9px;border:none;background:var(--accent);color:#fff;'
    + 'font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}'
    + '@media (max-width:860px){#genBox{top:auto;bottom:88px;width:94vw}}';

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- разметка ---------- */
  var box = document.createElement('div');
  box.id = 'genBox';
  box.className = 'panel';
  box.innerHTML =
      '<div id="genHead">Помощник редактора<div class="x" id="genClose">✕</div></div>'
    + '<div id="genTabs">'
    +   '<div class="genTab on" data-tab="chat">Помощник</div>'
    +   '<div class="genTab" data-tab="gen">Генератор</div>'
    + '</div>'
    + '<div id="genBody"></div>';
  document.body.appendChild(box);

  var body = box.querySelector('#genBody');
  document.getElementById('genClose').onclick = function () { box.classList.remove('on'); };

  var tab = 'chat';
  box.querySelector('#genTabs').onclick = function (e) {
    var t = e.target.closest('.genTab');
    if (!t) return;
    tab = t.dataset.tab;
    Array.prototype.forEach.call(box.querySelectorAll('.genTab'), function (x) {
      x.classList.toggle('on', x.dataset.tab === tab);
    });
    draw();
  };

  /* ---------- кнопка в панели редактора ---------- */
  var SPARK = '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>'
            + '<path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/>';

  function addButton() {
    var scene = document.getElementById('scene');
    if (!scene || document.getElementById('bGen')) return;
    var sep = document.createElement('div');
    sep.className = 'sep';
    var b = document.createElement('div');
    b.className = 'sBtn';
    b.id = 'bGen';
    b.setAttribute('data-tip', 'Помощник и генератор карт');
    b.innerHTML = '<svg viewBox="0 0 24 24">' + SPARK + '</svg>';
    b.onclick = toggle;
    // ставим перед кнопкой «Играть», чтобы она осталась крайней
    var play = document.getElementById('bPlay');
    if (play) { scene.insertBefore(sep, play); scene.insertBefore(b, play); }
    else { scene.appendChild(sep); scene.appendChild(b); }
  }

  function toggle() {
    if (box.classList.contains('on')) { box.classList.remove('on'); return; }
    box.classList.add('on');
    if (!state.loaded) refresh(); else draw();
  }

  /* ---------- состояние доступа ---------- */
  function refresh() {
    body.innerHTML = '<div class="genLock"><p>Загрузка…</p></div>';
    fetch('/mapgen/get', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        state.unlocked = !!d.unlocked;
        state.guest = !!d.guest;
        state.price = d.price || PRICE;
        state.coins = d.coins || 0;
        state.loaded = true;
        draw();
      })
      .catch(function () {
        body.innerHTML = '<div class="genLock"><p>Сервер недоступен. '
          + 'Проверь соединение и открой панель заново.</p></div>';
      });
  }

  function draw() {
    /* Подсказки и горячие клавиши бесплатны: закрывать справку за монеты
       незачем. Платная часть — сборка карты по описанию. */
    if (tab === 'chat') { drawChat(); return; }
    if (!state.unlocked) { drawLock(); return; }
    drawForm();
  }

  /* ---------- помощник ----------
     Отвечает офлайн по своей базе знаний. Просьбу собрать карту передаёт
     генератору, если тот оплачен. */
  var chat = [];

  function drawChat() {
    body.innerHTML =
        '<div id="chatLog"></div>'
      + '<div id="chatRow">'
      +   '<input id="chatIn" placeholder="Как сделать воду?">'
      +   '<button id="chatSend">→</button>'
      + '</div>'
      + '<div id="genHint">Спрашивай про горячие клавиши, воду, рикошет, укрытия, связи кнопок, '
      + 'пределы прыжка и публикацию. Просьбу «сделай лабиринт с водой» передам генератору.</div>';

    if (!chat.length)
      chat.push({ who: 'bot', text:
        'Привет. Подскажу по редактору и соберу карту по описанию.\n'
        + 'Попробуй: «какие горячие клавиши?», «как сделать кислоту?», '
        + '«сделай огромный лабиринт с водой».' });

    renderChat();
    document.getElementById('chatSend').onclick = send;
    document.getElementById('chatIn').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); send(); }
    });
  }

  function renderChat() {
    var log = document.getElementById('chatLog');
    if (!log) return;
    log.innerHTML = '';
    chat.forEach(function (m) {
      var d = document.createElement('div');
      d.className = 'chatMsg ' + (m.who === 'me' ? 'me' : 'bot');
      d.textContent = m.text;
      log.appendChild(d);
    });
    log.scrollTop = log.scrollHeight;
  }

  function reply(text) { chat.push({ who: 'bot', text: text }); renderChat(); }

  function send() {
    var el = document.getElementById('chatIn');
    var q = (el.value || '').trim();
    if (!q) return;
    el.value = '';
    chat.push({ who: 'me', text: q });
    renderChat();

    if (window.BFHelp && BFHelp.isBuildRequest(q)) {
      if (!state.unlocked) {
        reply('Сборка карт по описанию открывается за ' + state.price + ' монет — вкладка «Генератор». '
            + 'Подсказки по редактору бесплатны, спрашивай сколько угодно.');
        return;
      }
      var res = build(q, true);
      reply(res.ok ? 'Готово: ' + res.text + '\nCtrl+Z вернёт прежнюю карту.'
                   : 'Не вышло: ' + res.text);
      return;
    }
    var a = window.BFHelp ? BFHelp.ask(q) : null;
    reply(a ? a.answer : 'Справка не загрузилась — обнови страницу.');
  }

  function drawLock() {
    body.innerHTML =
        '<div class="genLock">'
      + '<h4>Генератор карт закрыт</h4>'
      + '<p>Опиши карту словами — «лабиринт с укрытиями», «огромная башня, сложно, шипы» — '
      + 'и она соберётся прямо в редакторе. Работает без интернета и без ограничений: '
      + 'покупка разовая, дальше генерируй сколько угодно.</p>'
      + '<div class="price">' + state.price + ' монет</div>'
      + '<button id="genBuy">' + (state.guest ? 'Нужен аккаунт' : 'Открыть за ' + state.price) + '</button>'
      + '<div id="genOut"></div>'
      + '</div>';

    var buy = document.getElementById('genBuy');
    if (state.guest) { buy.disabled = true; return; }
    buy.onclick = function () {
      buy.disabled = true;
      fetch('/mapgen/unlock', { method: 'POST', credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          buy.disabled = false;
          if (r.status !== 'success') { say(r.message || 'Ошибка', true); return; }
          state.unlocked = true;
          state.coins = r.coins;
          if (window.BFShell && BFShell.refreshCoins) BFShell.refreshCoins(r.coins);
          draw();
        })
        .catch(function () { buy.disabled = false; say('Сервер недоступен', true); });
    };
  }

  function drawForm() {
    body.innerHTML =
        '<textarea id="genText" placeholder="Опиши карту: лабиринт с укрытиями, сложно, 3 монеты"></textarea>'
      + '<div id="genChips"></div>'
      + '<div id="genActs">'
      +   '<button class="go" id="genRun">Создать</button>'
      +   '<button id="genMore" disabled>Ещё вариант</button>'
      + '</div>'
      + '<div id="genOut"></div>'
      + '<div id="genHint">Разбирает каждое слово по отдельности, в любой форме: объект '
      + '(блок, круг, треугольник, вода, монета, кнопка, рычаг, чекпоинт, финиш, старт, надпись), '
      + 'количество, цвет, размер, место и свойства. Пример: «20 красных вращающихся '
      + 'треугольников по краям, синяя вода снизу с ядом». Карта заменяет текущую — Ctrl+Z вернёт обратно.</div>';

    var chips = document.getElementById('genChips');
    EXAMPLES.forEach(function (e) {
      var c = document.createElement('div');
      c.className = 'genChip';
      c.textContent = e;
      c.onclick = function () { document.getElementById('genText').value = e; };
      chips.appendChild(c);
    });

    document.getElementById('genRun').onclick = function () { run(true); };
    document.getElementById('genMore').onclick = function () { run(false); };
    document.getElementById('genText').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(true); }
    });
  }

  function say(text, bad) {
    var out = document.getElementById('genOut');
    if (!out) return;
    out.textContent = text;
    out.className = bad ? 'bad' : '';
  }

  /* ---------- генерация ---------- */
  function build(text, fresh) {
    var G = window.GAME;
    if (!G || !window.BFMapGen) return { ok: false, text: 'редактор ещё загружается' };
    if (G.playing) return { ok: false, text: 'сначала выйди из режима игры' };
    if (!text) return { ok: false, text: 'напиши, какую карту собрать' };

    if (fresh) seed = null;                              // зерно из самого текста
    else seed = (Math.random() * 4294967296) >>> 0;      // «ещё вариант» — новое зерно

    var res;
    try {
      res = BFMapGen.generate(text, { seed: seed, mode: G.mode });
    } catch (err) {
      return { ok: false, text: 'не получилось собрать карту (' + err.message + ')' };
    }
    if (!res.objects.length) return { ok: false, text: 'по этому описанию ничего не вышло' };

    G.commit();                                          // чтобы Ctrl+Z вернул прежнюю карту

    // режим переключаем той же кнопкой, что и вручную — иначе панель
    // инструментов останется от старого режима
    if (res.mode !== G.mode) {
      var btn = document.querySelector('.modeBtn[data-mode="' + res.mode + '"]');
      if (btn) btn.click();
    }

    var n = G.loadMap({ mode: res.mode, gravity: res.gravity, objects: res.objects });
    last = res;
    return { ok: true, text: res.summary + ' · поставлено ' + n };
  }

  function run(fresh) {
    var r = build((document.getElementById('genText').value || '').trim(), fresh || seed === null);
    if (!r.ok) { say(r.text, true); return; }
    document.getElementById('genMore').disabled = false;
    say(r.text + '. Ctrl+Z — вернуть прежнюю карту.');
  }

  /* панель редактора строится в его собственном скрипте, поэтому ждём DOM */
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', addButton);
  else addButton();

  window.BFMapGenUI = { open: toggle, refresh: refresh, get last() { return last; } };
})();
