/* AIBROFIST — отрисовка персонажа по скину.
   Один и тот же код используют редактор скинов, аватар и карточки магазина. */
(function () {
  'use strict';

  var W = 200, H = 270;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  }); }

  function shade(hex, amt) {
    if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return '#374151';
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
  }

  // ------------ детали ------------
  function back(id, c) {
    switch (id) {
      case 'k_bag':
        return '<rect x="60" y="112" width="80" height="58" rx="12" fill="' + c + '"/>' +
               '<rect x="86" y="126" width="28" height="20" rx="5" fill="' + shade(c, -40) + '"/>';
      case 'k_cape':
        return '<path d="M70 104 L130 104 L150 226 L100 208 L50 226 Z" fill="' + c + '"/>' +
               '<path d="M100 104 L100 208 L50 226 Z" fill="' + shade(c, -30) + '"/>';
      case 'k_jetpack':
        return '<rect x="58" y="112" width="24" height="62" rx="11" fill="' + c + '"/>' +
               '<rect x="118" y="112" width="24" height="62" rx="11" fill="' + c + '"/>' +
               '<path d="M64 176 q6 22 12 0 z" fill="#f97316"/>' +
               '<path d="M124 176 q6 22 12 0 z" fill="#f97316"/>';
      case 'k_wings':
        return '<path d="M74 108 q-58 -14 -62 46 q30 -16 62 16 z" fill="' + c + '" stroke="' + shade(c, -50) + '" stroke-width="3"/>' +
               '<path d="M126 108 q58 -14 62 46 q-30 -16 -62 16 z" fill="' + c + '" stroke="' + shade(c, -50) + '" stroke-width="3"/>';
      default: return '';
    }
  }

  function feet(id, c, base) {
    if (id === 'l_none' || !id) return '';
    if (id === 'l_rocket')
      return '<rect x="76" y="222" width="24" height="26" rx="7" fill="' + c + '"/>' +
             '<rect x="102" y="222" width="24" height="26" rx="7" fill="' + c + '"/>' +
             '<path d="M82 248 q6 16 12 0 z" fill="#fbbf24"/>' +
             '<path d="M108 248 q6 16 12 0 z" fill="#fbbf24"/>';
    var h = (id === 'l_boots') ? 30 : 20;
    var y = 248 - h;
    return '<rect x="74" y="' + y + '" width="28" height="' + h + '" rx="7" fill="' + c + '"/>' +
           '<rect x="100" y="' + y + '" width="28" height="' + h + '" rx="7" fill="' + c + '"/>';
  }

  function bodyWear(id, c) {
    switch (id) {
      case 'b_tshirt':
        return '<rect x="70" y="112" width="60" height="44" rx="8" fill="' + c + '"/>';
      case 'b_stripes':
        return '<rect x="70" y="110" width="60" height="66" rx="8" fill="' + c + '"/>' +
               '<rect x="70" y="118" width="60" height="8" fill="#1d4ed8"/>' +
               '<rect x="70" y="134" width="60" height="8" fill="#1d4ed8"/>' +
               '<rect x="70" y="150" width="60" height="8" fill="#1d4ed8"/>' +
               '<rect x="70" y="166" width="60" height="8" fill="#1d4ed8"/>';
      case 'b_hoodie':
        return '<rect x="68" y="108" width="64" height="72" rx="12" fill="' + c + '"/>' +
               '<path d="M78 108 q22 26 44 0" fill="none" stroke="' + shade(c, 40) + '" stroke-width="5"/>' +
               '<rect x="86" y="150" width="28" height="16" rx="6" fill="' + shade(c, -25) + '"/>';
      case 'b_overall':
        return '<rect x="70" y="126" width="60" height="60" rx="8" fill="' + c + '"/>' +
               '<rect x="78" y="104" width="10" height="30" fill="' + c + '"/>' +
               '<rect x="112" y="104" width="10" height="30" fill="' + c + '"/>' +
               '<circle cx="83" cy="132" r="4" fill="#fbbf24"/>' +
               '<circle cx="117" cy="132" r="4" fill="#fbbf24"/>';
      case 'b_jacket':
        return '<rect x="68" y="108" width="64" height="72" rx="10" fill="' + c + '"/>' +
               '<rect x="96" y="108" width="8" height="72" fill="' + shade(c, 50) + '"/>';
      case 'b_suit':
        return '<rect x="68" y="106" width="64" height="76" rx="8" fill="' + c + '"/>' +
               '<path d="M88 106 L100 132 L112 106 Z" fill="#ffffff"/>' +
               '<path d="M100 132 l-7 26 l7 8 l7 -8 z" fill="#b91c1c"/>';
      case 'b_armor':
        return '<rect x="66" y="104" width="68" height="78" rx="12" fill="' + c + '"/>' +
               '<rect x="66" y="128" width="68" height="6" fill="' + shade(c, -50) + '"/>' +
               '<rect x="66" y="152" width="68" height="6" fill="' + shade(c, -50) + '"/>' +
               '<circle cx="100" cy="118" r="9" fill="' + shade(c, -60) + '"/>';
      default: return '';
    }
  }

  function hands(id, c) {
    if (id === 'a_none' || !id) return '';
    var r = (id === 'a_boxing') ? 15 : 11;
    var fill = c;
    return '<circle cx="56" cy="176" r="' + r + '" fill="' + fill + '"/>' +
           '<circle cx="144" cy="176" r="' + r + '" fill="' + fill + '"/>' +
           (id === 'a_gaunt'
             ? '<rect x="46" y="150" width="20" height="18" rx="4" fill="' + shade(c, -40) + '"/>' +
               '<rect x="134" y="150" width="20" height="18" rx="4" fill="' + shade(c, -40) + '"/>'
             : '');
  }

  function face(id, c) {
    switch (id) {
      case 'f_glasses':
        return '<circle cx="88" cy="60" r="11" fill="none" stroke="' + c + '" stroke-width="4"/>' +
               '<circle cx="112" cy="60" r="11" fill="none" stroke="' + c + '" stroke-width="4"/>' +
               '<line x1="99" y1="60" x2="101" y2="60" stroke="' + c + '" stroke-width="4"/>';
      case 'f_shades':
        return '<rect x="76" y="52" width="48" height="16" rx="6" fill="' + c + '"/>' +
               '<rect x="98" y="57" width="4" height="5" fill="#4b5563"/>';
      case 'f_eyepatch':
        return '<path d="M74 46 L126 62" stroke="' + c + '" stroke-width="4"/>' +
               '<rect x="78" y="52" width="22" height="18" rx="5" fill="' + c + '"/>';
      case 'f_mask':
        return '<path d="M74 62 q26 34 52 0 l0 16 q-26 24 -52 0 z" fill="' + c + '"/>';
      case 'f_monocle':
        return '<circle cx="112" cy="60" r="12" fill="none" stroke="' + c + '" stroke-width="4"/>' +
               '<path d="M112 72 q4 16 -8 20" fill="none" stroke="' + c + '" stroke-width="3"/>';
      case 'f_visor':
        return '<path d="M68 54 q32 -12 64 0 l0 16 q-32 12 -64 0 z" fill="' + c + '" opacity=".85"/>';
      default: return '';
    }
  }

  function head(id, c) {
    switch (id) {
      case 'h_cap':
        return '<path d="M66 44 q34 -34 68 0 l0 8 l-68 0 z" fill="' + c + '"/>' +
               '<path d="M130 44 q26 4 26 14 l-26 0 z" fill="' + shade(c, -30) + '"/>';
      case 'h_beanie':
        return '<path d="M66 46 q34 -38 68 0 z" fill="' + c + '"/>' +
               '<rect x="64" y="42" width="72" height="12" rx="6" fill="' + shade(c, 40) + '"/>' +
               '<circle cx="100" cy="14" r="8" fill="' + shade(c, 40) + '"/>';
      case 'h_bandana':
        return '<path d="M66 42 q34 -18 68 0 l0 10 l-68 0 z" fill="' + c + '"/>' +
               '<path d="M134 48 l24 12 l-22 4 z" fill="' + shade(c, -30) + '"/>';
      case 'h_helmet':
        return '<path d="M62 56 q38 -48 76 0 l0 6 l-76 0 z" fill="' + c + '"/>' +
               '<rect x="96" y="8" width="8" height="24" fill="' + shade(c, -40) + '"/>';
      case 'h_cowboy':
        return '<path d="M70 40 q30 -34 60 0 z" fill="' + c + '"/>' +
               '<ellipse cx="100" cy="42" rx="52" ry="10" fill="' + shade(c, -20) + '"/>';
      case 'h_tophat':
        return '<rect x="76" y="-6" width="48" height="46" rx="4" fill="' + c + '"/>' +
               '<ellipse cx="100" cy="40" rx="46" ry="8" fill="' + c + '"/>' +
               '<rect x="76" y="26" width="48" height="9" fill="#b91c1c"/>';
      case 'h_horns':
        return '<path d="M72 34 q-16 -30 4 -34 q10 14 14 24 z" fill="' + c + '"/>' +
               '<path d="M128 34 q16 -30 -4 -34 q-10 14 -14 24 z" fill="' + c + '"/>';
      case 'h_halo':
        return '<ellipse cx="100" cy="10" rx="30" ry="9" fill="none" stroke="' + c + '" stroke-width="7"/>';
      case 'h_crown':
        return '<path d="M68 40 l0 -30 l16 14 l16 -22 l16 22 l16 -14 l0 30 z" fill="' + c + '"/>' +
               '<circle cx="100" cy="20" r="5" fill="#e11d48"/>';
      default: return '';
    }
  }

  /**
   * @param {object} skin  {color, head, face, body, hands, feet, back} — id вещей
   * @param {object} byId  каталог id -> item (item.v = цвет детали)
   * @param {object} opt   {width, height, bg}
   */
  function svg(skin, byId, opt) {
    skin = skin || {};
    byId = byId || {};
    opt = opt || {};
    var col = function (id, def) {
      var it = byId[id];
      return (it && it.v) ? it.v : (def || '#374151');
    };
    var base = col(skin.color, '#191919');
    var dark = shade(base, -35);

    var parts = [];
    parts.push(back(skin.back, col(skin.back, '#64748b')));

    // ноги
    parts.push('<rect x="78" y="182" width="20" height="60" rx="9" fill="' + dark + '"/>');
    parts.push('<rect x="102" y="182" width="20" height="60" rx="9" fill="' + dark + '"/>');
    parts.push(feet(skin.feet, col(skin.feet, '#e5e7eb'), base));

    // тело
    parts.push('<rect x="70" y="102" width="60" height="86" rx="18" fill="' + base + '"/>');
    parts.push(bodyWear(skin.body, col(skin.body, '#2196F3')));

    // руки
    parts.push('<rect x="48" y="108" width="18" height="66" rx="9" fill="' + base + '"/>');
    parts.push('<rect x="134" y="108" width="18" height="66" rx="9" fill="' + base + '"/>');
    parts.push(hands(skin.hands, col(skin.hands, '#111827')));

    // голова
    parts.push('<circle cx="100" cy="62" r="36" fill="' + base + '"/>');
    parts.push('<circle cx="88" cy="58" r="5" fill="#ffffff"/>');
    parts.push('<circle cx="112" cy="58" r="5" fill="#ffffff"/>');
    parts.push('<path d="M86 78 q14 12 28 0" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>');
    parts.push(face(skin.face, col(skin.face, '#374151')));
    parts.push(head(skin.head, col(skin.head, '#e04141')));

    var w = opt.width || W, h = opt.height || H;
    return '<svg viewBox="-10 -14 ' + (W + 20) + ' ' + (H + 20) + '" width="' + w + '" height="' + h +
           '" xmlns="http://www.w3.org/2000/svg">' +
           (opt.bg ? '<rect x="-10" y="-14" width="' + (W + 20) + '" height="' + (H + 20) +
                     '" rx="14" fill="' + esc(opt.bg) + '"/>' : '') +
           parts.join('') + '</svg>';
  }

  // маленькая карточка для магазина: показываем только нужный слот на нейтральном теле
  function preview(item, byId, base, size) {
    var s = {
      color: base && base.color ? base.color : 'c_black',
      head: 'h_none', face: 'f_none', body: 'b_none',
      hands: 'a_none', feet: 'l_none', back: 'k_none'
    };
    if (item.slot === 'color') s.color = item.id;
    else s[item.slot] = item.id;
    return svg(s, byId, { width: size || 92, height: Math.round((size || 92) * 1.35) });
  }

  window.BFSkin = { svg: svg, preview: preview, shade: shade };
})();
