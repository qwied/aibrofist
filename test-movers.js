const { makeEngine, obj } = require('./harness.js');

const V92 = __dirname + '/game.v92.bak.html';   // исходник v92 (для регрессии)
const V93 = __dirname + '/game.html';             // исправленный

let pass = 0, fail = 0;
function ok(name, cond, extra){
  if(cond){ pass++; console.log('  ✓ ' + name + (extra? '  ['+extra+']' : '')); }
  else { fail++; console.log('  ✗ ' + name + (extra? '  ['+extra+']' : '')); }
}
function r1(v){ return Math.round(v*1000)/1000; }
function maxStep(traj, col){ let m=0; for(let f=1; f<traj.length; f++) m = Math.max(m, Math.abs(traj[f][col]-traj[f-1][col])); return m; }

function setup(E, objs, sx, sy){
  objs.forEach((o,i)=>{ o.id = i+1; });
  E.setObjects(objs);
  E.setSpawn(sx, sy);
  E.startRun();
  for(let i=0;i<6;i++) E.step();   // даём игроку встать на землю
}
function traj(E, frames, input){
  const t = [];
  for(let f=0; f<frames; f++){
    if(input) input(f);
    E.step();
    const p = E.pl();
    t.push([p.x, p.y, p.vx, p.vy, p.ground?1:0, p.dead?1:0]);
  }
  return t;
}
const GROUND_Y = 520;
const ground = () => obj('rect', -400, GROUND_Y, 3200, 80);

console.log('─ 1. Сила прыжка (JUMP_H = 122) ─────────────────────────');
{
  const e92 = makeEngine(V92), e93 = makeEngine(V93);
  ok('jumpV() не изменился', e92.jumpV() === e93.jumpV(), 'vy0=' + r1(e93.jumpV()));
  for(const [tag,E] of [['v92',e92],['v93',e93]]){
    setup(E, [ground()], 100, GROUND_Y-60);
    let apex = GROUND_Y-60;
    E.keys().u = true;                 // держим прыжок — иначе сработает short-hop
    for(let f=0; f<40; f++){ E.step(); apex = Math.min(apex, E.pl().y); }
    E.keys().u = false;
    for(let f=0; f<40; f++){ E.step(); apex = Math.min(apex, E.pl().y); }
    const h = (GROUND_Y-60) - apex;
    ok('апекс прыжка с земли ' + tag, Math.abs(h-116.2) < 1.5, r1(h) + ' px (дискретный эквивалент 122)');
  }
  // прямое сравнение траекторий прыжка
  const ta = (()=>{ const e = makeEngine(V92); setup(e, [ground()], 100, GROUND_Y-60); e.keys().u = true; const t = traj(e, 60); e.keys().u = false; return t; })();
  const tb = (()=>{ const e = makeEngine(V93); setup(e, [ground()], 100, GROUND_Y-60); e.keys().u = true; const t = traj(e, 60); e.keys().u = false; return t; })();
  ok('траектория прыжка v93 === v92 побитово', ta.every((s,i)=>s[0]===tb[i][0] && s[1]===tb[i][1] && s[2]===tb[i][2] && s[3]===tb[i][3]));
}

console.log('─ 2. Регрессия статики: 270 сценариев прыжка на полку ────');
{
  let diff = 0, worst = '';
  const H = [20,45,70,95,120], TH = [10,35,60], W = [40,120,200], JF = [5,12,19,26,33,40];
  for(const h of H) for(const th of TH) for(const w of W) for(const jf of JF){
    const mk = () => [ground(), obj('rect', 600, GROUND_Y - th - h, w, th)];
    const a = makeEngine(V92), b = makeEngine(V93);
    setup(a, mk(), 100, GROUND_Y-60);
    setup(b, mk(), 100, GROUND_Y-60);
    const ia = (f)=>{ a.keys().r = true; a.keys().u = (f===jf); };
    const ib = (f)=>{ b.keys().r = true; b.keys().u = (f===jf); };
    const ta = traj(a, 90, ia), tb = traj(b, 90, ib);
    for(let f=0; f<90; f++){
      if(ta[f][0]!==tb[f][0] || ta[f][1]!==tb[f][1]){
        diff++; worst = 'h='+h+' th='+th+' w='+w+' jf='+jf+' кадр '+f+
          ' v92('+r1(ta[f][0])+','+r1(ta[f][1])+') v93('+r1(tb[f][0])+','+r1(tb[f][1])+')';
        break;
      }
    }
  }
  ok('статичная геометрия: расхождений нет', diff === 0, diff ? worst : '270/270 траекторий совпали побитово');
}

console.log('─ 3. Платформа едет сквозь стоящего игрока (сцена из видео) ──');
{
  const e93 = makeEngine(V93), e92 = makeEngine(V92);
  const mk = () => [ground(), obj('rect', 560, 470, 300, 30, {moves:true, moveX:400, speed:6})];
  // v93: платформа толкает
  setup(e93, mk(), 900, GROUND_Y-60);
  const t93 = traj(e93, 120);
  const pushed = Math.min(...t93.map(s=>s[0])) < 895;
  const maxDx93 = maxStep(t93, 0);
  const maxPlatDx = 400*0.012*6/2;
  ok('платформа толкает игрока перед собой', pushed, 'мин x=' + r1(Math.min(...t93.map(s=>s[0]))));
  ok('нет телепорта: сдвиг за кадр <= ход платформы + 8', maxDx93 <= maxPlatDx + 8, 'макс ' + r1(maxDx93) + ' px/кадр (платформа до ' + r1(maxPlatDx) + ')');
  ok('без смерти', !t93.some(s=>s[5]));
  // v92: проход насквозь (контраст для readme)
  setup(e92, mk(), 900, GROUND_Y-60);
  const t92 = traj(e92, 120);
  ok('в v92 платформа почти не толкала (проходила сквозь)', Math.min(...t92.map(s=>s[0])) > 870,
     'v92 мин x=' + r1(Math.min(...t92.map(s=>s[0]))) + ' против ' + r1(Math.min(...t93.map(s=>s[0]))) + ' в v93');
}

console.log('─ 4. Толчок до стены и зажатие ──────────────────────────');
{
  const e93 = makeEngine(V93);
  const mk = () => [ground(), obj('rect', 400, GROUND_Y-160, 40, 160),
                    obj('rect', 800, 470, 300, 30, {moves:true, moveX:-340, speed:6})];
  setup(e93, mk(), 700, GROUND_Y-60);   // платформа едет влево, гонит игрока к стене на 400..440
  const t = traj(e93, 150);
  const maxDx = maxStep(t, 0);
  const maxPlatDx = 340*0.012*6/2;
  ok('игрок прижат к стене, а не выброшен', t.some(s=>Math.abs(s[0]-440) < 3),
     'мин x=' + r1(Math.min(...t.map(s=>s[0]))));
  ok('рывков нет (<= ход платформы + 24)', maxDx <= maxPlatDx + 24, 'макс ' + r1(maxDx) + ' px/кадр');
  ok('не прошёл сквозь стену', t.every(s=>s[0] >= 439.99));
}

console.log('─ 5. Вертикальная платформа опускается на игрока ─────────');
{
  const e93 = makeEngine(V93), e92 = makeEngine(V92);
  const mk = () => [ground(), obj('rect', 820, 260, 300, 24, {moves:true, moveY:240, speed:4})];
  setup(e93, mk(), 900, GROUND_Y-60);
  const t93 = traj(e93, 160);
  ok('игрок стоит на месте — вбок не выкидывает', maxStep(t93,0) < 0.001, 'макс сдвиг ' + r1(maxStep(t93,0)) + ' px');
  ok('без смерти', !t93.some(s=>s[5]));
  setup(e92, mk(), 900, GROUND_Y-60);
  const t92 = traj(e92, 160);
  ok('в v92 был боковой телепорт (контраст)', maxStep(t92,0) > 5, 'v92 сдвиг ' + r1(maxStep(t92,0)) + ' px/кадр');
}

console.log('─ 6. Платформа поднимается под игроком — посадка и поездка ──');
{
  const e93 = makeEngine(V93);
  setup(e93, [obj('rect', 800, 380, 240, 24, {moves:true, moveY:-160, speed:5})], 900, 200);
  let rode = 0, landed = false, gapMax = 0;
  for(let f=0; f<160; f++){
    e93.step();
    const p = e93.pl(), o = e93.objects()[0];
    const gap = Math.abs((p.y+60) - o.y);
    if(p.ground && gap < 1){ rode++; landed = true; }
    if(p.rideOn) gapMax = Math.max(gapMax, gap);
  }
  ok('приземлился на поднимающуюся платформу', landed);
  ok('едет с ней без зазора', rode > 100 && gapMax < 1, 'кадров в контакте ' + rode + ', макс зазор ' + r1(gapMax));
  const vy0 = e93.pl().vy;
  e93.keys().u = true; e93.step(); e93.keys().u = false;
  ok('прыжок с платформы полной силы', Math.abs(e93.pl().vy - (e93.jumpV() + e93.G())) < 0.001,
     'vy=' + r1(e93.pl().vy) + ' jumpV+G=' + r1(e93.jumpV() + e93.G()) + ' (было до прыжка ' + r1(vy0) + ')');
}

console.log('─ 7. Прыжок с поднимающегося лифта не режется ────────────');
{
  const e93 = makeEngine(V93);
  setup(e93, [obj('rect', 800, 380, 240, 24, {moves:true, moveY:-300, speed:6})], 900, 200);
  traj(e93, 60);   // садимся на лифт
  e93.keys().u = true; e93.step(); e93.keys().u = false;   // прыжок
  let cut = false;
  for(let f=0; f<40; f++){
    const vyBefore = e93.pl().vy;
    e93.step();
    const vyAfter = e93.pl().vy;
    if(vyBefore < -3 && vyAfter - vyBefore > 2) cut = true;   // скорость обнулили рывком
  }
  ok('скорость прыжка не сбрасывается встречной крышкой', !cut);
}

console.log('─ 8. Запрыгивание на движущуюся по горизонтали платформу ──');
{
  const e93 = makeEngine(V93);
  setup(e93, [ground(), obj('rect', 760, 430, 200, 22, {moves:true, moveX:60, speed:1})], 680, GROUND_Y-60);
  const t = traj(e93, 90, (f)=>{ e93.keys().r = f < 14; e93.keys().u = (f>=6 && f<=30); });
  let on = 0;
  for(const s of t){ if(s[4] && Math.abs((s[1]+60) - 430) < 2) on++; }
  ok('игрок приземлился на едущую платформу', on > 5, 'кадров на крышке ' + on);
}

console.log('─ 9. Низкая платформа — шаг на крышку, а не толчок ───────');
{
  const e93 = makeEngine(V93);
  setup(e93, [ground(), obj('rect', 700, GROUND_Y-12, 300, 12, {moves:true, moveX:300, speed:3})], 900, GROUND_Y-60);
  const t = traj(e93, 120);
  let stepped = false;
  for(const s of t){ if(s[4] && Math.abs((s[1]+60) - (GROUND_Y-12)) < 1){ stepped = true; break; } }
  ok('игрок поднялся на низкую едущую платформу', stepped);
}

console.log('─ 10. Поездка на горизонтальной платформе — зазор 0 ──────');
{
  const e93 = makeEngine(V93);
  setup(e93, [ground(), obj('rect', 700, 400, 200, 24, {moves:true, moveX:260, speed:2})], 900, 300);
  let gapMax = 0, rode = 0, landed = false;
  for(let f=0; f<180; f++){
    e93.step();
    const p = e93.pl(), o = e93.objects()[1];
    const gap = Math.abs((p.y+60) - o.y);
    if(p.ground && gap < 1){ rode++; landed = true; }
    if(p.rideOn) gapMax = Math.max(gapMax, gap);
  }
  ok('сел на платформу и едет', landed && rode > 120, 'кадров на крышке ' + rode);
  ok('зазор под ногами не растёт', gapMax < 1.5, 'макс зазор ' + r1(gapMax) + ' px');
}

console.log('─ 11. Удар головой об опускающуюся платформу ─────────────');
{
  const e93 = makeEngine(V93);
  setup(e93, [ground(), obj('rect', 820, 330, 300, 24, {moves:true, moveY:120, speed:3})], 900, GROUND_Y-60);
  traj(e93, 120, (f)=>{ e93.keys().u = (f===6); });
  const p = e93.pl(), o = e93.objects()[1];
  ok('прыжок погашен нижней гранью (как потолком)', p.vy >= 0);
  const snappedTop = Math.abs((p.y+60) - o.y) < 2 && p.y+60 < GROUND_Y - 2;
  ok('наверх платформы не выдёргивает', !snappedTop);
}

console.log('─ 12. Краевые случаи: круг, треугольник, диагональ ──────');
{
  // круг-платформа едет сквозь стоящего игрока — толкает в пределах своего хода
  const e93 = makeEngine(V93);
  setup(e93, [ground(), obj('circle', 700, 460, 80, 80, {moves:true, moveX:400, speed:6})], 900, GROUND_Y-60);
  const tc = traj(e93, 150);
  ok('круг-платформа толкает без рывков', maxStep(tc,0) <= 14.4 + 8 && !tc.some(s=>s[5]),
     'макс ' + r1(maxStep(tc,0)) + ' px/кадр');
  // треугольник-платформа
  const e93b = makeEngine(V93);
  setup(e93b, [ground(), obj('triangle', 700, 440, 120, 80, {moves:true, moveX:400, speed:6})], 900, GROUND_Y-60);
  const tt = traj(e93b, 150);
  ok('треугольник-платформа толкает без рывков', maxStep(tt,0) <= 14.4 + 8 && !tt.some(s=>s[5]),
     'макс ' + r1(maxStep(tt,0)) + ' px/кадр');
  // диагональная платформа опускается на игрока — вбок не сдвигает
  const e93c = makeEngine(V93);
  setup(e93c, [ground(), obj('rect', 820, 300, 260, 24, {moves:true, moveX:200, moveY:240, speed:4})], 900, GROUND_Y-60);
  const td = traj(e93c, 170);
  ok('диагональная платформа не выкидывает вбок', maxStep(td,0) < 1 && !td.some(s=>s[5]),
     'макс сдвиг вбок ' + r1(maxStep(td,0)) + ' px');
  // editor.html — тот же движок, тот же толчок
  const ed = makeEngine(__dirname + '/editor.html');
  setup(ed, [ground(), obj('rect', 560, 470, 300, 30, {moves:true, moveX:400, speed:6})], 900, GROUND_Y-60);
  let minX = 900;
  for(let f=0; f<120; f++){ ed.step(); minX = Math.min(minX, ed.pl().x); }
  ok('editor.html: платформа толкает так же', minX < 600, 'мин x=' + r1(minX));
}

console.log('');
console.log('ИТОГО: ' + pass + ' ok, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
