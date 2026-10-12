#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Вода на частицах: физика, метабол-рендер, затягивание, зелёный яд."""
import io, sys

FILES = ["editor.html", "game.html"]
E = []
def rep(old, new, name, count=1, only=None):
    E.append((old, new, name, count, only))

# ─── константы ──────────────────────────────────────────────────────
rep('var WATER_DEF = "#3b82f6";',
'''var WATER_DEF = "#3b82f6";
var ACID_DEF  = "#38d430";   // яд всегда узнаётся по этому зелёному
/* Вода в игре — рой мелких частиц с обычной физикой. Слипаются они не
   физически, а на рисовании: мягкие пятна складываются и обрезаются по
   плотности, поэтому рой читается как единая жидкость, а не как мячики. */
var P_R    = 7;              // радиус частицы
var P_STEP = 13;             // шаг раскладки при заполнении объёма
var P_MAX  = 700;            // потолок: больше браузер не тянет на телефоне
var SINK_DEF = 1.8;          // с какой скоростью затягивает вниз''', "consts")

# ─── свойства игрока ────────────────────────────────────────────────
rep('''    inWater:false,headUnder:false,inAcid:false,air:AIR_MAX,hp:HP_MAX};''',
'''    inWater:false,headUnder:false,inAcid:false,sinking:false,
    air:AIR_MAX,hp:HP_MAX};''', "pl fields")

# ─── состояние воды: добавили затягивание ───────────────────────────
rep('''function waterState(near){
  var top = Infinity, inW = false, acid = false;
  for(var i=0;i<near.length;i++){
    var o = near[i];
    if(o.type !== "water") continue;
    if(pl.x + pl.w <= o.x || pl.x >= o.x + o.w) continue;
    if(pl.y + pl.h <= o.y || pl.y >= o.y + o.h) continue;
    inW = true;
    if(o.y < top) top = o.y;
    if(o.acid) acid = true;
  }
  pl.inWater = inW;
  pl.inAcid = acid;
  // голова считается под водой, когда кромка выше макушки
  pl.headUnder = inW && (pl.y + 8 >= top);
  return { top: inW ? top : 0 };
}''',
'''function waterState(near){
  var top = Infinity, inW = false, acid = false, sink = false, sv = SINK_DEF;
  for(var i=0;i<near.length;i++){
    var o = near[i];
    if(o.type !== "water") continue;
    if(pl.x + pl.w <= o.x || pl.x >= o.x + o.w) continue;
    if(pl.y + pl.h <= o.y || pl.y >= o.y + o.h) continue;
    inW = true;
    if(o.y < top) top = o.y;
    if(o.acid) acid = true;
    if(o.sink){ sink = true; sv = o.sinkSpeed || SINK_DEF; }
  }
  pl.inWater = inW;
  pl.inAcid = acid;
  pl.sinking = inW && sink;
  // голова считается под водой, когда кромка выше макушки
  pl.headUnder = inW && (pl.y + 8 >= top);
  return { top: inW ? top : 0, sink: sink, sinkSpeed: sv };
}''', "waterState")

# ─── движение игрока: затягивание вниз ──────────────────────────────
rep('''    var depth = Math.max(0, Math.min(1, ((pl.y + pl.h) - wat.top) / pl.h));
    pl.vy += G() * W_GRAV;
    pl.vy -= G() * W_BUOY * depth * 1.6;
    if(keys.u) pl.vy -= W_SWIM;
    if(keys.d) pl.vy += W_DIVE;''',
'''    var depth = Math.max(0, Math.min(1, ((pl.y + pl.h) - wat.top) / pl.h));
    pl.vy += G() * W_GRAV;
    if(wat.sink){
      /* Затягивающая вода: выталкивания нет, вместо него тяга вниз до
         заданной скорости. Барахтаться можно, но выплыть — нет: гребок
         втрое слабее тяги, поэтому из яда уже не выбраться. */
      if(pl.vy < wat.sinkSpeed) pl.vy += 0.42;
      if(keys.u) pl.vy -= W_SWIM * 0.32;
    } else {
      pl.vy -= G() * W_BUOY * depth * 1.6;
      if(keys.u) pl.vy -= W_SWIM;
    }
    if(keys.d) pl.vy += W_DIVE;''', "sink physics")

# ─── частицы: сборка, шаг, рисование ────────────────────────────────
rep('''/* ── ВОДА: рисуется скриптом, никаких картинок ──''',
'''/* ══════════════════════════════════════════════════
   ВОДА НА ЧАСТИЦАХ
   В редакторе вода — залитые клетки: так автор видит объём. В игре из
   этих клеток рождается рой частиц с обычной физикой — тяжесть,
   отталкивание соседей, столкновения. Частицы не выливаются за
   пределы налитого объёма: он работает как ёмкость, иначе бассейн,
   нарисованный в воздухе, утёк бы и карта сломалась.
   ══════════════════════════════════════════════════ */
var wp = [];            // частицы
var wcell = null;       // клетки, где вода разрешена (ключ "cx,cy")
var wcolor = WATER_DEF, wacid = false;

function wkey(x, y){ return Math.floor(x/WCELL) + "," + Math.floor(y/WCELL); }
function cellOK(x, y){ return wcell ? wcell[wkey(x, y)] === 1 : false; }

/* Раскладываем частицы по объёму. Если воды налито много, шаг
   увеличивается, чтобы не выйти за потолок в P_MAX частиц. */
function buildWater(){
  wp.length = 0; wcell = {};
  var vols = [], i, o, area = 0;
  for(i=0;i<objects.length;i++){
    o = objects[i];
    if(o.type !== "water") continue;
    vols.push(o); area += o.w * o.h;
    if(o.fill) wcolor = o.fill;
    wacid = !!o.acid;
  }
  if(!vols.length){ wcell = null; return; }

  // клетки объёма минус те, что заняты твёрдым: иначе частицы застрянут в стене
  var solids = [];
  for(i=0;i<objects.length;i++) if(solid(objects[i])) solids.push(bbox(objects[i]));
  for(i=0;i<vols.length;i++){
    o = vols[i];
    for(var cy = o.y; cy < o.y + o.h; cy += WCELL)
      for(var cx = o.x; cx < o.x + o.w; cx += WCELL){
        var mx = cx + WCELL/2, my = cy + WCELL/2, hit = false;
        for(var s=0;s<solids.length;s++){
          var b = solids[s];
          if(mx > b[0] && mx < b[2] && my > b[1] && my < b[3]){ hit = true; break; }
        }
        if(!hit) wcell[wkey(cx, cy)] = 1;
      }
  }

  var step = P_STEP;
  while(area / (step*step) > P_MAX) step += 2;
  for(i=0;i<vols.length && wp.length < P_MAX;i++){
    o = vols[i];
    for(var y = o.y + step/2; y < o.y + o.h && wp.length < P_MAX; y += step)
      for(var x = o.x + step/2; x < o.x + o.w && wp.length < P_MAX; x += step){
        if(!cellOK(x, y)) continue;
        wp.push({ x: x + (Math.random()-0.5)*2, y: y + (Math.random()-0.5)*2, vx: 0, vy: 0 });
      }
  }
}

/* Шаг физики роя. Соседей ищем по хеш-сетке, иначе на 700 частицах
   получается четверть миллиона пар за кадр. */
function stepWater(){
  var n = wp.length;
  if(!n || !wcell) return;
  var i, j, p, q, g = G() * 0.5, D = P_R * 2, cell = D;
  var grid = {}, key, cx, cy, k;

  for(i=0;i<n;i++){
    p = wp[i];
    p.vy += g;
    key = Math.floor(p.x/cell) + "," + Math.floor(p.y/cell);
    (grid[key] = grid[key] || []).push(i);
  }

  for(i=0;i<n;i++){
    p = wp[i];
    cx = Math.floor(p.x/cell); cy = Math.floor(p.y/cell);
    for(var ox=-1; ox<=1; ox++) for(var oy=-1; oy<=1; oy++){
      var b = grid[(cx+ox) + "," + (cy+oy)];
      if(!b) continue;
      for(k=0;k<b.length;k++){
        j = b[k];
        if(j <= i) continue;
        q = wp[j];
        var dx = q.x - p.x, dy = q.y - p.y;
        var d2 = dx*dx + dy*dy;
        if(d2 > D*D || d2 < 0.0001) continue;
        var d = Math.sqrt(d2), f = (D - d) / D * 0.42;
        dx /= d; dy /= d;
        p.vx -= dx*f; p.vy -= dy*f;
        q.vx += dx*f; q.vy += dy*f;
      }
    }
  }

  // игрок расталкивает воду вокруг себя
  if(playing && !pl.dead && pl.inWater){
    var px = pl.x + pl.w/2, py = pl.y + pl.h/2, rr = Math.max(pl.w, pl.h)*0.6;
    for(i=0;i<n;i++){
      p = wp[i];
      var ddx = p.x - px, ddy = p.y - py, dd = Math.sqrt(ddx*ddx + ddy*ddy);
      if(dd > rr || dd < 0.001) continue;
      p.vx += ddx/dd * 0.5; p.vy += ddy/dd * 0.5;
    }
  }

  for(i=0;i<n;i++){
    p = wp[i];
    p.vx *= 0.93; p.vy *= 0.985;
    if(p.vx >  6) p.vx =  6; if(p.vx < -6) p.vx = -6;
    if(p.vy >  8) p.vy =  8; if(p.vy < -8) p.vy = -8;
    // по осям отдельно: так частица скользит вдоль стенки, а не залипает
    var nx = p.x + p.vx;
    if(cellOK(nx, p.y)) p.x = nx; else p.vx *= -0.3;
    var ny = p.y + p.vy;
    if(cellOK(p.x, ny)) p.y = ny; else p.vy *= -0.3;
  }
}

/* Метабол-рендер. Каждая частица — мягкое пятно; пятна складываются,
   потом плотность прогоняется через порог, и края слипаются в общий
   контур. Никаких спрайтов, всё считается на холсте. */
var wcv = null, wcx = null;
function drawParticles(){
  var n = wp.length;
  if(!n) return;
  if(!wcv){
    wcv = document.createElement("canvas");
    wcx = wcv.getContext ? wcv.getContext("2d") : null;
  }
  if(!wcx) return;
  var W = Math.max(1, Math.round(VW())), H = Math.max(1, Math.round(VH()));
  if(wcv.width !== W || wcv.height !== H){ wcv.width = W; wcv.height = H; }
  wcx.setTransform(1,0,0,1,0,0);
  wcx.clearRect(0,0,W,H);

  var s = view.s, ox = view.x, oy = view.y;
  var r = P_R * s * 2.1;
  if(r < 1) return;

  // 1. плотность: мягкие пятна, сложенные друг с другом
  wcx.globalCompositeOperation = "lighter";
  for(var i=0;i<n;i++){
    var p = wp[i];
    var sx = p.x*s + ox, sy = p.y*s + oy;
    if(sx < -r || sy < -r || sx > W+r || sy > H+r) continue;
    var g = wcx.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0,   "rgba(255,255,255,0.62)");
    g.addColorStop(0.5, "rgba(255,255,255,0.28)");
    g.addColorStop(1,   "rgba(255,255,255,0)");
    wcx.fillStyle = g;
    wcx.fillRect(sx-r, sy-r, r*2, r*2);
  }
  // 2. порог: складывая картинку саму с собой, поднимаем плотные места
  //    почти до единицы, а редкие брызги оставляем прозрачными
  wcx.drawImage(wcv, 0, 0);
  wcx.drawImage(wcv, 0, 0);

  // 3. красим получившийся объём
  wcx.globalCompositeOperation = "source-in";
  var body = wcx.createLinearGradient(0, 0, 0, H);
  body.addColorStop(0, shade(wcolor, 30));
  body.addColorStop(1, shade(wcolor, -28));
  wcx.fillStyle = body;
  wcx.fillRect(0, 0, W, H);
  wcx.globalCompositeOperation = "source-over";

  ctx.save();
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.globalAlpha = 0.88;
  ctx.drawImage(wcv, 0, 0, W, H);
  ctx.restore();
}

/* ── ВОДА В РЕДАКТОРЕ: рисуется скриптом, никаких картинок ──''', "particles")

# рисуем: в игре частицы, в редакторе залитый объём
rep('''function drawWater(vx0, vy0, vx1, vy1){
  var ws = [];''',
'''function drawWater(vx0, vy0, vx1, vy1){
  // в игре объём заменяет рой частиц
  if(playing){ drawParticles(); return; }
  var ws = [];''', "drawWater switch")

# запуск и остановка
rep('''  respawn();
  document.body.classList.add("play");''',
'''  buildWater();
  respawn();
  document.body.classList.add("play");''', "play build", only="editor.html")

rep('''  objects.forEach(function(o){ if(o._hx !== undefined){ o.x = o._hx; o.y = o._hy; }
    o._act = false; o._reached = false; o._spin = 0; o._got = false; });''',
'''  objects.forEach(function(o){ if(o._hx !== undefined){ o.x = o._hx; o.y = o._hy; }
    o._act = false; o._reached = false; o._spin = 0; o._got = false; });
  wp.length = 0; wcell = null;''', "stop clear")

rep('''  if(shake > 0) shake *= 0.86;
  stepParts();''',
'''  if(shake > 0) shake *= 0.86;
  stepWater();
  stepParts();''', "step water call")

def run():
    for f in FILES:
        src = io.open(f, encoding="utf-8").read()
        for old, new, name, count, only in E:
            if only and f != only: continue
            n = src.count(old)
            if n != count:
                print("!! %s / %s: ожидали %d, нашли %d" % (f, name, count, n)); sys.exit(1)
            src = src.replace(old, new)
        io.open(f, "w", encoding="utf-8").write(src)
        print("ok:", f)
run()
