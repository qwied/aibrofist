// Проверяем, что убранные объекты стали свойствами и старые карты играют так же
const fs=require('fs'), src=fs.readFileSync('/home/claude/work/editor.html','utf8');

// список инструментов
const tools=eval('(function(){var ALL="hideAndSeek race";'+src.match(/var TOOLS = \[[\s\S]*?\];/)[0]+';return TOOLS;})()');
console.log('инструменты:', tools.map(t=>t.t).join(', '));
['poison','spike','bounce','platform','rotator','door'].forEach(t=>{
  console.log('  ', t.padEnd(9), tools.some(x=>x.t===t) ? '✗ ещё в палитре' : '✓ убран');
});

// конвертация старых карт
const conv = src.match(/if\(o\.type === "platform"\)[\s\S]*?if\(o\.type === "door"\)\{ o\.type = "gate"; \}/)[0];
function upgrade(o){ eval(conv.replace(/\bo\./g,'o.')); return o; }
const cases=[
  {type:'platform', moveX:0, moveY:0},
  {type:'rotator'},
  {type:'bounce'},
  {type:'poison'},
  {type:'spike'},
  {type:'door'}
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
console.log('   движение по свойству :', /if\(o\.moves\)\{/.test(src) ? '✓' : '✗');
console.log('   вращение по свойству :', /if\(o\.spins\)/.test(src) ? '✓' : '✗');
console.log('   батут по свойству    :', /if\(o\.bouncy\)\{/.test(src) ? '✓' : '✗');
console.log('   несёт игрока         :', /if\(o\.moves\)\{ pl\.x \+=/.test(src) ? '✓' : '✗');
console.log('   плоская заливка      :', /function grad\([^)]*\)\{ return a; \}/.test(src) ? '✓' : '✗');
console.log('   блика на игроке нет  :', !/rgba\(255,255,255,\.22\)/.test(src) ? '✓' : '✗');
console.log('   теней у объектов нет :', !/shadowColor = "rgba\(15,23,42/.test(src) ? '✓' : '✗');
console.log('   холст не темнеет     :', !/night/.test(src) ? '✓' : '✗');
