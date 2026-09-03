// Проверяем палитру объектов, конвертацию старых карт и новые правила движка
const fs=require('fs'), src=fs.readFileSync(__dirname+'/editor.html','utf8');
const game=fs.readFileSync(__dirname+'/game.html','utf8');

// список инструментов
const tools=eval('(function(){var ALL="hideAndSeek race";'+src.match(/var TOOLS = \[[\s\S]*?\];/)[0]+';return TOOLS;})()');
console.log('инструменты:', tools.map(t=>t.t).join(', '));
['poison','spike','bounce','platform','rotator','door','gate','cover'].forEach(t=>{
  console.log('  ', t.padEnd(9), tools.some(x=>x.t===t) ? '✗ ещё в палитре' : '✓ убран');
});

// конвертация старых карт
const conv = src.match(/if\(o\.type === "platform"\)[\s\S]*?if\(o\.type === "door" \|\| o\.type === "gate" \|\| o\.type === "cover"\)\{ o\.type = "rect"; \}/)[0];
function upgrade(o){ eval(conv); return o; }
const cases=[
  {type:'platform', moveX:0, moveY:0},
  {type:'rotator'},
  {type:'bounce'},
  {type:'poison'},
  {type:'spike'},
  {type:'door'},
  {type:'gate'},
  {type:'cover'}
];
console.log('\nстарые карты:');
for(const c of cases){
  const o=Object.assign({},c);
  upgrade(o);
  const props=Object.keys(o).filter(k=>k!=='type'&&o[k]).join(', ');
  console.log('  ', c.type.padEnd(9), '->', o.type.padEnd(6), '|', props||'—');
}

// движение/вращение/батут теперь по свойствам
console.log('\nв движке:');
const ok = (t,c)=>console.log('   '+t.padEnd(24)+':', c ? '✓' : '✗');
ok('движение по свойству',  /if\(o\.moves\)\{/.test(src));
ok('вращение по свойству',  /if\(o\.spins\)/.test(src));
ok('батут по свойству',     /if\(o\.bouncy\)\{/.test(src));
ok('несёт игрока',          /if\(o\.moves\)\{ pl\.x \+=/.test(src));
ok('плоская заливка',       /function grad\([^)]*\)\{ return a; \}/.test(src));
ok('блика на игроке нет',   !/rgba\(255,255,255,\.22\)/.test(src));
ok('теней у объектов нет',  !/shadowColor = "rgba\(15,23,42/.test(src));
ok('холст не темнеет',      !/night/.test(src));

// плоские фигуры без бликов и скруглений
console.log('\nмодели фигур:');
const paint = src.match(/var PAINT = \{[\s\S]*?\n\};/);
const three = src.match(/  rect: function[\s\S]*?  text: function/)[0];
ok('rect без скруглений',   /ctx\.fillRect\(0,0,o\.w,o\.h\)/.test(three) && !/rr\(0,0,o\.w,o\.h/.test(three));
ok('без бликов у фигур',    !/rgba\(255,255,255/.test(three));
ok('без градиента у круга', !/createRadialGradient/.test(three));

// хитбоксы
console.log('\nхитбоксы:');
ok('круг многоугольником',  /CIRCLE_SIDES = 32/.test(src));
ok('треугольник по 3 точкам', /o\.type === "triangle"[\s\S]{0,80}\[o\.w\/2,0\],\[o\.w,o\.h\],\[0,o\.h\]/.test(src));
ok('SOLID = 3 фигуры',      /var SOLID  = \["rect","circle","triangle"\];/.test(src));

// прятки
console.log('\nпрятки:');
ok('укрытие без коллизии',  /o\.hideSpot !== true/.test(src));
ok('флаг спрятанности',     /pl\.hidden = true/.test(game));
ok('мост GAME.hidden',      /get hidden\(\)/.test(game));
const gjs=fs.readFileSync(__dirname+'/game.js','utf8');
ok('флаг уходит по сети',   /hid: !!GAME\.hidden/.test(gjs));
ok('чужого не рисуем',      /if \(o\.hid\) return;/.test(gjs));
ok('спрятанного не ловят',  /o\.caught \|\| o\.hid/.test(gjs));

// размеры и гравитация
console.log('\nразмеры и гравитация:');
ok('префаб 20x20',          /rect:\[20,20\], circle:\[20,20\], triangle:\[20,20\]/.test(src));
ok('игрок 20x60',           /spawn:\[20,60\]/.test(src) && /var pl = \{x:0,y:0,w:20,h:60,/.test(src));
ok('гравитация 9',          /var gravityScale = 9;/.test(src));
ok('ползунка нет',          !/id="grav"/.test(src) && !/id="grav"/.test(game));
ok('размер игрока не правят', /if\(sel\.type !== "spawn"\)/.test(src));

// рикошет вместо батута
console.log('\nрикошет:');
ok('батута нет',            !/chk\("Батут"/.test(src) && !/chk\("Батут"/.test(game));
ok('отражение по X',        /if\(o\.ricochet && Math\.abs\(pl\.vx\) > RICO_MIN\)/.test(src));
ok('отражение сверху',      /if\(o\.ricochet && pl\.vy > RICO_MIN\)/.test(src));
ok('отражение снизу',       /if\(o\.ricochet && Math\.abs\(pl\.vy\) > RICO_MIN\)/.test(src));

console.log('\nдублирование:');
ok('Ctrl+D на месте',       /mod && e\.code === "KeyD"/.test(src));
ok('Alt и потащить',        /down\(p\.x, p\.y, e\.altKey\)/.test(src) && /if\(alt && !overLimit\(1\)\)/.test(src));

// стены, топление, буфер обмена
console.log('\nстены:');
ok('карабканья нет',        !/pl\.vx = -pl\.wall\*wallVX\(\)/.test(src) && !/pl\.vx = -pl\.wall\*wallVX\(\)/.test(game));
ok('скольжение только в воздухе', /!inWater && pl\.wall !== 0 && pl\.vy > WALL_SLIDE/.test(src) && /!inWater && pl\.wall !== 0 && pl\.vy > WALL_SLIDE/.test(game));

console.log('\nбатут:');
ok('сила настраивается',    /rng\("Сила отскока"/.test(src));
ok('отскок по нормали',     /function faceNormal/.test(src) && /function ricochet\(o\)/.test(src));
ok('наклон учитывается',    /var pts = polyOf\(o\)/.test(src));
ok('сила из свойства',      /o\.power === undefined \? 1 : o\.power/.test(src));
ok('старые батуты мигрируют', src.indexOf('o.power = Math.max(0.2, Math.min(3, (o.power || 17) / 12.3));') !== -1);

console.log('\nгенератора в редакторе нет:');
ok('скриптов нет',          !/mapGen\.js/.test(src) && !/mapNLU\.js/.test(src));
ok('помощник остался',      /editorHelp\.js/.test(src) && /editorAI\.js/.test(src));

console.log('\nфиниш и старт:');
ok('перезапуск одной функцией', /function restartRun\(\)/.test(src) && /function restartRun\(\)/.test(game));
ok('сам стартует после финиша', /finishTimer = setTimeout/.test(src) && /finishTimer = setTimeout/.test(game));
ok('R использует тот же путь',  /clearTimeout\(finishTimer\); restartRun\(\);/.test(src));
ok('старт рядом с финишем',     /function spawnTooClose/.test(src) && /SPAWN_GAP = 320/.test(src));
ok('проверка при запуске',      /var near = spawnTooClose\(\);/.test(src));
ok('проверка при публикации',   /Старт слишком близко к финишу/.test(src));

console.log('\nбуфер обмена:');
ok('Ctrl+C копирует',       /mod && e\.code === "KeyC"/.test(src) && /function copySel/.test(src));
ok('Ctrl+V вставляет',      /mod && e\.code === "KeyV"/.test(src) && /function pasteAt/.test(src));
ok('копия по центру мыши',  /c\.x = snapN\(x - c\.w\/2\)/.test(src));
ok('курсор отслеживается',  /mouseW = p;/.test(src));

console.log('\nинтерфейс:');
ok('зум без границ',        /Math\.min\(4000, Math\.max\(0\.0005/.test(src) && /Math\.min\(4000, Math\.max\(0\.0005/.test(game));
ok('колесо работает в игре', !/if\(playing\) return; e\.preventDefault\(\);\s*\n\s*zoomAt/.test(src)
   && !/if\(playing\) return; e\.preventDefault\(\);\s*\n\s*zoomAt/.test(game));
ok('в игре панелей нет',    /body\.play #scene/.test(src) && /body\.play #bfPublish/.test(src));
ok('панель помощника тоже', /body\.play #genBox/.test(src));
ok('HUD в правом нижнем',   /#hud\{display:none;position:fixed;right:14px;bottom:14px/.test(src));
ok('HUD компактный',        /padding:6px 7px/.test(src));
ok('кнопка публикации своя', /#bfPublish\{position:fixed/.test(src) && /linear-gradient\(180deg,#2f8bff,#1667e0\)/.test(src));
ok('на кнопке значок',      /<svg viewBox="0 0 24 24"><path d="M12 16V5"/.test(src));

console.log('\nодна модель игрока:');
ok('метка старта скрыта в игре', /if\(playing && ro\.type === "spawn"\) continue;/.test(src));
ok('то же в игре',              /if\(playing && ro\.type === "spawn"\) continue;/.test(game));

// вода: палитра, модель, физика и миграция старых жидкостей
console.log('\nвода:');
ok('инструмент в палитре',   tools.some(x => x.t === 'water' && x.n === 'Вода'));
ok('модель воды в редакторе', /water: function\(o\)/.test(src));
ok('модель воды в игре',     /water: function\(o\)/.test(game));
ok('верхний проход в редакторе', /function waterOver\(/.test(src) && /waterOver\(wo2?\);/.test(src));
ok('верхний проход в игре',  /function waterOver\(/.test(game) && /waterOver\(wo2?\);/.test(game));
ok('волна общая для проходов', /function waterTop\(o, x\)/.test(src) && /function waterTop\(o, x\)/.test(game));
ok('в воде гравитация слабее', /pl\.vy \+= G\(\)\*\(inWater \? WTR_GRAV : 1\)/.test(src) && /pl\.vy \+= G\(\)\*\(inWater \? WTR_GRAV : 1\)/.test(game));
ok('вязкость воды',         /pl\.vx \*= WTR_VXDRAG/.test(src) && /pl\.vy \*= WTR_VYDRAG/.test(game));
ok('гребки при удержании прыжка', /pl\.vy -= G\(\)\*WTR_SWIM/.test(src) && /pl\.vy -= G\(\)\*WTR_SWIM/.test(game));
ok('выпрыгивание у поверхности', /jumpV\(\)\*WTR_KICK/.test(src) && /jumpV\(\)\*WTR_KICK/.test(game));
ok('всплеск при входе',     /function splash\(x, y, v\)/.test(src) && /splash\(pl\.x\+pl\.w\/2, wtr\.top, pl\.vy\)/.test(game));
ok('пузыри всплывают',      /if\(p\.f\)\{ p\.vy -= 0\.014/.test(src) && /if\(p\.f\)\{ p\.vy -= 0\.014/.test(game));
ok('кислота — галочка воды', /Кислота \(убивает\)/.test(src) && /Кислота \(убивает\)/.test(game));
ok('вода не блок',          !/SOLID\.indexOf\("water"\)/.test(src) && !/"water".*SOLID/.test(src));
ok('старая жидкость становится водой', /if\(o\.type === "liquid"\)\{ o\.type = "water"; delete o\.liq; \}/.test(src)
   && /if\(o\.type === "liquid"\)\{ o\.type = "water"; delete o\.liq; \}/.test(game));
ok('выбрасывание воды убрано', !/o\.type !== "liquid" && o\.type !== "water"/.test(src)
   && !/o\.type !== "liquid" && o\.type !== "water"/.test(game));
const maps=fs.readFileSync(__dirname+'/maps.js','utf8');
ok('сервер принимает воду', /water:null/.test(maps));

console.log('\nразмер игрока:');
ok('ручек у старта нет',    /sel\.type === "spawn"\) return null/.test(src));
ok('рамка без ручек',       /isSel && o\.type !== "spawn"/.test(src));

// прыжок с удержанием
console.log('\nпрыжок:');
ok('удержание = повтор',    /if\(keys\.u && !pl\.selfJump && \(pl\.ground \|\| coy > 0\)\) buf = BUFFER;/.test(src));
ok('то же в игре',          /if\(keys\.u && !pl\.selfJump && \(pl\.ground \|\| coy > 0\)\) buf = BUFFER;/.test(game));
