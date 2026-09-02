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
// только три базовые фигуры: жидкости рисуются иначе и сюда не входят
const three = src.match(/  rect: function[\s\S]*?  liquid: function/)[0];
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

// вода
console.log('\nдублирование:');
ok('Ctrl+D на месте',       /mod && e\.code === "KeyD"/.test(src));
ok('Alt и потащить',        /down\(p\.x, p\.y, e\.altKey\)/.test(src) && /if\(alt && !overLimit\(1\)\)/.test(src));

// стены, топление, буфер обмена
console.log('\nстены:');
ok('карабканья нет',        !/pl\.vx = -pl\.wall\*wallVX\(\)/.test(src) && !/pl\.vx = -pl\.wall\*wallVX\(\)/.test(game));
ok('скольжение осталось',   /pl\.wall !== 0 && pl\.vy > WALL_SLIDE/.test(src));

console.log('\nраздел «Жидкости»:');
const LIQS = ['water','acid','lava','quicksand','oil','slime','mercury','tar'];
const liqTable = src.match(/var LIQ = \{[\s\S]*?\n\};/)[0];
LIQS.forEach(k => ok('есть ' + k, new RegExp('\\n  ' + k + ': \\{').test(liqTable)));
ok('старой воды нет',       !tools.some(t => t.t === 'water'));
ok('инструмент в палитре',  tools.some(t => t.t === 'liquid'));
ok('во всех режимах',       /\{t:"liquid",\s*n:"Жидкости",\s*m:ALL\}/.test(src));
ok('выбор в свойствах',     /liquidPicker\(function\(k\)\{ sel\.liq = k;/.test(src));
ok('выбор до первого налива', /tool === "liquid"\)\{\s*\n\s*box\.style\.display/.test(src));
ok('раздел во всех режимах',/\{t:"liquid",\s*n:"Жидкости",\s*m:ALL\}/.test(src));
ok('залить всё этой',       /Залить всё этой/.test(src));

console.log('\nмеханики жидкостей:');
ok('лава убивает',          /if\(L && L\.lethal\)\{ die\(\); return; \}/.test(src));
ok('урон по профилю',       /if\(L && L\.dps > 0\) dmg \+= L\.dps \/ 60;/.test(src));
ok('вверх заблокировано',   /if\(pl\.vy < 0\) pl\.vy = 0;/.test(src));
ok('слизь подкидывает',     /L\.jump > 1/.test(src));
ok('нефть скользкая',       /L\.slip \? 0\.995 : L\.drag/.test(src));
ok('самая опасная главнее', /function liqRank/.test(src));
ok('жидкости не смешиваются', /cellOK\(x, y, k\)|cellOK\(nx, p\.y, p\.k\)/.test(src));
ok('старые карты переводятся', /o\.liq = o\.acid \? "acid" : \(o\.sink \? "quicksand" : "water"\)/.test(src));

console.log('\nбатут:');
ok('сила настраивается',    /rng\("Сила отскока"/.test(src));
ok('отскок по нормали',     /function faceNormal/.test(src) && /function ricochet\(o\)/.test(src));
ok('наклон учитывается',    /var pts = polyOf\(o\)/.test(src));
ok('сила из свойства',      /o\.power === undefined \? 1 : o\.power/.test(src));
ok('старые батуты мигрируют', src.indexOf('o.power = Math.max(0.2, Math.min(3, (o.power || 17) / 12.3));') !== -1);

console.log('\nвода: настройки и взаимодействие:');
ok('ползунок чувствительности', /rng\("Чувствительность"/.test(src));
ok('чувствительность в физике', /maxVX\(\) \* L\.speed \* wat\.sens/.test(src));
ok('три режима течения',    /\["none","Обычное"\],\["down","Затягивает на дно"\],\["up","Выталкивает наверх"\]/.test(src));
ok('затягивание вниз',      /wat\.flow === "down"/.test(src));
ok('выталкивание вверх',    /wat\.flow === "up"/.test(src));
ok('всплески при входе',    /function splash/.test(src) && /pl\.inWater && !pl\._wasWet/.test(src));
ok('блинчики по воде',      /SKIP_MIN_VX/.test(src) && /pl\._skips \|\| 0\) >= 3/.test(src));
ok('то же в игре',          /function splash/.test(game) && /wat\.flow === "up"/.test(game));

console.log('\nвид жидкости:');
ok('контура нет',           !/ctx\.strokeStyle = rim/.test(src) && !/ctx\.strokeStyle = rim/.test(game));
ok('падающих кружков нет',  !/течения: те самые частицы/.test(src));
ok('оверлей убран',         !/liqBox/.test(src) && !/buildLiqList/.test(src));
ok('обычный цвет воды',     /c1:"#60a5fa", c2:"#2563eb"/.test(src));
ok('жидкость стекает вниз', /function settleLiquid/.test(src) && /function liquidToCells/.test(src));
ok('растекается под давлением', /вбок под давлением/.test(src) && /if\(free\(c\.x, c\.y - WCELL\)\) continue;/.test(src));
ok('сползает по диагонали',  /сползание по диагонали/.test(src));
ok('любая правка запускает течение', /function markDirty\(\)\{ gridDirty = true; markLiquid\(\); \}/.test(src));
ok('лужа удаляется целиком', /liqBody\(sel\) : \[sel\]/.test(src));
ok('лужа копируется целиком', /clipboard\.type === "liquid" && clipboard\.body/.test(src));
ok('связное тело считается',  /function liqBody/.test(src));
ok('пересчёт каждый кадр',  /if\(!playing\) settleLiquid\(\);/.test(src));
ok('настоящая скорость падения', /c\.v \+= G\(\);/.test(src) && /LIQ_MAXV/.test(src));
ok('смещение внутри клетки', /c\.sub \+= c\.v;/.test(src));
ok('боковой сдвиг плавный',  /LIQ_SPREAD/.test(src) && /c\.ox \*= \(1 - LIQ_SPREAD\)/.test(src));
ok('рисуем из живых капель', /function liqList/.test(src) && /var src = liqList\(\);/.test(src));
ok('запись назад только в покое', /else if\(\+\+liqRest === 3\)/.test(src));
ok('устаревшие капли не пишутся', /if\(!lsim \|\| liqDirty\) return;/.test(src));
ok('уходим только на низкий столб', /free\(nx, c\.y\) && free\(nx, c\.y - WCELL\)/.test(src));

console.log('\nформа и лимит жидкости:');
ok('силуэт скругляется пером', /ctx\.lineJoin = "round"/.test(src) && /ctx\.lineWidth = 17/.test(src));
ok('светлый ореол по краю',  /ctx\.strokeStyle = shade\(L\.c1, 34\)/.test(src));
ok('тело узким пером',       /ctx\.lineWidth = 9;/.test(src));
ok('обрезка по силуэту',     /ctx\.clip\(body\)/.test(src));
ok('то же в игре',           /ctx\.lineJoin = "round"/.test(game) && /ctx\.clip\(body\)/.test(game));
ok('жидкость вне лимита',    /function overLimit\(extra, liquid\)/.test(src) && /LIQ_LIMIT/.test(src));
ok('счётчик без жидкости',   /countHard\(\) \+ "\/" \+ OBJ_LIMIT/.test(src));
ok('налив по своему потолку', /overLimit\(1, true\)/.test(src));

console.log('\nграфика жидкостей:');
ok('свой цвет у каждой',    /g\.addColorStop\(0, L\.c1\)/.test(src));
ok('свечение',              /if\(L\.glow\)/.test(src));
ok('блик',                  /if\(L\.sheen\)/.test(src));
ok('зерно песка',           /if\(L\.grain\)/.test(src));
ok('силуэт из клеток',     /body\.rect\(o\.x, o\.y, o\.w, o\.h\)/.test(src));
ok('форма без прямых углов', !/tops = freeEdge\(o, list, "top"\)/.test(src));
ok('внутреннее по силуэту', /ctx\.clip\(body\);/.test(src));
ok('то же в игре',          /var LIQ = \{/.test(game) && /function drawParticles/.test(game));

console.log('\nгенератора в редакторе нет:');
ok('скриптов нет',          !/mapGen\.js/.test(src) && !/mapNLU\.js/.test(src));
ok('помощник остался',      /editorHelp\.js/.test(src) && /editorAI\.js/.test(src));

console.log('\nбуфер обмена:');
ok('Ctrl+C копирует',       /mod && e\.code === "KeyC"/.test(src) && /function copySel/.test(src));
ok('Ctrl+V вставляет',      /mod && e\.code === "KeyV"/.test(src) && /function pasteAt/.test(src));
ok('копия по центру мыши',  /c\.x = snapN\(x - c\.w\/2\)/.test(src));
ok('курсор отслеживается',  /mouseW = p;/.test(src));

console.log('\nразмер игрока:');
ok('ручек у старта нет',    /sel\.type === "spawn"\) return null/.test(src));
ok('рамка без ручек',       /isSel && o\.type !== "spawn"/.test(src));

// прыжок с удержанием
console.log('\nпрыжок:');
ok('удержание = повтор',    /if\(keys\.u && !pl\.selfJump && \(pl\.ground \|\| coy > 0\)\) buf = BUFFER;/.test(src));
ok('то же в игре',          /if\(keys\.u && !pl\.selfJump && \(pl\.ground \|\| coy > 0\)\) buf = BUFFER;/.test(game));
