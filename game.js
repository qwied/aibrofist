/* ======= Игровой слой AIBrofist =======
   Работает поверх движка редактора (window.GAME).
   Режимы: hideAndSeek, race. */
(function () {
  'use strict';

  var q      = new URLSearchParams(location.search);
  var MODE   = q.get('mode') || 'hideAndSeek';
  var ROOM   = q.get('room') || null;
  var VIEW   = q.get('view');                 // просмотр одной карты из Maps Browser
  var VAUTH  = q.get('author');

  var ROUND_MS  = 120000;   // раунд — 2 минуты
  var LOBBY_MS  = 30000;    // ожидание в Hide and Seek — 30 секунд

  var COLOR_NORMAL = '#111827';
  var COLOR_SEEKER = '#1e6fe0';   // искатель — синий
  var COLOR_CAUGHT = '#f97316';   // пойманный — оранжевый

  var me = { name: '', role: 'hider', caught: false };

  // гостю выдаётся постоянный на сессию ник вида Bro_7K
  function guestName() {
    var n = sessionStorage.getItem('bfGuest');
    if (n) return n;
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    n = 'Bro_' + A[Math.floor(Math.random() * A.length)] + A[Math.floor(Math.random() * A.length)];
    sessionStorage.setItem('bfGuest', n);
    return n;
  }
  var others = {};
  var currentMap = null;
  var socket = null;
  var phase = 'loading';        // loading | lobby | round | over | dev
  var phaseEnds = 0;

  // ---------- разметка поверх движка ----------
  var css = ''
    + '#gTop{position:fixed;top:0;left:0;right:0;z-index:60;display:flex;gap:12px;align-items:center;'
    + 'padding:7px 12px;background:rgba(255,255,255,.9);font:13px sans-serif;flex-wrap:wrap}'
    + '#gTop b{color:#2196F3}'
    + '#gExit{margin-left:auto;background:#e74c3c;color:#fff;border:none;padding:7px 13px;'
    + 'border-radius:6px;cursor:pointer;font-weight:bold}'
    + '#gMap{position:fixed;right:12px;bottom:12px;z-index:60;background:rgba(255,255,255,.92);'
    + 'border:1px solid #d7dee7;border-radius:9px;padding:8px 13px;font:12.5px sans-serif;max-width:46vw}'
    + '#gMap .n{font-weight:bold;color:#111827;word-break:break-word}'
    + '#gMap .a{color:#6b7280;margin-top:2px}'
    + '#gMap .rate{margin-top:7px;display:flex;gap:6px;align-items:center}'
    + '#gMap .rate button{border:1px solid #2196F3;background:#fff;color:#2196F3;border-radius:5px;'
    + 'padding:4px 11px;cursor:pointer;font-size:13px}'
    + '#gBanner{position:fixed;inset:0;z-index:70;display:none;align-items:center;justify-content:center;'
    + 'flex-direction:column;gap:9px;background:rgba(255,255,255,.93);font:16px sans-serif;text-align:center;padding:24px}'
    + '#gBanner h2{margin:0;font-size:25px}'
    + '#gBanner p{margin:0;color:#6b7280;max-width:420px}'
    + '#gChat{position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0}'
    + '#gMsg{width:1px}'
    + '#gTalk{display:none;position:fixed;right:14px;top:50%;transform:translateY(-50%);z-index:61;'
    + 'width:52px;height:52px;border-radius:50%;border:none;background:rgba(33,150,243,.85);'
    + 'color:#fff;font-size:22px;cursor:pointer}'
    + 'html.is-mobile #gTalk,html.is-tablet #gTalk{display:block}'
    // на телефоне: шапка компактнее, карточка карты уходит наверх, чтобы не мешать кнопкам
    + 'html.is-mobile #gTop,html.is-tablet #gTop{padding:5px 9px;gap:8px;font-size:12px}'
    + 'html.is-mobile #gExit,html.is-tablet #gExit{padding:9px 14px;font-size:13px}'
    + 'html.is-mobile #gMap,html.is-tablet #gMap{bottom:auto;top:46px;right:8px;max-width:56vw;'
    + 'padding:6px 10px;font-size:11.5px}'
    + 'html.is-mobile #gBanner h2,html.is-tablet #gBanner h2{font-size:20px}'
    + 'html.is-mobile #gBanner p,html.is-tablet #gBanner p{font-size:14px}'
    ;

  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  document.body.insertAdjacentHTML('beforeend',
      '<div id="gTop"><span id="gRoleBox" style="display:none">Роль: <b id="gRole"></b></span>'
    + '<span>Игроков: <b id="gCount">1</b></span>'
    + '<span id="gTimeBox">Время: <b id="gTime">—</b></span>'
    + '<button id="gExit">Меню</button></div>'
    + '<div id="gMap"><div class="n" id="gMapName">Загрузка карты…</div>'
    + '<div class="a" id="gMapAuthor"></div><div class="rate" id="gRate" style="display:none">'
    + '<button data-v="1">👍</button><button data-v="-1">👎</button>'
    + '<span id="gRating" style="color:#6b7280"></span></div></div>'
    + '<div id="gBanner"><h2 id="gbT"></h2><p id="gbP"></p></div>'
    + '<div id="gChat"><input id="gMsg" maxlength="90"></div>'
    + '<button id="gTalk">Чат</button>'
);

  var $ = function (id) { return document.getElementById(id); };
  $('gExit').onclick = function () { location.href = 'index.html'; };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // системные сообщения — короткой плашкой, история не хранится
  function log(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    d.style.cssText = 'position:fixed;left:50%;top:52px;transform:translateX(-50%);z-index:62;' +
      'background:rgba(0,0,0,.62);color:#fff;padding:7px 15px;border-radius:16px;' +
      'font:12.5px sans-serif;pointer-events:none';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 2600);
  }

  // сказанные реплики: 2 секунды плавно уплывают вверх и тают
  // ---------- скины ----------
  var mySkinStr = '';                 // компактная запись для передачи по сети
  var myImg = '';                     // скин-картинка, если она надета

  /* Кеш скинов-картинок по нику. Запрашиваем пачкой и только один раз
     на игрока: сама картинка может быть на сотни килобайт. */
  var imgCache = {};                  // ник -> url ('' если картинки нет)
  var imgWanted = {};
  var imgTimer = null;
  function imgOf(name) {
    if (!name) return '';
    if (imgCache[name] !== undefined) return imgCache[name];
    if (!imgWanted[name]) {
      imgWanted[name] = 1;
      clearTimeout(imgTimer);
      imgTimer = setTimeout(askImgs, 120);
    }
    return '';
  }
  function askImgs() {
    var names = Object.keys(imgWanted);
    if (!names.length) return;
    imgWanted = {};
    fetch('/skins/many?names=' + encodeURIComponent(names.join(',')), { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var got = (d && d.skins) || {};
        names.forEach(function (n) { imgCache[n] = (got[n] && got[n].img) || ''; });
      })
      .catch(function () { names.forEach(function (n) { imgCache[n] = ''; }); });
  }
  function skinToStr(sk) {
    if (!sk) return '';
    // скин-картинка передаётся адресом, обычный — четырьмя id
    if (sk.img) return 'i:' + sk.img;
    return [sk.head, sk.face, sk.body, sk.back].join('|');
  }
  function strToSkin(v) {
    if (!v) return null;
    var str = String(v);
    if (str.indexOf('i:') === 0) return { img: str.slice(2) };
    var a = str.split('|');
    if (a.length !== 4) return null;
    return { head: a[0], face: a[1], body: a[2], back: a[3] };
  }
  function loadMySkin() {
    fetch('/skin/catalog', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        window.BF_SKIN_ITEMS = {};
        (d.items || []).forEach(function (i) { window.BF_SKIN_ITEMS[i.id] = i; });
        GAME.mySkin = d.skin || null;
        if (GAME.mySkin && d.img) GAME.mySkin.img = d.img;
        mySkinStr = skinToStr(GAME.mySkin);
        myImg = d.img || '';
        if (GAME.myName) imgCache[GAME.myName] = myImg;
      })
      .catch(function () {});
  }
  loadMySkin();

  // Дверь засчитывается, когда в ней все игроки — движок спрашивает список здесь
  if (window.GAME) {
    window.GAME.others = function () {
      var out = [];
      for (var k in others) {
        var o = others[k];
        if (o && !o.gone) out.push({ x: o.x, y: o.y, w: o.w, h: o.h, gone: o.gone });
      }
      return out;
    };
  }

  var SAY_FADE = 2600;
  var SAY_MAX = 4;
  var SAY_OUT = 500;            // сколько миллисекунд длится растворение
  /* Реплики копятся стопкой: новая не стирает предыдущую, а встаёт под
     ней. Раньше здесь лежала одна запись на игрока, поэтому второе
     сообщение затирало первое ещё до того, как его успевали прочитать. */
  var spoken = {};
  function speak(who, text) {
    if (!text) return;
    var list = spoken[who] || (spoken[who] = []);
    list.push({ text: text, born: Date.now() });
    /* Лишние не выкидываем разом: при частой отправке реплики пропадали
       рывком прямо на глазах. Вместо этого состариваем самую старую —
       она доживает свои полсекунды и растворяется как обычно. */
    for (var i = 0; i < list.length - SAY_MAX; i++) {
      var old = list[i], age = Date.now() - old.born;
      if (age < SAY_FADE - SAY_OUT) old.born = Date.now() - (SAY_FADE - SAY_OUT);
    }
    // совсем уж отжившие убираем, чтобы список не рос без конца
    while (list.length > SAY_MAX + 3) list.shift();
  }

  function banner(title, text, show) {
    $('gbT').textContent = title || '';
    $('gbP').textContent = text || '';
    $('gBanner').style.display = show ? 'flex' : 'none';
  }

  // ---------- загрузка карт ----------
  function showMap(m) {
    currentMap = m;
    if (!m) {
      $('gMapName').textContent = 'Карт пока нет';
      $('gMapAuthor').textContent = 'Опубликуй карту в Map Editor';
      GAME.clear();                       // убираем демо-сцену редактора
      banner('Здесь пока пусто', 'Никто ещё не опубликовал карту для этого режима. Открой Map Editor и выложи свою.', true);
      return;
    }
    banner('', '', false);
    $('gMapName').textContent = m.mapName;
    $('gMapAuthor').textContent = 'автор: ' + m.author;
    try {
      GAME.loadMap(m.mapData);
      GAME.startPlay();
      coinsSent = 0;
      applyColor();
    } catch (e) {
      $('gMapAuthor').textContent = 'карта повреждена';
    }
  }

  function nextMap(cb) {
    var u = '/getRandomMap?mapType=' + encodeURIComponent(MODE)
          + (currentMap ? '&not=' + encodeURIComponent(currentMap.mapName) : '');
    fetch(u).then(function (r) { return r.json(); }).then(function (m) {
      showMap(m);
      if (m) log('Карта: <b>' + esc(m.mapName) + '</b> от ' + esc(m.author), 's');
      if (cb) cb(m);
    }).catch(function () { showMap(null); if (cb) cb(null); });
  }

  // ---------- роли ----------
  function applyColor() {
    GAME.myColor = (me.role === 'seeker') ? COLOR_SEEKER
                 : (me.caught ? COLOR_CAUGHT : COLOR_NORMAL);
  }
  /* Пойманность живёт ровно один раунд. Раньше её снимали только у себя
     и только при уходе в лобби, поэтому чужие фигуры оставались серыми
     навсегда, а искатель не мог поймать их снова. */
  function clearCaught() {
    me.caught = false;
    Object.keys(others).forEach(function (id) { others[id].caught = false; });
    caughtNames = {};
    applyColor();
  }
  var caughtNames = {};

  function setRole(role) {
    me.role = role; me.caught = false;
    $('gRoleBox').style.display = 'inline';
    $('gRole').textContent = role === 'seeker' ? 'Искатель' : 'Прячется';
    applyColor();
  }

  // ---------- таймер и фазы ----------
  function fmt(ms) {
    if (ms < 0) ms = 0;
    var s = Math.ceil(ms / 1000);
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  setInterval(function () {
    if (phase === 'dev' || phase === 'loading') return;
    var left = phaseEnds - Date.now();
    $('gTime').textContent = fmt(left);
    if (left <= 0) advance();
  }, 250);

  function advance() {
    if (MODE === 'hideAndSeek') {
      if (phase === 'lobby') {
        phase = 'round'; phaseEnds = Date.now() + ROUND_MS;
        clearCaught();               // новый раунд — все снова не пойманы
        banner('', '', false);
        log('Раунд начался! 2 минуты', 's');
        if (socket) socket.emit('sendChat', { text: 'Раунд начался' });
      } else {
        phase = 'lobby'; phaseEnds = Date.now() + LOBBY_MS;
        clearCaught();
        nextMap();
        banner('Раунд окончен', 'Новая карта. До старта 30 секунд.', true);
        setTimeout(function () { banner('', '', false); }, 3000);
      }
    } else {
      phaseEnds = Date.now() + ROUND_MS;
      nextMap();
      log('Время вышло — следующая карта');
    }
  }

  // ---------- запуск по режимам ----------
  function boot() {
    GAME.setGrid(false);

    if (VIEW) {                       // просмотр карты из Maps Browser
      phase = 'dev';
      $('gTimeBox').style.display = 'none';
        $('gChat').style.display = 'none';
      $('gRate').style.display = 'flex';
      fetch('/getMapData?author=' + encodeURIComponent(VAUTH || '') + '&mapName=' + encodeURIComponent(VIEW))
        .then(function (r) { return r.json(); })
        .then(function (d) {
          showMap(d ? { mapName: VIEW, author: VAUTH, mapData: d } : null);
        })
        .catch(function () { showMap(null); });
      return;
    }

    connect();

    if (MODE === 'hideAndSeek') {
      phase = 'lobby'; phaseEnds = Date.now() + LOBBY_MS;
      banner('Ожидание игроков', 'Роли распределятся через 30 секунд.', true);
      setTimeout(function () { banner('', '', false); }, 3500);
    } else {
      phase = 'round'; phaseEnds = Date.now() + ROUND_MS;
    }
    nextMap();
  }

  // ---------- монеты на аккаунт ----------
  var coinsSent = 0;
  setInterval(function () {
    if (VIEW || !GAME.playing) return;
    var have = GAME.coins || 0;
    if (have <= coinsSent) return;
    var delta = have - coinsSent;
    coinsSent = have;
    fetch('/addCoins', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'coins=' + delta
    }).then(function (r) { return r.json(); }).then(function (r) {
      if (r && r.status === 'success') log('+' + delta + ' монет (всего ' + r.coins + ')');
    }).catch(function () {});
  }, 2500);

  // ---------- сеть ----------
  function connect() {
    socket = io();

    socket.on('connect', function () {
      Promise.all([
        fetch('/iSigned', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).catch(function () { return null; }),
        ROOM ? Promise.resolve({ room: ROOM })
             : fetch('/getBestRoom?mode=' + encodeURIComponent(MODE)).then(function (r) { return r.json(); })
                 .catch(function () { return { room: 'room1' }; })
      ]).then(function (res) {
        var signed = res[0], pick = res[1];
        me.name = (signed && signed.data && !signed.data.guest) ? signed.data.name : guestName();
        ROOM = pick.room || 'room1';
        socket.emit('join', { playerName: me.name, gameMode: MODE, room: ROOM });
      });
    });

    socket.on('playersList', function (list) {
      var seen = {};
      list.forEach(function (p) {
        if (p.id === socket.id) return;
        seen[p.id] = 1;
        others[p.id] = others[p.id] || { x: 0, y: 0, tx: 0, ty: 0 };
        others[p.id].name = p.name;
      });
      Object.keys(others).forEach(function (id) { if (!seen[id]) delete others[id]; });
      $('gCount').textContent = Object.keys(others).length + 1;

      // искатель — тот, у кого наименьший id среди присутствующих
      if (MODE === 'hideAndSeek') {
        var ids = list.map(function (p) { return p.id; }).sort();
        setRole(ids.length && ids[0] === socket.id ? 'seeker' : 'hider');
      }
    });

    socket.on('playerJoined', function (p) {
      if (p.id === socket.id) return;
      others[p.id] = { x: 0, y: 0, tx: 0, ty: 0, name: p.name };
      log(esc(p.name) + ' зашёл', 's');
      $('gCount').textContent = Object.keys(others).length + 1;
    });

    socket.on('playerLeft', function (d) {
      if (others[d.playerId]) log(esc(others[d.playerId].name) + ' вышел', 's');
      delete others[d.playerId];
      $('gCount').textContent = Object.keys(others).length + 1;
    });

    socket.on('playerMoved', function (d) {
      var o = others[d.playerId]; if (!o) return;
      o.tx = d.position.x; o.ty = d.position.y;
      if (d.position.w) { o.w = d.position.w; o.h = d.position.h; }
      o.color = d.position.color || COLOR_NORMAL;
      if (d.position.sk !== undefined) o.skin = strToSkin(d.position.sk);
      // скин-картинка весит сотни килобайт, гонять её в каждом пакете нельзя —
      // запрашиваем один раз по нику и держим в кеше
      if (o.skin) {
        var pic = imgOf(o.name);
        if (pic) o.skin.img = pic;
      }
      o.say = d.position.say || '';
      o.fin = !!d.position.fin;
      o.hid = !!d.position.hid;
    });

    socket.on('chatMessage', function (m) {
      if (m.playerName !== me.name) speak(m.playerName, m.text);
      watchCaught(m.text);
    });
  }

  // ---------- отправка позиции и ловля ----------
  var lastSent = 0;
  setInterval(function () {
    if (!socket || !GAME.playing) return;
    var p = GAME.pl;
    var now = Date.now();
    if (now - lastSent < 70) return;
    lastSent = now;
    socket.emit('movePlayer', { position: {
      x: Math.round(p.x), y: Math.round(p.y), w: p.w, h: p.h,
      color: GAME.myColor || COLOR_NORMAL, say: typing || '', fin: !!GAME.done,
      sk: mySkinStr,
      hid: !!GAME.hidden          // сижу в укрытии — меня не рисуют у других
    }});

    checkAllFinished();

    // искатель ловит прячущихся касанием
    if (MODE === 'hideAndSeek' && me.role === 'seeker' && phase === 'round') {
      Object.keys(others).forEach(function (id) {
        var o = others[id];
        if (o.caught || o.hid) return;     // в укрытии игрока не поймать
        if (Math.abs(o.x - p.x) < 34 && Math.abs(o.y - p.y) < 60) {
          o.caught = true;
          caughtNames[o.name] = 1;
          socket.emit('sendChat', { text: o.name + ' пойман!' });
        }
      });
      checkAllCaught();
    }
  }, 60);

  /* Раунд заканчивается, как только пойманы все. Таймер после этого
     дотикивал впустую: искать было уже некого. */
  function checkAllCaught() {
    if (switching || phase !== 'round' || VIEW) return;
    var ids = Object.keys(others);
    if (!ids.length) return;                  // один в комнате — ловить некого
    for (var i = 0; i < ids.length; i++) if (!others[ids[i]].caught) return;

    switching = true;
    log('Все пойманы — раунд окончен!');
    if (socket) socket.emit('sendChat', { text: 'Все пойманы' });
    setTimeout(function () { switching = false; advance(); }, 1200);
  }

  // пойманным считает тот, кого назвали в чате
  function watchCaught(text) {
    if (MODE !== 'hideAndSeek' || me.role === 'seeker') return;
    /* Сообщение о поимке имеет вид «Имя пойман!». Сверяем именно эту
       форму: искать имя подстрокой нельзя — игрока с коротким именем
       помечало бы пойманным от любой чужой реплики. */
    var m = /^(.+?) пойман/.exec(text);
    if (!m) return;
    var who = m[1];
    if (who === me.name) { me.caught = true; applyColor(); }
    // чужие поимки тоже слышны: у прячущихся фигуры красятся синхронно
    Object.keys(others).forEach(function (id) {
      if (others[id].name === who) others[id].caught = true;
    });
  }

  // все дошли до финиша — не ждём таймер, ставим новую карту
  var switching = false;
  function checkAllFinished() {
    if (switching || phase !== 'round' || VIEW) return;
    if (!GAME.done) return;
    var ids = Object.keys(others);
    for (var i = 0; i < ids.length; i++) if (!others[ids[i]].fin) return;

    switching = true;
    log(ids.length ? 'Все на финише — новая карта!' : 'Финиш! Новая карта');
    setTimeout(function () {
      nextMap(function () {
        phaseEnds = Date.now() + ROUND_MS;
        switching = false;
      });
    }, 1400);
  }

  // ---------- отрисовка чужих игроков ----------
  GAME.onDraw = function (ctx) {
    Object.keys(others).forEach(function (id) {
      var o = others[id];
      o.x += (o.tx - o.x) * 0.3;
      o.y += (o.ty - o.y) * 0.3;
      // спрятался за объектом — ни фигуры, ни ника, ни реплики
      if (o.hid) return;
      var w = o.w || 22, h = o.h || 74;
      ctx.save();
      ctx.translate(o.x, o.y);
      GAME.figure(w, h, o.caught ? COLOR_CAUGHT : (o.color || COLOR_NORMAL), true, o.skin || null);
      ctx.restore();
      drawTag(ctx, o.name || '', o.say, o.x + w / 2, o.y, (o.h || 74));
    });
    var p = GAME.pl;
    if (GAME.playing && me.name) {
      // свой ник в укрытии показываем бледным — напоминание, что тебя не видно
      ctx.save();
      if (GAME.hidden) ctx.globalAlpha = 0.35;
      drawTag(ctx, me.name, typing, p.x + p.w / 2, p.y, p.h);
      ctx.restore();
    }
  };

  // имя — под игроком зелёным, реплика — над головой
  function drawTag(ctx, name, say, cx, topY, h) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '15px sans-serif';

    ctx.fillStyle = '#2e9b2e';
    ctx.fillText(name, cx, topY + h + 17);

    // отправленная реплика плавно уплывает вверх и тает —
    // и не пропадает от того, что игрок уже набирает следующую
    var list = spoken[name];
    if (list && list.length) {
      var now = Date.now();
      // отжившие убираем с головы: они самые старые
      while (list.length && now - list[0].born >= SAY_FADE) list.shift();
      if (!list.length) delete spoken[name];
      for (var si = 0; si < list.length; si++) {
        var sp = list[si];
        var k = (now - sp.born) / SAY_FADE;        // 0 → 1
        // каждая следующая реплика висит ниже предыдущей и не наезжает
        var lift = (list.length - 1 - si) * 15;
        /* Растворение занимает последние полсекунды жизни, а не четверть
           срока: так оно одинаково плавное и у долгих, и у состаренных
           досрочно реплик. */
        var outFrom = 1 - SAY_OUT / SAY_FADE;
        ctx.globalAlpha = k < outFrom ? 1 : Math.max(0, 1 - (k - outFrom) / (1 - outFrom));
        ctx.fillStyle = '#3a3a3a';
        ctx.fillText(sp.text, cx, topY - 16 - lift - k * 46);
      }
      ctx.globalAlpha = 1;
    }

    // то, что печатают прямо сейчас — ниже уплывающей реплики, чтобы не наложились
    if (say) {
      ctx.fillStyle = '#6b7280';
      ctx.fillText(say + '▏', cx, topY - 14);
    }
    ctx.restore();
  }

  // ---------- чат ----------
  // текст виден над головой прямо во время набора и пропадает по Enter
  var typing = '';
  var inp = $('gMsg');

  // Enter только отправляет: поле остаётся в фокусе, чтобы можно было
  // сразу писать дальше, а на телефоне не закрывалась клавиатура
  function clearTyping() {
    typing = ''; inp.value = '';
  }
  function stopTyping() {
    clearTyping(); inp.blur();
  }
  /* Одна дорога для всех способов отправки: Enter, кнопка и «Готово» на
     клавиатуре айфона. Раньше «Готово» просто снимало фокус, текст молча
     пропадал, а поле после этого не принимало ввод. */
  function sendTyped() {
    var v = inp.value.trim();
    clearTyping();
    if (!v) return false;
    speak(me.name, v);                      // своя реплика сразу уплывает
    if (socket) socket.emit('sendChat', { text: v });
    return true;
  }
  // крестик/Escape — единственный способ выбросить черновик

  inp.addEventListener('input', function () { typing = inp.value; });

  // Касание по полю не должно уходить в игровые обработчики,
  // иначе они гасят событие и поле теряет фокус.
  ['touchstart', 'touchend', 'mousedown', 'pointerdown'].forEach(function (t) {
    inp.addEventListener(t, function (e) { e.stopPropagation(); }, true);
  });
  inp.addEventListener('keydown', function (e) {
    // стрелки пропускаем дальше — ими игрок ходит прямо во время набора
    var move = e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp';
    if (!move) e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      sendTyped();                          // гасим набор, но фокус не теряем
    } else if (e.key === 'Escape') {
      e.preventDefault();
      stopTyping();
    }
  });
  /* Здесь был баг: по blur поле очищалось целиком. На телефоне фокус
     теряется от любого касания по экрану и от появления клавиатуры,
     поэтому набранное сообщение пропадало прямо во время печати.
     Теперь черновик сохраняется: над головой он просто перестаёт
     показываться, пока игрок не вернётся в поле. Стереть — Escape. */
  /* «Готово» на айфоне не даёт ни Enter, ни submit — только blur. Поэтому
     на blur отправляем то, что набрано: иначе текст исчезал бесследно.
     Escape и крестик перед уходом чистят поле сами, так что случайно
     отправить пустой черновик нельзя. */
  inp.addEventListener('blur', function () {
    if (inp.value.trim()) sendTyped();
    typing = '';
  });
  inp.addEventListener('focus', function () { typing = inp.value; });

  /* На айфоне поле в форме реагирует на «Готово» ещё и submit — гасим
     его, чтобы страница не перезагрузилась и ввод не залипал. */
  if (inp.form) inp.form.addEventListener('submit', function (e) {
    e.preventDefault(); sendTyped();
  });

  // на телефоне клавиатуры нет — вызываем её кнопкой
  var talk = $('gTalk');
  if (talk) talk.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    inp.focus();
    var v = inp.value;
    try { inp.setSelectionRange(v.length, v.length); } catch (err) {}
    typing = v;
  });

  // любая печатная клавиша начинает реплику
  document.addEventListener('keydown', function (e) {
    if (document.activeElement === inp) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key.length !== 1) return;
    if (e.key === ' ') return;                  // пробел — прыжок
    inp.focus();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && document.activeElement !== $('gMsg')) {
      e.preventDefault(); $('gMsg').focus();
    }
  });

  // ---------- оценка карты (только просмотр из Maps Browser) ----------
  $('gRate').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || !currentMap) return;
    fetch('/uploadVote', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'author=' + encodeURIComponent(currentMap.author) +
            '&mapName=' + encodeURIComponent(currentMap.mapName) +
            '&vote=' + b.dataset.v
    }).then(function (r) { return r.json(); }).then(function (r) {
      $('gRating').textContent = (r.status === 'success') ? ('рейтинг: ' + r.rating) : (r.message || 'ошибка');
    }).catch(function () { $('gRating').textContent = 'сервер недоступен'; });
  });

  // сенсорное управление берёт на себя движок:
  // при касании он сам показывает кнопки ◀ ▶ JUMP внизу экрана

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
