/* AIBROFIST — отрисовка персонажа.
   Базовая модель ровно та же, что в игре (editor.html -> figure()):
   круглая голова диаметром w, зазор h*0.049, дальше капсула-тело.
   Никаких глаз, рук и ног — только сам силуэт и аксессуары поверх. */
(function () {
  'use strict';

  // пропорции игрока: в игре spawn имеет размер 22 x 74
  var W = 100;                 // ширина = диаметр головы
  var H = 336;                 // 100 * (74/22)
  var HEAD_R = W / 2;
  var GAP = H * 0.049;
  var BODY_TOP = W + GAP;      // 116.5
  var BODY_H = H - BODY_TOP;   // 219.5
  var BODY_RX = Math.min(W * 0.22, BODY_H / 2);

  var uid = 0;

  function shade(hex, amt) {
    if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return '#374151';
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
  }

  /* ---------- аксессуары на голову ---------- */
  function head(id, c) {
    var d = shade(c, -34), l = shade(c, 46);
    switch (id) {
      case 'h_cap':
        return '<path d="M6 42 A50 50 0 0 1 94 42 L94 50 L6 50 Z" fill="' + c + '"/>'
             + '<path d="M92 44 q26 3 26 12 l-26 0 z" fill="' + d + '"/>';
      case 'h_beanie':
        return '<path d="M6 44 A50 50 0 0 1 94 44 Z" fill="' + c + '"/>'
             + '<rect x="2" y="40" width="96" height="15" rx="7" fill="' + l + '"/>'
             + '<circle cx="50" cy="-8" r="12" fill="' + l + '"/>';
      case 'h_bandana':
        return '<path d="M8 38 A50 50 0 0 1 92 38 L92 50 L8 50 Z" fill="' + c + '"/>'
             + '<path d="M90 48 l30 16 l-28 5 z" fill="' + d + '"/>';
      case 'h_helmet':
        return '<path d="M0 54 A50 50 0 0 1 100 54 L100 60 L0 60 Z" fill="' + c + '"/>'
             + '<rect x="44" y="-16" width="12" height="30" rx="5" fill="' + d + '"/>'
             + '<circle cx="50" cy="-20" r="8" fill="' + l + '"/>';
      case 'h_cowboy':
        return '<path d="M18 36 A34 34 0 0 1 82 36 Z" fill="' + c + '"/>'
             + '<ellipse cx="50" cy="40" rx="70" ry="11" fill="' + d + '"/>';
      case 'h_tophat':
        return '<rect x="20" y="-42" width="60" height="76" rx="4" fill="' + c + '"/>'
             + '<ellipse cx="50" cy="34" rx="62" ry="10" fill="' + c + '"/>'
             + '<rect x="20" y="14" width="60" height="14" fill="' + l + '"/>';
      case 'h_horns':
        return '<path d="M14 30 q-24 -36 2 -46 q16 18 20 34 z" fill="' + c + '"/>'
             + '<path d="M86 30 q24 -36 -2 -46 q-16 18 -20 34 z" fill="' + c + '"/>';
      case 'h_halo':
        return '<ellipse cx="50" cy="-16" rx="36" ry="11" fill="none" stroke="' + c + '" stroke-width="9"/>';
      case 'h_crown':
        return '<path d="M10 36 L10 -14 L30 4 L50 -22 L70 4 L90 -14 L90 36 Z" fill="' + c + '"/>'
             + '<circle cx="50" cy="14" r="7" fill="' + l + '"/>';
      case 'h_ears':
        return '<path d="M12 30 L6 -18 L44 8 Z" fill="' + c + '"/>'
             + '<path d="M88 30 L94 -18 L56 8 Z" fill="' + c + '"/>'
             + '<path d="M18 24 L16 -4 L34 10 Z" fill="' + l + '"/>'
             + '<path d="M82 24 L84 -4 L66 10 Z" fill="' + l + '"/>';
      case 'h_antenna':
        return '<path d="M50 4 q4 -34 22 -40" fill="none" stroke="' + c + '" stroke-width="7" stroke-linecap="round"/>'
             + '<circle cx="74" cy="-38" r="11" fill="' + l + '"/>';
      case 'h_hair':
        return '<path d="M4 40 A50 50 0 0 1 96 40 L96 30 q-12 12 -22 2 q-10 14 -22 2 q-12 14 -24 0 q-10 10 -24 -4 z" fill="' + c + '"/>';
      default: return '';
    }
  }

  /* ---------- аксессуары на лицо ---------- */
  function face(id, c) {
    var d = shade(c, -40), l = shade(c, 50);
    switch (id) {
      case 'f_glasses':
        return '<circle cx="30" cy="52" r="17" fill="none" stroke="' + c + '" stroke-width="6"/>'
             + '<circle cx="70" cy="52" r="17" fill="none" stroke="' + c + '" stroke-width="6"/>'
             + '<path d="M47 52 h6" stroke="' + c + '" stroke-width="6"/>';
      case 'f_shades':
        return '<rect x="9" y="41" width="82" height="24" rx="9" fill="' + c + '"/>'
             + '<rect x="47" y="49" width="6" height="8" fill="' + l + '"/>';
      case 'f_visor':
        return '<path d="M2 40 q48 -14 96 0 l0 24 q-48 16 -96 0 z" fill="' + c + '" opacity=".9"/>'
             + '<path d="M10 45 q40 -9 80 0" fill="none" stroke="' + l + '" stroke-width="4" opacity=".7"/>';
      case 'f_mask':
        return '<path d="M8 56 A50 50 0 0 0 92 56 L92 66 A50 50 0 0 1 8 66 Z" fill="' + c + '"/>'
             + '<path d="M8 62 A50 50 0 0 0 92 62" fill="none" stroke="' + d + '" stroke-width="3"/>';
      case 'f_eyepatch':
        return '<path d="M4 30 L96 62" stroke="' + c + '" stroke-width="7"/>'
             + '<rect x="16" y="36" width="34" height="28" rx="8" fill="' + c + '"/>';
      case 'f_scarf':
        return '<rect x="4" y="96" width="92" height="30" rx="13" fill="' + c + '"/>'
             + '<path d="M66 118 l22 54 l-24 6 z" fill="' + d + '"/>';
      case 'f_snorkel':
        return '<rect x="12" y="40" width="76" height="28" rx="10" fill="none" stroke="' + c + '" stroke-width="7"/>'
             + '<path d="M88 46 q22 -6 20 -34" fill="none" stroke="' + c + '" stroke-width="7"/>';
      default: return '';
    }
  }

  /* ---------- рисунок на теле (обрезается по капсуле) ---------- */
  function body(id, c) {
    var d = shade(c, -34), l = shade(c, 46);
    var T = BODY_TOP;
    switch (id) {
      case 'b_tie':
        return '<path d="M38 ' + T + ' L50 ' + (T + 26) + ' L62 ' + T + ' Z" fill="' + l + '"/>'
             + '<path d="M50 ' + (T + 26) + ' l-12 42 l12 18 l12 -18 z" fill="' + c + '"/>';
      case 'b_belt':
        return '<rect x="0" y="' + (T + 96) + '" width="100" height="26" fill="' + c + '"/>'
             + '<rect x="38" y="' + (T + 96) + '" width="24" height="26" fill="' + l + '"/>';
      case 'b_stripes':
        return [0, 1, 2, 3, 4].map(function (i) {
          return '<rect x="0" y="' + (T + 14 + i * 40) + '" width="100" height="18" fill="' + c + '"/>';
        }).join('');
      case 'b_vest':
        return '<rect x="0" y="' + T + '" width="26" height="' + BODY_H + '" fill="' + c + '"/>'
             + '<rect x="74" y="' + T + '" width="26" height="' + BODY_H + '" fill="' + c + '"/>';
      case 'b_number':
        return '<circle cx="50" cy="' + (T + 62) + '" r="30" fill="' + c + '"/>'
             + '<text x="50" y="' + (T + 76) + '" text-anchor="middle" font-size="42" font-weight="800" '
             + 'font-family="sans-serif" fill="' + l + '">1</text>';
      case 'b_hoodie':
        return '<path d="M0 ' + T + ' q50 44 100 0 l0 -18 l-100 0 z" fill="' + c + '"/>'
             + '<path d="M34 ' + (T + 28) + ' l-4 46 M66 ' + (T + 28) + ' l4 46" stroke="' + l + '" stroke-width="6"/>'
             + '<rect x="26" y="' + (T + 108) + '" width="48" height="30" rx="8" fill="' + d + '"/>';
      case 'b_armor':
        return '<rect x="0" y="' + T + '" width="100" height="' + (BODY_H * 0.62) + '" fill="' + c + '"/>'
             + '<rect x="0" y="' + (T + 42) + '" width="100" height="8" fill="' + d + '"/>'
             + '<rect x="0" y="' + (T + 92) + '" width="100" height="8" fill="' + d + '"/>'
             + '<circle cx="50" cy="' + (T + 24) + '" r="13" fill="' + l + '"/>';
      case 'b_suit':
        return '<path d="M0 ' + T + ' L50 ' + (T + 60) + ' L100 ' + T + ' L100 ' + (T + 150) + ' L0 ' + (T + 150) + ' Z" fill="' + c + '"/>'
             + '<path d="M50 ' + (T + 60) + ' L26 ' + T + ' L50 ' + T + ' Z" fill="' + l + '"/>'
             + '<path d="M50 ' + (T + 60) + ' L74 ' + T + ' L50 ' + T + ' Z" fill="' + l + '"/>';
      case 'b_overall':
        return '<rect x="0" y="' + (T + 54) + '" width="100" height="' + (BODY_H - 54) + '" fill="' + c + '"/>'
             + '<rect x="14" y="' + T + '" width="16" height="60" fill="' + c + '"/>'
             + '<rect x="70" y="' + T + '" width="16" height="60" fill="' + c + '"/>'
             + '<circle cx="22" cy="' + (T + 58) + '" r="7" fill="' + l + '"/>'
             + '<circle cx="78" cy="' + (T + 58) + '" r="7" fill="' + l + '"/>';
      default: return '';
    }
  }

  /* ---------- за спиной ---------- */
  function back(id, c) {
    var d = shade(c, -34), l = shade(c, 46);
    var T = BODY_TOP;
    switch (id) {
      case 'k_cape':
        return '<path d="M6 ' + (T + 4) + ' L94 ' + (T + 4) + ' L128 ' + H + ' L50 ' + (H - 26) + ' L-28 ' + H + ' Z" fill="' + c + '"/>'
             + '<path d="M50 ' + (T + 4) + ' L50 ' + (H - 26) + ' L-28 ' + H + ' Z" fill="' + d + '"/>';
      case 'k_wings':
        return '<path d="M12 ' + (T + 20) + ' q-96 -26 -104 74 q52 -28 104 22 z" fill="' + c + '" stroke="' + d + '" stroke-width="5"/>'
             + '<path d="M88 ' + (T + 20) + ' q96 -26 104 74 q-52 -28 -104 22 z" fill="' + c + '" stroke="' + d + '" stroke-width="5"/>';
      case 'k_jetpack':
        return '<rect x="-24" y="' + (T + 18) + '" width="34" height="112" rx="16" fill="' + c + '"/>'
             + '<rect x="90" y="' + (T + 18) + '" width="34" height="112" rx="16" fill="' + c + '"/>'
             + '<path d="M-16 ' + (T + 132) + ' q9 40 18 0 z" fill="#f97316"/>'
             + '<path d="M98 ' + (T + 132) + ' q9 40 18 0 z" fill="#f97316"/>';
      case 'k_bag':
        return '<rect x="-18" y="' + (T + 26) + '" width="136" height="104" rx="20" fill="' + c + '"/>'
             + '<rect x="24" y="' + (T + 52) + '" width="52" height="36" rx="10" fill="' + d + '"/>';
      case 'k_tail':
        return '<path d="M78 ' + (H - 40) + ' q76 10 60 -80 q-14 62 -60 52 z" fill="' + c + '"/>';
      case 'k_shell':
        return '<ellipse cx="50" cy="' + (T + BODY_H * 0.55) + '" rx="76" ry="' + (BODY_H * 0.42) + '" fill="' + c + '"/>'
             + '<ellipse cx="50" cy="' + (T + BODY_H * 0.55) + '" rx="52" ry="' + (BODY_H * 0.28) + '" fill="none" stroke="' + d + '" stroke-width="6"/>';
      default: return '';
    }
  }

  /**
   * skin: {color, head, face, body, back} — id вещей
   * byId: каталог id -> {v: цвет}
   */
  function svg(skin, byId, opt) {
    skin = skin || {}; byId = byId || {}; opt = opt || {};
    var col = function (id, def) {
      var it = byId[id];
      return (it && it.v) ? it.v : (def || '#374151');
    };
    var base = col(skin.color, '#111827');
    var id = 'bf' + (++uid);

    var parts = [];
    parts.push(back(skin.back, col(skin.back, '#b91c1c')));

    // сам игрок — точно как в игре
    parts.push('<g fill="' + base + '">'
      + '<circle cx="' + HEAD_R + '" cy="' + HEAD_R + '" r="' + HEAD_R + '"/>'
      + '<rect x="0" y="' + BODY_TOP + '" width="' + W + '" height="' + BODY_H + '" rx="' + BODY_RX + '"/>'
      + '</g>');

    // рисунок на теле обрезаем по капсуле, чтобы не торчал за силуэт
    var bodyArt = body(skin.body, col(skin.body, '#2196F3'));
    if (bodyArt) {
      parts.push('<clipPath id="' + id + '"><rect x="0" y="' + BODY_TOP + '" width="' + W +
                 '" height="' + BODY_H + '" rx="' + BODY_RX + '"/></clipPath>' +
                 '<g clip-path="url(#' + id + ')">' + bodyArt + '</g>');
    }

    parts.push(face(skin.face, col(skin.face, '#374151')));
    parts.push(head(skin.head, col(skin.head, '#e04141')));

    // запас по краям, чтобы плащ и крылья не обрезались
    var PAD = 62;
    var vb = (-PAD) + ' ' + (-PAD) + ' ' + (W + PAD * 2) + ' ' + (H + PAD * 2);
    var h = opt.height || 260;
    var w = opt.width || Math.round(h * (W + PAD * 2) / (H + PAD * 2));

    return '<svg viewBox="' + vb + '" width="' + w + '" height="' + h + '" ' +
           'xmlns="http://www.w3.org/2000/svg">' + parts.join('') + '</svg>';
  }

  // карточка магазина: показываем только выбранную вещь на текущем цвете
  function preview(item, byId, current, size) {
    var s = {
      color: (current && current.color) || 'c_black',
      head: 'h_none', face: 'f_none', body: 'b_none', back: 'k_none'
    };
    if (item.slot === 'color') s.color = item.id;
    else s[item.slot] = item.id;
    return svg(s, byId, { height: size || 92 });
  }

  window.BFSkin = { svg: svg, preview: preview, shade: shade, W: W, H: H };
})();
