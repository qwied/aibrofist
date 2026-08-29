/* AIBROFIST — геометрия персонажа и аксессуаров.
   Один набор фигур используют и SVG (страницы сайта), и canvas (сама игра),
   поэтому скин выглядит одинаково везде.

   Базовая модель ровно та же, что в игре (editor.html -> figure()):
   круглая голова диаметром w, зазор h*0.049, дальше капсула-тело.
   Цвет тела задаёт игра (роль в прятках), игрок его не меняет. */
(function () {
  'use strict';

  var W = 100, H = 336;
  var HEAD_R = W / 2;
  var BODY_TOP = W + H * 0.049;          // 116.46
  var BODY_H = H - BODY_TOP;             // 219.54
  var BODY_RX = Math.min(W * 0.22, BODY_H / 2);
  var T = BODY_TOP;
  var uid = 0;

  function shade(hex, amt) {
    if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return '#374151';
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
  }

  // короткие конструкторы фигур
  var P = function (d, fill, stroke, sw) { return { t:'path', d:d, fill:fill, stroke:stroke, sw:sw }; };
  var R = function (x, y, w, h, rx, fill) { return { t:'rect', x:x, y:y, w:w, h:h, rx:rx||0, fill:fill }; };
  var C = function (cx, cy, r, fill) { return { t:'circle', cx:cx, cy:cy, r:r, fill:fill }; };
  var E = function (cx, cy, rx, ry, fill, stroke, sw) {
    return { t:'ellipse', cx:cx, cy:cy, rx:rx, ry:ry, fill:fill, stroke:stroke, sw:sw };
  };
  var L = function (x1, y1, x2, y2, stroke, sw) {
    return { t:'line', x1:x1, y1:y1, x2:x2, y2:y2, stroke:stroke, sw:sw };
  };
  var TX = function (x, y, s, size, fill) { return { t:'text', x:x, y:y, s:s, size:size, fill:fill }; };

  /* ---------- голова ---------- */
  function head(id, c) {
    var d = shade(c, -38), l = shade(c, 44), o = shade(c, -70);
    switch (id) {
      case 'h_cap':
        return [P('M4 44 A50 50 0 0 1 96 44 L96 51 L4 51 Z', c),
                P('M92 45 q30 2 30 13 q-16 4 -30 -1 z', d),
                P('M14 30 A44 44 0 0 1 50 6', null, l, 5)];
      case 'h_beanie':
        return [P('M6 46 A48 48 0 0 1 94 46 Z', c),
                R(1, 40, 98, 16, 8, l),
                C(50, -10, 13, l), C(50, -10, 6, c)];
      case 'h_bandana':
        return [P('M6 40 A50 50 0 0 1 94 40 L94 52 L6 52 Z', c),
                P('M90 50 q26 6 34 20 q-18 6 -34 -6 z', d),
                C(26, 46, 4, l), C(48, 43, 4, l), C(70, 46, 4, l)];
      case 'h_helmet':
        return [P('M-2 56 A52 52 0 0 1 102 56 L102 63 L-2 63 Z', c),
                P('M-2 56 A52 52 0 0 1 50 4 L50 63 L-2 63 Z', d),
                R(43, -20, 14, 34, 6, o), C(50, -24, 10, l)];
      case 'h_cowboy':
        return [E(50, 40, 72, 12, d), E(50, 40, 72, 9, c),
                P('M16 38 A36 36 0 0 1 84 38 Z', c),
                P('M16 34 q34 -8 68 0 l0 6 q-34 -6 -68 0 z', o)];
      case 'h_tophat':
        return [E(50, 35, 64, 11, d), E(50, 33, 64, 9, c),
                R(19, -46, 62, 80, 5, c),
                R(19, 12, 62, 16, 0, o),
                P('M19 -46 q31 -8 62 0 l0 10 q-31 -7 -62 0 z', l)];
      case 'h_horns':
        return [P('M16 32 q-28 -34 -2 -50 q20 16 24 40 z', c),
                P('M84 32 q28 -34 2 -50 q-20 16 -24 40 z', c),
                P('M18 26 q-18 -24 -6 -36 q10 12 14 30 z', l),
                P('M82 26 q18 -24 6 -36 q-10 12 -14 30 z', l)];
      case 'h_halo':
        return [E(50, -18, 38, 12, null, o, 11), E(50, -18, 38, 12, null, c, 7)];
      case 'h_crown':
        return [P('M8 38 L8 -18 L30 6 L50 -26 L70 6 L92 -18 L92 38 Z', c),
                R(8, 22, 84, 16, 3, d),
                C(50, 12, 8, l), C(24, 20, 5, l), C(76, 20, 5, l)];
      case 'h_ears':
        return [P('M10 32 L2 -22 L46 8 Z', c), P('M90 32 L98 -22 L54 8 Z', c),
                P('M17 25 L13 -7 L36 11 Z', l), P('M83 25 L87 -7 L64 11 Z', l)];
      case 'h_antenna':
        return [P('M50 2 q6 -36 24 -44', null, o, 9),
                P('M50 2 q6 -36 24 -44', null, c, 5),
                C(74, -42, 12, o), C(74, -42, 9, l)];
      case 'h_hair':
        return [P('M2 42 A50 50 0 0 1 98 42 L98 28 q-13 14 -24 2 q-11 15 -24 2 ' +
                  'q-13 15 -25 0 q-11 11 -25 -3 z', c),
                P('M12 24 A42 42 0 0 1 44 2', null, l, 5)];
      default: return [];
    }
  }

  /* ---------- лицо ---------- */
  function face(id, c) {
    var d = shade(c, -42), l = shade(c, 52);
    switch (id) {
      case 'f_glasses':
        return [E(29, 52, 18, 16, '#ffffff', null, 0),
                E(71, 52, 18, 16, '#ffffff', null, 0),
                E(29, 52, 18, 16, null, c, 6), E(71, 52, 18, 16, null, c, 6),
                L(47, 52, 53, 52, c, 6), L(11, 50, 2, 46, c, 5), L(89, 50, 98, 46, c, 5)];
      case 'f_shades':
        return [R(6, 40, 88, 26, 11, c),
                P('M12 44 q14 -3 22 2 l-4 8 q-10 -4 -18 -2 z', l),
                R(46, 48, 8, 9, 2, d)];
      case 'f_visor':
        return [P('M0 40 q50 -16 100 0 l0 26 q-50 18 -100 0 z', c),
                P('M8 46 q42 -10 84 0', null, l, 5),
                P('M0 40 q50 -16 100 0 l0 26 q-50 18 -100 0 z', null, d, 3)];
      case 'f_mask':
        return [P('M7 54 A50 50 0 0 0 93 54 L93 67 A50 50 0 0 1 7 67 Z', c),
                P('M7 60 A50 50 0 0 0 93 60', null, d, 3),
                L(7, 56, -6, 48, d, 4), L(93, 56, 106, 48, d, 4)];
      case 'f_eyepatch':
        return [L(2, 28, 98, 60, c, 8),
                R(14, 34, 38, 32, 10, c), R(14, 34, 38, 32, 10, null, d, 3)];
      case 'f_scarf':
        return [R(2, 94, 96, 34, 15, c),
                P('M2 108 q48 14 96 0', null, d, 4),
                P('M64 120 q26 30 22 62 l-24 4 q6 -34 -6 -60 z', d)];
      case 'f_snorkel':
        return [E(50, 54, 40, 17, null, c, 8),
                E(50, 54, 40, 17, '#dbeafe'),
                E(50, 54, 40, 17, null, c, 8),
                P('M88 44 q26 -8 24 -40', null, c, 8)];
      default: return [];
    }
  }

  /* ---------- рисунок на теле (обрезается по капсуле) ---------- */
  function body(id, c) {
    var d = shade(c, -38), l = shade(c, 46), out;
    switch (id) {
      case 'b_tie':
        out = [P('M34 ' + T + ' L50 ' + (T+30) + ' L66 ' + T + ' Z', l),
               P('M50 ' + (T+28) + ' l-13 20 l6 44 l7 10 l7 -10 l6 -44 z', c),
               R(41, T+26, 18, 12, 3, d)]; break;
      case 'b_belt':
        out = [R(0, T+94, 100, 28, 0, c),
               R(0, T+94, 100, 5, 0, d),
               R(36, T+92, 28, 32, 5, l), R(44, T+102, 12, 12, 2, d)]; break;
      case 'b_stripes':
        out = [];
        for (var i = 0; i < 5; i++) out.push(R(0, T+16+i*40, 100, 20, 0, c));
        break;
      case 'b_vest':
        out = [R(0, T, 28, BODY_H, 0, c), R(72, T, 28, BODY_H, 0, c),
               R(24, T, 5, BODY_H, 0, d), R(71, T, 5, BODY_H, 0, d),
               C(14, T+56, 6, l), C(86, T+56, 6, l)]; break;
      case 'b_number':
        out = [C(50, T+64, 32, c), C(50, T+64, 32, null, l, 4),
               TX(50, T+79, '1', 44, l)]; break;
      case 'b_hoodie':
        out = [P('M-2 ' + T + ' q52 46 104 0 l0 -20 l-104 0 z', c),
               P('M-2 ' + (T+2) + ' q52 44 104 0', null, d, 4),
               P('M33 ' + (T+30) + ' q-6 26 -4 48', null, l, 7),
               P('M67 ' + (T+30) + ' q6 26 4 48', null, l, 7),
               C(33, T+80, 5, l), C(71, T+80, 5, l),
               R(24, T+112, 52, 32, 10, d)]; break;
      case 'b_armor':
        out = [R(0, T, 100, BODY_H*0.66, 0, c),
               R(0, T+44, 100, 9, 0, d), R(0, T+96, 100, 9, 0, d),
               P('M0 ' + (T+BODY_H*0.66) + ' q50 22 100 0 l0 -10 l-100 0 z', d),
               C(50, T+26, 15, d), C(50, T+26, 9, l)]; break;
      case 'b_suit':
        out = [R(0, T, 100, 160, 0, c),
               P('M50 ' + (T+66) + ' L20 ' + T + ' L50 ' + T + ' Z', l),
               P('M50 ' + (T+66) + ' L80 ' + T + ' L50 ' + T + ' Z', l),
               P('M50 ' + (T+66) + ' l-11 16 l11 42 l11 -42 z', '#b91c1c'),
               C(50, T+130, 5, l)]; break;
      case 'b_overall':
        out = [R(0, T+56, 100, BODY_H-56, 0, c),
               R(12, T, 18, 62, 4, c), R(70, T, 18, 62, 4, c),
               C(21, T+60, 8, l), C(79, T+60, 8, l),
               R(30, T+82, 40, 34, 6, d)]; break;
      default: return [];
    }
    out.forEach(function (s) { s.clip = true; });
    return out;
  }

  /* ---------- за спиной ---------- */
  function back(id, c) {
    var d = shade(c, -38), l = shade(c, 44);
    switch (id) {
      case 'k_cape':
        return [P('M4 ' + (T+2) + ' L96 ' + (T+2) + ' L134 ' + (H+6) +
                  ' Q50 ' + (H-34) + ' -34 ' + (H+6) + ' Z', c),
                P('M50 ' + (T+2) + ' L50 ' + (H-28) + ' Q6 ' + (H-16) + ' -34 ' + (H+6) + ' Z', d),
                R(2, T-2, 96, 16, 8, l)];
      case 'k_wings':
        return [P('M14 ' + (T+16) + ' q-58 -44 -104 26 q-14 46 12 62 q28 -44 92 -22 z', c, d, 5),
                P('M86 ' + (T+16) + ' q58 -44 104 26 q14 46 -12 62 q-28 -44 -92 -22 z', c, d, 5),
                P('M12 ' + (T+50) + ' q-40 -12 -70 14', null, d, 4),
                P('M88 ' + (T+50) + ' q40 -12 70 14', null, d, 4)];
      case 'k_jetpack':
        return [R(-26, T+14, 36, 118, 17, c), R(90, T+14, 36, 118, 17, c),
                R(-26, T+14, 36, 22, 11, d), R(90, T+14, 36, 22, 11, d),
                P('M-18 ' + (T+134) + ' q10 46 20 0 z', '#fbbf24'),
                P('M98 ' + (T+134) + ' q10 46 20 0 z', '#fbbf24'),
                P('M-14 ' + (T+134) + ' q6 26 12 0 z', '#f97316'),
                P('M102 ' + (T+134) + ' q6 26 12 0 z', '#f97316')];
      case 'k_bag':
        return [R(-20, T+22, 140, 112, 22, c),
                R(-20, T+22, 140, 22, 11, d),
                R(20, T+52, 60, 40, 10, d), R(44, T+64, 12, 16, 3, l)];
      case 'k_tail':
        return [P('M74 ' + (H-34) + ' q86 16 66 -88 q-20 70 -66 58 z', c),
                P('M92 ' + (H-42) + ' q52 6 44 -54', null, l, 5)];
      case 'k_shell':
        return [E(50, T+BODY_H*0.55, 80, BODY_H*0.44, c),
                E(50, T+BODY_H*0.55, 80, BODY_H*0.44, null, d, 6),
                E(50, T+BODY_H*0.55, 54, BODY_H*0.29, null, d, 5),
                E(50, T+BODY_H*0.55, 28, BODY_H*0.15, null, d, 5)];
      default: return [];
    }
  }

  var DEF = { head:'#e04141', face:'#374151', body:'#2196F3', back:'#b91c1c' };

  /** Полный набор фигур скина. bodyColor — цвет силуэта, его задаёт игра. */
  function parts(skin, byId, bodyColor) {
    skin = skin || {}; byId = byId || {};
    var col = function (slot) {
      var it = byId[skin[slot]];
      return (it && it.v) ? it.v : DEF[slot];
    };
    var base = bodyColor || '#111827';
    return {
      base: base,
      back: back(skin.back, col('back')),
      body: body(skin.body, col('body')),
      face: face(skin.face, col('face')),
      head: head(skin.head, col('head'))
    };
  }

  /* ---------- вывод в SVG ---------- */
  function shape(s) {
    var a = (s.fill ? ' fill="' + s.fill + '"' : ' fill="none"') +
            (s.stroke ? ' stroke="' + s.stroke + '" stroke-width="' + (s.sw || 4) + '"' : '');
    switch (s.t) {
      case 'path':    return '<path d="' + s.d + '"' + a + '/>';
      case 'rect':    return '<rect x="' + s.x + '" y="' + s.y + '" width="' + s.w +
                             '" height="' + s.h + '" rx="' + s.rx + '"' + a + '/>';
      case 'circle':  return '<circle cx="' + s.cx + '" cy="' + s.cy + '" r="' + s.r + '"' + a + '/>';
      case 'ellipse': return '<ellipse cx="' + s.cx + '" cy="' + s.cy + '" rx="' + s.rx +
                             '" ry="' + s.ry + '"' + a + '/>';
      case 'line':    return '<line x1="' + s.x1 + '" y1="' + s.y1 + '" x2="' + s.x2 +
                             '" y2="' + s.y2 + '"' + a + ' stroke-linecap="round"/>';
      case 'text':    return '<text x="' + s.x + '" y="' + s.y + '" text-anchor="middle" font-size="' +
                             s.size + '" font-weight="800" font-family="sans-serif" fill="' + s.fill +
                             '">' + s.s + '</text>';
      default: return '';
    }
  }

  function svg(skin, byId, opt) {
    opt = opt || {};
    var p = parts(skin, byId, opt.color);
    var id = 'bf' + (++uid);
    var out = [];

    out.push(p.back.map(shape).join(''));
    out.push('<g fill="' + p.base + '"><circle cx="' + HEAD_R + '" cy="' + HEAD_R + '" r="' + HEAD_R +
             '"/><rect x="0" y="' + T + '" width="' + W + '" height="' + BODY_H +
             '" rx="' + BODY_RX + '"/></g>');
    if (p.body.length) {
      out.push('<clipPath id="' + id + '"><rect x="0" y="' + T + '" width="' + W +
               '" height="' + BODY_H + '" rx="' + BODY_RX + '"/></clipPath>' +
               '<g clip-path="url(#' + id + ')">' + p.body.map(shape).join('') + '</g>');
    }
    out.push(p.face.map(shape).join(''));
    out.push(p.head.map(shape).join(''));

    var vb, vw, vh;
    if (opt.bust) {
      // портрет для круглых аватарок: голова, головной убор и плечи,
      // квадратная рамка — иначе фигура в круге выглядит крошечной
      vb = '-52 -58 204 204'; vw = 204; vh = 204;
    } else {
      var PAD = 62;
      vb = (-PAD) + ' ' + (-PAD) + ' ' + (W + PAD*2) + ' ' + (H + PAD*2);
      vw = W + PAD*2; vh = H + PAD*2;
    }
    var h = opt.height || 260;
    var w = opt.width || Math.round(h * vw / vh);
    return '<svg viewBox="' + vb + '" width="' + w + '" height="' + h +
           '" xmlns="http://www.w3.org/2000/svg">' + out.join('') + '</svg>';
  }

  // карточка магазина: только выбранная вещь на чистом силуэте
  function preview(item, byId, current, size) {
    var s = { head:'h_none', face:'f_none', body:'b_none', back:'k_none' };
    s[item.slot] = item.id;
    return svg(s, byId, { height: size || 92 });
  }

  window.BFSkin = {
    svg: svg, preview: preview, parts: parts, shade: shade,
    W: W, H: H, BODY_TOP: T, BODY_H: BODY_H, BODY_RX: BODY_RX, HEAD_R: HEAD_R
  };
})();
