/* ======= AIBROFIST — генератор карт по описанию =======
   Работает целиком в браузере: ни одного запроса в сеть, ни ключей,
   ни регистрации, ни лимитов. Это не нейросеть, а разбор текста плюс
   процедурная сборка геометрии — зато оно всегда доступно и мгновенно.

   Наружу: window.BFMapGen.generate(текст, {seed}) -> {mode, gravity, objects, summary}
   В node тот же модуль подключается через require — на нём держатся тесты. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BFMapGen = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /* ---------- физика игрока (должна совпадать с движком) ----------
     Прыжок 122px, разгон до 5.2px/кадр. Отсюда предельные разрывы:
     дальше игрок просто не долетит и карта станет непроходимой. */
  var GAP  = [90, 130, 170];   // максимальный разрыв по X для лёгкой/средней/сложной
  var RISE = [60,  85, 105];   // максимальный подъём за один прыжок
  var PH   = 60;               // рост игрока
  var PW   = 20;
  var HEAD = 110;              // просвет в коридоре, чтобы игрок проходил

  var OBJ_CAP  = 1900;         // потолок движка 2000, оставляем запас
  var COIN_CAP = 3;            // столько же, сколько принимает сервер

  /* ---------- ГСЧ с зерном ----------
     Одно и то же описание даёт одну и ту же карту, а кнопка «ещё вариант»
     просто меняет зерно. Без этого игрок не может вернуться к тому,
     что ему понравилось. */
  function mulberry(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      var r = t;
      r = Math.imul(r ^ (r >>> 15), r | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /* ══════════════════════════════════════════════════
     РАЗБОР ОПИСАНИЯ
     Ищем основы слов, а не слова целиком: «лабиринт», «лабиринта»,
     «лабиринтом» — одно и то же. Русский и английский вперемешку.
     ══════════════════════════════════════════════════ */
  var KINDS = [
    ['maze',    ['лабиринт', 'запутан', 'коридор', 'катакомб', 'подземел', 'maze', 'labyrinth', 'corridor', 'dungeon']],
    ['tower',   ['башн', 'вверх', 'вертикал', 'небоскрёб', 'небоскреб', 'подъём', 'подъем', 'взбира', 'колодец', 'tower', 'vertical', 'climb', 'shaft']],
    ['city',    ['город', 'здани', 'дом', 'крыш', 'квартал', 'улиц', 'city', 'building', 'roof', 'street', 'town']],
    ['cave',    ['пещер', 'грот', 'скал', 'камен', 'подзем', 'сталакт', 'cave', 'cavern', 'rock', 'grotto']],
    ['islands', ['остров', 'парящ', 'лета', 'облак', 'небе', 'бездн', 'island', 'floating', 'sky', 'cloud', 'void']],
    ['bridge',  ['мост', 'переправ', 'пропаст', 'каньон', 'ущел', 'bridge', 'chasm', 'canyon', 'gorge']],
    ['arena',   ['арен', 'площад', 'поле', 'открыт', 'просто', 'зал', 'arena', 'open', 'field', 'hall', 'plaza']],
    ['parkour', ['паркур', 'прыж', 'платформ', 'полос препятств', 'трасс', 'parkour', 'jump', 'platform', 'obstacle']]
  ];

  var SIZES = [
    ['huge',   ['огромн', 'гигантск', 'очень больш', 'громадн', 'huge', 'massive', 'enormous']],
    ['large',  ['больш', 'широк', 'длинн', 'просторн', 'big', 'large', 'wide', 'long']],
    ['small',  ['маленьк', 'мал', 'небольш', 'тесн', 'коротк', 'компактн', 'small', 'tiny', 'short', 'compact']],
    ['medium', ['средн', 'обычн', 'normal', 'medium', 'average']]
  ];

  var DIFFS = [
    [2, ['сложн', 'трудн', 'хардкор', 'жёстк', 'жестк', 'адск', 'кошмар', 'невозможн', 'hard', 'hardcore', 'brutal', 'insane', 'difficult']],
    [0, ['лёгк', 'легк', 'прост', 'новичк', 'спокойн', 'easy', 'simple', 'casual', 'beginner']],
    [1, ['средн', 'умерен', 'medium', 'normal', 'moderate']]
  ];

  var FEAT = {
    water:    ['вода', 'воду', 'воды', 'озер', 'море', 'бассейн', 'река', 'реку', 'затоплен', 'water', 'lake', 'sea', 'pool', 'river', 'flooded'],
    acid:     ['кислот', 'ядовит', 'токсич', 'acid', 'toxic'],
    traps:    ['ловуш', 'шип', 'яд', 'опасн', 'смерт', 'убива', 'лав', 'кислот', 'trap', 'spike', 'poison', 'deadly', 'lava', 'hazard', 'danger'],
    bounce:   ['батут', 'пружин', 'отскок', 'подкид', 'trampolin', 'bounce', 'spring'],
    movers:   ['движ', 'подвижн', 'едущ', 'ездящ', 'катающ', 'moving', 'mover'],
    spinners: ['вращ', 'крутящ', 'вертящ', 'вертушк', 'spinning', 'rotating', 'rotor'],
    switches: ['кнопк', 'рычаг', 'механизм', 'переключ', 'button', 'lever', 'switch', 'mechanism'],
    hides:    ['укрыт', 'прятат', 'спрятат', 'схрон', 'закут', 'тайник', 'hide', 'hiding', 'cover', 'stash'],
    walls:    ['стен', 'заборы', 'ограж', 'wall', 'fence']
  };

  var MODES = [
    ['hideAndSeek', ['прятк', 'пряч', 'искател', 'hide', 'seek']],
    ['race',        ['гонк', 'гонoч', 'наперегонк', 'финиш', 'race', 'sprint', 'finish']]
  ];

  function has(text, stems) {
    for (var i = 0; i < stems.length; i++) if (text.indexOf(stems[i]) !== -1) return true;
    return false;
  }
  function pickTable(text, table, fallback) {
    for (var i = 0; i < table.length; i++) if (has(text, table[i][1])) return table[i][0];
    return fallback;
  }

  // «3 укрытия», «пять монет», «10 платформ» — вытаскиваем число рядом со словом
  var WORD_NUM = { 'один': 1, 'одна': 1, 'одно': 1, 'два': 2, 'две': 2, 'три': 3, 'четыре': 4,
                   'пять': 5, 'шесть': 6, 'семь': 7, 'восемь': 8, 'девять': 9, 'десять': 10,
                   'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6,
                   'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10 };

  function countNear(text, stems) {
    var words = text.split(/[^0-9a-zа-яё]+/);
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!w) continue;
      var isTarget = false;
      for (var s = 0; s < stems.length; s++) if (w.indexOf(stems[s]) === 0) { isTarget = true; break; }
      if (!isTarget) continue;
      // число может стоять и до слова, и после него
      for (var d = 1; d <= 2; d++) {
        var before = words[i - d], after = words[i + d];
        var v = numOf(before);
        if (v !== null) return v;
        v = numOf(after);
        if (v !== null) return v;
      }
    }
    return null;
  }
  function numOf(w) {
    if (!w) return null;
    if (/^\d+$/.test(w)) {
      var n = parseInt(w, 10);
      return (n >= 0 && n <= 99) ? n : null;
    }
    return WORD_NUM[w] !== undefined ? WORD_NUM[w] : null;
  }

  function parse(text, opts) {
    opts = opts || {};
    var t = String(text || '').toLowerCase().replace(/ё/g, 'ё').trim();

    var spec = {
      text:  String(text || '').trim(),
      kind:  pickTable(t, KINDS, null),
      size:  pickTable(t, SIZES, 'medium'),
      diff:  pickTable(t, DIFFS, 1),
      mode:  pickTable(t, MODES, null) || opts.mode || 'hideAndSeek',
      seed:  opts.seed != null ? opts.seed : hash(t || 'aibrofist')
    };

    // «12x30» — прямое указание размера в клетках
    var box = t.match(/(\d{1,3})\s*[xх×*]\s*(\d{1,3})/);
    if (box) {
      spec.cellsW = Math.max(12, Math.min(90, parseInt(box[1], 10)));
      spec.cellsH = Math.max(8,  Math.min(60, parseInt(box[2], 10)));
    }

    if (!spec.kind) spec.kind = (spec.mode === 'race') ? 'parkour' : 'arena';

    spec.traps    = has(t, FEAT.traps);
    spec.bounce   = has(t, FEAT.bounce);
    spec.movers   = has(t, FEAT.movers);
    spec.spinners = has(t, FEAT.spinners);
    spec.switches = has(t, FEAT.switches);
    spec.walls    = has(t, FEAT.walls);
    spec.acid     = has(t, FEAT.acid);
    spec.water    = has(t, FEAT.water) || spec.acid;

    // сложность сама добавляет опасностей, если про них ничего не сказано
    if (!spec.traps && spec.diff === 2) spec.traps = true;

    var wantHide = has(t, FEAT.hides) || spec.mode === 'hideAndSeek';
    var nHide = countNear(t, ['укрыт', 'тайник', 'cover', 'hide', 'hiding']);
    spec.hides = wantHide ? (nHide !== null ? Math.min(nHide, 24) : 0) : 0;
    spec.hidesAuto = wantHide && nHide === null;

    var nCoin = countNear(t, ['монет', 'coin']);
    spec.coins = nCoin !== null ? Math.max(0, Math.min(nCoin, COIN_CAP))
                                : (t.indexOf('монет') !== -1 || t.indexOf('coin') !== -1 ? COIN_CAP : 1);

    return spec;
  }

  /* ══════════════════════════════════════════════════
     СБОРКА ГЕОМЕТРИИ
     ══════════════════════════════════════════════════ */
  var INK = '#111827';

  function Builder(spec) {
    this.spec = spec;
    this.r = mulberry(spec.seed);
    this.objects = [];
    this.id = 1;
  }
  Builder.prototype.rnd = function (a, b) { return a + this.r() * (b - a); };
  Builder.prototype.ri  = function (a, b) { return Math.floor(this.rnd(a, b + 1)); };
  Builder.prototype.chance = function (p) { return this.r() < p; };
  Builder.prototype.pick = function (arr) { return arr[this.ri(0, arr.length - 1)]; };

  Builder.prototype.add = function (type, x, y, w, h, extra) {
    if (this.objects.length >= OBJ_CAP) return null;
    var o = {
      id: this.id++, type: type,
      x: Math.round(x), y: Math.round(y),
      w: Math.max(4, Math.round(w)), h: Math.max(4, Math.round(h)),
      rot: 0, fill: (type === 'coin' || type === 'checkpoint' || type === 'finishline') ? '' : INK,
      deadly: false
    };
    if (extra) for (var k in extra) o[k] = extra[k];
    this.objects.push(o);
    return o;
  };
  Builder.prototype.block = function (x, y, w, h, extra) { return this.add('rect', x, y, w, h, extra); };

  // опасный блок: чёрный на чёрном не виден, поэтому красим ядовитым зелёным
  Builder.prototype.trap = function (x, y, w, h, extra) {
    return this.add('rect', x, y, w, h, Object.assign({ deadly: true, fill: '#16a34a' }, extra || {}));
  };
  // рикошет: отражает игрока от той грани, в которую он попал
  Builder.prototype.pad = function (x, y, w, h) {
    return this.add('rect', x, y, w, h, { ricochet: true, fill: '#a855f7' });
  };
  // вода рядами по 20 пикселей, как её кладёт редактор
  Builder.prototype.water = function (x, y, w, h, acid) {
    var rows = Math.max(1, Math.round(h / 20));
    for (var i = 0; i < rows; i++)
      this.add('water', x, y + i * 20, w, 20, {
        fill: acid ? '#38d430' : '#3b82f6', acid: !!acid,
        sink: !!acid, sinkSpeed: acid ? 1.8 : 0        // из яда не выплыть
      });
  };
  Builder.prototype.mover = function (x, y, w, h, dx, dy) {
    return this.add('rect', x, y, w, h, { moves: true, moveX: dx, moveY: dy, speed: 1.1, fill: '#475569' });
  };
  Builder.prototype.spinner = function (x, y, w, h) {
    return this.add('rect', x, y, w, h, { spins: true, spin: 2, deadly: true, fill: '#7c3aed' });
  };
  // укрытие: игрок в него заходит и пропадает для искателя
  Builder.prototype.hide = function (x, y, w, h) {
    return this.add('rect', x, y, w, h, { hideSpot: true, fill: '#334155' });
  };

  Builder.prototype.gap  = function () { return GAP[this.spec.diff]; };
  Builder.prototype.rise = function () { return RISE[this.spec.diff]; };

  /* ---------- размеры мира ---------- */
  var SIZE_CELLS = {
    small:  [26, 14],
    medium: [44, 18],
    large:  [72, 24],
    huge:   [104, 30]
  };
  var TOWER_H = { small: 22, medium: 32, large: 42, huge: 56 };
  var U = 40;   // сторона клетки

  function worldOf(spec) {
    var c = SIZE_CELLS[spec.size] || SIZE_CELLS.medium;
    var w = (spec.cellsW || c[0]), h = (spec.cellsH || c[1]);
    // башня растёт не вширь, а вверх — иначе «огромная» ничем не отличается
    if (spec.kind === 'tower') {
      w = Math.min(w, 24);
      h = spec.cellsH || TOWER_H[spec.size] || TOWER_H.medium;
    }
    return { W: w * U, H: h * U, cw: w, ch: h };
  }

  /* ---------- общие детали ---------- */
  Builder.prototype.finishAt = function (x, groundY) {
    if (this.spec.mode !== 'race') return;
    this.add('finishline', x, groundY - 160, 50, 160);
  };
  Builder.prototype.spawnAt = function (x, groundY) {
    this.add('spawn', x, groundY - PH, PW, PH, { fill: INK });
  };

  // монеты кладём на уже готовые площадки, чтобы они не висели в пустоте
  Builder.prototype.scatterCoins = function (spots) {
    var n = Math.min(this.spec.coins, COIN_CAP, spots.length);
    for (var i = 0; i < n; i++) {
      var s = spots[Math.floor(i * spots.length / Math.max(1, n))];
      if (!s) continue;
      this.add('coin', s.x - 11, s.y - 64, 22, 22, { fill: '' });
    }
  };

  Builder.prototype.scatterHides = function (spots, wanted) {
    var n = Math.min(wanted, spots.length);
    for (var i = 0; i < n; i++) {
      var s = spots[Math.floor(i * spots.length / Math.max(1, n))];
      if (!s) continue;
      this.hide(s.x - 26, s.y - 92, 52, 92);
    }
  };

  /* ══════════════════════════════════════════════════
     АРХЕТИПЫ
     ══════════════════════════════════════════════════ */

  /* Паркур: цепочка площадок слева направо, перепад высот и разрывы
     растут вместе со сложностью. Это же основа для гонки. */
  Builder.prototype.parkour = function (Wd, Ht) {
    var groundY = Ht - 2 * U;
    var x = 60, y = groundY;
    var spots = [], hideSpots = [];

    this.block(0, groundY, 240, 60);
    this.spawnAt(80, groundY);
    spots.push({ x: 140, y: groundY });
    x = 240;

    var guard = 0;
    while (x < Wd - 320 && guard++ < 120) {
      var g = this.rnd(this.gap() * 0.4, this.gap() * 0.92);
      var pw = this.rnd(70, 160);
      var dy = this.rnd(-this.rise(), this.rise() * 0.8);
      y = Math.max(3 * U, Math.min(groundY, y + dy));
      x += g;

      if (this.spec.movers && this.chance(0.18)) {
        this.mover(x, y, Math.max(70, pw * 0.7), 22, this.chance(0.5) ? 140 : 0, this.chance(0.5) ? -110 : 0);
      } else {
        this.block(x, y, pw, 24);
        spots.push({ x: x + pw / 2, y: y });
        if (pw > 120) hideSpots.push({ x: x + pw / 2, y: y });
      }

      if (this.spec.bounce && this.chance(0.16)) this.pad(x + pw * 0.3, y - 20, 60, 18);
      if (this.spec.traps && this.chance(0.28)) this.trap(x + pw + 12, y + 26, this.rnd(50, 110), 18);
      if (this.spec.spinners && this.chance(0.12)) this.spinner(x + pw * 0.5, y - 130, 90, 16);

      // чекпоинты в гонке, чтобы падение не отбрасывало в самое начало
      if (this.spec.mode === 'race' && this.spec.diff > 0 && this.chance(0.12))
        this.add('checkpoint', x + 10, y - 64, 30, 64, { fill: '' });

      x += pw;
    }

    this.block(Wd - 300, groundY, 300, 60);
    spots.push({ x: Wd - 160, y: groundY });
    hideSpots.push({ x: Wd - 200, y: groundY });
    this.finishAt(Wd - 140, groundY);
    return { spots: spots, hides: hideSpots, groundY: groundY };
  };

  /* Башня: подъём по уступам между двумя стенами. Уступы чередуются
     сторонами — так подъём читается и не превращается в лотерею. */
  Builder.prototype.tower = function (Wd, Ht) {
    var groundY = Ht - 2 * U;
    var spots = [], hides = [];

    this.block(0, groundY, Wd, 60);
    this.block(-30, 0, 30, Ht);
    this.block(Wd, 0, 30, Ht);
    this.spawnAt(60, groundY);
    spots.push({ x: 120, y: groundY });

    var y = groundY - this.rise() * 0.9, side = 0, step = 0;
    while (y > 2 * U && this.objects.length < OBJ_CAP - 40) {
      var pw = this.rnd(Wd * 0.32, Wd * 0.52);
      var x = side ? Wd - pw - this.rnd(0, 40) : this.rnd(0, 40);
      this.block(x, y, pw, 22);
      spots.push({ x: x + pw / 2, y: y });
      if (pw > 150 && step % 2 === 0) hides.push({ x: x + pw / 2, y: y });

      if (this.spec.bounce && this.chance(0.2)) this.pad(x + pw * 0.45, y - 20, 60, 18);
      if (this.spec.traps && this.chance(0.3)) this.trap(x + (side ? -70 : pw + 10), y + 24, 60, 16);
      if (this.spec.movers && this.chance(0.15))
        this.mover(Wd * 0.4, y - this.rise() * 0.5, 90, 20, 0, -90);

      y -= this.rnd(this.rise() * 0.65, this.rise());
      side = 1 - side;
      step++;
    }

    var top = Math.max(2 * U, y);
    this.block(Wd * 0.25, top, Wd * 0.5, 26);
    spots.push({ x: Wd * 0.5, y: top });
    this.finishAt(Wd * 0.5 - 25, top);
    return { spots: spots, hides: hides, groundY: groundY };
  };

  /* Арена: один большой пол, стены по краям, несколько ярусов и много
     мест, где можно встать. Лучший вариант для пряток. */
  Builder.prototype.arena = function (Wd, Ht) {
    var groundY = Ht - 2 * U;
    var spots = [], hides = [];

    this.block(0, groundY, Wd, 60);
    this.block(-30, 0, 30, Ht + 60);
    this.block(Wd, 0, 30, Ht + 60);
    this.spawnAt(70, groundY);
    spots.push({ x: 150, y: groundY });

    var tiers = this.ri(2, 3);
    for (var t = 1; t <= tiers; t++) {
      var y = groundY - t * this.rnd(this.rise() * 0.9, this.rise() * 1.15);
      if (y < 2 * U) break;
      var n = this.ri(2, Math.max(3, Math.round(Wd / 300)));
      for (var i = 0; i < n; i++) {
        var pw = this.rnd(120, 260);
        var x = this.rnd(40, Math.max(60, Wd - pw - 40));
        this.block(x, y + this.rnd(-20, 20), pw, 24);
        spots.push({ x: x + pw / 2, y: y });
        hides.push({ x: x + pw / 2, y: y });
      }
    }

    // столбы и ниши на полу: за ними и прячутся
    var pillars = this.ri(3, Math.max(4, Math.round(Wd / 240)));
    for (var p = 0; p < pillars; p++) {
      var px = this.rnd(200, Math.max(220, Wd - 200));
      var ph = this.rnd(90, 200);
      this.block(px, groundY - ph, this.rnd(30, 70), ph);
      hides.push({ x: px - 40, y: groundY });
    }

    if (this.spec.traps) {
      var traps = this.ri(2, 5);
      for (var q = 0; q < traps; q++)
        this.trap(this.rnd(200, Wd - 300), groundY - 16, this.rnd(60, 130), 16);
    }
    if (this.spec.bounce) this.pad(Wd * 0.5, groundY - 18, 80, 18);

    this.finishAt(Wd - 120, groundY);
    return { spots: spots, hides: hides, groundY: groundY };
  };

  /* Лабиринт: многоэтажка. Этажи через каждые HEAD+ пикселей, в полу
     оставляем шахты, а рядом со ступеньками — подъём. Внутри этажей
     стены-перегородки, чтобы искать приходилось долго. */
  Builder.prototype.maze = function (Wd, Ht) {
    var spots = [], hides = [];
    var floorH = HEAD + 40;
    var floors = Math.max(2, Math.floor((Ht - U) / floorH));
    var groundY = floorH * floors;

    this.block(-30, 0, 30, groundY + 60);
    this.block(Wd, 0, 30, groundY + 60);
    this.block(0, groundY, Wd, 60);
    this.spawnAt(60, groundY);
    spots.push({ x: 130, y: groundY });

    for (var f = 1; f <= floors; f++) {
      var y = groundY - f * floorH;
      // в полу этажа один-два проёма — это переходы между этажами
      var holes = [];
      var nh = this.ri(1, 2);
      for (var i = 0; i < nh; i++) holes.push(this.rnd(120, Math.max(140, Wd - 220)));

      var x = 0;
      while (x < Wd) {
        var seg = this.rnd(120, 300);
        var blocked = holes.some(function (hx) { return x < hx + 110 && x + seg > hx; });
        if (!blocked) {
          this.block(x, y, Math.min(seg, Wd - x), 22);
          spots.push({ x: x + seg / 2, y: y });
        }
        x += seg;
      }

      // ступеньки у проёма, иначе на этаж не подняться
      holes.forEach(function (hx) {
        this.block(hx + 100, y + floorH * 0.55, 70, 18);
        this.block(hx - 40, y + floorH * 0.28, 70, 18);
      }, this);

      // перегородки этажа
      var walls = this.ri(1, 3);
      for (var w = 0; w < walls; w++) {
        var wx = this.rnd(150, Math.max(180, Wd - 180));
        this.block(wx, y - HEAD * 0.62, 26, HEAD * 0.62);
        hides.push({ x: wx - 40, y: y });
      }
      hides.push({ x: this.rnd(100, Math.max(140, Wd - 140)), y: y });

      if (this.spec.traps && this.chance(0.6))
        this.trap(this.rnd(150, Wd - 250), y - 16, this.rnd(50, 110), 16);
      if (this.spec.switches && f === 1) {
        var bx = this.rnd(200, Math.max(240, Wd - 300));
        this.add('button', bx, y - 18, 34, 18, { fill: INK, customId: 'b1', targetIds: 'door1' });
        this.block(bx + 180, y - HEAD, 26, HEAD, { customId: 'door1' });
      }
    }

    this.finishAt(Wd - 140, groundY - floors * floorH);
    return { spots: spots, hides: hides, groundY: groundY };
  };

  /* Пещера: неровный пол случайным блужданием плюс свод сверху.
     Перепад ограничен высотой прыжка, иначе получается тупик. */
  Builder.prototype.cave = function (Wd, Ht) {
    var spots = [], hides = [];
    var baseY = Ht - 2 * U;
    var y = baseY, x = 0;
    var step = 70;

    this.block(-30, 0, 30, Ht + 60);
    this.block(Wd, 0, 30, Ht + 60);
    this.spawnAt(60, baseY);

    while (x < Wd) {
      var w = this.rnd(step, step * 2.2);
      this.block(x, y, w + 4, Ht - y + 60);
      if (this.chance(0.35)) spots.push({ x: x + w / 2, y: y });
      if (this.chance(0.25)) hides.push({ x: x + w / 2, y: y });

      // свод: сталактиты сверху, опасные при высокой сложности
      var ch = this.rnd(60, 150);
      if (this.chance(0.55)) {
        var cy = y - HEAD - ch;
        if (cy > 20) {
          if (this.spec.traps && this.chance(0.4)) this.trap(x + 10, cy, w * 0.5, ch);
          else this.block(x, cy, w, ch);
        }
      }
      if (this.spec.bounce && this.chance(0.12)) this.pad(x + 10, y - 18, 60, 18);

      var d = this.rnd(-this.rise() * 0.9, this.rise() * 0.7);
      y = Math.max(4 * U, Math.min(baseY + U, y + d));
      x += w;
    }

    this.finishAt(Wd - 150, y);
    return { spots: spots, hides: hides, groundY: baseY };
  };

  /* Город: здания разной высоты, между ними просветы по силам прыжка.
     Крыши — основной маршрут, земля — запасной. */
  Builder.prototype.city = function (Wd, Ht) {
    var spots = [], hides = [];
    var groundY = Ht - 2 * U;

    this.block(0, groundY, Wd, 60);
    this.spawnAt(60, groundY);
    spots.push({ x: 130, y: groundY });

    var x = 200, prevRoof = groundY;
    while (x < Wd - 260 && this.objects.length < OBJ_CAP - 40) {
      var bw = this.rnd(110, 220);
      var maxUp = prevRoof - this.rise();
      var roof = Math.max(3 * U, Math.min(groundY - 60, this.rnd(maxUp, prevRoof + this.rise())));
      this.block(x, roof, bw, groundY - roof);
      spots.push({ x: x + bw / 2, y: roof });

      // окно-ниша в стене — готовое укрытие
      if (bw > 150 && this.chance(0.6)) {
        hides.push({ x: x + bw * 0.5, y: groundY });
        this.block(x + bw * 0.25, roof + 60, bw * 0.5, 14);
      }
      if (this.spec.traps && this.chance(0.3)) this.trap(x + bw * 0.3, roof - 16, bw * 0.4, 16);
      if (this.spec.bounce && this.chance(0.25)) this.pad(x + bw * 0.4, roof - 18, 60, 18);
      if (this.spec.movers && this.chance(0.2))
        this.mover(x + bw + 20, roof - 40, 90, 20, this.gap() * 0.8, 0);

      prevRoof = roof;
      x += bw + this.rnd(this.gap() * 0.5, this.gap());
    }

    this.block(Wd - 240, groundY - 120, 240, 120);
    spots.push({ x: Wd - 120, y: groundY - 120 });
    this.finishAt(Wd - 130, groundY - 120);
    return { spots: spots, hides: hides, groundY: groundY };
  };

  /* Острова: куски земли над пустотой. Падение — смерть по правилу
     движка (y > 5000), так что расстояния держим строго по прыжку. */
  Builder.prototype.islands = function (Wd, Ht) {
    var spots = [], hides = [];
    var midY = Ht * 0.62;

    this.block(0, midY, 220, 50);
    this.spawnAt(70, midY);
    spots.push({ x: 120, y: midY });

    var x = 220, y = midY;
    var guard = 0;
    while (x < Wd - 280 && guard++ < 90) {
      x += this.rnd(this.gap() * 0.5, this.gap());
      y = Math.max(2.5 * U, Math.min(Ht - 3 * U, y + this.rnd(-this.rise(), this.rise() * 0.85)));
      var iw = this.rnd(90, 220), ih = this.rnd(30, 70);
      this.block(x, y, iw, ih);
      spots.push({ x: x + iw / 2, y: y });
      if (iw > 150) hides.push({ x: x + iw / 2, y: y });

      // маленький спутник сверху — за монетой или как страховка
      if (this.chance(0.35)) this.block(x + this.rnd(-40, iw), y - this.rnd(90, this.rise() + 20), this.rnd(60, 110), 20);
      if (this.spec.spinners && this.chance(0.18)) this.spinner(x + iw * 0.5, y - 120, 80, 16);
      if (this.spec.bounce && this.chance(0.2)) this.pad(x + iw * 0.4, y - 18, 60, 18);
      x += iw;
    }

    this.block(Wd - 260, y, 260, 60);
    spots.push({ x: Wd - 130, y: y });
    this.finishAt(Wd - 120, y);
    return { spots: spots, hides: hides, groundY: midY };
  };

  /* Мост через пропасть: настил с провалами, внизу — опасная зона. */
  Builder.prototype.bridge = function (Wd, Ht) {
    var spots = [], hides = [];
    var deckY = Ht * 0.45;
    var pitY  = Ht - U;

    this.block(0, deckY, 260, 60);
    this.spawnAt(70, deckY);
    spots.push({ x: 130, y: deckY });

    if (this.spec.traps) this.trap(240, pitY, Math.max(200, Wd - 500), 40);

    var x = 260;
    var guard = 0;
    while (x < Wd - 300 && guard++ < 90) {
      var sw = this.rnd(140, 300);
      this.block(x, deckY, sw, 22);
      spots.push({ x: x + sw / 2, y: deckY });

      // опоры вниз — заодно ориентир и укрытие у края
      if (this.chance(0.5)) this.block(x + sw * 0.5 - 12, deckY + 22, 24, this.rnd(60, 160));
      if (this.chance(0.4)) hides.push({ x: x + sw * 0.5, y: deckY });
      if (this.spec.spinners && this.chance(0.2)) this.spinner(x + sw * 0.5, deckY - 130, 90, 16);
      if (this.chance(0.3)) this.block(x + this.rnd(0, sw - 80), deckY - this.rnd(100, this.rise() + 30), 80, 18);

      x += sw;
      var hole = this.rnd(this.gap() * 0.5, this.gap());
      if (this.spec.movers && this.chance(0.35)) this.mover(x + 10, deckY - 10, 80, 20, hole * 0.8, 0);
      x += hole;
    }

    this.block(Wd - 300, deckY, 300, 60);
    spots.push({ x: Wd - 150, y: deckY });
    this.finishAt(Wd - 130, deckY);
    return { spots: spots, hides: hides, groundY: deckY };
  };

  /* ══════════════════════════════════════════════════
     ГЛАВНАЯ ФУНКЦИЯ
     ══════════════════════════════════════════════════ */
  var KIND_RU = {
    parkour: 'паркур', tower: 'башня', arena: 'арена', maze: 'лабиринт',
    cave: 'пещера', city: 'город', islands: 'острова', bridge: 'мост'
  };
  var DIFF_RU = ['лёгкая', 'средняя', 'сложная'];
  var SIZE_RU = { small: 'маленькая', medium: 'средняя', large: 'большая', huge: 'огромная' };

  /* ---------- размещение заказов из разбора по словам ----------
     Сюда попадает всё, что игрок перечислил явно: объект, количество,
     цвет, размер, свойства и место. Ставится поверх базовой карты. */
  var SIZE_PX = { tiny: 12, small: 20, big: 60, huge: 110 };
  var ONE = ['spawn', 'finishline', 'button', 'lever'];
  var SOLIDS = ['rect', 'circle', 'triangle'];

  function zoneOf(name, W, H, groundY) {
    switch (name) {
      case 'top':    return { x0: 0.04*W, x1: 0.96*W, y0: 0.05*H, y1: 0.28*H };
      case 'bottom': return { x0: 0.04*W, x1: 0.96*W, y0: Math.max(0, groundY - 0.22*H), y1: groundY - 30 };
      case 'left':   return { x0: 0.03*W, x1: 0.30*W, y0: 0.10*H, y1: groundY - 30 };
      case 'right':  return { x0: 0.70*W, x1: 0.97*W, y0: 0.10*H, y1: groundY - 30 };
      case 'center': return { x0: 0.34*W, x1: 0.66*W, y0: 0.30*H, y1: 0.70*H };
      case 'edges':  return { x0: 0.02*W, x1: 0.98*W, y0: 0.05*H, y1: groundY - 30, ring: true };
      default:       return { x0: 0.05*W, x1: 0.95*W, y0: 0.10*H, y1: groundY - 40 };
    }
  }

  function applyProps(o, ord) {
    var p = ord.props;
    if (p.deadly)     o.deadly = true;
    if (p.ghost)      o.ghost = true;
    if (p.hideSpot)   o.hideSpot = true;
    if (p.ricochet)   o.ricochet = true;
    if (p.startsOpen) o.startsOpen = true;
    if (p.acid)       o.acid = true;
    if (p.sink)     { o.sink = true; o.sinkSpeed = 2.2; }
    if (p.spins)    { o.spins = true; o.spin = ord.speed === 'fast' ? 5 : ord.speed === 'slow' ? 1 : 2.5; }
    if (p.moves) {
      o.moves = true;
      o.speed = ord.speed === 'fast' ? 2.2 : ord.speed === 'slow' ? 0.5 : 1.1;
      if (ord.axis === 'y') { o.moveX = 0; o.moveY = -130; }
      else                  { o.moveX = 150; o.moveY = 0; }
    }
    if (ord.color) o.fill = ord.color;
    return o;
  }

  Builder.prototype.orders = function (list, world, res) {
    var W = world.W, H = world.H, groundY = res.groundY || (H - 80);
    var placed = 0, coins = 0, linkIds = [];

    for (var oi = 0; oi < list.length; oi++) {
      var ord = list[oi];
      var z = zoneOf(ord.pos, W, H, groundY);
      var side = SIZE_PX[ord.size] || 20;

      // вода наливается объёмом, а не россыпью
      if (ord.type === 'water') {
        var wy1 = Math.min(groundY, z.y1), wy0 = Math.max(0, Math.min(z.y0, wy1 - 80));
        var rows = Math.max(2, Math.min(40, Math.round((wy1 - wy0) / 20)));
        for (var r = 0; r < rows; r++) {
          var wo = this.add('water', z.x0, wy1 - (r + 1) * 20, z.x1 - z.x0, 20,
                            { fill: ord.color || (ord.props.acid ? '#3fd13f' : '#3b82f6') });
          if (wo) { applyProps(wo, ord); placed++; }
        }
        continue;
      }

      var n = ord.count;
      if (n === null) n = (ONE.indexOf(ord.type) !== -1) ? 1 : (ord.plural ? 6 : 1);
      n = Math.max(1, Math.min(400, n));
      if (ord.type === 'coin') n = Math.min(n, COIN_CAP);
      if (ONE.indexOf(ord.type) !== -1) n = 1;
      if (ord.type === 'checkpoint') n = Math.min(n, 8);

      for (var k = 0; k < n; k++) {
        if (this.objects.length >= OBJ_CAP) break;
        var w = side, h = side;
        if (ord.type === 'coin')       { w = 22; h = 22; }
        if (ord.type === 'spawn')      { w = 20; h = 60; }
        if (ord.type === 'button')     { w = 34; h = 18; }
        if (ord.type === 'lever')      { w = 22; h = 42; }
        if (ord.type === 'checkpoint') { w = 30; h = 64; }
        if (ord.type === 'finishline') { w = 42; h = 86; }
        if (ord.type === 'text')       { w = 70; h = 24; }

        var x, y;
        if (z.ring) {
          // по краям: раскладываем по периметру
          var t = (k + 0.5) / n;
          var sw = z.x1 - z.x0, sh = z.y1 - z.y0, d = t * (2*sw + 2*sh);
          if (d < sw)                { x = z.x0 + d;                 y = z.y0; }
          else if (d < sw + sh)      { x = z.x1 - w;                 y = z.y0 + (d - sw); }
          else if (d < 2*sw + sh)    { x = z.x1 - (d - sw - sh);     y = z.y1 - h; }
          else                       { x = z.x0;                     y = z.y1 - (d - 2*sw - sh); }
        } else if (ONE.indexOf(ord.type) !== -1 || ord.type === 'checkpoint') {
          x = z.x0 + (z.x1 - z.x0) * ((k + 0.5) / n);
          y = groundY - h;
        } else if (ord.type === 'coin') {
          x = z.x0 + (z.x1 - z.x0) * ((k + 0.5) / n);
          y = z.y0 + (z.y1 - z.y0) * 0.5;
        } else {
          // сетка с лёгким разбросом: объекты не садятся друг на друга
          var span = Math.max(1, z.x1 - z.x0), tall = Math.max(1, z.y1 - z.y0);
          var cols = Math.max(1, Math.ceil(Math.sqrt(n * span / tall)));
          var rowsN = Math.max(1, Math.ceil(n / cols));
          x = z.x0 + span * (((k % cols) + 0.5) / cols) + this.rnd(-8, 8) - w/2;
          y = z.y0 + tall * ((Math.floor(k / cols) + 0.5) / rowsN) + this.rnd(-8, 8) - h/2;
        }
        x = Math.max(0, Math.min(W - w, x));
        y = Math.max(0, Math.min(H - h, y));

        if (ord.type === 'spawn') {
          // точка старта в карте одна: прежнюю убираем
          for (var q = this.objects.length - 1; q >= 0; q--)
            if (this.objects[q].type === 'spawn') this.objects.splice(q, 1);
          y = groundY - h;
        }
        if (ord.type === 'coin') {
          // потолок в три монеты держит сервер, обойти его нельзя
          var have = 0;
          for (var ci = 0; ci < this.objects.length; ci++)
            if (this.objects[ci].type === 'coin') have++;
          if (have >= COIN_CAP) break;
        }

        var obj = this.add(ord.type, x, y, w, h, {});
        if (!obj) break;
        applyProps(obj, ord);
        if (ord.type === 'text') obj.text = 'текст';
        // блок, который можно открыть кнопкой, получает адрес
        if (SOLIDS.indexOf(ord.type) !== -1 && linkIds.length < 6) {
          obj.customId = 'g' + obj.id;
          linkIds.push(obj.customId);
        }
        placed++;
      }
    }

    // кнопки и рычаги без целей бесполезны — привязываем к первым блокам
    if (linkIds.length)
      for (var m = 0; m < this.objects.length; m++) {
        var mo = this.objects[m];
        if ((mo.type === 'button' || mo.type === 'lever') && !mo.targetIds)
          mo.targetIds = linkIds.slice(0, 3).join(',');
      }
    return placed;
  };

  function generate(text, opts) {
    var spec = parse(text, opts);
    var b = new Builder(spec);
    var world = worldOf(spec);

    var res = (b[spec.kind] || b.arena).call(b, world.W, world.H);

    // укрытия только в прятках: в гонке они лишь мешают читать трассу
    if (spec.mode === 'hideAndSeek') {
      var want = spec.hides || (spec.hidesAuto ? Math.max(3, Math.round(world.cw / 9)) : 0);
      if (want) b.scatterHides(res.hides.length ? res.hides : res.spots, want);
    }
    // вода наливается в самую нижнюю часть карты — там, где она и собирается
    if (spec.water) {
      var lo = res.groundY, hi = lo + 4 * 20;
      b.water(0, lo + 20, world.W, hi - lo, spec.acid);
    }
    /* Явные пожелания игрока: разбор по словам даёт список заказов,
       и они ставятся поверх собранной карты. */
    var nlu = null;
    try {
      var N = (typeof window !== 'undefined' && window.BFNLU) ? window.BFNLU
            : (typeof require === 'function' ? require('./mapNLU.js') : null);
      if (N) nlu = N.analyze(text);
    } catch (e) { nlu = null; }
    var ordered = nlu && nlu.orders.length ? b.orders(nlu.orders, world, res) : 0;

    if (!ordered) b.scatterCoins(res.spots);

    // без точки старта редактор не даст сыграть
    if (!b.objects.some(function (o) { return o.type === 'spawn'; }))
      b.spawnAt(80, res.groundY);

    // гравитация во всех картах одна и та же — 9, менять её нельзя
    var gravity = 9;

    var counts = {};
    b.objects.forEach(function (o) {
      var k = o.type === 'water' ? (o.acid ? 'кислота' : 'вода')
            : o.hideSpot ? 'укрытия' : o.deadly ? 'опасные' : o.ricochet ? 'рикошет'
            : o.moves ? 'движущиеся' : o.spins ? 'вращающиеся' : o.type === 'coin' ? 'монеты'
            : o.type;
      counts[k] = (counts[k] || 0) + 1;
    });

    var summary = KIND_RU[spec.kind] + ' · ' + SIZE_RU[spec.size] + ' · ' + DIFF_RU[spec.diff]
      + ' · режим ' + (spec.mode === 'race' ? 'гонка' : 'прятки')
      + ' · объектов ' + b.objects.length;

    return {
      mode: spec.mode,
      gravity: gravity,
      objects: b.objects,
      spec: spec,
      counts: counts,
      nlu: nlu,
      report: nlu ? nlu.report : '',
      ordered: ordered,
      summary: summary
    };
  }

  return { generate: generate, parse: parse, KINDS: KINDS, U: U, OBJ_CAP: OBJ_CAP };
});
