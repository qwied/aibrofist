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
    var d = shade(c, -34), l = shade(c, 46);
    switch (id) {
      case 'h_cap':     return [P('M6 42 A50 50 0 0 1 94 42 L94 50 L6 50 Z', c),
                                P('M92 44 q26 3 26 12 l-26 0 z', d)];
      case 'h_beanie':  return [P('M6 44 A50 50 0 0 1 94 44 Z', c), R(2,40,96,15,7,l), C(50,-8,12,l)];
      case 'h_bandana': return [P('M8 38 A50 50 0 0 1 92 38 L92 50 L8 50 Z', c),
                                P('M90 48 l30 16 l-28 5 z', d)];
      case 'h_helmet':  return [P('M0 54 A50 50 0 0 1 100 54 L100 60 L0 60 Z', c),
                                R(44,-16,12,30,5,d), C(50,-20,8,l)];
      case 'h_cowboy':  return [P('M18 36 A34 34 0 0 1 82 36 Z', c), E(50,40,70,11,d)];
      case 'h_tophat':  return [R(20,-42,60,76,4,c), E(50,34,62,10,c), R(20,14,60,14,0,l)];
      case 'h_horns':   return [P('M14 30 q-24 -36 2 -46 q16 18 20 34 z', c),
                                P('M86 30 q24 -36 -2 -46 q-16 18 -20 34 z', c)];
      case 'h_halo':    return [E(50,-16,36,11,null,c,9)];
      case 'h_crown':   return [P('M10 36 L10 -14 L30 4 L50 -22 L70 4 L90 -14 L90 36 Z', c), C(50,14,7,l)];
      case 'h_ears':    return [P('M12 30 L6 -18 L44 8 Z', c), P('M88 30 L94 -18 L56 8 Z', c),
                                P('M18 24 L16 -4 L34 10 Z', l), P('M82 24 L84 -4 L66 10 Z', l)];
      case 'h_antenna': return [P('M50 4 q4 -34 22 -40', null, c, 7), C(74,-38,11,l)];
      case 'h_hair':    return [P('M4 40 A50 50 0 0 1 96 40 L96 30 q-12 12 -22 2 q-10 14 -22 2 ' +
                                  'q-12 14 -24 0 q-10 10 -24 -4 z', c)];
      default: return [];
    }
  }

  /* ---------- лицо ---------- */
  function face(id, c) {
    var d = shade(c, -40), l = shade(c, 50);
    switch (id) {
      case 'f_glasses':  return [C(30,52,17,null), // заглушка заменяется ниже
                                 E(30,52,17,17,null,c,6), E(70,52,17,17,null,c,6), L(47,52,53,52,c,6)].slice(1);
      case 'f_shades':   return [R(9,41,82,24,9,c), R(47,49,6,8,0,l)];
      case 'f_visor':    return [P('M2 40 q48 -14 96 0 l0 24 q-48 16 -96 0 z', c),
                                 P('M10 45 q40 -9 80 0', null, l, 4)];
      case 'f_mask':     return [P('M8 56 A50 50 0 0 0 92 56 L92 66 A50 50 0 0 1 8 66 Z', c),
                                 P('M8 62 A50 50 0 0 0 92 62', null, d, 3)];
      case 'f_eyepatch': return [L(4,30,96,62,c,7), R(16,36,34,28,8,c)];
      case 'f_scarf':    return [R(4,96,92,30,13,c), P('M66 118 l22 54 l-24 6 z', d)];
      case 'f_snorkel':  return [R(12,40,76,28,10,null,c), E(50,54,38,14,null,c,7),
                                 P('M88 46 q22 -6 20 -34', null, c, 7)].slice(1);
      default: return [];
    }
  }

  /* ---------- рисунок на теле (обрезается по капсуле) ---------- */
  function body(id, c) {
    var d = shade(c, -34), l = shade(c, 46), out;
    switch (id) {
      case 'b_tie':
        out = [P('M38 ' + T + ' L50 ' + (T+26) + ' L62 ' + T + ' Z', l),
               P('M50 ' + (T+26) + ' l-12 42 l12 18 l12 -18 z', c)]; break;
      case 'b_belt':
        out = [R(0, T+96, 100, 26, 0, c), R(38, T+96, 24, 26, 0, l)]; break;
      case 'b_stripes':
        out = [0,1,2,3,4].map(function (i) { return R(0, T+14+i*40, 100, 18, 0, c); }); break;
      case 'b_vest':
        out = [R(0, T, 26, BODY_H, 0, c), R(74, T, 26, BODY_H, 0, c)]; break;
      case 'b_number':
        out = [C(50, T+62, 30, c), TX(50, T+76, '1', 42, l)]; break;
      case 'b_hoodie':
        out = [P('M0 ' + T + ' q50 44 100 0 l0 -18 l-100 0 z', c),
               P('M34 ' + (T+28) + ' l-4 46', null, l, 6),
               P('M66 ' + (T+28) + ' l4 46', null, l, 6),
               R(26, T+108, 48, 30, 8, d)]; break;
      case 'b_armor':
        out = [R(0, T, 100, BODY_H*0.62, 0, c), R(0, T+42, 100, 8, 0, d),
               R(0, T+92, 100, 8, 0, d), C(50, T+24, 13, l)]; break;
      case 'b_suit':
        out = [P('M0 ' + T + ' L50 ' + (T+60) + ' L100 ' + T + ' L100 ' + (T+150) +
                 ' L0 ' + (T+150) + ' Z', c),
               P('M50 ' + (T+60) + ' L26 ' + T + ' L50 ' + T + ' Z', l),
               P('M50 ' + (T+60) + ' L74 ' + T + ' L50 ' + T + ' Z', l)]; break;
      case 'b_overall':
        out = [R(0, T+54, 100, BODY_H-54, 0, c), R(14, T, 16, 60, 0, c), R(70, T, 16, 60, 0, c),
               C(22, T+58, 7, l), C(78, T+58, 7, l)]; break;
      default: return [];
    }
    out.forEach(function (s) { s.clip = true; });
    return out;
  }

  /* ---------- за спиной ---------- */
  function back(id, c) {
    var d = shade(c, -34);
    switch (id) {
      case 'k_cape':
        return [P('M6 ' + (T+4) + ' L94 ' + (T+4) + ' L128 ' + H + ' L50 ' + (H-26) + ' L-28 ' + H + ' Z', c),
                P('M50 ' + (T+4) + ' L50 ' + (H-26) + ' L-28 ' + H + ' Z', d)];
      case 'k_wings':
        return [P('M12 ' + (T+20) + ' q-96 -26 -104 74 q52 -28 104 22 z', c, d, 5),
                P('M88 ' + (T+20) + ' q96 -26 104 74 q-52 -28 -104 22 z', c, d, 5)];
      case 'k_jetpack':
        return [R(-24, T+18, 34, 112, 16, c), R(90, T+18, 34, 112, 16, c),
                P('M-16 ' + (T+132) + ' q9 40 18 0 z', '#f97316'),
                P('M98 ' + (T+132) + ' q9 40 18 0 z', '#f97316')];
      case 'k_bag':
        return [R(-18, T+26, 136, 104, 20, c), R(24, T+52, 52, 36, 10, d)];
      case 'k_tail':
        return [P('M78 ' + (H-40) + ' q76 10 60 -80 q-14 62 -60 52 z', c)];
      case 'k_shell':
        return [E(50, T+BODY_H*0.55, 76, BODY_H*0.42, c),
                E(50, T+BODY_H*0.55, 52, BODY_H*0.28, null, d, 6)];
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

    var PAD = 62;
    var vb = (-PAD) + ' ' + (-PAD) + ' ' + (W + PAD*2) + ' ' + (H + PAD*2);
    var h = opt.height || 260;
    var w = opt.width || Math.round(h * (W + PAD*2) / (H + PAD*2));
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
