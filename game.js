/* ======= Игровой слой AIBrofist =======
   Работает поверх движка редактора (window.GAME).
   Режимы: twoPlayer, hideAndSeek, sandbox, race. */
(function () {
  'use strict';

  var q      = new URLSearchParams(location.search);
  var MODE   = q.get('mode') || 'sandbox';
  var ROOM   = q.get('room') || null;
  var VIEW   = q.get('view');                 // просмотр одной карты из Maps Browser
  var VAUTH  = q.get('author');

  var ROUND_MS  = 120000;   // раунд — 2 минуты
  var LOBBY_MS  = 30000;    // ожидание в Hide and Seek — 30 секунд
  var SANDBOX_MS = 60000;   // в Sandbox карта меняется каждую минуту

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
    + '#gHint{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:59;'
    + 'background:rgba(0,0,0,.5);color:#fff;padding:5px 13px;border-radius:14px;font:11.5px sans-serif;pointer-events:none}'
    + 'html.is-mobile #gHint,html.is-tablet #gHint{display:none}'
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
      '<div id="gTop"><span id="gRoleBox" style="display:none">🎭 <b id="gRole"></b></span>'
    + '<span>👥 <b id="gCount">1</b></span>'
    + '<span id="gTimeBox">⏱️ <b id="gTime">—</b></span>'
    + '<button id="gExit">← Меню</button></div>'
    + '<div id="gMap"><div class="n" id="gMapName">Загрузка карты…</div>'
    + '<div class="a" id="gMapAuthor"></div><div class="rate" id="gRate" style="display:none">'
    + '<button data-v="1">👍</button><button data-v="-1">👎</button>'
    + '<span id="gRating" style="color:#6b7280"></span></div></div>'
    + '<div id="gBanner"><h2 id="gbT"></h2><p id="gbP"></p></div>'
    + '<div id="gChat"><input id="gMsg" maxlength="90"></div>'
    + '<div id="gHint">Просто печатай, чтобы говорить · Enter — отправить · A/D или ←→ — идти · W / ↑ / Пробел — прыжок</div>'
    + '<button id="gTalk">💬</button>'
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
  var SAY_FADE = 2000;
  var spoken = {};
  function speak(who, text) {
    if (!text) return;
    spoken[who] = { text: text, born: Date.now() };
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
    var u = '/getRandomMap?mapType=' + encodeURIComponent(MODE === 'sandbox' ? 'sandbox' : MODE)
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
        banner('', '', false);
        log('Раунд начался! 2 минуты', 's');
        if (socket) socket.emit('sendChat', { text: '⏱️ раунд начался' });
      } else {
        phase = 'lobby'; phaseEnds = Date.now() + LOBBY_MS;
        me.caught = false; applyColor();
        nextMap();
        banner('Раунд окончен', 'Новая карта. До старта 30 секунд.', true);
        setTimeout(function () { banner('', '', false); }, 3000);
      }
    } else if (MODE === 'twoPlayer' || MODE === 'race') {
      phaseEnds = Date.now() + ROUND_MS;
      nextMap();
      log('Время вышло — следующая карта');
    } else if (MODE === 'sandbox') {
      phaseEnds = Date.now() + SANDBOX_MS;
      nextMap();
    }
  }

  // ---------- запуск по режимам ----------
  function boot() {
    GAME.setGrid(false);

    if (VIEW) {                       // просмотр карты из Maps Browser
      phase = 'dev';
      $('gTimeBox').style.display = 'none';
        $('gChat').style.display = 'none';
      $('gHint').style.display = 'none';
      $('gRate').style.display = 'flex';
      fetch('/getMapData?author=' + encodeURIComponent(VAUTH || '') + '&mapName=' + encodeURIComponent(VIEW))
        .then(function (r) { return r.json(); })
        .then(function (d) {
          showMap(d ? { mapName: VIEW, author: VAUTH, mapData: d } : null);
        });
      return;
    }

    connect();

    if (MODE === 'hideAndSeek') {
      phase = 'lobby'; phaseEnds = Date.now() + LOBBY_MS;
      banner('Ожидание игроков', 'Роли распределятся через 30 секунд.', true);
      setTimeout(function () { banner('', '', false); }, 3500);
    } else if (MODE === 'twoPlayer' || MODE === 'race') {
      phase = 'round'; phaseEnds = Date.now() + ROUND_MS;
    } else {
      phase = 'round'; phaseEnds = Date.now() + SANDBOX_MS;
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
      if (r && r.status === 'success') log('+' + delta + ' 🪙 (всего ' + r.coins + ')');
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
      o.say = d.position.say || '';
      o.fin = !!d.position.fin;
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
      color: GAME.myColor || COLOR_NORMAL, say: typing || '', fin: !!GAME.done
    }});

    checkAllFinished();

    // искатель ловит прячущихся касанием
    if (MODE === 'hideAndSeek' && me.role === 'seeker' && phase === 'round') {
      Object.keys(others).forEach(function (id) {
        var o = others[id];
        if (o.caught) return;
        if (Math.abs(o.x - p.x) < 34 && Math.abs(o.y - p.y) < 60) {
          o.caught = true;
          socket.emit('sendChat', { text: '🟠 ' + o.name + ' пойман!' });
        }
      });
    }
  }, 60);

  // пойманным считает тот, кого назвали в чате
  function watchCaught(text) {
    if (MODE !== 'hideAndSeek' || me.role === 'seeker') return;
    if (text.indexOf('пойман') !== -1 && text.indexOf(me.name) !== -1) {
      me.caught = true; applyColor();
    }
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
        phaseEnds = Date.now() + (MODE === 'sandbox' ? SANDBOX_MS : ROUND_MS);
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
      var w = o.w || 22, h = o.h || 74;
      ctx.save();
      ctx.translate(o.x, o.y);
      GAME.figure(w, h, o.caught ? COLOR_CAUGHT : (o.color || COLOR_NORMAL), true);
      ctx.restore();
      drawTag(ctx, o.name || '', o.say, o.x + w / 2, o.y, (o.h || 74));
    });
    var p = GAME.pl;
    if (GAME.playing && me.name) drawTag(ctx, me.name, typing, p.x + p.w / 2, p.y, p.h);
  };

  // имя — под игроком зелёным, реплика — над головой
  function drawTag(ctx, name, say, cx, topY, h) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '15px sans-serif';

    ctx.fillStyle = '#2e9b2e';
    ctx.fillText(name, cx, topY + h + 17);

    if (say) {
      // то, что печатают прямо сейчас — чётко и на месте
      ctx.fillStyle = '#3a3a3a';
      ctx.fillText(say, cx, topY - 14);
    } else {
      var sp = spoken[name];
      if (sp) {
        var age = Date.now() - sp.born;
        if (age >= SAY_FADE) { delete spoken[name]; }
        else {
          var k = age / SAY_FADE;                 // 0 → 1
          ctx.globalAlpha = 1 - k * k;            // тает к концу быстрее
          ctx.fillStyle = '#3a3a3a';
          ctx.fillText(sp.text, cx, topY - 14 - k * 34);   // уплывает вверх
          ctx.globalAlpha = 1;
        }
      }
    }
    ctx.restore();
  }

  // ---------- чат ----------
  // текст виден над головой прямо во время набора и пропадает по Enter
  var typing = '';
  var inp = $('gMsg');

  function stopTyping() {
    typing = ''; inp.value = ''; inp.blur();
  }

  inp.addEventListener('input', function () { typing = inp.value; });
  inp.addEventListener('keydown', function (e) {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      var v = inp.value.trim();
      stopTyping();                         // сначала гасим набор, чтобы текст не задвоился
      if (v) {
        speak(me.name, v);                  // своя реплика сразу уплывает
        if (socket) socket.emit('sendChat', { text: v });
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      stopTyping();
    }
  });
  inp.addEventListener('blur', function () { typing = ''; inp.value = ''; });

  // на телефоне клавиатуры нет — вызываем её кнопкой
  var talk = $('gTalk');
  if (talk) talk.addEventListener('click', function (e) {
    e.preventDefault();
    inp.focus();
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
    });
  });

  // сенсорное управление берёт на себя движок:
  // при касании он сам показывает кнопки ◀ ▶ JUMP внизу экрана

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
