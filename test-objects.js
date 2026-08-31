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

// прыжок с удержанием
console.log('\nпрыжок:');
ok('удержание = повтор',    /if\(keys\.u && !pl\.selfJump && \(pl\.ground \|\| coy > 0\)\) buf = BUFFER;/.test(src));
ok('то же в игре',          /if\(keys\.u && !pl\.selfJump && \(pl\.ground \|\| coy > 0\)\) buf = BUFFER;/.test(game));
