/* Точечные repro-сценарии телепорта: ротатор, спавн внутри платформы,
   платформа «проплывает» сквозь игрока и возвращается (синус). */
'use strict';
const { makeEngine, obj } = require('./harness.js');

const GROUND_Y = 520;
const ground = () => obj('rect', -400, GROUND_Y, 3600, 80);
let fails = 0;

function run(name, objs, spawn, input, frames, onFrame){
  objs.forEach((o, i) => { o.id = i + 1; });
  const E = makeEngine('game.html');
  E.setObjects(objs);
  E.setSpawn(spawn[0], spawn[1]);
  E.startRun();
  for(let i = 0; i < 6; i++) E.step();
  // предел как в тесте-переборе, но по осям: ход платформы/ротатора за кадр + свой разгон/падение
  const mover = objs.find(o => o.moves || o.spins);
  let platX = 0, platY = 0;
  if(mover && mover.spins){
    const rMax = Math.sqrt(mover.w * mover.w + mover.h * mover.h) / 2;
    const dth = (mover.spin || 2) * 0.02;
    platX = platY = rMax * 2 * Math.sin(dth / 2);
  } else if(mover){
    for(let f = 1; f < frames + 10; f++){
      const sp1 = (mover.speed || 1), t1 = ((f - 1) * 0.012) * sp1, t2 = (f * 0.012) * sp1;
      const dk = (Math.sin(t2) + 1) / 2 - (Math.sin(t1) + 1) / 2;
      platX = Math.max(platX, Math.abs((mover.moveX || 0) * dk));
      platY = Math.max(platY, Math.abs((mover.moveY || 0) * dk));
    }
  }
  const limX = platX + 4.93 + 2.5, limY = platY + 19.2 + 2.5;
  let worst = 0, worstF = -1, worstTo = 0, viol = false;
  for(let f = 0; f < frames; f++){
    if(input) input(f, E);
    const px = E.pl().x, py = E.pl().y;
    E.step();
    if(onFrame) onFrame(f, E);
    const p = E.pl();
    if(p.dead || E.done()) break;
    const dx = Math.abs(p.x - px), dy = Math.abs(p.y - py);
    const d = Math.hypot(dx, dy);
    if(d > worst){ worst = d; worstF = f; worstTo = p.x; }
    if(dx > limX || dy > limY){ viol = true; break; }
  }
  if(viol) fails++;
  console.log((viol ? '✗' : '✓') + ' ' + name + ': макс сдвиг за кадр ' + worst.toFixed(1) + ' px' + (viol ? ' — ПРЕВЫШЕНИЕ (лимит X ' + limX.toFixed(1) + ', Y ' + limY.toFixed(1) + ')' : ''));
  return { worst, E };
}

/* 1. Ротатор: длинная горизонтальная балка медленно крутится над землёй,
      край проносит через стоящего игрока */
run('ротатор-балка через игрока',
  [ground(), obj('rect', 700, 380, 400, 26, { spins: true, spin: 2 })],
  [890, GROUND_Y - 60], null, 300);

/* 2. Ротатор быстрее */
run('ротатор-балка spin=6',
  [ground(), obj('rect', 700, 380, 400, 26, { spins: true, spin: 6 })],
  [890, GROUND_Y - 60], null, 300);

/* 3. Спавн внутри едущей платформы */
run('спавн внутри платформы',
  [ground(), obj('rect', 800, GROUND_Y - 40, 300, 30, { moves: true, moveX: 300, speed: 4 })],
  [900, GROUND_Y - 60], null, 120);

/* 4. Платформа проплывает сквозь игрока и возвращается синусом */
run('платформа вернулась и накрыла',
  [ground(), obj('rect', 500, GROUND_Y - 40, 300, 30, { moves: true, moveX: 500, speed: 2 })],
  [900, GROUND_Y - 60], null, 400);

/* 5. Платформа сверху-сбоку диагонально в голову стоящего */
run('диагональ в голову',
  [ground(), obj('rect', 700, GROUND_Y - 190, 300, 26, { moves: true, moveX: 300, moveY: 260, speed: 3 })],
  [900, GROUND_Y - 60], null, 200);

/* 6. Игрок на платформе, она едет в стену (тиски край) */
run('платформа везёт в стену',
  [ground(), obj('rect', 1200, GROUND_Y - 300, 40, 300),
   obj('rect', 600, GROUND_Y - 24, 500, 24, { moves: true, moveX: 500, speed: 5 })],
  [700, GROUND_Y - 24 - 60], null, 260);

/* 7. Две платформы навстречу, игрок между (видео-«тиски» с большой амплитудой) */
run('тиски amp=700',
  [ground(),
   obj('rect', 400, GROUND_Y - 40, 220, 24, { moves: true, moveX: 700, speed: 7 }),
   obj('rect', 1400, GROUND_Y - 40, 220, 24, { moves: true, moveX: -700, speed: 7 })],
  [1000, GROUND_Y - 60], null, 220);

/* 8. Быстрая платформа (speed 12, ход ~86 px/кадр) сквозь стоящего */
run('скорость 12 сквозь игрока',
  [ground(), obj('rect', 300, GROUND_Y - 40, 300, 30, { moves: true, moveX: 1200, speed: 12 })],
  [900, GROUND_Y - 60], null, 150);

console.log(fails ? '\nНАЙДЕНО ПРОБЛЕМ: ' + fails : '\nвсё чисто');
process.exit(fails ? 1 : 0);
