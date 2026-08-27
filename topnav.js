// Единый фикс верхнего меню для ВСЕХ страниц.
// Вендорные страницы (mapsBrowser, users, avatar…) рисуют шапку изнутри своих
// бандлов со старыми путями и без Leaderboard. Этот скрипт после загрузки
// правит ссылки на реальные файлы и добавляет пункт Leaderboard.
(function () {
  'use strict';

  // куда реально ведут разделы в нашей сборке
  var MAP = {
    'editor':        'editor.html',
    'map editor':    'editor.html',
    'skin editor':   'skinEditor.html',
    'редактор скинов':'skinEditor.html',
    'maps browser':  'mapsBrowser.html',
    'browser':       'mapsBrowser.html',
    'skins browser': 'skinEditor.html',
    'avatar':        'avatar.html',
    'shop':          'skinEditor.html',
    'магазин':       'skinEditor.html',
    'supporters':    'leaderboard.html',
    'editor tutorial':'editor.html',
    'leaderboard':   'leaderboard.html',
    'leaderboards':  'leaderboard.html',
    'logs':          'logs.html'
  };

  // Menu не ведёт на страницу — им управляет сам вендорный код
  var MENU_LABELS = ['menu', 'меню', 'menü', 'menú', '菜单'];

  function label(el) {
    return (el.textContent || '').trim().toLowerCase();
  }

  // навесить правильный переход на элемент меню
  function wire(el) {
    if (MENU_LABELS.indexOf(label(el)) !== -1) return;   // Menu не трогаем
    var dest = MAP[label(el)];
    if (!dest) return;
    if (el.tagName === 'A') el.setAttribute('href', dest);
    el.style.cursor = 'pointer';
    if (el.__wired) return;
    el.__wired = true;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      location.href = dest;
    });
  }

  // добавить кнопку Leaderboard в верхнюю панель, если её там нет
  function addLeaderboardButton(header) {
    var buttons = header.querySelectorAll('.header-link-item-button');
    for (var i = 0; i < buttons.length; i++) {
      if (label(buttons[i]) === 'leaderboard' || label(buttons[i]) === 'leaderboards') return;
    }
    // берём любой существующий пункт как образец разметки
    var sample = header.querySelector('.header-link-item');
    if (!sample) return;
    var item = sample.cloneNode(true);
    // очистить клон от подменю и лишнего
    var sub = item.querySelector('.header-link-item-sub-menu');
    if (sub) sub.parentNode.removeChild(sub);
    var btn = item.querySelector('.header-link-item-button') || item;
    btn.textContent = 'Leaderboard';
    btn.removeAttribute('href');
    // вставляем первым в контейнере ссылок
    var container = sample.parentNode;
    container.insertBefore(item, container.firstChild);
    wire(btn);
  }

  function fix() {
    var header = document.querySelector('.header');
    if (!header) return false;

    // 1) починить все существующие пункты
    var items = header.querySelectorAll(
      '.header-link-item-button, .header-link-a, .header-link-item-sub-menu a, .header-more-link-button'
    );
    for (var i = 0; i < items.length; i++) wire(items[i]);

    // 2) добавить Leaderboard в верхнюю панель
    addLeaderboardButton(header);
    // 3) Menu должен быть виден всем, даже на узком экране
    var items = header.querySelectorAll('.header-link-item');
    for (var m = 0; m < items.length; m++) {
      var btn = items[m].querySelector('.header-link-item-button');
      if (btn && MENU_LABELS.indexOf(label(btn)) !== -1) items[m].style.display = 'inherit';
    }
    return true;
  }

  // шапка вендора появляется не сразу — подождём её
  function boot() {
    if (fix()) return;
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (fix() || tries > 40) clearInterval(t);   // максимум ~10 секунд
    }, 250);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
