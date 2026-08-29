/* Навигация главного меню AIBrofist
   В исходном index.html все ссылки заглушены (href="#"), поэтому назначаем их здесь.
   Кнопка Menu открывает список разделов и доступна всем, включая гостей. */
(function () {
  'use strict';

  var ROUTES = {
    'two player adventure': 'two-player.html',
    'hide and seek':        'hide-and-seek.html',
    'sandbox':              'sandbox.html',
    'race':                 { play: 'race' },
    'map editor':           'editor.html',
    'editor':               'editor.html',
    'skin editor':          'skinEditor.html',
    'редактор скинов':      'skinEditor.html',
    'maps browser':         'mapsBrowser.html',
    'browser':              'mapsBrowser.html',
    'skins browser':        'skinsBrowser.html',
    'обзор скинов':         'skinsBrowser.html',
    'shop':                 'avatar.html',
    'магазин':              'avatar.html',
    'logs':                 'logs.html',
    'новости':              'logs.html',
    'avatar':               'avatar.html',
    'аватар':               'avatar.html',
    'leaderboards':         'leaderboard.html',
    'leaderboard':          'leaderboard.html',
    'таблица лидеров':      'leaderboard.html',
    'supporters':           'leaderboard.html',
    'editor tutorial':      'editor.html',
    'privacy policy':       'logs.html',
    'terms & conditions':   'logs.html'
  };

  var MENU_LABELS = ['menu', 'меню', 'menü', 'menú', '菜单'];

  function go(target) {
    if (typeof target === 'string') { location.href = target; return; }
    if (target && target.play) location.href = 'game.html?mode=' + target.play;
  }

  function toast(text) {
    var t = document.createElement('div');
    t.textContent = text;
    t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:9999;' +
      'background:rgba(0,0,0,.82);color:#fff;padding:11px 20px;border-radius:20px;font-size:14px;' +
      'font-family:sans-serif;pointer-events:none';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1800);
  }

  function label(el) {
    return (el.textContent || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }
  function isMenu(el) {
    return MENU_LABELS.indexOf(label(el)) !== -1 || el.id === 'menuButton';
  }

  function overlay(show) {
    var ov = document.getElementById('moreLinksOverlay');
    var box = document.getElementById('moreLinksContainer');
    if (ov) ov.style.display = show ? 'block' : 'none';
    if (box) box.style.display = show ? 'block' : 'none';
  }

  // в списке Menu не хватало Skin Editor, Logs и Leaderboards — добавляем
  function fillMenu() {
    var box = document.querySelector('#moreLinksContainer .header-more-links-subcontainer');
    if (!box) return;
    var have = {};
    Array.prototype.forEach.call(box.querySelectorAll('.header-more-link-button'), function (a) {
      have[label(a)] = true;
    });
    [['Skin Editor', 'skinEditor.html'], ['Skins Browser', 'skinsBrowser.html'],
     ['Logs', 'logs.html'], ['Leaderboards', 'leaderboard.html'],
     ['Telegram', 'https://t.me/aibrofist']].forEach(function (pair) {
      if (have[pair[0].toLowerCase()]) return;
      var a = document.createElement('a');
      a.className = 'header-more-link-button';
      a.href = pair[1];
      a.textContent = pair[0];
      if (pair[1].indexOf('http') === 0) { a.target = '_blank'; a.rel = 'noopener'; }
      box.appendChild(a);
    });
  }

  // На телефоне нет наведения мышью, поэтому подменю «Editor» и «Browser»
  // не открывались вовсе — их пункты выглядели нерабочими. Открываем по клику.
  function wireSubMenus() {
    var items = document.querySelectorAll('.header-link-item');
    Array.prototype.forEach.call(items, function (item) {
      var sub = item.querySelector('.header-link-item-sub-menu');
      var btn = item.querySelector('.header-link-item-button');
      if (!sub || !btn || item.__subWired) return;
      item.__subWired = true;

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = sub.style.display === 'block';
        Array.prototype.forEach.call(
          document.querySelectorAll('.header-link-item-sub-menu'),
          function (x) { x.style.display = 'none'; }
        );
        sub.style.display = open ? 'none' : 'block';
      });
      sub.addEventListener('click', function (e) { e.stopPropagation(); });
    });

    if (!document.__subCloser) {
      document.__subCloser = true;
      document.addEventListener('click', function () {
        Array.prototype.forEach.call(
          document.querySelectorAll('.header-link-item-sub-menu'),
          function (x) { x.style.display = 'none'; }
        );
      });
    }
  }

  function wireNav() {
    Array.prototype.forEach.call(document.querySelectorAll('.card'), function (card) {
      var title = card.querySelector('div');
      var dest = ROUTES[label(title || card)];
      card.style.cursor = 'pointer';
      card.addEventListener('click', function (e) {
        e.preventDefault();
        if (dest) go(dest);
        else toast(window.I18N ? I18N.t('notReady') : 'Этот режим ещё не готов');
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll(
      '.header-link-item-button, .header-link-a, .header-link-item-sub-menu a, .header-more-link-button'
    ), function (el) {
      if (el.__navWired) return;
      el.__navWired = true;
      el.style.cursor = 'pointer';

      // кнопку с подменю не превращаем в ссылку — ей управляет wireSubMenus
      if (el.classList.contains('header-link-item-button') &&
          el.parentNode && el.parentNode.querySelector('.header-link-item-sub-menu')) {
        return;
      }

      if (isMenu(el)) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          overlay(true);
        });
        return;
      }

      // внешняя ссылка (Telegram) открывается как обычная ссылка
      if (el.tagName === 'A' && /^https?:/.test(el.getAttribute('href') || '')) {
        el.addEventListener('click', function () { overlay(false); });
        return;
      }

      var dest = ROUTES[label(el)];
      el.addEventListener('click', function (e) {
        e.preventDefault();
        overlay(false);
        if (dest) go(dest);
        else toast(window.I18N ? I18N.t('notReady') : 'Этот раздел ещё не готов');
      });
    });

    var cross = document.getElementById('moreLinksClose');
    var ov = document.getElementById('moreLinksOverlay');
    if (cross) cross.addEventListener('click', function () { overlay(false); });
    if (ov) ov.addEventListener('click', function () { overlay(false); });
  }

  function ensureSignIn() {
    if (document.querySelector('.auth-buttons')) return;
    var box = document.querySelector('.profile-container');
    if (!box) return;
    var b = document.createElement('div');
    b.className = 'auth-buttons';
    b.textContent = 'Sign in';
    b.style.cssText = 'float:right;padding:14px 16px;text-align:center;color:#000;cursor:pointer;display:inherit';
    box.appendChild(b);
  }

  function boot() {
    ensureSignIn(); fillMenu(); wireSubMenus(); wireNav();
    if (window.I18N) I18N.apply(document.body);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
