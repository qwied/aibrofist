/* AIBROFIST — темы оформления.
   Игрок выбирает от одного до четырёх цветов, а палитра всего сайта
   собирается из них по правилам: так интерфейс остаётся читаемым при
   любом наборе, включая совсем тёмные или кислотные цвета. */
(function () {
  'use strict';

  /* ---------- работа с цветом ---------- */
  function hex2rgb(h) {
    var n = parseInt(String(h).replace('#', ''), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgb2hex(r, g, b) {
    var f = function (v) { return Math.max(0, Math.min(255, Math.round(v))); };
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }
  function mix(a, b, t) {                     // t=0 -> a, t=1 -> b
    var x = hex2rgb(a), y = hex2rgb(b);
    return rgb2hex(x.r + (y.r - x.r) * t, x.g + (y.g - x.g) * t, x.b + (y.b - x.b) * t);
  }
  function lum(h) {                           // воспринимаемая яркость 0..1
    var c = hex2rgb(h);
    var f = function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function rgb2hsl(h) {
    var c = hex2rgb(h), r = c.r / 255, g = c.g / 255, b = c.b / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    var l = (mx + mn) / 2, s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)), hh = 0;
    if (d !== 0) {
      if (mx === r) hh = ((g - b) / d) % 6;
      else if (mx === g) hh = (b - r) / d + 2;
      else hh = (r - g) / d + 4;
      hh *= 60; if (hh < 0) hh += 360;
    }
    return { h: hh, s: s, l: l };
  }
  function hsl2hex(h, s, l) {
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2, r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return rgb2hex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }

  function contrast(a, b) {
    var l1 = Math.max(lum(a), lum(b)), l2 = Math.min(lum(a), lum(b));
    return (l1 + 0.05) / (l2 + 0.05);
  }

  // читаемый текст поверх цвета: берём тот, с которым контраст выше
  function on(hex) {
    return contrast(hex, '#ffffff') >= contrast(hex, '#111827') ? '#ffffff' : '#111827';
  }

  /* Приводим выбранный цвет к рабочему. Задача одна: на кнопке должен
     читаться текст. Двигаем яркость, пока контраст с подписью не станет
     не меньше 4.5 — это порог, при котором текст различим на любом экране.
     Серые оттенки не подкрашиваем, иначе чёрный превращался в бурый. */
  function usable(hex) {
    var c = rgb2hsl(hex);
    var sat = c.s < 0.08 ? 0 : Math.max(0.3, c.s);
    var l = Math.min(0.62, Math.max(0.28, c.l));
    var best = hsl2hex(c.h, sat, l);
    if (contrast(best, on(best)) >= 4.5) return best;

    // пробуем и темнее, и светлее — берём первый подходящий
    for (var step = 0.02; step <= 0.42; step += 0.02) {
      var down = hsl2hex(c.h, sat, Math.max(0.12, l - step));
      if (contrast(down, on(down)) >= 4.5) return down;
      var up = hsl2hex(c.h, sat, Math.min(0.94, l + step));
      if (contrast(up, on(up)) >= 4.5) return up;
    }
    return best;
  }

  function rotate(hex, deg) {
    var c = rgb2hsl(hex);
    return usable(hsl2hex((c.h + deg + 360) % 360, c.s, c.l));
  }

  /* ---------- палитра из выбранных цветов ---------- */
  function palette(colors) {
    var raw = (colors || []).filter(Boolean);
    if (!raw.length) return null;

    var c1 = usable(raw[0]);
    var c2 = raw[1] ? usable(raw[1]) : rotate(c1, 24);
    var c3 = raw[2] ? usable(raw[2]) : rotate(c1, -22);
    var c4 = raw[3] ? usable(raw[3]) : usable(mix(c1, c2, 0.5));

    var dark = mix(c1, '#0b1020', 0.72);      // тёмный тон для текста
    return {
      brand:   c1,
      brand2:  c2,
      brand3:  c3,
      brand4:  c4,
      onBrand: on(c1),
      onBrand2: on(c2),
      dark:    dark,
      ink:     mix('#111827', c1, 0.14),
      muted:   mix('#6b7280', c1, 0.18),
      line:    mix('#e5e7eb', c1, 0.22),
      soft:    mix('#ffffff', c1, 0.06),
      soft2:   mix('#ffffff', c2, 0.07),
      head:    mix('#f5f5f5', c1, 0.09),
      hover:   mix('#ffffff', c1, 0.13),
      shadow:  'rgba(' + [hex2rgb(c1).r, hex2rgb(c1).g, hex2rgb(c1).b].join(',') + ',.20)',
      raw:     raw
    };
  }

  /* ---------- применение ----------
     Каждый выбранный цвет отвечает за свою часть интерфейса, а не только
     за кнопки. Один цвет — вся страница в его тонах. Два — шапка и
     активные элементы берут первый, кнопки и ссылки второй. Три — плюс
     карточки и чипы. Четыре — плюс выделения и вкладки. */
  function css(p) {
    var c = p.raw.length;
    var A = p.brand, B = c > 1 ? p.brand2 : p.brand,
        C = c > 2 ? p.brand3 : B, D = c > 3 ? p.brand4 : A;
    var onA = on(A), onB = on(B), onC = on(C), onD = on(D);

    var grad = c > 1
      ? 'linear-gradient(135deg,' + A + ' 0%,' + B + ' 100%)'
      : A;
    var stripe = c > 1
      ? 'linear-gradient(90deg,' + p.raw.join(',') + ')'
      : A;

    /* Фон страницы. Раньше подмешивалось 5% цвета — на глаз это почти
       белый лист. Теперь заметный оттенок, а при нескольких цветах —
       мягкий переход между ними по диагонали. Больше 22% не берём:
       дальше тёмный текст начинает терять контраст. */
    var tint = function (c, k) { return mix('#ffffff', c, k); };
    var pageBg = tint(A, 0.17);
    var pageImg = c > 1
      ? 'linear-gradient(160deg,' + tint(A, 0.20) + ' 0%,' +
        (c > 2 ? tint(B, 0.16) + ' 45%,' + tint(C, 0.20) : tint(B, 0.20)) + ' 100%)'
      : 'linear-gradient(160deg,' + tint(A, 0.22) + ' 0%,' + tint(A, 0.09) + ' 100%)';
    var cardBg = tint(C, 0.05);
    var panelBg = tint(C, 0.03);

    return [
      ':root{',
      '--blue:', A, ';--accent:', A, ';--accent-dark:', mix(A, '#000', 0.18), ';',
      '--brand-2:', B, ';--brand-3:', C, ';--brand-4:', D, ';',
      '--on-brand:', onA, ';',
      '--ink:', p.ink, ';--muted:', p.muted, ';--line:', mix('#e5e7eb', C, 0.3), ';',
      '--soft:', mix('#ffffff', C, 0.07), ';--hdr-bg:', p.head, ';',
      '--bf-grad:', grad, ';',
      '}',

      /* --- вся страница --- */
      'html{background:', pageBg, '}',
      'body{background:', pageBg, ' !important;background-image:', pageImg, ' !important;',
      'background-attachment:fixed !important;background-repeat:no-repeat !important;',
      'min-height:100vh;color:', p.ink, '}',
      '.bfWrap{background:transparent}',
      /* белые полотна внутри страниц тоже подкрашиваем */
      '.container,.bfPanel{background:transparent}',

      /* --- шапка: первый цвет --- */
      '.bfHead{background:', mix('#f5f5f5', A, 0.12), ';border-bottom:3px solid transparent;',
      'border-image:', stripe, ' 1}',
      '.bfNav a:hover,.bfMenuBtn:hover{background:', mix('#ffffff', A, 0.18), '}',
      '.bfNav a.on{background:', grad, ';color:', onA, '}',
      '.bfBrand b,.bfBrandMark i{color:', p.dark, ';background:', p.dark, '}',
      '.bfBrand b{background:none}',

      /* --- кнопки: второй цвет --- */
      '.bfBtn{border-color:', B, ';color:', B, ';background:#fff}',
      '.bfBtn:hover{background:', B, ';color:', onB, '}',
      '.bfBtn.go{background:', grad, ';color:', onA, ';border-color:transparent}',
      '.bfMini{border-color:', B, ';color:', B, '}',
      '.bfMini:hover{background:', B, ';color:', onB, '}',
      '.mbPlay{border-color:', B, ';color:', B, '}',
      '.mbPlay:hover,.mdPlay{background:', grad, ';color:', onA, ';border-color:transparent}',
      'a{color:', B, '}',

      /* --- карточки и панели: третий цвет --- */
      '.bfCard,.mbRow,.sbCard,.upRow,.upSkin,.thSet,.mdArt{',
      'background:', cardBg, ';border-color:', mix('#e5e7eb', C, 0.42), '}',
      '.bfPanel{background:', panelBg, ';border-color:', mix('#e5e7eb', C, 0.42), '}',
      '.bfDrop,.ow-box{background:', tint(C, 0.04), '}',
      '.mbRow:hover,.bfCard:hover,.sbCard:hover{border-color:', C, '}',
      '.seStage,.avStage,.sbArt,.avArt,.upSkin .art,.mdArt{background:', mix('#ffffff', C, 0.10), '}',
      '.bfHint{color:', p.muted, '}',

      /* --- выделения и вкладки: четвёртый цвет --- */
      '.bfChip.on{background:', D, ';border-color:transparent;color:', onD, '}',
      '.bfTab.on{color:', p.ink, ';border-bottom-color:', D, '}',
      '.bfLangItem.on,.thSet.on{border-color:', D, '}',
      '.bfLangItem.on{background:', D, ';color:', onD, '}',
      '.bfPager button{border-color:', D, ';color:', D, '}',
      '.mbRate.up{color:', mix(C, '#15803d', 0.4), '}',
      '.bfCoin{color:', mix(A, '#7a5c00', 0.45), '}',

      /* --- поля ввода --- */
      '.bfInput,.bfSelect{background:#fff;border-color:', mix('#cfd6de', C, 0.3), '}',
      '.bfInput:focus,.bfSelect:focus{border-color:', B, ';outline:none}',

      /* --- выпадающие списки --- */
      '.bfDrop{border-color:', mix('#e5e7eb', C, 0.35), '}',
      '.bfDropItem:hover,.bfLangItem:hover{background:', mix('#ffffff', B, 0.14), '}',

      /* --- редактор и панель владельца --- */
      '.tool.on,.modeBtn.on,.sBtn.on{background:', grad, ' !important;color:', onA, ' !important}',
      '#bfPublish{background:', p.dark, '}',
      '#bfPublish:hover{background:', mix(p.dark, A, 0.35), '}',
      '.ow-fab{background:', p.dark, '}',
      '.ow-fab:hover{background:', A, '}',
      '.ow-b,.ow-bar button{border-color:', B, ';color:', B, '}',
      '.ow-b:hover,.ow-bar button:hover{background:', B, ';color:', onB, '}',
      '.ow-bar button.go,.ow-bar button.picked{background:', grad, ';color:', onA, '}'
    ].join('');
  }

  var styleEl = null;
  function apply(colors) {
    var p = palette(colors);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'bfThemeStyle';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = p ? css(p) : '';
    document.documentElement.dataset.bfTheme = p ? p.raw.join(',') : '';
    window.dispatchEvent(new CustomEvent('bf-theme', { detail: { colors: p ? p.raw : [] } }));
  }

  /* ---------- загрузка ---------- */
  var state = { unlocked: false, colors: [], price: 100, max: 4, presets: [], coins: 0 };

  function load() {
    // сначала последняя известная тема из памяти браузера — чтобы
    // страница не мигала белым до ответа сервера
    try {
      var cached = JSON.parse(localStorage.getItem('bfTheme') || 'null');
      if (cached && cached.length) apply(cached);
    } catch (e) {}

    return fetch('/theme/get', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        state.unlocked = !!d.unlocked;
        state.price = d.price;
        state.max = d.max;
        state.presets = d.presets || [];
        state.coins = d.coins || 0;
        state.colors = (d.theme && d.theme.colors) || [];
        apply(state.colors);
        try { localStorage.setItem('bfTheme', JSON.stringify(state.colors)); } catch (e) {}
        return state;
      })
      .catch(function () { return state; });
  }

  function save(colors) {
    return fetch('/theme/set', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'colors=' + encodeURIComponent(JSON.stringify(colors || []))
    }).then(function (r) { return r.json(); })
      .then(function (r) {
        if (r.status === 'success') {
          state.colors = colors || [];
          apply(state.colors);
          try { localStorage.setItem('bfTheme', JSON.stringify(state.colors)); } catch (e) {}
        }
        return r;
      });
  }

  function unlock() {
    return fetch('/theme/unlock', { method: 'POST', credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (r.status === 'success') { state.unlocked = true; state.coins = r.coins; }
        return r;
      });
  }

  window.BFTheme = {
    apply: apply, palette: palette, css: css, load: load, save: save, unlock: unlock,
    get state() { return state; },
    helpers: { mix: mix, lum: lum, on: on, usable: usable, rotate: rotate,
               contrast: contrast, hsl: rgb2hsl }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
