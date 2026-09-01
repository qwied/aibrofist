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
ok('старые батуты мигрируют', /o\.ricochet = true; delete o\.bouncy/.test(src));

// вода
console.log('\nвода:');
ok('инструмент в палитре',  tools.some(t => t.t === 'water'));
ok('вода не твёрдая',       /var SOLID  = \["rect","circle","triangle"\];/.test(src));
ok('заливка зажатием',      /drag = \{m:"water"\}/.test(src) && /function pourWater/.test(src));
ok('ряды склеиваются',      /function mergeWater/.test(src));
ok('цвет на весь объём',    /if\(o\.type === "water"\) o\.fill = ci\.value/.test(src));
ok('переключатель кислоты', /Опасная вода \(кислота\)/.test(src));
ok('плавание медленнее',    /W_SPEED = 0\.72/.test(src) && /maxVX\(\) \* W_SPEED/.test(src));
ok('погружение по кнопке',  /if\(keys\.d\) pl\.vy \+= W_DIVE/.test(src));
ok('воздух на 10 секунд',   /AIR_MAX = 10 \* 60/.test(src));
ok('урон после воздуха',    /if\(pl\.air <= 0\) dmg \+= DROWN_DPS/.test(src));
ok('кислота жжёт сразу',    /if\(pl\.inAcid\)   dmg \+= ACID_DPS/.test(src));
ok('вода рисуется скриптом',/function drawWater/.test(src) && /function waveAt/.test(src));
ok('полоски воздуха и HP',  /function drawBreathHud/.test(src));
ok('то же в игре',          /function drawWater/.test(game) && /function breathe/.test(game));

// быстрое дублирование
console.log('\nдублирование:');
ok('Ctrl+D на месте',       /mod && e\.code === "KeyD"/.test(src));
ok('Alt и потащить',        /down\(p\.x, p\.y, e\.altKey\)/.test(src) && /if\(alt && !overLimit\(1\)\)/.test(src));

// прыжок с удержанием
console.log('\nпрыжок:');
ok('удержание = повтор',    /if\(keys\.u && !pl\.selfJump && \(pl\.ground \|\| coy > 0\)\) buf = BUFFER;/.test(src));
ok('то же в игре',          /if\(keys\.u && !pl\.selfJump && \(pl\.ground \|\| coy > 0\)\) buf = BUFFER;/.test(game));
