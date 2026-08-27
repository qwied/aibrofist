/* Общая шапка для собственных страниц AIBrofist (Skin Editor, Skins Browser, Avatar).
   Одинаково работает на телефоне и на компьютере. */
(function () {
  'use strict';

  var LINKS = [
    { key: 'leaderboard', href: 'leaderboard.html', txt: 'Leaderboard' },
    { key: 'mapEditor',   href: 'editor.html',      txt: 'Map Editor' },
    { key: 'skinEditor',  href: 'skinEditor.html',  txt: 'Skin Editor' },
    { key: 'mapsBrowser', href: 'mapsBrowser.html', txt: 'Maps Browser' },
    { key: 'skinsBrowser',href: 'skinsBrowser.html',txt: 'Skins Browser' },
    { key: 'avatar',      href: 'avatar.html',      txt: 'Avatar' },
    { key: 'logs',        href: 'logs.html',        txt: 'Logs' }
  ];

  var MARK = '<span class="bfBrandMark"><i></i><i></i></span>';

  function build(active) {
    var h = document.createElement('div');
    h.className = 'bfHead';
    h.innerHTML =
      '<a class="bfBrand" href="/">' + MARK + '<b>AIBROFIST</b></a>' +
      '<nav class="bfNav">' +
        LINKS.map(function (l) {
          return '<a href="' + l.href + '" data-i18n="' + l.key + '"' +
                 (l.href === active ? ' class="on"' : '') + '>' + l.txt + '</a>';
        }).join('') +
      '</nav>' +
      '<div class="bfRight">' +
        '<span class="bfCoin" id="bfHeadCoins" style="display:none">' +
          (window.BFCoin ? BFCoin.svg(17) : '') + ' <span>0</span></span>' +
        '<div class="bfAvatar" id="bfHeadAvatar" title="Профиль">' + MARK + '</div>' +
      '</div>';
    document.body.insertBefore(h, document.body.firstChild);

    h.querySelector('#bfHeadAvatar').onclick = function () {
      fetch('/whoAmI', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && !d.guest) location.href = 'users.html?name=' + encodeURIComponent(d.name);
          else if (window.bfOpenAuth) window.bfOpenAuth();
        }).catch(function () {});
    };

    fetch('/whoAmI', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || d.guest) return;
        var c = h.querySelector('#bfHeadCoins');
        c.style.display = 'flex';
        c.querySelector('span').textContent = d.coins;
        window.BF_ME = d;
      }).catch(function () {});

    return h;
  }

  function boot() {
    var active = (location.pathname.split('/').pop() || '').toLowerCase();
    var match = LINKS.filter(function (l) { return l.href.toLowerCase() === active; })[0];
    build(match ? match.href : '');
    if (window.I18N) I18N.apply(document.body);
  }

  window.BFShell = { refreshCoins: function (n) {
    var c = document.getElementById('bfHeadCoins');
    if (c) { c.style.display = 'flex'; c.querySelector('span').textContent = n; }
  } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
