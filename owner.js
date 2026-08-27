/* AIBROFIST — инструменты владельца сайта.
   Всё, что тут есть, видно и работает ТОЛЬКО для аккаунта-владельца:
   сервер повторно проверяет права на каждый запрос, кнопки — лишь удобная обёртка. */
(function () {
  'use strict';

  var me = { owner: false, name: '', ownerName: 'AIBrofist' };
  var inGame = {};          // "автор::карта" -> true
  var T = function (k, fallback) {
    return (window.I18N && window.I18N.t(k) !== k) ? I18N.t(k) : (fallback || k);
  };
  var keyOf = function (a, m) {
    return String(a || '').toLowerCase() + '::' + String(m || '').toLowerCase();
  };

  function post(url, data) {
    var body = Object.keys(data).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
    }).join('&');
    return fetch(url, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body
    }).then(function (r) { return r.json(); });
  }
  function get(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) { return r.json(); });
  }

  /* ---------- стили ---------- */
  var css = ''
    + '.ow-fab{position:fixed;right:18px;bottom:18px;z-index:9997;width:52px;height:52px;border-radius:50%;'
    + 'background:#111827;color:#fff;border:none;font-size:22px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.32)}'
    + '.ow-fab:hover{background:#2196F3}'
    + '.ow-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:none}'
    + '.ow-box{position:fixed;inset:0;margin:auto;width:340px;max-height:86vh;overflow:auto;height:max-content;'
    + 'background:#fff;border:3px solid #c5c5c5;border-radius:10px;padding:22px 24px 18px;z-index:9999;'
    + 'display:none;font-family:sans-serif;color:#2d2d2d;box-sizing:border-box}'
    + '.ow-x{position:absolute;right:6px;top:5px;border:1px solid;border-radius:30px;font-size:14px;'
    + 'padding:3px 8px;color:red;background:#fff;cursor:pointer;line-height:1}'
    + '.ow-h{text-align:center;font-size:16px;color:#5b5b5b;margin:2px 0 10px}'
    + '.ow-sub{font-size:13px;font-weight:bold;color:#374151;margin:14px 0 6px;'
    + 'border-top:1px solid #e6ebf0;padding-top:12px}'
    + '.ow-i{border:1px solid #2b2b2b;border-radius:4px;font-size:15px;padding:9px 10px;margin:6px 0;'
    + 'display:block;width:100%;box-sizing:border-box}'
    + '.ow-b{border:1px solid #2196F3;border-radius:4px;text-align:center;font-size:15px;padding:9px 0;'
    + 'margin:7px 0;display:block;width:100%;background:#fff;color:#2196F3;cursor:pointer}'
    + '.ow-b:hover{background:#2196F3;color:#fff}'
    + '.ow-m{text-align:center;font-size:12.5px;min-height:16px;margin-top:2px}'
    + '.ow-row2{display:flex;gap:8px}.ow-row2 .ow-i{margin:6px 0}'
    + '.ow-tag{display:inline-block;border:1px solid;border-radius:5px;padding:3px 8px;font-size:12px;'
    + 'cursor:pointer;margin-left:5px;background:#fff;white-space:nowrap}'
    + '.ow-tag.add{border-color:#2e9b2e;color:#2e9b2e}.ow-tag.add:hover{background:#2e9b2e;color:#fff}'
    + '.ow-tag.on{border-color:#2e9b2e;background:#2e9b2e;color:#fff}'
    + '.ow-tag.vote{border-color:#d97706;color:#d97706}.ow-tag.vote:hover{background:#d97706;color:#fff}';

  function injectCss() {
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ---------- панель ---------- */
  var ov, box;

  function buildPanel() {
    ov = document.createElement('div'); ov.className = 'ow-ov';
    box = document.createElement('div'); box.className = 'ow-box';
    document.body.appendChild(ov); document.body.appendChild(box);
    ov.onclick = close;

    var fab = document.createElement('button');
    fab.className = 'ow-fab';
    fab.title = T('ownerTools', 'Инструменты владельца');
    fab.textContent = '🛠';
    fab.onclick = open;
    document.body.appendChild(fab);
  }

  function close() { ov.style.display = 'none'; box.style.display = 'none'; }

  function open() {
    box.innerHTML =
        '<div class="ow-x">X</div>'
      + '<div class="ow-h">' + T('ownerTools', 'Инструменты владельца') + ' · ' + me.name + '</div>'

      + '<div class="ow-sub">🪙 ' + T('giveCoins', 'Выдать монеты') + '</div>'
      + '<input class="ow-i" id="owCName" placeholder="' + T('playerName', 'Ник игрока') + '">'
      + '<div class="ow-row2">'
      +   '<input class="ow-i" id="owCAmt" type="number" placeholder="' + T('amount', 'Количество') + '">'
      +   '<select class="ow-i" id="owCMode">'
      +     '<option value="add">+ добавить</option><option value="set">= установить</option>'
      +   '</select>'
      + '</div>'
      + '<div class="ow-b" id="owCGo">' + T('apply', 'Применить') + '</div>'
      + '<div class="ow-m" id="owCMsg"></div>'

      + '<div class="ow-sub">👍 ' + T('boostVotes', 'Накрутка оценок') + '</div>'
      + '<input class="ow-i" id="owVAuthor" placeholder="' + T('colAuthor', 'Автор') + '">'
      + '<input class="ow-i" id="owVMap" placeholder="' + T('colName', 'Название карты') + '">'
      + '<div class="ow-row2">'
      +   '<input class="ow-i" id="owVLikes" type="number" min="0" placeholder="' + T('likes', 'Лайки') + '">'
      +   '<input class="ow-i" id="owVDis" type="number" min="0" placeholder="' + T('dislikes', 'Дизлайки') + '">'
      + '</div>'
      + '<div class="ow-b" id="owVGo">' + T('apply', 'Применить') + '</div>'
      + '<div class="ow-m" id="owVMsg"></div>'

      + '<div class="ow-sub">🎮 ' + T('addToGame', 'Добавить в игру') + '</div>'
      + '<div class="ow-m" style="text-align:left;color:#6b7280" id="owGList">…</div>';

    box.querySelector('.ow-x').onclick = close;

    box.querySelector('#owCGo').onclick = function () {
      var m = box.querySelector('#owCMsg');
      post('/owner/giveCoins', {
        name: box.querySelector('#owCName').value.trim(),
        coins: box.querySelector('#owCAmt').value.trim(),
        mode: box.querySelector('#owCMode').value
      }).then(function (r) {
        m.style.color = r.status === 'success' ? '#2e9b2e' : 'red';
        m.textContent = r.message || '';
      }).catch(function () { m.style.color = 'red'; m.textContent = T('serverDown', 'Сервер недоступен'); });
    };

    box.querySelector('#owVGo').onclick = function () {
      var m = box.querySelector('#owVMsg');
      post('/owner/setVotes', {
        author: box.querySelector('#owVAuthor').value.trim(),
        mapName: box.querySelector('#owVMap').value.trim(),
        likes: box.querySelector('#owVLikes').value.trim(),
        dislikes: box.querySelector('#owVDis').value.trim()
      }).then(function (r) {
        m.style.color = r.status === 'success' ? '#2e9b2e' : 'red';
        m.textContent = r.status === 'success'
          ? '👍 ' + r.likes + '   👎 ' + r.dislikes + '   → ' + r.rating
          : (r.message || T('errorTxt', 'Ошибка'));
      }).catch(function () { m.style.color = 'red'; m.textContent = T('serverDown', 'Сервер недоступен'); });
    };

    get('/owner/inGame').then(function (r) {
      var el = box.querySelector('#owGList');
      var list = (r && r.maps) || [];
      el.innerHTML = list.length
        ? list.map(function (x) {
            return '· ' + x.mapName + ' <span style="color:#9aa3ad">(' + x.author + ' · ' + x.mapType + ')</span>';
          }).join('<br>')
        : '<span style="color:#9aa3ad">пока ничего не добавлено</span>';
    }).catch(function () {});

    ov.style.display = 'block';
    box.style.display = 'block';
  }

  /* ---------- кнопки прямо в Maps Browser ---------- */
  function rowInfo(row) {
    var n = row.querySelector('.map-name-row');
    var a = row.querySelector('.map-author-row');
    if (!n || !a) return null;
    return { mapName: (n.textContent || '').trim(), author: (a.textContent || '').trim() };
  }

  function decorate(row) {
    if (!row || row.__owWired) return;
    var info = rowInfo(row);
    if (!info || !info.mapName) return;
    var host = row.querySelector('.play-button');
    host = host ? host.parentNode : row.lastElementChild;
    if (!host) return;
    row.__owWired = true;

    var on = !!inGame[keyOf(info.author, info.mapName)];

    var add = document.createElement('span');
    add.className = 'ow-tag add' + (on ? ' on' : '');
    add.textContent = on ? ('✔ ' + T('inGameTxt', 'В игре')) : ('➕ ' + T('addToGame', 'Добавить в игру'));
    add.onclick = function (e) {
      e.stopPropagation();
      var next = !add.classList.contains('on');
      add.textContent = '…';
      post('/owner/mapInGame', { author: info.author, mapName: info.mapName, on: String(next) })
        .then(function (r) {
          if (r.status !== 'success') { add.textContent = '⚠'; return; }
          inGame[keyOf(info.author, info.mapName)] = r.inGame;
          add.classList.toggle('on', r.inGame);
          add.textContent = r.inGame ? ('✔ ' + T('inGameTxt', 'В игре'))
                                     : ('➕ ' + T('addToGame', 'Добавить в игру'));
        })
        .catch(function () { add.textContent = '⚠'; });
    };

    var vote = document.createElement('span');
    vote.className = 'ow-tag vote';
    vote.textContent = '👍 ' + T('boostVotes', 'Оценки');
    vote.onclick = function (e) {
      e.stopPropagation();
      open();
      box.querySelector('#owVAuthor').value = info.author;
      box.querySelector('#owVMap').value = info.mapName;
      box.querySelector('#owVLikes').focus();
    };

    host.appendChild(add);
    host.appendChild(vote);
  }

  function scan() {
    var rows = document.querySelectorAll('.maps-row');
    for (var i = 0; i < rows.length; i++) decorate(rows[i]);
  }

  function watchBrowser() {
    get('/owner/inGame').then(function (r) {
      ((r && r.maps) || []).forEach(function (x) { inGame[keyOf(x.author, x.mapName)] = true; });
      scan();
    }).catch(scan);

    try {
      var mo = new MutationObserver(function () { scan(); });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {
      setInterval(scan, 1200);
    }
  }

  // ---------- инструменты владельца ----------
  function ownerPanel(host, linked, io) {
    var post = io.post, get = io.get;
    if (!host) return;
    host.innerHTML =
        '<div style="border-top:1px solid #e6ebf0;margin:12px 0 8px"></div>'
      + '<div class="bf-t" style="font-size:14px">Управление</div>'
      + '<input class="bf-i" id="bfRenFrom" placeholder="Чей ник менять">'
      + '<input class="bf-i" id="bfRenTo" placeholder="Новый ник" maxlength="20">'
      + '<div class="bf-b" id="bfRenGo">Сменить ник</div>'
      + '<div class="bf-e" id="bfRenMsg"></div>'
      + '<div class="bf-t" style="font-size:14px">Мои аккаунты</div>'
      + '<div id="bfLinked" style="font-size:13px;margin-bottom:6px"></div>'
      + '<input class="bf-i" id="bfLinkName" placeholder="Логин аккаунта">'
      + '<input class="bf-i" id="bfLinkPass" type="password" placeholder="Пароль от него">'
      + '<div class="bf-b" id="bfLinkGo">Привязать</div>'
      + '<div class="bf-e" id="bfLinkMsg"></div>'
      + '<div class="bf-t" style="font-size:14px">🪙 Выдать монеты</div>'
      + '<input class="bf-i" id="bfCoinName" placeholder="Ник игрока">'
      + '<input class="bf-i" id="bfCoinAmt" type="number" placeholder="Сколько монет">'
      + '<div class="bf-b" id="bfCoinGo">Начислить</div>'
      + '<div class="bf-e" id="bfCoinMsg"></div>'
      + '<div class="bf-t" style="font-size:14px">👍 Накрутка оценок карты</div>'
      + '<input class="bf-i" id="bfVAuthor" placeholder="Автор карты">'
      + '<input class="bf-i" id="bfVMap" placeholder="Название карты">'
      + '<input class="bf-i" id="bfVLikes" type="number" placeholder="Лайки">'
      + '<input class="bf-i" id="bfVDis" type="number" placeholder="Дизлайки">'
      + '<div class="bf-b" id="bfVGo">Применить</div>'
      + '<div class="bf-e" id="bfVMsg"></div>'
      + '<div class="bf-h">Карты добавляются в игровые режимы кнопкой «Добавить в игру» в Maps Browser.</div>';

    host.querySelector('#bfCoinGo').onclick = function () {
      var m = host.querySelector('#bfCoinMsg');
      post('/owner/giveCoins', {
        name: host.querySelector('#bfCoinName').value.trim(),
        coins: host.querySelector('#bfCoinAmt').value.trim(),
        mode: 'add'
      }, function (r) {
        m.style.color = (r.status === 'success') ? '#2e9b2e' : 'red';
        m.textContent = r.message || '';
      });
    };

    host.querySelector('#bfVGo').onclick = function () {
      var m = host.querySelector('#bfVMsg');
      post('/owner/setVotes', {
        author: host.querySelector('#bfVAuthor').value.trim(),
        mapName: host.querySelector('#bfVMap').value.trim(),
        likes: host.querySelector('#bfVLikes').value.trim(),
        dislikes: host.querySelector('#bfVDis').value.trim()
      }, function (r) {
        m.style.color = (r.status === 'success') ? '#2e9b2e' : 'red';
        m.textContent = (r.status === 'success')
          ? '👍 ' + r.likes + '  👎 ' + r.dislikes + '  → ' + r.rating
          : (r.message || 'Ошибка');
      });
    };

    function drawLinked(list) {
      var el = host.querySelector('#bfLinked');
      if (!list.length) { el.innerHTML = '<span style="color:#9aa3ad">пока ничего не привязано</span>'; return; }
      el.innerHTML = list.map(function (u) {
        return '<div style="display:flex;gap:6px;align-items:center;margin:4px 0">'
             + '<span style="flex:1">' + u.name + ' · ' + u.coins + ' 🪙</span>'
             + '<button data-go="' + u.name + '" style="border:1px solid #2196F3;background:#fff;'
             + 'color:#2196F3;border-radius:4px;padding:3px 9px;cursor:pointer">Войти</button>'
             + '<button data-rm="' + u.name + '" style="border:1px solid #e74c3c;background:#fff;'
             + 'color:#e74c3c;border-radius:4px;padding:3px 9px;cursor:pointer">×</button></div>';
      }).join('');
    }
    drawLinked(linked);

    host.querySelector('#bfRenGo').onclick = function () {
      post('/renameUser', {
        from: host.querySelector('#bfRenFrom').value.trim(),
        to: host.querySelector('#bfRenTo').value.trim()
      }, function (r) {
        var m = host.querySelector('#bfRenMsg');
        m.style.color = (r.status === 'success') ? '#2e9b2e' : 'red';
        m.textContent = r.message || '';
      });
    };

    host.querySelector('#bfLinkGo').onclick = function () {
      post('/owner/link', {
        name: host.querySelector('#bfLinkName').value.trim(),
        password: host.querySelector('#bfLinkPass').value
      }, function (r) {
        var m = host.querySelector('#bfLinkMsg');
        m.style.color = (r.status === 'success') ? '#2e9b2e' : 'red';
        m.textContent = r.message || '';
        if (r.status === 'success') {
          host.querySelector('#bfLinkName').value = '';
          host.querySelector('#bfLinkPass').value = '';
          get('/owner/accounts', function (x) { if (x && x.linked) drawLinked(x.linked); });
        }
      });
    };

    host.addEventListener('click', function (e) {
      var go = e.target.closest('[data-go]'), rm = e.target.closest('[data-rm]');
      if (go) post('/owner/switch', { name: go.dataset.go }, function (r) {
        if (r.status === 'success') location.reload();
        else host.querySelector('#bfLinkMsg').textContent = r.message || '';
      });
      if (rm) post('/owner/unlink', { name: rm.dataset.rm }, function () {
        get('/owner/accounts', function (x) { if (x && x.linked) drawLinked(x.linked); });
      });
    });
  }

  window.bfOwnerPanel = ownerPanel;

  /* ---------- старт ---------- */
  get('/whoAmI').then(function (r) {
    if (!r || !r.owner) return;      // не владелец — ничего не показываем
    me = r;
    injectCss();
    buildPanel();
    if (document.querySelector('.maps-table') ||
        /mapsBrowser/i.test(location.pathname)) watchBrowser();
  }).catch(function () {});
})();
