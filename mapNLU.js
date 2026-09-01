/* ======= AIBROFIST — разбор запроса по словам =======
   Никаких заготовленных фраз. Текст режется на слова, каждое слово
   ищется в словаре по корню (поэтому «треугольник», «треугольные»,
   «треугольниками» — одно и то же), и из слов собираются заказы вида
   «5 красных вращающихся треугольников сверху».

   Наружу: window.BFNLU.analyze(текст)
   В node подключается через require — на нём держатся тесты. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BFNLU = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /* ---------- словарь ----------
     Ключ это корень, а не слово целиком: слово подходит, если начинается
     с ключа. Так любая падежная форма находится без морфологии. */

  // объекты редактора — все до единого
  var TYPES = {
    rect:       ['блок','кубик','куб','квадрат','прямоугольн','стен','пол','потолок','платформ','балк','плит','брус','ступен','полк','box','block','square','wall','floor','platform'],
    circle:     ['круг','шар','сфер','мяч','окружн','circle','ball','sphere','round'],
    triangle:   ['треугольн','шип','пик','клин','остри','конус','triangle','spike','wedge'],
    text:       ['текст','надпис','подпис','табличк','label','text','sign'],
    coin:       ['монет','монетк','золот','coin','gold'],
    water:      ['вод','жидкост','бассейн','озер','лужа','лужи','river','рек','мор','болот','кислот','яд','токсич','acid','water','pool','lake','poison'],
    spawn:      ['спавн','старт','появлен','возрожден','spawn','start'],
    button:     ['кнопк','нажимн','button','plate'],
    lever:      ['рычаг','переключат','тумблер','lever','switch'],
    checkpoint: ['чекпоинт','контрольн','сохранен','checkpoint'],
    finishline: ['финиш','выход','дверь','двер','ворот','конец','flag','finish','exit','goal']
  };

  // свойства объектов
  var PROPS = {
    deadly:   ['ядовит','смертельн','убива','опасн','шипаст','жгуч','лав','огнен','лет альн','deadly','kill','lethal','hazard'],
    ghost:    ['проходим','декорат','призрач','фонов','сквозн','неосязаем','ghost','decor','passable'],
    hideSpot: ['укрыт','тайник','схрон','прятат','спрятат','пряч','закут','hide','cover','stash'],
    ricochet: ['рикошет','отскок','отража','отраз','пружин','упруг','прыгуч','батут','ricochet','bounce','spring'],
    moves:    ['движ','подвижн','едущ','ездящ','катающ','ползущ','снующ','moving','mover','sliding'],
    spins:    ['вращ','крутящ','вертящ','вертушк','кружащ','spinning','rotating','rotor'],
    startsOpen:['открыт','поднят','убранн','opened','open'],
    acid:     ['кислот','ядовит','токсич','едк','acid','toxic'],
    sink:     ['затягива','топящ','тонущ','трясин','засасыва','утягива','болотн','sink','drown','suck']
  };

  // цвета
  var COLORS = {
    '#ef4444': ['красн','ал','багров','red','crimson'],
    '#f97316': ['оранж','рыж','orange'],
    '#eab308': ['жёлт','желт','золотист','yellow'],
    '#22c55e': ['зелён','зелен','салатов','изумруд','green'],
    '#14b8a6': ['бирюзов','мятн','teal','turquoise'],
    '#3b82f6': ['син','голуб','лазурн','blue','azure'],
    '#8b5cf6': ['фиолет','сирен','лилов','purple','violet'],
    '#ec4899': ['розов','малинов','pink','magenta'],
    '#92400e': ['коричнев','бур','brown'],
    '#111827': ['чёрн','черн','тёмн','темн','black','dark'],
    '#f8fafc': ['бел','светл','white','light'],
    '#6b7280': ['сер','стальн','gray','grey','silver']
  };

  // где размещать
  var POS = {
    top:    ['сверх','вверх','наверх','верхн','высок','небе','потолк','top','above','upper'],
    bottom: ['снизу','внизу','нижн','низ','дне','дно','земл','пол у','bottom','below','ground','lower'],
    left:   ['слев','лев','начал','left','west'],
    right:  ['справ','прав','конц','end у','right','east'],
    center: ['центр','середин','посередин','посредин','middle','center','centre'],
    edges:  ['кра','периметр','границ','стенк','обод','edge','border','perimeter'],
    around: ['вокруг','повсюд','везде','всюд','разброс','случайн','хаотич','random','everywhere','scatter']
  };

  // размеры
  var SIZES = {
    tiny:  ['крошеч','мельчайш','микро','tiny'],
    small: ['маленьк','мал','небольш','мелк','узк','тонк','small','little','thin'],
    big:   ['больш','крупн','широк','толст','длинн','big','large','wide','thick','long'],
    huge:  ['огромн','гигант','громадн','исполин','колосс','huge','giant','massive']
  };

  var SPEEDW = { slow: ['медлен','неспеш','плавн','slow'], fast: ['быстр','стремит','шустр','fast','quick','rapid'] };
  var AXIS   = { x: ['горизонт','вбок','вширь','влево','вправо','horizontal'], y: ['вертикал','вверх-вниз','ввысь','vertical'] };
  var DIFFS  = { 0:['лёгк','легк','прост','новичк','спокойн','easy','simple'],
                 1:['средн','обычн','умерен','normal','medium'],
                 2:['сложн','трудн','хардкор','жёстк','жестк','адск','кошмар','hard','brutal','insane'] };
  var MODES  = { hideAndSeek: ['прятк','пряч','искател','hide','seek'],
                 race: ['гонк','наперегонк','забег','race','sprint'] };
  var KINDS  = { maze:['лабиринт','запутан','коридор','катакомб','подземел','maze','labyrinth','dungeon'],
                 tower:['башн','вертикал','небоскрёб','небоскреб','подъём','подъем','взбира','колодец','tower','climb'],
                 city:['город','здани','дом','крыш','квартал','улиц','city','building','roof','town'],
                 cave:['пещер','грот','скал','камен','сталакт','cave','cavern','grotto'],
                 islands:['остров','парящ','лета','облак','бездн','island','floating','sky'],
                 bridge:['мост','переправ','пропаст','каньон','ущел','bridge','chasm','canyon'],
                 arena:['арен','площад','поле','открыт простр','зал','arena','field','hall'],
                 parkour:['паркур','прыж','полос препятств','трасс','parkour','jump','obstacle'] };

  var NUMW = { 'ноль':0,'один':1,'одна':1,'одно':1,'два':2,'две':2,'три':3,'четыр':4,'пять':5,'шесть':6,
               'сем':7,'восем':8,'девят':9,'десят':10,'одиннадцат':11,'двенадцат':12,'пятнадцат':15,
               'двадцат':20,'тридцат':30,'сорок':40,'пятьдесят':50,'сто':100,
               'пар':2,'нескольк':4,'немног':3,'мног':12,'куч':20,'полн':30,'тьм':40,
               'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,
               'few':3,'several':4,'many':12,'lots':20 };

  /* Связки. Короткие служебные слова сверяем целиком, иначе «а» съест
     «абракадабру», а «по» — «посередине». Длинные корни ищем по началу. */
  var STOP_EXACT = ['и','а','но','с','со','из','на','в','во','по','для','от','до','у','к','ко','о','об',
                    'же','что','где','там','тут','это','мне','мой','моя','ещё','еще','очень','мы','я',
                    'the','a','an','to','on','in','at','of','and','with','i','it','me','my'];
  var STOP_STEM  = ['чтобы','сдела','созда','постро','нужн','хочу','хоч','добав','поставь','поставит',
                    'пожалуйста','карт','уровен','level','map','make','build','create','add','put',
                    'place','some','please','want','need'];

  /* ---------- поиск по корню ----------
     Берём самое длинное совпадение, иначе «пол» перебьёт «полка». */
  function lookup(word, table) {
    var best = null, bestLen = 0;
    for (var key in table) {
      var list = table[key];
      for (var i = 0; i < list.length; i++) {
        var stem = list[i];
        if (word.indexOf(stem) === 0 && stem.length > bestLen) { best = key; bestLen = stem.length; }
      }
    }
    return best === null ? null : { value: best, len: bestLen };
  }
  function isStop(word) {
    if (STOP_EXACT.indexOf(word) !== -1) return true;
    for (var i = 0; i < STOP_STEM.length; i++)
      if (STOP_STEM[i].length >= 4 && word.indexOf(STOP_STEM[i]) === 0) return true;
    return false;
  }

  /* ---------- разбор одного слова ----------
     Каждое слово получает роль. Что не опознано — попадает в «не понял»,
     и игрок видит это в отчёте, а не молча теряет. */
  /* Роль слова выбирается по самому длинному совпадению во всех словарях
     сразу, а не по порядку таблиц. Иначе «ядовитые» поймалось бы на корень
     «яд» и стало объектом «вода» вместо свойства. */
  // NUMW это плоская таблица слово→число, приводим к виду для lookup
  var NUMWtable = {};
  for (var nk in NUMW) NUMWtable[nk] = [nk];

  var TABLES = [
    ['number', NUMWtable], ['type', TYPES], ['prop', PROPS], ['color', COLORS],
    ['pos', POS], ['size', SIZES], ['speed', SPEEDW], ['axis', AXIS],
    ['kind', KINDS], ['mode', MODES], ['diff', DIFFS]
  ];
  function classify(w) {
    if (/^\d+$/.test(w)) return { role: 'number', value: parseInt(w, 10) };
    var best = null, bestLen = 0;
    for (var t = 0; t < TABLES.length; t++) {
      var m = lookup(w, TABLES[t][1]);
      if (m && m.len > bestLen) { bestLen = m.len; best = { role: TABLES[t][0], value: m.value }; }
    }
    if (best) {
      if (best.role === 'number') best.value = NUMW[best.value];
      if (best.role === 'diff')   best.value = parseInt(best.value, 10);
      return best;
    }
    if (isStop(w)) return { role: 'stop' };
    return { role: 'unknown' };
  }

  var ROLE_RU = {
    type: 'объект', prop: 'свойство', color: 'цвет', pos: 'место', size: 'размер',
    speed: 'скорость', axis: 'направление', kind: 'тип карты', mode: 'режим',
    diff: 'сложность', number: 'количество', stop: 'связка', unknown: 'не понял'
  };
  var NAME_RU = {
    rect:'блок', circle:'круг', triangle:'треугольник', text:'надпись', coin:'монета',
    water:'вода', spawn:'точка старта', button:'кнопка', lever:'рычаг',
    checkpoint:'чекпоинт', finishline:'финиш',
    deadly:'убивает', ghost:'проходимый', hideSpot:'укрытие', ricochet:'рикошет',
    moves:'движется', spins:'вращается', startsOpen:'открыт сначала',
    acid:'яд', sink:'затягивает',
    top:'сверху', bottom:'снизу', left:'слева', right:'справа',
    center:'в центре', edges:'по краям', around:'вразброс',
    tiny:'крошечный', small:'маленький', big:'большой', huge:'огромный',
    slow:'медленно', fast:'быстро', x:'по горизонтали', y:'по вертикали'
  };

  /* ---------- сборка заказов ----------
     Определения, стоящие перед объектом, относятся к нему. То, что идёт
     сразу после объекта и до следующего числа или объекта, тоже. */
  function analyze(text) {
    var raw = String(text == null ? '' : text).toLowerCase();
    var words = raw.split(/[^0-9a-zа-яё]+/).filter(Boolean);

    var tokens = [], orders = [], unknown = [];
    var global = { kind: null, mode: null, diff: null, cellsW: null, cellsH: null, size: null };

    // размер поля вида 40x16 достаём до разбиения на слова
    var box = raw.match(/(\d{1,3})\s*[xх×*]\s*(\d{1,3})/);
    if (box) {
      global.cellsW = Math.max(10, Math.min(160, parseInt(box[1], 10)));
      global.cellsH = Math.max(8,  Math.min(90,  parseInt(box[2], 10)));
    }

    var pend = newPend();          // накопитель определений
    var cur = null;                // последний заказ, к нему цепляется хвост

    function newPend() {
      return { count: null, color: null, size: null, props: {}, pos: null, speed: null, axis: null };
    }
    function flushInto(o) {
      if (pend.count !== null) o.count = pend.count;
      if (pend.color) o.color = pend.color;
      if (pend.size) o.size = pend.size;
      if (pend.pos) o.pos = pend.pos;
      if (pend.speed) o.speed = pend.speed;
      if (pend.axis) o.axis = pend.axis;
      for (var k in pend.props) o.props[k] = pend.props[k];
      pend = newPend();
    }

    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var c = classify(w);
      tokens.push({ word: w, role: c.role, value: c.value });

      if (c.role === 'unknown') { unknown.push(w); continue; }
      if (c.role === 'stop') continue;

      /* «Огромный лабиринт» — размер относится к карте, а не к объекту,
         поэтому на слове-типе карты накопленное уходит в общие настройки. */
      if (c.role === 'kind') { global.kind = c.value; if (pend.size) global.size = pend.size; pend = newPend(); cur = null; continue; }
      if (c.role === 'mode') { global.mode = c.value; continue; }
      if (c.role === 'diff') { global.diff = c.value; continue; }

      /* В русском определения стоят перед существительным: «красных
         вращающихся треугольников». Поэтому цвет, размер, свойство и
         скорость копятся и достаются следующему объекту. После объекта
         обычно идёт только место — его цепляем к нему сразу. */
      if (c.role === 'number') { pend.count = c.value; cur = null; continue; }
      if (c.role === 'color')  { pend.color = c.value; cur = null; continue; }
      if (c.role === 'size')   { pend.size = c.value; if (!orders.length) global.size = c.value; cur = null; continue; }
      if (c.role === 'speed')  { pend.speed = c.value; cur = null; continue; }
      if (c.role === 'axis')   { pend.axis = c.value; cur = null; continue; }
      if (c.role === 'prop')   { pend.props[c.value] = true; cur = null; continue; }
      if (c.role === 'pos')    { if (cur) cur.pos = c.value; else pend.pos = c.value; continue; }

      if (c.role === 'type') {
        /* «платформа» и «платформы» — разное количество по умолчанию.
           Множественное число узнаём по окончанию. */
        var plural = /(ы|и|ов|ев|ей|ами|ями|ах|ях)$/.test(w) || (w.length > 4 && /s$/.test(w));
        var o = { type: c.value, count: null, color: null, size: null, pos: null,
                  speed: null, axis: null, plural: plural, props: {} };
        flushInto(o);
        // «яд» и «кислота» это вода со свойством, а не отдельный объект
        if (o.type === 'water' && /кислот|яд|токсич|acid|poison/.test(w)) {
          o.props.acid = true; o.props.deadly = true;
        }
        /* Второе упоминание того же объекта без своих числа и цвета —
           это уточнение: «синяя вода снизу с ядом» даёт один объём. */
        var same = null;
        if (o.count === null && !o.color && !o.size && !o.pos)
          for (var q = orders.length - 1; q >= 0; q--)
            if (orders[q].type === o.type) { same = orders[q]; break; }
        if (same) {
          for (var pk in o.props) same.props[pk] = true;
          if (o.speed) same.speed = o.speed;
          if (o.axis) same.axis = o.axis;
          cur = same;
        } else {
          orders.push(o);
          cur = o;
        }
      }
    }
    /* Осталось висеть определение без объекта — отдаём последнему
       заказу, иначе слово просто пропало бы. */
    if (orders.length && (pend.color || pend.size || pend.pos || Object.keys(pend.props).length)) {
      var lastO = orders[orders.length - 1];
      if (!lastO.color && pend.color) lastO.color = pend.color;
      if (!lastO.size && pend.size) lastO.size = pend.size;
      if (!lastO.pos && pend.pos) lastO.pos = pend.pos;
      for (var lp in pend.props) lastO.props[lp] = true;
    } else if (pend.pos || pend.color || pend.size) {
      global.tail = pend;
    }

    if (global.diff === null) global.diff = 1;
    if (!global.mode) global.mode = null;

    return {
      text: String(text == null ? '' : text).trim(),
      tokens: tokens, orders: orders, global: global, unknown: unknown,
      report: report(tokens, orders, global, unknown)
    };
  }

  /* ---------- отчёт: что именно понято из каждого слова ---------- */
  function report(tokens, orders, global, unknown) {
    var lines = [];
    var seen = {};
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.role === 'stop') continue;
      var k = t.word + '|' + t.role;
      if (seen[k]) continue;
      seen[k] = 1;
      if (t.role === 'unknown') { lines.push('· ' + t.word + ' → не понял'); continue; }
      var val = (t.role === 'number' || t.role === 'diff') ? String(t.value)
              : (NAME_RU[t.value] || t.value);
      lines.push('· ' + t.word + ' → ' + ROLE_RU[t.role] + ': ' + val);
    }

    var out = 'Разбор запроса:\n' + (lines.length ? lines.join('\n') : '· пусто');
    if (orders.length) {
      out += '\n\nБуду ставить:';
      for (i = 0; i < orders.length; i++) {
        var o = orders[i], parts = [];
        parts.push((o.count === null ? '' : o.count + ' × ') + (NAME_RU[o.type] || o.type));
        if (o.size)  parts.push(NAME_RU[o.size]);
        if (o.color) parts.push('цвет ' + o.color);
        for (var p in o.props) parts.push(NAME_RU[p] || p);
        if (o.speed) parts.push(NAME_RU[o.speed]);
        if (o.axis)  parts.push(NAME_RU[o.axis]);
        if (o.pos)   parts.push(NAME_RU[o.pos]);
        out += '\n· ' + parts.join(', ');
      }
    }
    if (global.kind) out += '\n\nОснова карты: ' + global.kind;
    if (unknown.length) out += '\nНе понял слова: ' + unknown.join(', ');
    return out;
  }

  return {
    analyze: analyze, classify: classify,
    TYPES: TYPES, PROPS: PROPS, COLORS: COLORS, POS: POS, NAME_RU: NAME_RU
  };
});
