// 코딩 탐험대: 블록의 마법 — 횡스크롤 게임 + 블록 퍼즐
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const CFG = window.AIX_CONFIG;
  const KEY = 'ai-explorers:coding';            // 이 게임 전용 저장 (AI 탐험대 저장과 따로)
  const T = 16, ROWS = 15, GY = 12;              // 타일 16px, 15줄, 땅 윗면 = 12번째 줄
  const COLW = 2 * T;                            // 퍼즐 1칸 = 타일 2개
  const { STAGES, BONUS, LINK } = CodeLevels;
  const ALL = [...STAGES, BONUS];
  const COIN_STAGE = 15, COIN_ALL = 15;

  // ================= 저장 =================
  // 코인은 AI 탐험대 저장소를 직접 고치지 않고, 이 게임 저장소에 '받을 코인(grants)'만 적어요.
  // AI 탐험대(main.js)가 열릴 때 한 번만 더해 줘요 → 두 화면이 동시에 열려 있어도 코인이 사라지거나 두 번 들어가지 않아요.
  function mainStore() { try { const s = JSON.parse(localStorage.getItem(CFG.STORAGE_KEY) || 'null'); if (s && s.players) return s; } catch (e) { } return { players: {} }; }
  function loadCS() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.players) return s; } catch (e) { } return { v: 1, current: null, players: {} }; }
  let cs = loadCS();
  function saveCS() { try { localStorage.setItem(KEY, JSON.stringify(cs)); } catch (e) { } }
  const me = () => (cs.current ? cs.players[cs.current] : null);
  function rec(sid) { const p = me(); p.stages[sid] = p.stages[sid] || { solved: [], done: false, intro: false }; return p.stages[sid]; }
  function look() {
    const mp = mainStore().players[cs.current], p = me();
    if (p && !p.color) { p.color = PX.SEAL_COLORS[Math.floor(Math.random() * PX.SEAL_COLORS.length)].id; saveCS(); }
    return { color: (mp && PX.COLOR_BY_ID[mp.color] && mp.color) || (p && p.color) || 'sky', wear: Shop.cleanWear(mp && mp.wear) };
  }
  function coins() {
    const mp = mainStore().players[cs.current], applied = (mp && mp.codingApplied) || {};
    let pend = 0; for (const [id, amt] of Object.entries(me().grants || {})) if (!applied[id]) pend += amt;
    return ((mp && mp.coins) || 0) + pend;
  }
  function grant(id, amt) { const p = me(); if (p.grants[id]) return 0; p.grants[id] = amt; saveCS(); return amt; }

  // ================= 소리 =================
  let actx = null, soundOn = true;
  try { soundOn = JSON.parse(localStorage.getItem(CFG.SETTINGS_KEY) || '{}').sound !== false; } catch (e) { }
  function tone(fs, d = 0.08, type = 'triangle', v = 0.1) {
    if (!soundOn) return;
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); let t = actx.currentTime; for (const f of fs) { const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.85; } } catch (e) { }
  }
  const sfx = { jump: () => tone([520, 780], 0.06, 'square', 0.04), step: () => tone([440], 0.04, 'square', 0.03), bump: () => tone([180, 140], 0.1, 'sine', 0.12), ok: () => tone([660, 880, 1175], 0.1), star: () => tone([988, 1319], 0.08, 'square', 0.05), badge: () => tone([523, 659, 784, 1047, 1319], 0.11), pick: () => tone([520], 0.04, 'square', 0.04), open: () => tone([392, 523, 659], 0.09) };

  // ================= 레벨 만들기 =================
  const THEME = {
    beach: { sky: ['#9fdcf0', '#e8fbff'], top: '#f8e6b4', top2: '#e9cd88', dirt: '#e6b97a', dirt2: '#d6a463', plat: '#ffb3a7', plat2: '#f08a7c', water: true, gate: '#c98d55' },
    cloud: { sky: ['#b9d9ff', '#f3f9ff'], top: '#ffffff', top2: '#dfe9f5', dirt: '#eef4fb', dirt2: '#d3e1f0', plat: '#ffffff', plat2: '#c9d9ec', water: false, gate: '#c58fe0' },
    castle: { sky: ['#24345a', '#5b6fa8'], top: '#c9d2dc', top2: '#9aa7b6', dirt: '#8a97a8', dirt2: '#6f7c8f', plat: '#b9c4d0', plat2: '#7d8a9c', water: false, gate: '#5b6b8c' },
    reef: { sky: ['#9fe3ea', '#e8fffb'], top: '#ffd9cf', top2: '#f4b8a8', dirt: '#f2c3a0', dirt2: '#e2a982', plat: '#ff9ec0', plat2: '#e0709e', water: true, gate: '#3fb8a6' },
  };
  function buildLevel(stage) {
    const grid = [];
    const col = (top = GY, t = 1) => { const c = new Uint8Array(ROWS); for (let y = top; y < ROWS; y++) c[y] = t; grid.push(c); return grid.length - 1; };
    const hole = () => { grid.push(new Uint8Array(ROWS)); return grid.length - 1; };
    const L = { stage, th: THEME[stage.theme], stations: [], movers: [], stars: [], holes: [] };
    for (let i = 0; i < 9; i++) col();
    L.spawn = { x: 3.5 * T, y: GY * T };
    stage.missions.forEach((m, i) => {
      // 탐험 구간 (스테이지·순서마다 조금씩 달라요. 초보자도 쉽게 지나가게!)
      if (i === 0) { for (let k = 0; k < 8; k++) { const x = col(); if (k >= 2 && k <= 4) grid[x][9] = 2; } L.stars.push({ x: (grid.length - 5) * T, y: 7.5 * T }); }
      else if (i === 1) {
        for (let k = 0; k < 3; k++) col();
        const g0 = grid.length, gw = stage.theme === 'cloud' ? 6 : 2;   // 초보자도 쉽게 넘는 2칸 구멍 (구름섬은 움직이는 발판)
        for (let k = 0; k < gw; k++) hole();
        L.holes.push([g0, g0 + gw]);
        if (stage.theme === 'cloud') L.movers.push({ x0: (g0 + 0.2) * T, x1: (g0 + gw - 3.2) * T, y: 11 * T, w: 3 * T, t: 0, x: (g0 + 0.2) * T, dx: 0 });
        L.stars.push({ x: (g0 + gw / 2) * T, y: 8.5 * T });
        for (let k = 0; k < 4; k++) col();
      } else { for (let k = 0; k < 3; k++) col(); for (let k = 0; k < 5; k++) col(GY - 2); L.stars.push({ x: (grid.length - 3) * T, y: 7 * T }); for (let k = 0; k < 3; k++) col(); }
      // 코딩 수정(퍼즐 장소) + 퍼즐 길 + 문
      const sx = grid.length; for (let k = 0; k < 4; k++) col();
      const world = m.world || m.worlds[0];
      const laneX0 = grid.length; for (let k = 0; k < world.cols * 2; k++) col();
      const gateX = grid.length; col(); col();
      for (let y = 4; y < GY; y++) { grid[gateX][y] = 4; grid[gateX + 1][y] = 4; }
      L.stations.push({ i, m, sx, crystalX: (sx + 1.5) * T, laneX0, gateX, world, gateLift: 0 });
    });
    for (let i = 0; i < 12; i++) col();
    L.exitX = (grid.length - 6) * T;
    for (let i = 0; i < 3; i++) col(0);
    L.grid = grid; L.w = grid.length;
    L.stations.forEach((s) => setRocks(L, s, s.world));
    L.cv = prerender(L);
    return L;
  }
  function setRocks(L, s, world) {
    for (let c = 0; c < world.cols; c++) for (const dx of [0, 1]) if (L.grid[s.laneX0 + c * 2 + dx][GY - 1] === 3) L.grid[s.laneX0 + c * 2 + dx][GY - 1] = 0;
    for (const c of world.rocks || []) for (const dx of [0, 1]) L.grid[s.laneX0 + c * 2 + dx][GY - 1] = 3;
  }
  const colX = (s, c) => (s.laneX0 + c * 2 + 1) * T;
  function prerender(L) {
    const c = document.createElement('canvas'); c.width = L.w * T; c.height = ROWS * T;
    const g = c.getContext('2d'), th = L.th;
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    for (let x = 0; x < L.w; x++) for (let y = 0; y < ROWS; y++) {
      const t = L.grid[x][y], px = x * T, py = y * T;
      if (t === 1) {
        const topEdge = y === 0 || L.grid[x][y - 1] !== 1;
        R(px, py, T, T, (x + y) % 2 ? th.dirt : th.dirt2);
        if (L.stage.theme === 'castle') { R(px, py + 7, T, 1, '#6a7688'); R(px + ((y % 2) ? 4 : 11), py, 1, 7, '#6a7688'); R(px + ((y % 2) ? 11 : 4), py + 8, 1, 8, '#6a7688'); }
        else if ((x * 7 + y * 3) % 5 === 0) R(px + 5, py + 6, 3, 2, th.dirt2);
        if (topEdge) { R(px, py, T, 5, th.top); R(px, py + 5, T, 2, th.top2); if (L.stage.theme === 'beach' && x % 3 === 0) R(px + 6, py + 1, 2, 1, '#fff5d8'); if (L.stage.theme === 'cloud') { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(px + 8, py + 1, 5, 0, Math.PI * 2); g.fill(); } if (L.stage.theme === 'reef' && x % 4 === 1) { R(px + 4, py - 4, 2, 4, '#ff7aa8'); R(px + 3, py - 5, 4, 2, '#ff9ec0'); } }
        if (!topEdge && x > 0 && L.grid[x - 1][y] !== 1) R(px, py, 2, T, th.top2);
      } else if (t === 2) {
        R(px, py, T, 7, '#26344f'); R(px, py + 1, T, 5, th.plat); R(px, py + 4, T, 2, th.plat2); if (x % 2 === 0) R(px + 7, py + 1, 1, 5, th.plat2);
      }
    }
    return c;
  }

  // ================= 화면 =================
  const cv = $('cv'), ctx = cv.getContext('2d');
  let S = 2, VW = 420, VH = 250, cssScale = 2;
  function resize() {
    const st = $('stage').getBoundingClientRect(), w = Math.max(100, st.width), h = Math.max(100, st.height), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    if (mode === 'puzzle' && puz) { const laneW = puz.st.world.cols * COLW + 80; cssScale = Math.min(w / Math.max(220, Math.min(laneW, 300)), h / 165); }   // 긴 길은 가까이 보고 카메라가 따라가요
    else cssScale = Math.min(w / 420, h / 250);
    VW = w / cssScale; VH = h / cssScale;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    S = cssScale * dpr;
    if (puz && puz.ws) Blockly.svgResize(puz.ws);
  }

  // ================= 상태 =================
  let mode = 'menu';      // menu | play | puzzle | talk
  let L = null, stageIdx = 0, time = 0;
  const hero = { x: 0, y: 0, vx: 0, vy: 0, on: false, face: 1, anim: 0, coyote: 0, buf: 0, ride: null, fr: 'idle', emote: null, emoteT: 0 };
  const cam = { x: 0 };
  let starsGot = 0, checkpoint = null;
  const keys = new Set();

  // ================= 입력 =================
  window.addEventListener('keydown', (e) => {
    if (mode !== 'play') { if (mode === 'talk' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); $('talkNext').click(); } return; }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.add('l');
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.add('r');
    else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { hero.buf = 0.15; e.preventDefault(); }
    else if (e.code === 'KeyE') { const s = nearStation(); if (s) openPuzzle(s); }
    else return;
    e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.delete('l'); if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.delete('r'); });
  window.addEventListener('blur', () => keys.clear());
  document.querySelectorAll('#pad [data-k]').forEach((b) => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); keys.add(k); b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (er) { } });
    const off = () => { keys.delete(k); b.classList.remove('on'); };
    b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
  });
  $('btnJump').addEventListener('pointerdown', (e) => { e.preventDefault(); hero.buf = 0.15; });
  $('btnPuzzle').onclick = () => { const s = nearStation(); if (s) openPuzzle(s); };
  cv.addEventListener('pointerdown', (e) => {   // 코딩 수정(퍼즐 장소)을 눌러도 열려요
    if (mode !== 'play') return;
    const wx = cam.x + e.clientX / cssScale;
    const s = nearStation(); if (s && Math.abs(wx - s.crystalX) < 40) openPuzzle(s);
  });
  document.addEventListener('touchmove', (e) => { if (!e.target.closest('.scroll, #blockly')) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  // ================= 물리 =================
  const SPEED = 92, GRAV = 950, JUMPV = 335;
  function solid(tx, ty) {
    if (tx < 0 || tx >= L.w) return true;
    if (ty < 0 || ty >= ROWS) return false;
    const t = L.grid[tx][ty];
    if (t === 4) { const s = L.stations.find((q) => tx >= q.gateX && tx <= q.gateX + 1); return !(s && s.open); }
    return t === 1 || t === 2 || t === 3;
  }
  function hits(x, y) { const x0 = Math.floor((x - 7) / T), x1 = Math.floor((x + 6) / T), y0 = Math.floor((y - 22) / T), y1 = Math.floor((y - 1) / T); for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solid(tx, ty)) return true; return false; }
  function physics(dt) {
    let dir = 0; if (keys.has('l')) dir -= 1; if (keys.has('r')) dir += 1;
    if (dir) hero.face = dir;
    hero.vx = dir * SPEED;
    hero.coyote = hero.on ? 0.1 : hero.coyote - dt; hero.buf -= dt;
    if (hero.buf > 0 && hero.coyote > 0) { hero.vy = -JUMPV; hero.on = false; hero.coyote = 0; hero.buf = 0; hero.ride = null; sfx.jump(); }
    hero.vy = Math.min(600, hero.vy + GRAV * dt);
    // 움직이는 발판에 타고 있으면 같이 움직여요
    if (hero.ride) { const nx = hero.x + hero.ride.dx; if (!hits(nx, hero.y)) hero.x = nx; }
    let nx = hero.x + hero.vx * dt;
    if (!hits(nx, hero.y)) hero.x = nx;
    let ny = hero.y + hero.vy * dt;
    hero.on = false; hero.ride = null;
    if (hits(hero.x, ny)) {
      if (hero.vy > 0) { ny = Math.floor(ny / T) * T; while (hits(hero.x, ny) && ny > 0) ny -= 1; hero.on = true; }
      else { ny = hero.y; }
      hero.vy = 0;
    }
    for (const m of L.movers) if (hero.vy >= 0 && hero.x > m.x - 4 && hero.x < m.x + m.w + 4 && hero.y <= m.y + 2 && ny >= m.y - 1) { ny = m.y; hero.vy = 0; hero.on = true; hero.ride = m; }
    hero.y = ny;
    if (dir && hero.on) hero.anim += dt;
    if (hero.y > ROWS * T + 30) respawn();
  }
  function respawn() { const c = checkpoint || L.spawn; hero.x = c.x; hero.y = c.y; hero.vx = hero.vy = 0; toast('풍덩! 마지막으로 지난 곳에서 다시 시작해요. 괜찮아요!', 2500); }
  function nearStation() { if (!L || mode !== 'play') return null; return L.stations.find((s) => hero.x > s.sx * T - 28 && hero.x < s.laneX0 * T + 12 && hero.y >= GY * T - 2) || null; }

  // ================= 그리기 =================
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    const th = L.th, levelH = ROWS * T;
    const gr = ctx.createLinearGradient(0, 0, 0, cv.height); gr.addColorStop(0, th.sky[0]); gr.addColorStop(1, th.sky[1]);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, cv.width, cv.height);
    const cx = Math.round(cam.x), cy = Math.round(levelH - VH);
    const X = (v) => Math.round(v - cx) * S, Y = (v) => Math.round(v - cy) * S;
    // 먼 배경 (천천히 움직여요)
    background(cx, cy, th);
    // 물·빈 곳
    if (th.water) { ctx.fillStyle = '#7cc6df'; ctx.fillRect(0, Y(GY * T + 9), cv.width, cv.height); ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 30; i++) { const wx = ((i * 53 + time * 12) % (VW + 40)) - 20; ctx.fillRect(Math.round(wx) * S, Y(GY * T + 13 + (i % 3) * 6), 6 * S, S); } }
    // 땅
    const sx = Math.max(0, cx), ex = Math.min(L.cv.width, cx + Math.ceil(VW) + 1);
    if (ex > sx) ctx.drawImage(L.cv, sx, 0, ex - sx, levelH, (sx - cx) * S, (0 - cy) * S, (ex - sx) * S, levelH * S);
    // 움직이는 발판
    for (const m of L.movers) { ctx.fillStyle = '#26344f'; ctx.fillRect(X(m.x), Y(m.y), m.w * S, 7 * S); ctx.fillStyle = th.plat; ctx.fillRect(X(m.x + 1), Y(m.y + 1), (m.w - 2) * S, 5 * S); ctx.fillStyle = '#ffd84a'; ctx.fillRect(X(m.x + m.w / 2 - 2), Y(m.y + 2), 4 * S, 2 * S); }
    // 퍼즐 장소들
    for (const s of L.stations) drawStation(s, X, Y);
    // 출구
    drawPortal(X, Y);
    // 자유 별
    for (const st of L.stars) if (!st.got) drawStar(st.x, st.y + Math.sin(time * 3 + st.x) * 2, 5, X, Y, '#ffd84a');
    // 바다표범
    const look0 = look();
    let fr = hero.fr; if (mode === 'play') fr = hero.emoteT > 0 ? hero.emote : !hero.on ? 'walk1' : hero.vx ? (Math.floor(hero.anim / 0.14) % 2 ? 'walk1' : 'walk2') : (time % 3.4 > 3.25 ? 'blink' : 'idle');
    const img = PX.seal(look0.wear, fr, hero.face < 0, look0.color);
    const hx = hero.px != null ? hero.px : hero.x, hy = hero.py != null ? hero.py : hero.y;
    ctx.fillStyle = 'rgba(38,52,79,.18)'; ctx.beginPath(); ctx.ellipse(X(hx), Y(GY * T > hy ? hy : GY * T), 11 * S, 3 * S, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(img, X(hx - img.width / 2), Y(hy - img.height + 2), img.width * S, img.height * S);
    // 말풍선 효과 (쿵! ⏳ 등)
    for (const f of fx) { const a = Math.max(0, 1 - f.t / f.d); ctx.globalAlpha = a; ctx.font = `${f.size * S}px Jua, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = f.col || '#26344f'; ctx.fillText(f.text, X(f.x), Y(f.y - f.t * 14)); ctx.globalAlpha = 1; }
  }
  function background(cx, cy, th) {
    const t = L.stage.theme;
    if (t === 'castle') {
      ctx.fillStyle = '#fff6c8'; for (let i = 0; i < 40; i++) { const x = ((i * 97) % 900 - cx * 0.1) % (VW + 20); const y = (i * 37) % 120; if ((time * 2 + i) % 3 > 0.4) ctx.fillRect(Math.round((x + VW + 20) % (VW + 20)) * S, Math.round(y + 6) * S, S * 1.5, S * 1.5); }
      ctx.fillStyle = '#3a4a78'; for (let i = 0; i < 6; i++) { const bx = (i * 180 - cx * 0.3) % 1080; const x = ((bx % 1080) + 1080) % 1080 - 100; ctx.fillRect(Math.round(x) * S, Math.round(120 - cy * 0) * S, 60 * S, 120 * S); for (let k = 0; k < 4; k++) ctx.fillRect(Math.round(x + k * 16) * S, 112 * S, 8 * S, 8 * S); ctx.fillStyle = '#ffd84a'; ctx.fillRect(Math.round(x + 26) * S, 140 * S, 6 * S, 8 * S); ctx.fillStyle = '#3a4a78'; }
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 9; i++) { const x = (((i * 160 - cx * 0.25 + time * 4) % 1440) + 1440) % 1440 - 120; const y = 20 + (i * 47) % 70; for (const [ox, oy, r] of [[0, 6, 10], [12, 0, 13], [26, 6, 10]]) { ctx.beginPath(); ctx.arc((x + ox) * S, (y + oy) * S, r * S, 0, Math.PI * 2); ctx.fill(); } }
      if (t === 'beach' || t === 'reef') { ctx.fillStyle = t === 'beach' ? '#8fd8ea' : '#7fd8d0'; ctx.fillRect(0, Math.round(150 - (ROWS * T - VH - cy) * 0 - (ROWS * T - VH) + (ROWS * T - VH)) * S, cv.width, cv.height); }
    }
  }
  function drawStar(x, y, r, X, Y, col, glow) {
    if (glow) { ctx.fillStyle = 'rgba(255,246,168,.45)'; ctx.beginPath(); ctx.arc(X(x), Y(y), (r + 5) * S, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(X(x) + Math.cos(a) * rr * S, Y(y) + Math.sin(a) * rr * S); } ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = Math.max(1, S * 0.8); ctx.strokeStyle = '#26344f'; ctx.stroke();
  }
  function drawStation(s, X, Y) {
    const th = L.th, gy = GY * T, solved = !!rec(L.stage.id).solved[s.i], world = puz && puz.st === s ? puz.world : s.world;
    // 코딩 수정
    const bx = s.crystalX, glow = 0.6 + Math.sin(time * 3) * 0.3;
    ctx.fillStyle = '#26344f'; ctx.fillRect(X(bx - 9), Y(gy - 10), 18 * S, 10 * S); ctx.fillStyle = '#c9d2dc'; ctx.fillRect(X(bx - 8), Y(gy - 9), 16 * S, 8 * S);
    ctx.fillStyle = solved ? `rgba(122,215,160,${glow})` : `rgba(127,220,255,${glow})`; ctx.beginPath(); ctx.arc(X(bx), Y(gy - 22), 14 * S, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(X(bx), Y(gy - 36)); ctx.lineTo(X(bx + 8), Y(gy - 22)); ctx.lineTo(X(bx), Y(gy - 9)); ctx.lineTo(X(bx - 8), Y(gy - 22)); ctx.closePath();
    ctx.fillStyle = solved ? '#7ad7a0' : '#7fdcff'; ctx.fill(); ctx.strokeStyle = '#26344f'; ctx.lineWidth = Math.max(1, S); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(X(bx - 3), Y(gy - 28), 2 * S, 5 * S);
    if (s.i === 0) { const hs = PX.sprite(L.stage.helper, Math.floor(time * 2) % 2 ? 'walk1' : 'idle'); ctx.drawImage(hs, X(bx - 34 - hs.width / 2), Y(gy - hs.height), hs.width * S, hs.height * S); }
    // 퍼즐 이름표
    label(bx, gy - 44, solved ? '✔ ' + s.m.title : '🧩 ' + s.m.title, solved ? '#dcf7ea' : '#fff6c8', X, Y);
    // 길: 칸 표시 (퍼즐 중일 때 숫자)
    if (mode === 'puzzle' && puz && puz.st === s) {
      for (let c = 0; c < world.cols; c++) { const x = colX(s, c); ctx.fillStyle = c % 2 ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.35)'; ctx.fillRect(X(x - T + 1), Y(gy), (COLW - 2) * S, 6 * S); ctx.font = `${6 * S}px Jua, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#26344f'; ctx.fillText(c === 0 ? '출발' : String(c), X(x), Y(gy + 13)); }
    }
    // 바위
    for (const c of world.rocks || []) { const x = colX(s, c); ctx.fillStyle = '#26344f'; ctx.beginPath(); ctx.ellipse(X(x), Y(gy - 7), 13 * S, 9 * S, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(X(x - 13), Y(gy - 7), 26 * S, 7 * S); ctx.fillStyle = '#9aa7b6'; ctx.beginPath(); ctx.ellipse(X(x), Y(gy - 7), 11.5 * S, 7.5 * S, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(X(x - 11.5), Y(gy - 7), 23 * S, 6 * S); ctx.fillStyle = '#c9d2dc'; ctx.fillRect(X(x - 6), Y(gy - 12), 5 * S, 2 * S); }
    // 깃발 (목표)
    const fx0 = colX(s, world.goal);
    ctx.fillStyle = '#26344f'; ctx.fillRect(X(fx0 + 10), Y(gy - 40), 2 * S, 40 * S);
    ctx.fillStyle = solved ? '#7ad7a0' : '#ff8a80'; ctx.beginPath(); ctx.moveTo(X(fx0 + 12), Y(gy - 40)); ctx.lineTo(X(fx0 + 26), Y(gy - 35)); ctx.lineTo(X(fx0 + 12), Y(gy - 30)); ctx.fill();
    // 별 (코딩으로만 모아요)
    const got = puz && puz.st === s ? puz.got : new Set();
    (world.stars || []).forEach((st, i) => { if (got.has(i)) return; drawStar(colX(s, st.col), st.high ? gy - 46 + Math.sin(time * 3) * 2 : gy - 10, 6, X, Y, '#ffd84a', true); });
    // 꽃게
    if (world.crab && !(puz && puz.st === s && puz.crabGone >= 1)) {
      const a = puz && puz.st === s ? puz.crabGone : 0, x = colX(s, world.crab.col) + a * 40, y = gy - 4;
      ctx.globalAlpha = 1 - a; ctx.fillStyle = '#26344f'; ctx.beginPath(); ctx.ellipse(X(x), Y(y - 4), 10 * S, 7 * S, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff6b5a'; ctx.beginPath(); ctx.ellipse(X(x), Y(y - 4), 8.5 * S, 5.5 * S, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff6b5a'; ctx.fillRect(X(x - 13), Y(y - 12), 4 * S, 4 * S); ctx.fillRect(X(x + 9), Y(y - 12), 4 * S, 4 * S);
      ctx.fillStyle = '#26344f'; ctx.fillRect(X(x - 4), Y(y - 10), 2 * S, 2 * S); ctx.fillRect(X(x + 2), Y(y - 10), 2 * S, 2 * S);
      if (puz && puz.st === s && !puz.running && !puz.crabGone) label(x, y - 22, '6번 움직인 뒤 비켜요', '#ffe8e5', X, Y, 5);
      ctx.globalAlpha = 1;
    }
    // 문 (해결하면 위로 열려요)
    const lift = s.gateLift;
    if (lift < 1) {
      const gx = s.gateX * T, top = 4 * T + lift * 8 * T, h = Math.max(0, GY * T - top);
      ctx.fillStyle = '#26344f'; ctx.fillRect(X(gx), Y(top), 32 * S, h * S);
      ctx.fillStyle = th.gate; ctx.fillRect(X(gx + 2), Y(top), 28 * S, h * S);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 6; k < 30; k += 8) ctx.fillRect(X(gx + k), Y(top), 2 * S, h * S);
      if (h > 30) { ctx.fillStyle = '#ffd84a'; ctx.fillRect(X(gx + 12), Y(top + h / 2 - 4), 8 * S, 8 * S); ctx.fillStyle = '#26344f'; ctx.fillRect(X(gx + 15), Y(top + h / 2 - 1), 2 * S, 4 * S); }
    }
  }
  function label(x, y, text, bg, X, Y, size = 5.6) {
    ctx.font = `${size * S}px Jua, sans-serif`; const w = ctx.measureText(text).width + 8 * S, h = (size + 4.5) * S;
    const bx = X(x) - w / 2, by = Y(y) - h / 2;
    ctx.fillStyle = bg; ctx.strokeStyle = '#26344f'; ctx.lineWidth = Math.max(1, S * 0.7); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, w, h, 4 * S) : ctx.rect(bx, by, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#26344f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, X(x), Y(y) + S * 0.4); ctx.textBaseline = 'alphabetic';
  }
  function drawPortal(X, Y) {
    const x = L.exitX, y = GY * T - 26;
    for (let i = 3; i >= 0; i--) { ctx.fillStyle = ['#c58fe0', '#7fdcff', '#ffd84a', '#ffffff'][i]; ctx.beginPath(); ctx.ellipse(X(x), Y(y), (14 - i * 3 + Math.sin(time * 4 + i) * 1.2) * S, (22 - i * 4) * S, 0, 0, Math.PI * 2); ctx.fill(); }
    label(x, y - 32, '🏁 출구', '#ffffff', X, Y);
  }

  // ================= 효과 =================
  const fx = [];
  function pop(x, y, text, col, size = 8, d = 0.9) { fx.push({ x, y, text, col, size, d, t: 0 }); }
  let toastT = 0;
  function toast(m, ms = 3500) { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, ms); }
  function confetti() { const box = $('fx'), cols = ['#ff8a80', '#ffd84a', '#7ad7a0', '#5fb4ff', '#c58fe0']; for (let i = 0; i < 40; i++) { const s = document.createElement('i'); s.className = 'cf'; s.style.left = Math.random() * 100 + 'vw'; s.style.background = cols[i % 5]; s.style.animationDelay = Math.random() * 0.4 + 's'; s.style.setProperty('--dx', (Math.random() * 100 - 50) + 'px'); box.appendChild(s); setTimeout(() => s.remove(), 3000); } }

  // ================= 반복 =================
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.04, (now - last) / 1000); last = now; time += dt;
    if (L) {
      for (const m of L.movers) { m.t += dt; const nx = m.x0 + (m.x1 - m.x0) * (0.5 - 0.5 * Math.cos(m.t * 0.9)); m.dx = nx - m.x; m.x = nx; }
      if (mode === 'play') {
        physics(dt);
        for (const st of L.stars) if (!st.got && Math.hypot(st.x - hero.x, st.y - (hero.y - 12)) < 16) { st.got = true; starsGot++; $('hudStars').textContent = '✦ ' + starsGot; sfx.star(); pop(st.x, st.y, '+✦', '#e0a800'); }
        if (Math.abs(hero.x - L.exitX) < 14 && hero.y > GY * T - 30) stageClear();
        const s = nearStation(); $('btnPuzzle').hidden = !s;
        if (s) $('btnPuzzle').firstChild.textContent = rec(L.stage.id).solved[s.i] ? '🧩 다시 해 보기 ' : '🧩 퍼즐 열기 ';
      }
      for (const s of L.stations) if (s.open && s.gateLift < 1) s.gateLift = Math.min(1, s.gateLift + dt * 1.2);
      if (hero.emoteT > 0) hero.emoteT -= dt;
      tickAnim(dt);
      if (puz && puz.crabFading && puz.crabGone < 1) puz.crabGone = Math.min(1, puz.crabGone + dt * 2);
      for (let i = fx.length - 1; i >= 0; i--) { fx[i].t += dt; if (fx[i].t > fx[i].d) fx.splice(i, 1); }
      const laneMid = puz ? (colX(puz.st, 0) + colX(puz.st, puz.world.cols - 1)) / 2 : 0, laneFits = puz && puz.world.cols * COLW + 60 <= VW;
      const target = mode === 'puzzle' && puz ? (laneFits ? laneMid - VW / 2 + 10 : (hero.px != null ? hero.px : hero.x) - VW * 0.35) : hero.x - VW * 0.42;
      const tx = Math.max(0, Math.min(L.w * T - VW, target));
      cam.x += (tx - cam.x) * Math.min(1, dt * (mode === 'puzzle' ? 5 : 8));
      render();
    }
    requestAnimationFrame(loop);
  }

  // ================= 실행 애니메이션 =================
  let anim = null, speed = 1;
  function play(kind, dur, data) { return new Promise((res) => { anim = Object.assign({ kind, t: 0, dur: dur * speed, res }, data); }); }
  function tickAnim(dt) {
    if (!anim) return;
    anim.t += dt; const k = Math.min(1, anim.t / anim.dur), a = anim;
    if (a.kind === 'move') { hero.px = a.x0 + (a.x1 - a.x0) * k; hero.py = GY * T; hero.fr = Math.floor(k * 4) % 2 ? 'walk1' : 'walk2'; hero.face = a.x1 >= a.x0 ? 1 : -1; }
    else if (a.kind === 'jump') { hero.px = a.x0 + (a.x1 - a.x0) * k; hero.py = GY * T - 44 * 4 * k * (1 - k); hero.fr = 'walk1'; hero.face = 1; }
    else if (a.kind === 'bump') { const q = k < 0.5 ? k * 2 : (1 - k) * 2; hero.px = a.x0 + (a.x1 - a.x0) * 0.35 * q; hero.py = GY * T; hero.fr = 'think'; }
    else if (a.kind === 'wait') { hero.fr = 'think'; }
    if (k >= 1) { anim = null; a.res(); }
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms * speed));

  // ================= 퍼즐 (블록 편집기) =================
  let puz = null;
  function openPuzzle(s) {
    if (mode !== 'play') return;
    sfx.open(); keys.clear();
    const m = s.m;
    puz = { st: s, m, worldIdx: 0, world: m.world || m.worlds[0], got: new Set(), crabGone: 0, running: false, stop: false, hint: 0, seen: {} };
    mode = 'puzzle';
    document.body.classList.add('puzzling');
    $('editor').hidden = false; $('pad').hidden = true; $('pad2').hidden = true;
    $('eStage').textContent = `${L.stage.name.split('·')[0].trim()} · 미션 ${s.i + 1}`;
    $('eTitle').textContent = m.title; $('eGoal').textContent = '🎯 ' + m.goal;
    msg('블록을 끌어와 ▶ 시작하기 아래에 연결하고, ▶ 실행을 눌러요!', '');
    resetWorld();
    setTimeout(() => {
      resize();
      puz.ws = CodeBlocks.inject($('blockly'), m);
      const blocker = document.createElement('div'); blocker.id = 'blocker'; blocker.hidden = true; blocker.textContent = '▶ 실행 중이에요… (↺ 처음 위치로 를 누르면 멈춰요)'; $('blockly').appendChild(blocker);
      resize(); Blockly.svgResize(puz.ws);
      puz.ws.addChangeListener((e) => { if (e.type === Blockly.Events.BLOCK_MOVE || e.type === Blockly.Events.BLOCK_CHANGE) { if (!puz.running) clearWarnings(); } });
    }, 30);
    if (!rec(L.stage.id).firstPuzzle) { rec(L.stage.id).firstPuzzle = true; saveCS(); }
  }
  function closePuzzle(solved) {
    if (!puz) return;
    puz.stop = true; anim = null;
    const s = puz.st;
    try { puz.ws.dispose(); } catch (e) { }
    $('blockly').innerHTML = '';
    if (puz.worldIdx) { puz.world = s.world; setRocks(L, s, s.world); }
    puz = null; mode = 'play';
    document.body.classList.remove('puzzling');
    $('editor').hidden = true; $('pad').hidden = false; $('pad2').hidden = false;
    hero.px = hero.py = null; hero.fr = 'idle'; hero.vx = hero.vy = 0;
    if (solved) { hero.x = colX(s, s.world.goal); hero.y = GY * T; checkpoint = { x: hero.x, y: hero.y }; }
    else { hero.x = s.crystalX + 14; hero.y = GY * T; }
    setTimeout(resize, 30);
  }
  function resetWorld() {
    const s = puz.st; puz.got = new Set(); puz.crabGone = 0; puz.crabFading = false;
    hero.px = colX(s, 0); hero.py = GY * T; hero.fr = 'idle'; hero.face = 1;
  }
  function msg(html, cls) { const e = $('eMsg'); e.className = 'emsg ' + (cls || ''); e.innerHTML = html; }
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function clearWarnings() { if (!puz || !puz.ws) return; for (const b of puz.ws.getAllBlocks(false)) b.setWarningText(null); }
  function blockName(id) { const b = puz.ws.getBlockById(id); if (!b) return '블록'; if (b.type === 'c_repeat') return `🔁 ${b.getFieldValue('N')}번 반복하기`; return CodeBlocks.NAME[b.type] || '블록'; }

  async function runProgram() {
    if (!puz || puz.running) return;
    const prog = CodeBlocks.read(puz.ws);
    clearWarnings(); puz.ws.highlightBlock(null);
    if (prog.error) { msg('⚠️ ' + prog.error, 'bad'); return; }
    if (!prog.nodes.length) { msg('🤔 ▶ 시작하기 아래에 연결된 블록이 없어요. 블록을 끌어와 시작하기 아래에 딱 붙여요!', 'bad'); sfx.bump(); return; }
    puz.running = true; puz.stop = false;
    $('eRun').disabled = true; $('blocker').hidden = false;
    const worlds = puz.m.worlds || [puz.st.world];
    let allOk = true, lastJudge = null, failWorld = -1;
    for (let wi = 0; wi < worlds.length; wi++) {
      puz.worldIdx = wi; puz.world = worlds[wi]; setRocks(L, puz.st, puz.world);
      resetWorld(); await sleep(250);
      if (worlds.length > 1) { msg(`🛣️ ${puz.world.name}에서 실행해요…`, 'run'); await sleep(500); }
      const out = await CodeEngine.run(puz.world, prog.nodes, {
        stopped: () => puz.stop,
        onRepeat: async (node, k) => { puz.ws.highlightBlock(node.id); setRunInfo(node, `🔁 ${node.n}번 중 ${k}번째`); await sleep(120); },
        onCond: async (node, yes) => { puz.ws.highlightBlock(node.id); pop(hero.px, GY * T - 40, yes ? '앞에 바위 있음 → 점프!' : '앞에 바위 없음 → 걷기', yes ? '#d94f4f' : '#1f9d66', 6, 1); setRunInfo(node, yes ? '❓ 바위가 있어요 → 위쪽 명령' : '❓ 바위가 없어요 → 아니면 쪽 명령'); await sleep(450); },
        onStep: async (node, res) => { puz.ws.highlightBlock(node.id); setRunInfo(node); await animate(res.ev); },
        onError: async (node, err, st) => {
          const b = puz.ws.getBlockById(node.id); if (b) b.setWarningText(err.msg);
          puz.ws.highlightBlock(node.id);
          lastJudge = { ok: false, msg: `<b>“${esc(blockName(node.id))}” 블록</b>에서 멈췄어요. ${esc(err.msg)}`, code: err.code };
          sfx.bump(); void st;
        },
      });
      if (puz.stop) break;
      if (out.judge) lastJudge = out.judge.ok ? out.judge : { ok: false, msg: esc(out.judge.msg), code: out.judge.code };
      if (!lastJudge || !lastJudge.ok) { allOk = false; failWorld = wi; break; }
      if (worlds.length > 1) { pop(hero.px, GY * T - 40, '통과!', '#1f9d66'); await sleep(500); }
    }
    if (!puz || puz.stop) return;
    puz.running = false; $('eRun').disabled = false; $('blocker').hidden = true;
    if (prog.loose) toast(`⚠️ 시작하기에 연결되지 않은 블록 ${prog.loose}개는 실행되지 않았어요.`, 4500);
    afterRun(prog, allOk, lastJudge, failWorld);
  }
  function setRunInfo(node, extra) { const b = blockName(node.id); msg(`▶ 실행 중: <b>${esc(b)}</b>${extra ? ' · ' + esc(extra) : ''}`, 'run'); }
  async function animate(evs) {
    const s = puz.st;
    for (const e of evs) {
      if (puz.stop) return;
      if (e.t === 'move') { sfx.step(); await play('move', 0.42, { x0: colX(s, e.from), x1: colX(s, e.to) }); }
      else if (e.t === 'jump') { sfx.jump(); await play('jump', 0.6, { x0: colX(s, e.from), x1: colX(s, e.to) }); }
      else if (e.t === 'bump') { pop(colX(s, e.to), GY * T - 30, e.what === 'crab' ? '꽃게! 🦀' : e.what === 'gate' ? '쿵! 🚪' : '쿵! 🪨', '#d94f4f', 8); await play('bump', 0.5, { x0: hero.px, x1: colX(s, e.to) }); }
      else if (e.t === 'wait') { pop(hero.px, GY * T - 40, '⏳ 기다려요', '#b07800', 6.5, 0.8); await play('wait', 0.7, {}); hero.fr = 'idle'; }
      else if (e.t === 'star') { puz.got.add(e.i); sfx.star(); const st = puz.world.stars[e.i]; pop(colX(s, st.col), GY * T - (st.high ? 50 : 18), '⭐ +1', '#e0a800', 7); }
      else if (e.t === 'crabgo') { pop(colX(s, puz.world.crab.col), GY * T - 30, '꽃게가 비켜요!', '#1f9d66', 6); puz.crabFading = true; }
    }
    hero.fr = 'idle';
  }
  function afterRun(prog, ok, judge, failWorld) {
    const m = puz.m;
    puz.ws.highlightBlock(null);
    // 블록 순서 비교 미션: 두 순서를 모두 실행해 봐야 완료
    if (m.compare) {
      const order = CodeEngine.flatActs(prog.nodes).join(',');
      if (order === 'right,jump' && !ok) puz.seen.a = true;
      if (order === 'jump,right' && ok) puz.seen.b = true;
      if (!(puz.seen.a && puz.seen.b)) {
        if (ok) { hero.emote = 'happy'; msg('✅ 깃발에 도착했어요! 이번에는 블록 순서를 바꿔서 <b>이동 → 점프</b>로 실행해 보세요. 결과가 어떻게 달라질까요?', 'ok'); sfx.ok(); return; }
        if (order === 'right,jump') { msg(`🪨 ${judge.msg}<br>👉 이번에는 순서를 바꿔 <b>점프 → 이동</b>으로 실행해 보세요!`, 'bad'); return; }
        msg((judge ? judge.msg : '') + '<br>두 블록을 모두 시작하기 아래에 연결해요.', 'bad'); return;
      }
      ok = true;
    }
    if (!ok) {
      const pre = failWorld > 0 ? `🛣️ <b>${esc(m.worlds[failWorld].name)}</b>에서 실패했어요. ` : '';
      msg(`🔧 ${pre}${judge ? judge.msg : '다시 해 봐요.'}<br><small>블록을 고친 뒤 다시 ▶ 실행해요. (↺ 처음 위치로 → 바다표범이 출발 칸으로 돌아가요)</small>`, 'bad');
      return;
    }
    // 성공!
    sfx.ok(); confetti();
    const s = puz.st, r = rec(L.stage.id), first = !r.solved[s.i];
    r.solved[s.i] = true; saveCS();
    const el = $('eMsg'); el.className = 'emsg ok';
    el.innerHTML = `<b>🎉 ${esc(m.ok)}</b><br>📘 ${esc(m.learn)}`;
    const b = document.createElement('button'); b.className = 'ebtn run'; b.textContent = first ? '🚪 문 열고 계속 가기 ▶' : '닫기 ▶';
    b.onclick = () => { s.open = true; closePuzzle(true); hero.emote = 'clap'; hero.emoteT = 1.6; };
    el.appendChild(document.createElement('br')); el.appendChild(b);
  }
  $('eRun').onclick = runProgram;
  $('eReset').onclick = () => { if (!puz) return; puz.stop = true; anim = null; setTimeout(() => { puz.running = false; puz.stop = false; $('eRun').disabled = false; $('blocker').hidden = true; resetWorld(); puz.ws.highlightBlock(null); msg('바다표범이 출발 칸으로 돌아왔어요.', ''); }, 60); };
  $('eClear').onclick = () => { if (!puz || puz.running) return; if (!confirm('블록을 처음 상태로 되돌릴까요?')) return; CodeBlocks.load(puz.ws, puz.m); msg('블록을 처음 상태로 되돌렸어요.', ''); };
  $('eHint').onclick = () => { if (!puz) return; const h = puz.m.hints; msg('💡 ' + esc(h[puz.hint % h.length]), 'hint'); puz.hint++; };
  $('eSpeed').onclick = () => { speed = speed === 1 ? 0.5 : 1; $('eSpeed').textContent = speed === 1 ? '🐢 보통' : '🐇 빠르게'; };
  $('eClose').onclick = () => { if (puz && puz.running) { puz.stop = true; } closePuzzle(false); };

  // ================= 반복 숫자 고르기 (태블릿용 큰 버튼) =================
  // 휴대폰·태블릿에서 Blockly는 숫자를 바꿀 때 브라우저 기본 입력 창을 띄워요. 대신 1~10 큰 버튼을 보여 줘요.
  function numPick(message, def, cb) {
    const box = $('numPick'), grid = $('numGrid'); grid.innerHTML = '';
    for (let n = 1; n <= 10; n++) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'nbtn' + (String(n) === String(def) ? ' cur' : ''); b.textContent = n;
      b.onclick = () => { box.hidden = true; sfx.pick(); cb(String(n)); };
      grid.appendChild(b);
    }
    $('numCancel').onclick = () => { box.hidden = true; cb(null); };
    box.hidden = false;
  }
  if (Blockly.dialog && Blockly.dialog.setPrompt) Blockly.dialog.setPrompt(numPick);

  // ================= 대화 =================
  function talk(who, name, lines, done) {
    mode = 'talk'; let i = 0;
    $('talkPic').src = PX.url(who, 'idle', 5); $('talkName').textContent = name; $('talk').hidden = false;
    const show = () => { $('talkText').textContent = lines[i]; $('talkNext').textContent = i === lines.length - 1 ? '시작! ▶' : '다음 ▶'; };
    $('talkNext').onclick = () => { i++; if (i >= lines.length) { $('talk').hidden = true; mode = 'play'; done && done(); } else show(); };
    show();
  }

  // ================= 스테이지 =================
  function startStage(idx) {
    stageIdx = idx; const stage = ALL[idx];
    L = buildLevel(stage);
    const r = rec(stage.id);
    L.stations.forEach((s) => { if (r.solved[s.i]) { s.open = true; s.gateLift = 1; } });
    // 체크포인트: 마지막으로 해결한 퍼즐의 깃발
    const lastSolved = [...L.stations].reverse().find((s) => r.solved[s.i]);
    checkpoint = lastSolved ? { x: colX(lastSolved, lastSolved.world.goal), y: GY * T } : null;
    const c = checkpoint || L.spawn; hero.x = c.x; hero.y = c.y; hero.vx = hero.vy = 0; hero.face = 1; hero.px = hero.py = null;
    starsGot = 0; $('hudStars').textContent = '✦ 0';
    cam.x = Math.max(0, hero.x - VW * 0.42);
    $('select').hidden = true; $('who').hidden = true; $('hud').hidden = false; $('pad').hidden = false; $('pad2').hidden = false;
    $('hudStage').textContent = stage.name; updateCoins();
    mode = 'play'; resize();
    if (!r.intro) { r.intro = true; saveCS(); talk(stage.helper, stage.helperName, stage.intro); }
    else toast(`${stage.name} — ${r.solved.filter(Boolean).length}/${stage.missions.length} 해결`, 2500);
  }
  function stageClear() {
    if (mode !== 'play') return;
    const stage = L.stage, r = rec(stage.id);
    if (!stage.missions.every((_, i) => r.solved[i])) return;
    mode = 'menu';
    const first = !r.done; r.done = true; r.doneAt = r.doneAt || Date.now(); saveCS();
    let got = 0;
    if (stage.id !== 'bonus') got += grant('code:' + stage.id, COIN_STAGE);
    const allDone = STAGES.every((s) => rec(s.id).done);
    if (allDone) got += grant('code:all', COIN_ALL);
    $('badgeIc').textContent = stage.badgeIc; $('badgeName').textContent = stage.badge; $('badgeLearn').textContent = '배운 것: ' + stage.learn;
    $('badgeCoin').hidden = !got; $('badgeCoin').textContent = `🪙 +${got} 코인! (AI 탐험대 상점에서 쓸 수 있어요)`;
    $('badgeSeal').src = PX.sealUrl(look().wear, 'clap', 5, look().color);
    $('badge').hidden = false; sfx.badge(); confetti(); updateCoins();
    $('badgeOk').onclick = () => { $('badge').hidden = true; if (allDone && first && stage.id !== 'bonus') showCert(); else showSelect(); };
  }
  function updateCoins() { if (me()) $('hudCoins').textContent = coins(); }

  // ================= 화면: 별명 · 지도 · 인증서 =================
  function showWho() {
    mode = 'menu'; $('who').hidden = false; $('select').hidden = true; $('hud').hidden = true; $('pad').hidden = true; $('pad2').hidden = true;
    $('whoSeal').src = PX.sealUrl({ head: 'hat', back: 'bag' }, 'happy', 6, 'sky');
    const list = $('whoList'); list.innerHTML = '';
    const names = new Set([...Object.keys(mainStore().players), ...Object.keys(cs.players)]);
    for (const n of names) {
      const mp = mainStore().players[n], b = document.createElement('button'); b.type = 'button'; b.className = 'chip';
      b.innerHTML = `<img alt="" src="${PX.sealUrl(Shop.cleanWear(mp && mp.wear), 'idle', 2, (mp && mp.color) || (cs.players[n] && cs.players[n].color) || 'sky')}"><span></span>`;
      b.querySelector('span').textContent = n; b.onclick = () => choose(n); list.appendChild(b);
    }
    if (!names.size) list.innerHTML = '<p class="small">아직 이 기기에 별명이 없어요. 새 별명을 적어 주세요.</p>';
  }
  function choose(nick) {
    if (!cs.players[nick]) cs.players[nick] = { nick, stages: {}, grants: {}, color: null, createdAt: Date.now() };
    cs.current = nick; saveCS(); look(); showSelect();
  }
  $('whoForm').addEventListener('submit', (e) => { e.preventDefault(); const n = $('whoNick').value.replace(/[<>&"'\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 10); if (!n) { $('whoErr').textContent = '별명을 적어 주세요.'; return; } choose(n); });
  function unlocked(i) { if (i === 0) return true; if (i < 3) return !!rec(ALL[i - 1].id).done; return !!rec('s2').done; }
  function showSelect() {
    mode = 'menu'; L = null; puz = null;
    $('select').hidden = false; $('who').hidden = true; $('hud').hidden = true; $('pad').hidden = true; $('pad2').hidden = true; $('editor').hidden = true; document.body.classList.remove('puzzling');
    $('selWho').textContent = `${cs.current} 대원 · 🪙 ${coins()}`;
    const box = $('selList'); box.innerHTML = '';
    ALL.forEach((st, i) => {
      const r = rec(st.id), open = unlocked(i), n = r.solved.filter(Boolean).length;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'scard t-' + st.theme + (r.done ? ' done' : '') + (open ? '' : ' locked') + (st.id === 'bonus' ? ' bonus' : '');
      b.innerHTML = `<span class="sic">${r.done ? st.badgeIc : open ? '🧩' : '🔒'}</span><b></b><span class="spl"></span><span class="sln"></span><span class="sst"></span>`;
      b.querySelector('b').textContent = st.name; b.querySelector('.spl').textContent = st.place; b.querySelector('.sln').textContent = '배워요: ' + st.learn;
      b.querySelector('.sst').textContent = r.done ? '✔ 완료 · ' + st.badge : open ? `퍼즐 ${n}/${st.missions.length}` : (st.id === 'bonus' ? '스테이지 2를 마치면 열려요 (선택)' : '앞 스테이지를 마치면 열려요');
      b.disabled = !open; b.onclick = () => startStage(i);
      box.appendChild(b);
    });
    $('btnCert').hidden = !STAGES.every((s) => rec(s.id).done);
  }
  function showCert() {
    mode = 'menu';
    $('certSeal').src = PX.sealUrl(look().wear, 'happy', 7, look().color); $('certName').textContent = cs.current;
    $('certBadges').innerHTML = ALL.filter((s) => rec(s.id).done).map((s) => `<span>${s.badgeIc} ${s.badge}</span>`).join('');
    $('certLink').innerHTML = LINK.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
    $('cert').hidden = false;
  }
  $('certClose').onclick = () => { $('cert').hidden = true; showSelect(); };
  $('certPrint').onclick = () => window.print();
  $('btnCert').onclick = showCert;
  $('btnWho').onclick = showWho;
  $('btnStages').onclick = () => { if (mode === 'play') showSelect(); };
  $('btnHelp').onclick = () => { if (mode !== 'play') return; mode = 'talk'; $('help').hidden = false; };
  $('helpClose').onclick = () => { $('help').hidden = true; mode = 'play'; };
  function syncSound() { $('btnSound').textContent = soundOn ? '🔊' : '🔇'; }
  $('btnSound').onclick = () => { soundOn = !soundOn; syncSound(); try { const s = JSON.parse(localStorage.getItem(CFG.SETTINGS_KEY) || '{}'); s.sound = soundOn; localStorage.setItem(CFG.SETTINGS_KEY, JSON.stringify(s)); } catch (e) { } };

  // ================= 시작 =================
  window.addEventListener('resize', () => setTimeout(resize, 50));
  syncSound(); resize();
  if (cs.current && cs.players[cs.current]) showSelect(); else showWho();
  requestAnimationFrame(loop);
  // 자동 테스트용
  window.CODE = { get mode() { return mode; }, hero, get L() { return L; }, get puz() { return puz; }, rec, startStage, openPuzzle, runProgram, coins, colX, showSelect, keys };
})();
