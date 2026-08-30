/* AIBROFIST — единая верхняя панель для всех страниц.
   Раньше шапок было две: собственная на моих страницах и вендорная на
   остальных. Они выглядели по-разному, а на части страниц ещё и
   дорисовывались скриптами — оттого меню то появлялось, то исчезало.
   Теперь панель одна и строится здесь, а вендорная прячется. */
(function () {
  'use strict';

  var LINKS = [
    { key: 'leaderboard',  href: 'leaderboard.html',  txt: 'Leaderboard' },
    { key: 'mapEditor',    href: 'editor.html',       txt: 'Map Editor' },
    { key: 'skinEditor',   href: 'skinEditor.html',   txt: 'Skin Editor' },
    { key: 'mapsBrowser',  href: 'mapsBrowser.html',  txt: 'Maps Browser' },
    { key: 'skinsBrowser', href: 'skinsBrowser.html', txt: 'Skins Browser' },
    { key: 'avatar',       href: 'avatar.html',       txt: 'Avatar' },
    { key: 'logs',         href: 'logs.html',         txt: 'Logs' }
  ];

  // то, что не помещается в строку, уходит в «Меню»
  var MENU = [
    { key: 'twoPlayer',   href: 'two-player.html',     txt: 'Two Player Adventure' },
    { key: 'hideAndSeek', href: 'hide-and-seek.html',  txt: 'Hide and Seek' },
    { key: 'sandbox',     href: 'sandbox.html',        txt: 'Sandbox' },
    { key: 'race',        href: 'game.html?mode=race', txt: 'Race' },
    { sep: true },
    { key: 'skinsBrowser', href: 'skinsBrowser.html',  txt: 'Skins Browser' },
    { key: 'logs',         href: 'logs.html',          txt: 'Logs' },
    { txt: 'Telegram', href: 'https://t.me/aibrofist', ext: true }
  ];

  var MARK = '<span class="bfBrandMark"><i></i><i></i></span>';
  var me = null;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function link(l, cls) {
    var a = el('a', cls || '');
    a.href = l.href;
    a.textContent = l.txt;
    if (l.key) a.setAttribute('data-i18n', l.key);
    if (l.ext) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }

  function build() {
    // прячем вендорную шапку, чтобы не было двух панелей сразу
    var old = document.querySelector('.header');
    if (old) old.style.display = 'none';

    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    var head = el('div', 'bfHead');
    head.id = 'bfHead';

    var brand = el('a', 'bfBrand', MARK + '<b>AIBROFIST</b>');
    brand.href = '/';
    head.appendChild(brand);

    var nav = el('nav', 'bfNav');
    LINKS.forEach(function (l) {
      var a = link(l);
      if (l.href.toLowerCase() === here) a.className = 'on';
      nav.appendChild(a);
    });

    var menuBtn = el('button', 'bfMenuBtn');
    menuBtn.type = 'button';
    menuBtn.textContent = 'Menu';
    menuBtn.setAttribute('data-i18n', 'menu');
    nav.appendChild(menuBtn);
    head.appendChild(nav);

    var right = el('div', 'bfRight');
    right.innerHTML =
      '<span class="bfCoin" id="bfHeadCoins" style="display:none">' +
        (window.BFCoin ? BFCoin.svg(17) : '') + ' <span>0</span></span>';
    var ava = el('div', 'bfAvatar');
    ava.id = 'bfHeadAvatar';
    ava.innerHTML = MARK;
    right.appendChild(ava);
    head.appendChild(right);

    document.body.insertBefore(head, document.body.firstChild);

    // ---------- выпадающее «Меню» ----------
    var drop = el('div', 'bfDrop');
    drop.id = 'bfDrop';
    MENU.forEach(function (l) {
      if (l.sep) { drop.appendChild(el('div', 'bfDropSep')); return; }
      drop.appendChild(link(l, 'bfDropItem'));
    });
    document.body.appendChild(drop);

    menuBtn.onclick = function (e) {
      e.stopPropagation();
      closeAll(drop);
      drop.classList.toggle('open');
    };

    // ---------- меню профиля ----------
    var prof = el('div', 'bfDrop bfProf');
    prof.id = 'bfProf';
    document.body.appendChild(prof);

    ava.onclick = function (e) {
      e.stopPropagation();
      closeAll(prof);
      fillProfile(prof);
      prof.classList.toggle('open');
    };

    document.addEventListener('click', function () { closeAll(null); });
    drop.addEventListener('click', function (e) { e.stopPropagation(); });
    prof.addEventListener('click', function (e) { e.stopPropagation(); });

    return head;
  }

  function closeAll(except) {
    ['bfDrop', 'bfProf'].forEach(function (id) {
      var d = document.getElementById(id);
      if (d && d !== except) d.classList.remove('open');
    });
  }

  function T(k, f) {
    return (window.I18N && I18N.t(k) !== k) ? I18N.t(k) : f;
  }

  function fillProfile(box) {
    box.innerHTML = '';
    if (!me || me.guest) {
      var inBtn = el('div', 'bfDropItem', T('signin', 'Войти'));
      inBtn.onclick = function () {
        closeAll(null);
        if (window.bfOpenAuth) window.bfOpenAuth();
        else if (window.BFAuth && BFAuth.open) BFAuth.open();
        else location.href = '/';
      };
      box.appendChild(inBtn);
      return;
    }
    var name = el('div', 'bfDropName', me.name);
    box.appendChild(name);

    var p = el('div', 'bfDropItem', T('viewProfile', 'Мой профиль'));
    p.onclick = function () { location.href = 'users.html?name=' + encodeURIComponent(me.name); };
    box.appendChild(p);

    var st = el('div', 'bfDropItem', T('settings', 'Настройки'));
    st.onclick = function () {
      closeAll(null);
      if (window.bfOpenSettings) window.bfOpenSettings();
      else if (window.BFAuth && BFAuth.settings) BFAuth.settings();
    };
    box.appendChild(st);

    var out = el('div', 'bfDropItem bfDropOut', T('logout', 'Выйти'));
    out.onclick = function () {
      fetch('/logOut', { method: 'POST', credentials: 'same-origin' })
        .then(function () { location.reload(); })
        .catch(function () { location.reload(); });
    };
    box.appendChild(out);
  }

  function loadMe() {
    fetch('/whoAmI', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        me = d || { guest: true };
        window.BF_ME = me;
        if (!me.guest) {
          var c = document.getElementById('bfHeadCoins');
          if (c) {
            c.style.display = 'inline-flex';
            c.querySelector('span').textContent = me.coins;
          }
        }
        window.dispatchEvent(new CustomEvent('bf-shell-ready', { detail: me }));
      })
      .catch(function () { me = { guest: true }; });
  }

  function boot() {
    if (document.getElementById('bfHead')) return;
    build();
    loadMe();
    if (window.I18N) I18N.apply(document.body);
    // вендорный код может дорисовать свою шапку позже — прячем и её
    try {
      new MutationObserver(function () {
        var v = document.querySelector('.header');
        if (v && v.style.display !== 'none') v.style.display = 'none';
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }

  window.BFShell = {
    refreshCoins: function (n) {
      var c = document.getElementById('bfHeadCoins');
      if (c) { c.style.display = 'inline-flex'; c.querySelector('span').textContent = n; }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
