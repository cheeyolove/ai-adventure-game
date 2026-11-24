// AI 탐험대! 메인: 저장·코인·화면 전환·이동·대화·지도·함께 탐험
(function () {
  'use strict';
  const CFG = window.AIX_CONFIG;
  const $ = (id) => document.getElementById(id);
  const T = World.T;
  const GAMES = ['m1', 'm2', 'm3', 'm4', 'm5'];        // 체험형 미니게임 5개
  const MISSIONS = [...GAMES, 'fin'];                   // + 최종 인증 미션
  const COIN_GAME = 20, COIN_FIN = 30;                  // 처음 완료할 때만: 20×5 + 30 = 130코인

  // ================= 저장 =================
  // 처음 만든 학생에게 몸 색을 하나 뽑아 줘요. (같은 방에서 겹치면 방장이 다른 색으로 바꿔 줘요 → net.js)
  // 함께 탐험에서 '같은 학생이 다시 들어왔는지' 알아보는 무작위 아이디 (이름·기기 정보와 관계없어요)
  function newUid() { return Array.from({ length: 10 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join(''); }
  function randomColor() { const c = PX.SEAL_COLORS; return c[Math.floor(Math.random() * c.length)].id; }
  // 저장 키는 'ai-explorers:' 로 시작 → 판다 탐험대('panda-...')와 겹치지 않아요.
  function blankMissions() { const m = {}; for (const id of MISSIONS) m[id] = { done: false, wrong: 0, secs: 0, doneAt: null, coined: false }; return m; }
  function newProfile(nick) {
    return { nick, createdAt: Date.now(), introDone: false, missions: blankMissions(), finishedAt: null, playSecs: 0, pos: null, coins: 0, coinLog: [], owned: [], wear: { head: 'hat', back: 'bag' }, color: randomColor(), uid: newUid() };
  }
  // v1(첫 버전) 기록 → v2: 예전 미션 순서를 새 미니게임에 옮기고, 이미 끝낸 미션의 코인을 한 번 넣어 줘요.
  //   v1 m1 영상 해변 → m1 / v1 m2 질문 마을 → m3 / v1 m3 도서관 → m4 / v1 m4 공유 광장 → m5 / v1 m5 최종 시험 → fin
  function migrate(s) {
    if (!s || !s.players) return null;
    if (s.v === 2) return s;
    if (s.v !== 1) return null;
    for (const nick of Object.keys(s.players)) {
      const o = s.players[nick], om = o.missions || {}, p = Object.assign(newProfile(nick), o);
      p.missions = blankMissions();
      const map = { m1: 'm1', m3: 'm2', m4: 'm3', m5: 'm4', fin: 'm5' };
      for (const [nid, oid] of Object.entries(map)) if (om[oid]) Object.assign(p.missions[nid], om[oid], { coined: false });
      for (const id of MISSIONS) if (p.missions[id].done) { const amt = id === 'fin' ? COIN_FIN : COIN_GAME; p.coins += amt; p.missions[id].coined = true; p.coinLog.push({ at: Date.now(), amt, why: '이전 기록 보상' }); }
      if (!GAMES.every((id) => p.missions[id].done)) p.finishedAt = null;
      s.players[nick] = p;
    }
    s.v = 2; return s;
  }
  function loadStore() {
    try { const s = migrate(JSON.parse(localStorage.getItem(CFG.STORAGE_KEY) || 'null')); if (s) return s; } catch (e) { /* 저장소 사용 불가 */ }
    return { v: 2, current: null, players: {} };
  }
  let store = loadStore();
  for (const p of Object.values(store.players)) { if (!PX.COLOR_BY_ID[p.color]) p.color = randomColor(); if (!/^[a-z0-9]{10}$/.test(p.uid || '')) p.uid = newUid(); }   // 예전 기록에도 색을 한 번 정해 줘요 (코인·아이템은 그대로)
  let memoryOnly = false;
  function save() { try { localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(store)); } catch (e) { memoryOnly = true; } }
  save();
  let settings = { sound: true, net: true, room: '바다' };
  try { Object.assign(settings, JSON.parse(localStorage.getItem(CFG.SETTINGS_KEY) || '{}')); } catch (e) { }
  function saveSettings() { try { localStorage.setItem(CFG.SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { } }
  function prof() { return store.current ? store.players[store.current] : null; }
  function doneCount(p = prof(), list = GAMES) { return p ? list.filter((id) => p.missions[id].done).length : 0; }
  const allDone = (p = prof()) => p && MISSIONS.every((id) => p.missions[id].done);
  const myWear = () => { const p = prof(); return Shop.cleanWear(p && p.wear); };
  const myColor = () => { const p = prof(); return (p && PX.COLOR_BY_ID[p.color]) ? p.color : 'sky'; };
  const colorOf = (id) => PX.COLOR_BY_ID[id] || PX.SEAL_COLORS[0];

  // ================= 소리 =================
  let actx = null;
  function tone(freqs, dur = 0.09, type = 'triangle', vol = 0.12) {
    if (!settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      let t = actx.currentTime;
      for (const f of freqs) {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02); t += dur * 0.85;
      }
    } catch (e) { }
  }
  const sfx = {
    blip: () => tone([660], 0.05, 'square', 0.04),
    ok: () => tone([660, 880, 1175], 0.1),
    no: () => tone([300, 240], 0.12, 'sine', 0.1),
    pick: () => tone([520], 0.05, 'square', 0.05),
    badge: () => tone([523, 659, 784, 1047, 1319], 0.11),
    open: () => tone([440, 660], 0.07, 'sine', 0.08),
    coin: () => tone([988, 1319], 0.08, 'square', 0.05),
  };

  // ================= NPC =================
  const NPCS = [
    { id: 'captain', spr: 'captain', x: 24.4 * T, y: 13.3 * T, name: '탐험대장 바다표범', short: '탐험대장', icon: '🦭', face: -1, mission: 'fin' },
    { id: 'octopus', spr: 'octopus', x: 12.9 * T, y: 21.3 * T, name: '생각하는 문어 박사', short: '문어 박사', icon: '🐙', mission: 'm1' },
    { id: 'fish', spr: 'fish', x: 19.8 * T, y: 28.4 * T, lift: 6, name: '소문을 전하는 작은 물고기', short: '작은 물고기', icon: '🐟', float: true, noBlock: true, mission: 'm2' },
    { id: 'turtle', spr: 'turtle', x: 13.7 * T, y: 11.5 * T, name: '차분한 바다거북 선생님', short: '거북 선생님', icon: '🐢', face: -1, mission: 'm3' },
    { id: 'penguin', spr: 'penguin', x: 35.6 * T, y: 10.9 * T, name: '확인 도우미 펭귄', short: '확인 도우미 펭귄', icon: '🐧', mission: 'm4' },
    { id: 'jelly', spr: 'jelly', x: 33.5 * T, y: 23.4 * T, lift: 26, name: '인터넷 소문 해파리', short: '해파리', icon: '🪼', float: true, mission: 'm5' },
  ];
  const NPC = Object.fromEntries(NPCS.map((n) => [n.id, n]));
  const MISSION_NPC = { m1: 'octopus', m2: 'fish', m3: 'turtle', m4: 'penguin', m5: 'jelly', fin: 'captain' };
  const MISSION_INFO = {
    m1: { title: '수상한 영상 탐정', place: '신기한 영상 해변', who: '🐙 문어 박사', badge: 'lens', badgeName: '탐정 돋보기', msg: '영상만 보고 정하지 말고, 만든 사람과 근거를 확인해요!' },
    m2: { title: '소문을 멈춰라!', place: '소문 바다', who: '🐟 작은 물고기', badge: 'bubble', badgeName: '소문 멈춤 방패', msg: '확인되지 않은 소문은 멈추고 확인해요!' },
    m3: { title: '누구에게 물어볼까?', place: '질문하는 마을', who: '🐢 거북 선생님', badge: 'shell', badgeName: '질문 조개', msg: '혼자 판단하기 어려우면 믿을 만한 어른에게 물어봐요!' },
    m4: { title: '사실 확인 연구소', place: '사실 확인 도서관', who: '🐧 확인 도우미 펭귄', badge: 'book', badgeName: '비교 책갈피', msg: '말한 사람 수보다 출처! 날짜까지 확인해요!' },
    m5: { title: '사진 속 비밀을 찾아라!', place: '안전한 공유 광장', who: '🪼 해파리', badge: 'shield', badgeName: '안전 공유 방패', msg: '올리기 전에 친구 얼굴과 이름을 가리고 확인해요!' },
    fin: { title: 'AI 탐험대 인증', place: 'AI 탐험대 인증 센터', who: '🦭 탐험대장', badge: 'medal', badgeName: 'AI 탐험대 인증 메달', msg: '멈춰요 · 물어봐요 · 다시 찾아봐요를 모두 해냈어요!' },
  };

  // ================= 화면·카메라 =================
  const cv = $('game'), ctx = cv.getContext('2d');
  let S = 2, VW = 400, VH = 225, cssScale = 2;
  function resize() {
    const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cssScale = Math.min(w / 380, h / 220);
    VW = w / cssScale; VH = h / cssScale;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    S = cssScale * dpr;
    checkOrientation();
  }
  const START = [22.6 * T, 16.4 * T];
  const hero = { x: START[0], y: START[1], face: 1, moving: false, anim: 0, emote: null, emoteT: 0, path: null, pending: null };
  const cam = { x: 0, y: 0 };
  let mode = 'title';   // title | play | dialog | quiz
  let time = 0;
  function camTarget() {
    let tx = hero.x - VW / 2, ty = hero.y - VH / 2 - 10;
    if (mode === 'dialog') {
      const f = dlg && dlg.focus;
      const fx = f ? (hero.x + f.x) / 2 : hero.x, fy = f ? (hero.y + f.y) / 2 : hero.y;
      tx = fx - VW / 2; ty = fy - 12 - VH * 0.34;
    }
    tx = World.WPX <= VW ? (World.WPX - VW) / 2 : Math.max(0, Math.min(World.WPX - VW, tx));
    ty = World.HPX <= VH ? (World.HPX - VH) / 2 : Math.max(-8, Math.min(World.HPX - VH + (mode === 'dialog' ? VH * 0.3 : 0), ty));
    return [tx, ty];
  }

  // ================= 입력 =================
  const keys = new Set();
  const KEYMAP = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd' };
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const k = KEYMAP[e.code];
    if (k && mode === 'play') { keys.add(k); hero.path = null; hero.pending = null; e.preventDefault(); return; }
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      if (mode === 'dialog') { e.preventDefault(); advanceDialog(); }
      else if (mode === 'play') { const n = nearNpc(); if (n) { e.preventDefault(); interact(n); } }
    }
  });
  window.addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) keys.delete(k); });
  window.addEventListener('blur', () => keys.clear());
  document.querySelectorAll('#dpad [data-k]').forEach((b) => {
    const k = b.dataset.k;
    const on = (e) => { e.preventDefault(); if (mode !== 'play') return; keys.add(k); hero.path = null; hero.pending = null; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (er) { } };
    const off = () => { keys.delete(k); b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
  });
  let tapMark = null;
  cv.addEventListener('pointerdown', (e) => {
    if (mode === 'dialog') { advanceDialog(); return; }
    if (mode !== 'play') return;
    const wx = cam.x + e.clientX / cssScale, wy = cam.y + e.clientY / cssScale;
    let hit = null;
    for (const n of NPCS) { const sp = PX.sprite(n.spr); const top = n.y - sp.height - (n.lift || 0) - 4; if (wx > n.x - sp.width / 2 - 4 && wx < n.x + sp.width / 2 + 4 && wy > top && wy < n.y + 6) hit = n; }
    if (hit) {
      if (dist(hero, hit) < TALK_R) { interact(hit); return; }
      const goal = approachPoint(hit);
      hero.path = World.findPath(hero.x, hero.y, goal[0], goal[1]); hero.pending = hit;
      tapMark = { x: goal[0], y: goal[1], t: 0 };
    } else {
      hero.path = World.findPath(hero.x, hero.y, wx, wy); hero.pending = null;
      tapMark = { x: wx, y: wy, t: 0 };
    }
  });
  function approachPoint(n) {
    let best = null, bd = 1e9;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const tx = Math.floor(n.x / T) + dx, ty = Math.floor(n.y / T) + dy;
      if (!World.walkableTile(tx, ty)) continue;
      const px = tx * T + T / 2, py = ty * T + T / 2, d = Math.hypot(px - n.x, py - n.y);
      if (d < 14 || d > TALK_R - 4) continue;
      const dh = Math.hypot(px - hero.x, py - hero.y) * 0.3 + d;
      if (dh < bd) { bd = dh; best = [px, py]; }
    }
    return best || [n.x, n.y + 18];
  }

  // ================= 이동 =================
  const SPEED = 74, TALK_R = 36;
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function canStand(x, y) { for (const [ox, oy] of [[-6, 0], [6, 0], [-6, -4], [6, -4]]) if (!World.walkablePx(x + ox, y + oy)) return false; return true; }
  function moveHero(dt) {
    let vx = 0, vy = 0;
    if (keys.has('l')) vx -= 1; if (keys.has('r')) vx += 1; if (keys.has('u')) vy -= 1; if (keys.has('d')) vy += 1;
    if (!vx && !vy && hero.path && hero.path.length) {
      const [px, py] = hero.path[0];
      const dx = px - hero.x, dy = py - hero.y, d = Math.hypot(dx, dy);
      if (d < 2.5) hero.path.shift(); else { vx = dx / d; vy = dy / d; }
      if (!hero.path.length) hero.path = null;
    }
    if (!hero.path && hero.pending && !vx && !vy) {
      const n = hero.pending; hero.pending = null;
      if (dist(hero, n) < TALK_R + 6) { hero.face = n.x < hero.x ? -1 : 1; interact(n); }
    }
    const len = Math.hypot(vx, vy);
    hero.moving = len > 0;
    if (!len) return;
    vx /= len; vy /= len;
    const step = SPEED * dt;
    if (vx) hero.face = vx < 0 ? -1 : 1;
    const nx = hero.x + vx * step, ny = hero.y + vy * step;
    if (canStand(nx, hero.y)) hero.x = nx;
    else if (hero.path && canStand(hero.x, hero.y + Math.sign(vy || 1) * step)) hero.y += Math.sign(vy || 1) * step;
    if (canStand(hero.x, ny)) hero.y = ny;
    else if (hero.path && canStand(hero.x + Math.sign(vx || 1) * step, hero.y)) hero.x += Math.sign(vx || 1) * step;
    hero.anim += dt;
  }
  function nearNpc() { let best = null, bd = TALK_R; for (const n of NPCS) { const d = dist(hero, n); if (d < bd) { bd = d; best = n; } } return best; }

  // ================= 다음 목표 · HUD =================
  function firstOpen() { const p = prof(); if (!p) return null; for (const id of MISSIONS) if (!p.missions[id].done) return id; return null; }
  function nextTarget() { const p = prof(); if (!p) return null; if (!p.introDone) return NPC.captain; const id = firstOpen(); return id ? NPC[MISSION_NPC[id]] : null; }
  function updateHud() {
    const p = prof(); if (!p) return;
    $('hudName').textContent = colorOf(myColor()).icon + ' ' + p.nick;   // 내 몸 색 표시
    $('hudCoins').textContent = p.coins || 0;
    const wrap = $('hudBadges'); wrap.innerHTML = '';
    for (const id of MISSIONS) {
      const d = p.missions[id].done;
      const el = document.createElement('span'); el.className = 'hb' + (d ? ' on' : ''); el.title = MISSION_INFO[id].title + (d ? ' 완료' : '');
      const img = document.createElement('img'); img.src = PX.url('badge', MISSION_INFO[id].badge, 4); img.alt = '';
      el.appendChild(img); wrap.appendChild(el);
    }
    const id = firstOpen();
    $('hudGoal').textContent = !p.introDone ? '🦭 탐험대장에게 말을 걸어요' : !id ? '🏅 모든 미션 완료! 🛍️ 상점에서 꾸며 봐요' : `다음: ${MISSION_INFO[id].who} · ${MISSION_INFO[id].place}`;
    updateNetHud();
  }
  function updateNetHud() {
    const el = $('hudNet'); if (!el) return;
    const st = Net.status;
    el.className = 'netpill ' + st;
    el.textContent = st === 'on' ? `🟢 ${Net.room} 방 · 👥 ${Net.count()}명` : st === 'connecting' ? '🟡 친구 방 연결 중…' : st === 'retry' ? '🟡 다시 연결 중… (게임은 계속돼요)' : st === 'fail' ? '🔴 혼자 탐험 중 · 눌러서 다시 연결' : '🦭 혼자 탐험 중';
  }

  // ================= 대화 =================
  let dlg = null;
  const WHO = {
    hero: () => ({ name: prof() ? prof().nick : '나', url: (fr) => PX.sealUrl(myWear(), fr, 5, myColor()) }),
    captain: () => ({ name: '탐험대장 바다표범', spr: 'captain' }), octopus: () => ({ name: '문어 박사', spr: 'octopus' }),
    turtle: () => ({ name: '거북 선생님', spr: 'turtle' }), fish: () => ({ name: '작은 물고기', spr: 'fish' }),
    penguin: () => ({ name: '확인 도우미 펭귄', spr: 'penguin' }), jelly: () => ({ name: '해파리', spr: 'jelly' }),
  };
  function say(lines, onDone) { mode = 'dialog'; keys.clear(); hero.path = null; dlg = { lines, i: -1, onDone }; $('dialog').hidden = false; $('talkBtn').hidden = true; nextLine(); }
  function nextLine() {
    dlg.i++;
    if (dlg.i >= dlg.lines.length) { closeDialog(); return; }
    const [who, text, frame] = dlg.lines[dlg.i];
    const w = WHO[who]();
    if (NPC[who]) dlg.focus = NPC[who];
    const fr = frame || (who === 'hero' ? 'happy' : 'idle');
    $('dlgPic').src = w.url ? w.url(fr) : PX.url(w.spr, fr, 5);
    $('dlgName').textContent = w.name;
    dlg.text = text.replace(/\{nick\}/g, prof() ? prof().nick : '대원'); dlg.shown = 0; dlg.full = false;
    $('dlgText').textContent = '';
    $('dlgNext').textContent = dlg.i === dlg.lines.length - 1 ? '확인 ▶' : '다음 ▶';
    sfx.blip();
  }
  function advanceDialog() { if (!dlg) return; if (!dlg.full) { dlg.shown = dlg.text.length; dlg.full = true; $('dlgText').textContent = dlg.text; return; } nextLine(); }
  function closeDialog() { const cb = dlg && dlg.onDone; dlg = null; $('dialog').hidden = true; mode = 'play'; if (cb) cb(); }
  $('dialog').addEventListener('click', advanceDialog);

  // 작은 선택 창 (예: 다시 공부하기)
  function ask(text, buttons) {
    mode = 'quiz';
    const box = $('ask'); $('askText').textContent = text; const row = $('askBtns'); row.innerHTML = '';
    for (const [label, fn, cls] of buttons) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + (cls || ''); b.textContent = label; b.onclick = () => { box.hidden = true; mode = 'play'; fn && fn(); }; row.appendChild(b); }
    box.hidden = false;
  }

  // ================= 친구와 상호작용 =================
  const INTRO_LINES = {
    m1: [['octopus', '어서 와요! 해변 극장에 수상한 영상이 올라왔어요. 🎬'], ['octopus', '탐정 돋보기로 단서를 찾아볼까요?']],
    m2: [['fish', '큰일이야! 내가 들은 소문들이 물방울처럼 친구들에게 퍼지고 있어! 🫧'], ['fish', '친구들에게 닿기 전에 멈추고 확인하는 걸 도와줘!']],
    m3: [['turtle', '혼자 판단하기 어려울 땐 \'물어봐요\'예요.'], ['turtle', '상황 카드를 알맞은 사람에게 배달해 볼까요?']],
    m4: [['penguin', '사실 확인 연구소에 온 걸 환영해요! 📚'], ['penguin', '"내일 학교 쉰대!"가 맞는지 정보 카드를 조사해요!']],
    m5: [['jelly', '나는 예전에 소문을 퍼뜨리던 해파리야… 이제는 올리기 전에 확인하고 싶어! 📷'], ['jelly', '포스터 사진 속 비밀을 같이 찾아 줄래?']],
    fin: [['captain', '다섯 미니게임을 모두 해냈군요, {nick} 대원!'], ['captain', '이제 AI 탐험대 최종 인증 미션이에요. 등대에 불을 켜 봐요! 💡']],
  };
  const DONE_LINES = {
    m1: [['octopus', '수상해 보여도, 진짜 같아도! 만든 사람과 근거를 확인해요. 🔍']],
    m2: [['fish', '이제 소문을 들으면 먼저 멈추고 확인할 거야! 🫧']],
    m3: [['turtle', '알맞은 어른은 여러 명일 수 있어요. 언제든 물어봐요.']],
    m4: [['penguin', '말한 사람 수보다 출처! 날짜도 잊지 마요. 📖']],
    m5: [['jelly', '올리기 전에 한 번 더 확인! ✨']],
    fin: [['captain', '{nick} 대원, 진짜 같아도 한 번 더 확인해요!']],
  };
  function interact(n) {
    const p = prof(); if (!p || mode !== 'play') return;
    hero.face = n.x < hero.x ? -1 : 1;
    sfx.open();
    if (n.id === 'captain' && !p.introDone) return introCaptain();
    const mid = n.mission;
    if (p.missions[mid].done) {
      if (mid === 'fin') return say(DONE_LINES.fin, () => ask('무엇을 할까요?', [['🏅 인증서 보기', showCert, 'primary'], ['📖 다시 공부하기 (코인 없음)', () => startMission('fin', true)], ['닫기', null, 'ghost']]));
      return say(DONE_LINES[mid], () => ask(`'${MISSION_INFO[mid].title}'을(를) 다시 해 볼까요? (코인은 처음 완료할 때만 받아요)`, [['📖 다시 공부하기', () => startMission(mid, true), 'primary'], ['괜찮아요', null, 'ghost']]));
    }
    if (!p.introDone) return say([[n.id, '안녕! 먼저 등대 앞의 탐험대장님을 만나고 와 줄래요?']]);
    if (mid === 'fin') {
      const left = GAMES.filter((id) => !p.missions[id].done);
      if (left.length) return say([['captain', `잘하고 있어요! 미니게임 ${5 - left.length}개를 해냈어요.`], ['captain', `다음은 '${MISSION_INFO[left[0]].place}'의 ${MISSION_INFO[left[0]].who}예요. 노란 화살표를 따라가요!`]]);
    } else {
      const idx = GAMES.indexOf(mid);
      if (idx > 0 && !p.missions[GAMES[idx - 1]].done) { const prev = GAMES[idx - 1]; return say([[n.id, `반가워요! 먼저 '${MISSION_INFO[prev].place}'의 ${MISSION_INFO[prev].who}부터 도와줄래요? 노란 화살표를 따라가요!`]]); }
    }
    say(INTRO_LINES[mid], () => startMission(mid));
  }
  function introCaptain() {
    const p = prof();
    say([
      ['captain', '어서 와요, {nick} 대원! 나는 AI 탐험대의 탐험대장이에요.'],
      ['captain', 'AI는 진짜 같은 사진과 영상도 만들 수 있어요. 그래서 진짜처럼 보여도 한 번 더 확인해야 해요.'],
      ['captain', '우리 탐험대의 세 가지 약속을 기억하나요? 이제 직접 실천해 볼 시간이에요!'],
    ], () => {
      mode = 'quiz';
      Missions.open('intro', {
        nick: p.nick, sfx,
        onFinish: () => {
          mode = 'play'; p.introDone = true; save(); updateHud();
          say([['captain', '섬의 다섯 곳에서 미니게임을 해결하면 코인을 받아요. 🪙 코인으로 🛍️ 상점에서 나를 꾸밀 수 있어요!'], ['captain', '먼저 왼쪽 아래 \'신기한 영상 해변\'의 문어 박사에게 가 봐요. 노란 화살표를 따라가요!']],
            () => toast('방향키·WASD 또는 화면을 눌러 이동해요. 친구 가까이에서 E 키나 💬 버튼으로 이야기해요.'));
        },
        onClose: () => { mode = 'play'; },
      });
    });
  }

  // ================= 미니게임 · 코인 =================
  function startMission(id, practice) {
    const p = prof(); mode = 'quiz';
    const rec = p.missions[id];
    Missions.open(id, {
      nick: p.nick, sfx, practice: !!practice,
      onWrong: () => { if (!practice) { rec.wrong++; save(); } },
      onFinish: (r) => {
        hero.emote = 'clap'; hero.emoteT = 2.5;
        if (practice) { mode = 'play'; sfx.ok(); toast('📖 다시 공부 완료! 잘했어요. (코인은 처음 완료할 때만 받아요)'); return; }
        rec.done = true; rec.secs = Math.round(r.secs); rec.doneAt = Date.now();
        const amt = grantCoins(id);
        if (allDone(p)) p.finishedAt = Date.now();
        save(); updateHud(); sendResult();
        showBadge(id, amt, () => { mode = 'play'; if (id === 'fin') return ending(); say(afterLines(id)); });
      },
      onClose: () => { mode = 'play'; },
    });
  }
  // 미션을 처음 끝낼 때만 코인 (같은 미션을 반복해도 더 주지 않아요)
  function grantCoins(id) {
    const p = prof(), rec = p.missions[id];
    if (rec.coined) return 0;
    const amt = id === 'fin' ? COIN_FIN : COIN_GAME;
    rec.coined = true; p.coins = (p.coins || 0) + amt;
    p.coinLog = (p.coinLog || []).concat({ at: Date.now(), amt, why: `${MISSION_INFO[id].title} 첫 완료` }).slice(-60);
    return amt;
  }
  function afterLines(id) {
    const next = firstOpen();
    const where = next ? `다음은 '${MISSION_INFO[next].place}'의 ${MISSION_INFO[next].who}예요. 노란 화살표를 따라가요!` : '';
    return [[MISSION_INFO[id] && MISSION_NPC[id], `${MISSION_INFO[id].badgeName}를 줄게요! 🪙 코인으로 상점에서 꾸며 봐요.`], ...(where ? [[MISSION_NPC[id], where]] : [])];
  }
  function showBadge(id, amt, cb) {
    mode = 'quiz';
    $('badgePic').src = PX.url('badge', MISSION_INFO[id].badge, 8);
    $('badgeName').textContent = MISSION_INFO[id].badgeName;
    $('badgeMsg').textContent = MISSION_INFO[id].msg;
    $('badgeCount').textContent = `배지 ${doneCount(prof(), MISSIONS)} / 6`;
    $('badgeCoin').hidden = !amt; $('badgeCoin').textContent = `🪙 +${amt} 코인!`;
    $('badgeSeal').src = PX.sealUrl(myWear(), 'clap', 5, myColor());
    $('badgeModal').hidden = false;
    sfx.badge(); confetti();
    if (amt) setTimeout(() => flyCoins(amt), 500);
    const btn = $('badgeOk');
    btn.onclick = () => { $('badgeModal').hidden = true; cb && cb(); };
    setTimeout(() => btn.focus(), 50);
  }
  function flyCoins(amt) {
    const to = $('hudCoins').getBoundingClientRect(), from = $('badgeCoin').getBoundingClientRect();
    for (let i = 0; i < Math.min(8, amt / 4); i++) {
      const c = document.createElement('i'); c.className = 'flycoin'; c.textContent = '🪙';
      c.style.left = (from.left + from.width / 2) + 'px'; c.style.top = (from.top) + 'px';
      $('fx').appendChild(c);
      setTimeout(() => { c.style.transform = `translate(${to.left - from.left - from.width / 2}px, ${to.top - from.top}px) scale(.6)`; c.style.opacity = '0.2'; }, 30 + i * 70);
      setTimeout(() => { c.remove(); sfx.coin(); const h = $('hudCoins').parentElement; h.classList.remove('bump'); void h.offsetWidth; h.classList.add('bump'); }, 750 + i * 70);
    }
  }
  function ending() {
    say([['captain', '축하해요! 이제 {nick} 대원은 정보를 한 번 더 확인하는 멋진 AI 탐험대원이 되었어요!', 'happy']], () => {
      mode = 'quiz';
      $('finale').hidden = false; confetti(); sfx.badge();
      let f = 0; const img = $('finaleSeal');
      const dance = setInterval(() => { if ($('finale').hidden) { clearInterval(dance); return; } f++; img.src = PX.sealUrl(myWear(), ['happy', 'clap', 'walk1', 'clap'][f % 4], 6, myColor()); }, 260);
      $('finaleOk').onclick = () => { $('finale').hidden = true; clearInterval(dance); showCert(); };
    });
  }

  // ================= 인증서 =================
  function fmtTime(sec) { sec = Math.round(sec); const m = Math.floor(sec / 60), s = sec % 60; return m ? `${m}분 ${s}초` : `${s}초`; }
  function resultCode(p) {
    const o = { n: p.nick, m: MISSIONS.map((id) => (p.missions[id].done ? 1 : 0)).join(''), w: MISSIONS.map((id) => Math.min(99, p.missions[id].wrong)).join('.'), s: Math.round(p.playSecs), f: p.finishedAt || 0 };
    return 'AIX2-' + btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, '');
  }
  function showCert() {
    const p = prof(); mode = 'quiz';
    $('certSeal').src = PX.sealUrl(myWear(), 'happy', 7, myColor());
    $('certCaptain').src = PX.url('captain', 'idle', 5);
    $('certName').textContent = p.nick;
    const d = new Date(p.finishedAt || Date.now());
    $('certDate').textContent = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    const st = $('certStamps'); st.innerHTML = '';
    for (const id of MISSIONS) {
      const el = document.createElement('div'); el.className = 'stamp';
      el.innerHTML = `<img alt="" src="${PX.url('badge', MISSION_INFO[id].badge, 4)}"><b></b><span>완료 ✔</span>`; el.querySelector('b').textContent = MISSION_INFO[id].title;
      st.appendChild(el);
    }
    const wrong = MISSIONS.reduce((a, id) => a + p.missions[id].wrong, 0);
    $('certStats').textContent = `여섯 가지 활동 모두 완료 · 다시 도전 ${wrong}번 · 플레이 시간 ${fmtTime(p.playSecs)}`;
    $('certCode').textContent = resultCode(p);
    $('certCodeBox').hidden = true;
    $('cert').hidden = false;
  }
  $('certPrint').onclick = () => window.print();
  $('certShowCode').onclick = () => { $('certCodeBox').hidden = !$('certCodeBox').hidden; };
  $('certClose').onclick = () => { $('cert').hidden = true; mode = 'play'; };
  $('certRestart').onclick = () => confirmRestart();

  // ================= (선택) 교사용 결과 전송 — 기본값: 꺼짐 =================
  function sendResult() {
    const url = CFG.RESULT_ENDPOINT; const p = prof();
    if (!url || !p) return;
    const body = { game: 'ai-explorers', v: 2, nick: p.nick, missions: Object.fromEntries(MISSIONS.map((id) => [id, { done: p.missions[id].done, wrong: p.missions[id].wrong, secs: p.missions[id].secs }])), allDone: !!allDone(p), playSecs: Math.round(p.playSecs), finishedAt: p.finishedAt ? new Date(p.finishedAt).toISOString() : '' };
    try { fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }).catch(() => { }); } catch (e) { }
  }

  // ================= 효과 =================
  function confetti() {
    const box = $('fx'); const cols = ['#ff8a80', '#ffd84a', '#7ad7a0', '#5fb4ff', '#c58fe0', '#ffffff'];
    for (let i = 0; i < 46; i++) {
      const s = document.createElement('i'); s.className = 'cf';
      s.style.left = (Math.random() * 100) + 'vw'; s.style.background = cols[i % cols.length];
      s.style.animationDelay = (Math.random() * 0.5) + 's'; s.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
      s.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
      box.appendChild(s); setTimeout(() => s.remove(), 3400);
    }
  }
  let toastTimer = 0;
  function toast(msg, ms = 5200) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, ms); }

  // ================= 지도 그리기 =================
  const waterTiles = [];
  function prepWater() { for (let ty = 0; ty < World.MH; ty++) for (let tx = 0; tx < World.MW; tx++) { const c = World.classify(tx + 0.5, ty + 0.5); if (c === 'W' || c === 'w') waterTiles.push([tx, ty, World.hash(tx, ty, 11), World.hash(tx, ty, 12)]); } }
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#7cc6df'; ctx.fillRect(0, 0, cv.width, cv.height);
    const cx = Math.round(cam.x), cy = Math.round(cam.y);
    const P = (v) => Math.round(v) * S;
    const sx = Math.max(0, cx), sy = Math.max(0, cy), ex = Math.min(World.WPX, cx + Math.ceil(VW) + 1), ey = Math.min(World.HPX, cy + Math.ceil(VH) + 1);
    if (ex > sx && ey > sy) ctx.drawImage(World.ground, sx, sy, ex - sx, ey - sy, (sx - cx) * S, (sy - cy) * S, (ex - sx) * S, (ey - sy) * S);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (const [tx, ty, h1, h2] of waterTiles) {
      const wx = tx * T, wy = ty * T;
      if (wx + T < cx || wy + T < cy || wx > cx + VW || wy > cy + VH) continue;
      const ph = (time * 0.7 + h1 * 6) % 3; if (ph > 1.6) continue;
      const len = ph < 0.8 ? Math.round(ph * 6) + 2 : Math.round((1.6 - ph) * 6) + 2;
      ctx.fillRect(P(wx + 3 + h2 * 8 - cx), P(wy + 4 + h1 * 9 - cy), len * S, S);
    }
    const list = [];
    for (const p of World.PROPS) list.push({ y: p.y, draw: () => drawProp(p, cx, cy) });
    for (const s of World.SIGNS) list.push({ y: s.y, draw: () => drawSign(s, cx, cy) });
    for (const n of NPCS) list.push({ y: n.y, draw: () => drawNpc(n, cx, cy) });
    for (const o of Net.others.values()) list.push({ y: o.ry, draw: () => drawSeal(o.rx, o.ry, o.f, o.mv ? (Math.floor(time / 0.16) % 2 ? 'walk1' : 'walk2') : (o.e || 'idle'), o.w, cx, cy, o.c) });
    list.push({ y: hero.y, draw: () => drawHero(cx, cy) });
    list.sort((a, b) => a.y - b.y);
    for (const d of list) d.draw();
    if (tapMark) { tapMark.t += 1 / 60; const r = 3 + tapMark.t * 10; ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, 1 - tapMark.t * 2)})`; ctx.lineWidth = S; ctx.beginPath(); ctx.ellipse(P(tapMark.x - cx), P(tapMark.y - cy), r * S, r * 0.55 * S, 0, 0, Math.PI * 2); ctx.stroke(); if (tapMark.t > 0.6) tapMark = null; }
    for (const n of NPCS) drawNpcLabel(n, cx, cy);
    for (const o of Net.others.values()) drawTag(o.rx - cx, o.ry - 36 - cy, (o.q ? '📝 ' : '') + o.n, 'other', o.c);
    if (Net.status === 'on') drawTag(hero.x - cx, hero.y - 36 - cy, '나 · ' + (prof() ? prof().nick : ''), 'me', myColor());
    drawGuide(cx, cy);
  }
  function shadow(x, y, w) { ctx.fillStyle = 'rgba(38,52,79,0.18)'; ctx.beginPath(); ctx.ellipse(x * S, y * S, w * S, w * 0.32 * S, 0, 0, Math.PI * 2); ctx.fill(); }
  function drawProp(p, cx, cy) {
    const img = World.artOf(p.art); const bob = p.bob ? Math.round(Math.sin(time * 1.6) * 1.2) : 0;
    const x = Math.round(p.x - img.width / 2 - cx), y = Math.round(p.y - img.height - cy + bob);
    if (x > VW || y > VH || x + img.width < 0 || y + img.height < 0) return;
    ctx.drawImage(img, x * S, y * S, img.width * S, img.height * S);
    if (p.anim === 'screen') {
      const ix = x + 7, iy = y + 7, f = Math.floor(time * 2) % 4, cols = ['#ffd84a', '#7ad7a0', '#ff8a80', '#5fb4ff'];
      ctx.fillStyle = '#2c3f66'; ctx.fillRect(ix * S, iy * S, 74 * S, 38 * S);
      ctx.fillStyle = cols[f]; ctx.fillRect((ix + 4) * S, (iy + 30) * S, (16 + f * 14) * S, 3 * S);
      ctx.fillStyle = '#ffffff'; for (let i = 0; i < 9; i++) ctx.fillRect((ix + 31) * S, (iy + 9 + i) * S, (i < 5 ? i + 1 : 9 - i) * 1.4 * S, S);
    } else if (p.anim === 'fountain') {
      ctx.fillStyle = '#d2f4fb';
      for (let i = 0; i < 6; i++) { const t = (time * 1.2 + i / 6) % 1; const dx = (i % 2 ? 1 : -1) * t * 14, dy = -6 + t * t * 20 - t * 14; ctx.fillRect(Math.round(x + 36 + dx) * S, Math.round(y + 6 + dy) * S, 2 * S, 2 * S); }
    }
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawSign(s, cx, cy) {
    const img = World.artOf('sign');
    const x = Math.round(s.x - img.width / 2 - cx), y = Math.round(s.y - img.height - cy);
    if (x > VW + 60 || y > VH || x + img.width < -60 || y + img.height < 0) return;
    ctx.drawImage(img, x * S, y * S, img.width * S, img.height * S);
    ctx.font = `${6.2 * S}px Jua, "Gowun Dodum", sans-serif`;
    const label = s.icon + ' ' + s.text, tw = ctx.measureText(label).width;
    const bw = Math.max(img.width * S - 4 * S, tw + 8 * S), bx = (x + img.width / 2) * S - bw / 2, by = (y + 2) * S;
    ctx.fillStyle = '#26344f'; roundRect(bx - S, by - S, bw + 2 * S, 17 * S, 3 * S); ctx.fill();
    ctx.fillStyle = '#fbe6c4'; roundRect(bx, by, bw, 15 * S, 3 * S); ctx.fill();
    ctx.fillStyle = '#26344f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, (x + img.width / 2) * S, by + 7.8 * S);
  }
  function npcFrame(n) { const ph = (time + n.x * 0.01) % 4; if (ph > 3.82) return 'blink'; if (n.float || n.id === 'octopus') return Math.floor((time + n.x * 0.003) * 2) % 2 ? 'walk1' : 'idle'; return 'idle'; }
  function drawNpc(n, cx, cy) {
    const fr = npcFrame(n);
    let face = n.face || 1;
    if (dist(hero, n) < 60 && (n.id === 'captain' || n.id === 'turtle' || n.id === 'fish')) face = hero.x < n.x ? -1 : 1;
    const img = face < 0 ? PX.flipped(n.spr, fr) : PX.sprite(n.spr, fr);
    const lift = (n.lift || 0) + (n.float ? Math.round(Math.sin(time * 2 + n.x) * 2) : 0);
    const x = Math.round(n.x - img.width / 2 - cx), y = Math.round(n.y - img.height - cy - lift);
    if (x > VW || y > VH + 40 || x + img.width < 0) return;
    if (!n.float) shadow(n.x - cx, n.y - cy - 1, img.width * 0.38);
    ctx.drawImage(img, x * S, y * S, img.width * S, img.height * S);
  }
  // 바다표범 (나 · 친구) — 착용 아이템이 걸음마다 함께 움직여요
  function drawSeal(wx, wy, face, fr, wear, cx, cy, color) {
    const img = PX.seal(wear, fr, face < 0, color || 'sky');
    const x = Math.round(wx - img.width / 2 - cx), y = Math.round(wy - img.height + 2 - cy);
    if (x > VW || y > VH + 10 || x + img.width < 0 || y + img.height < -10) return;
    shadow(wx - cx, wy - cy - 1, 12);
    ctx.drawImage(img, x * S, y * S, img.width * S, img.height * S);
    if (wear && wear.fx === 'bubbles') {   // 소문 멈춤 방울: 작은 물방울이 동동 올라가요
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.fillStyle = 'rgba(191,234,255,0.45)'; ctx.lineWidth = Math.max(1, S * 0.6);
      for (let i = 0; i < 4; i++) { const t = (time * 0.5 + i / 4) % 1; const bx = wx - cx + Math.sin(time * 2 + i * 2) * 4 + (i - 1.5) * 8, by = wy - cy - 8 - t * 30, r = (1.6 + (i % 2)) * (1 - t * 0.3); ctx.beginPath(); ctx.arc(bx * S, by * S, r * S, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    }
    if (wear && wear.fx === 'sparkle') {
      ctx.fillStyle = '#fff6a8';
      for (let i = 0; i < 4; i++) { const a = time * 2 + i * 1.6, r = 14 + Math.sin(time * 3 + i) * 3; const sx = wx - cx + Math.cos(a) * r, sy = wy - 14 - cy + Math.sin(a) * r * 0.6; const z = (Math.sin(time * 6 + i * 2) + 1) * 0.8 + 0.6; ctx.fillRect(Math.round(sx - z) * S, Math.round(sy) * S, Math.ceil(z * 2 + 1) * S, S); ctx.fillRect(Math.round(sx) * S, Math.round(sy - z) * S, S, Math.ceil(z * 2 + 1) * S); }
    }
  }
  function heroFrame() { if (hero.emoteT > 0) return hero.emote; if (hero.moving) return Math.floor(hero.anim / 0.16) % 2 ? 'walk1' : 'walk2'; return (time % 3.4) > 3.25 ? 'blink' : 'idle'; }
  function drawHero(cx, cy) { drawSeal(hero.x, hero.y, hero.face, heroFrame(), myWear(), cx, cy, myColor()); }
  // 이름표: 흰 바탕에 굵은 글씨 + 왼쪽에 몸 색 동그라미 (나는 노란 바탕)
  function drawTag(mx, top, text, kind, color) {
    if (mx < -60 || mx > VW + 60 || top > VH || top < -20) return;
    ctx.font = `${6 * S}px Jua, "Gowun Dodum", sans-serif`;
    const c = colorOf(color), dot = 4.2 * S;
    const tw = ctx.measureText(text).width, bw = tw + dot + 11 * S, bh = 10.5 * S, bx = mx * S - bw / 2, by = top * S;
    ctx.fillStyle = kind === 'me' ? 'rgba(255,216,74,0.97)' : 'rgba(255,255,255,0.96)'; roundRect(bx, by, bw, bh, 5 * S); ctx.fill();
    ctx.strokeStyle = '#26344f'; ctx.lineWidth = Math.max(1.5, S * 0.8); ctx.stroke();
    ctx.fillStyle = c.body; ctx.beginPath(); ctx.arc(bx + 5.5 * S, by + bh / 2, dot / 2 + S, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = c.shade; ctx.stroke();
    ctx.fillStyle = '#26344f'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, bx + dot + 7.5 * S, by + bh / 2 + S * 0.4);
  }
  function drawNpcLabel(n, cx, cy) {
    const p = prof(); if (!p) return;
    const sp = PX.sprite(n.spr);
    const top = n.y - sp.height - (n.lift || 0) - 3 - cy, mx = n.x - cx;
    if (mx < -60 || mx > VW + 60 || top > VH || top < -40) return;
    const near = dist(hero, n) < 80, done = n.mission && p.missions[n.mission].done;
    ctx.font = `${5.6 * S}px Jua, "Gowun Dodum", sans-serif`;
    const label = n.icon + ' ' + (near ? n.name : n.short) + (done ? ' ✔' : '');
    const tw = ctx.measureText(label).width, bw = tw + 8 * S, bh = 10 * S, bx = mx * S - bw / 2, by = (top - 12) * S;
    ctx.fillStyle = done ? 'rgba(220,245,232,0.95)' : 'rgba(255,255,255,0.93)'; roundRect(bx, by, bw, bh, 5 * S); ctx.fill();
    ctx.strokeStyle = '#26344f'; ctx.lineWidth = Math.max(1, S * 0.7); ctx.stroke();
    ctx.fillStyle = '#26344f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, mx * S, by + bh / 2 + S * 0.4);
  }
  function drawGuide(cx, cy) {
    const t = nextTarget(); if (!t || mode === 'title') return;
    const sp = PX.sprite(t.spr);
    const ax = t.x - cx, ay = t.y - sp.height - (t.lift || 0) - 18 - cy + Math.sin(time * 5) * 2.5;
    if (ax > 8 && ax < VW - 8 && ay > 6 && ay < VH - 10) {
      ctx.fillStyle = '#26344f'; ctx.beginPath(); ctx.moveTo((ax - 7) * S, (ay - 6) * S); ctx.lineTo((ax + 7) * S, (ay - 6) * S); ctx.lineTo(ax * S, (ay + 3) * S); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo((ax - 5) * S, (ay - 5) * S); ctx.lineTo((ax + 5) * S, (ay - 5) * S); ctx.lineTo(ax * S, (ay + 1) * S); ctx.closePath(); ctx.fill();
    } else {
      const ang = Math.atan2(t.y - hero.y, t.x - hero.x);
      let px = VW / 2 + Math.cos(ang) * (VW / 2 - 18), py = VH / 2 + Math.sin(ang) * (VH / 2 - 18);
      px = Math.max(16, Math.min(VW - 16, px)); py = Math.max(34, Math.min(VH - 16, py));
      const pulse = 1 + Math.sin(time * 6) * 0.08;
      ctx.save(); ctx.translate(px * S, py * S); ctx.rotate(ang); ctx.scale(pulse, pulse);
      ctx.fillStyle = '#26344f'; ctx.beginPath(); ctx.moveTo(11 * S, 0); ctx.lineTo(-7 * S, -9 * S); ctx.lineTo(-3 * S, 0); ctx.lineTo(-7 * S, 9 * S); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(8.5 * S, 0); ctx.lineTo(-5 * S, -6.5 * S); ctx.lineTo(-1.8 * S, 0); ctx.lineTo(-5 * S, 6.5 * S); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  // ================= 함께 탐험 (실시간) =================
  function netMine() {
    const p = prof();
    return { n: p ? p.nick : '대원', x: Math.round(hero.x), y: Math.round(hero.y), f: hero.face, m: hero.moving ? 1 : 0, q: mode === 'quiz' ? 1 : 0, e: hero.emoteT > 0 ? hero.emote : '', w: myWear(), c: myColor(), u: p ? p.uid : '', b: doneCount(p, MISSIONS) };
  }
  let lastNet = '';
  function netChanged() {
    updateNetHud();
    const st = Net.status;
    if (st !== lastNet) {
      if (st === 'on' && lastNet !== 'retry') toast(`🌊 '${Net.room}' 방에 들어왔어요! 친구들의 바다표범이 보여요.`, 3500);
      if (st === 'fail') toast('친구 방에 연결하지 못했어요. 혼자서도 모든 미니게임을 할 수 있어요! (위의 🔴 표시를 누르면 다시 연결)', 7000);
      lastNet = st;
    }
  }
  function netStart() { if (!settings.net) { Net.leave(); return; } Net.start(settings.room || '바다', netMine, netChanged, onNetColor); }
  // 방장이 '같은 방에서 겹친다'며 다른 색을 정해 주면, 그 색을 저장해서 다음에도 써요
  function onNetColor(c) {
    const p = prof(); if (!p || !PX.COLOR_BY_ID[c] || p.color === c) return;
    p.color = c; save(); updateHud();
    toast(`🎨 같은 방 친구와 색이 겹쳐서 내 바다표범이 ${colorOf(c).icon} ${colorOf(c).name}이 되었어요!`, 4500);
  }
  $('hudNet').onclick = () => {
    if (mode !== 'play') return;
    const st = Net.status;
    if (st === 'on') return ask(`지금 '${Net.room}' 방에서 ${Net.count()}명이 함께 탐험하고 있어요.`, [['계속하기', null, 'primary'], ['🦭 혼자 하기로 바꾸기', () => { settings.net = false; saveSettings(); Net.leave(); }, 'ghost']]);
    ask(st === 'fail' ? `${Net.why || '친구 방에 연결하지 못했어요.'}\n인터넷 연결을 확인하고 다시 눌러 보세요. 학교 인터넷이 막고 있다면 선생님께 알려 주세요. 혼자서도 모든 활동을 할 수 있어요.` : '친구들과 같은 방에서 함께 탐험할까요? (방 코드: ' + (settings.room || '바다') + ')',
      [['🔄 친구 방에 연결하기', () => { settings.net = true; saveSettings(); netStart(); }, 'primary'], ['혼자 계속하기', () => { settings.net = false; saveSettings(); Net.leave(); }, 'ghost']]);
  };

  // ================= 반복 =================
  let last = performance.now(), saveTimer = 0;
  const dpadEl = $('dpad');
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    if (mode === 'play') moveHero(dt); else hero.moving = false;
    if (hero.emoteT > 0) hero.emoteT -= dt;
    const p = prof();
    if (p && mode !== 'title' && !document.hidden) {
      p.playSecs += dt; saveTimer += dt;
      if (saveTimer > 4) { saveTimer = 0; p.pos = [Math.round(hero.x), Math.round(hero.y)]; save(); }
    }
    // 친구 위치는 부드럽게 따라가요
    for (const o of Net.others.values()) { const k = Math.min(1, dt * 9); const dx = o.x - o.rx, dy = o.y - o.ry; o.mv = o.m || Math.hypot(dx, dy) > 1.5; o.rx += dx * k; o.ry += dy * k; }
    if (mode !== 'title') Net.tick(dt);
    const [tx, ty] = camTarget(); const k = 1 - Math.pow(0.0015, dt);
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
    if (mode !== 'title') render();
    if (dlg && !dlg.full) { dlg.shown += dt * 38; const n = Math.floor(dlg.shown); if (n >= dlg.text.length) { dlg.full = true; $('dlgText').textContent = dlg.text; } else $('dlgText').textContent = dlg.text.slice(0, n); }
    dpadEl.classList.toggle('off', mode !== 'play');
    if (mode !== 'play') $('talkBtn').hidden = true;
    else {
      const n = nearNpc(); const b = $('talkBtn');
      if (n) { b.hidden = false; b.querySelector('span').textContent = `${n.icon} ${n.short}에게 말 걸기`; b.onclick = () => interact(n); } else b.hidden = true;
    }
    requestAnimationFrame(loop);
  }

  // ================= 시작 화면 · 별명 =================
  const SUGGEST = ['반짝 바다표범', '용감한 파도', '똑똑 조개', '방울 탐정', '별빛 대원', '푸른 등대', '몽글 해초', '씩씩 물개'];
  function showTitle() {
    mode = 'title';
    $('title').hidden = false; $('nameScreen').hidden = true;
    $('titleSeal').src = PX.sealUrl({ head: 'hat', back: 'bag' }, 'happy', 8);
    $('titleCaptain').src = PX.url('captain', 'idle', 6);
    const list = $('continueList'); list.innerHTML = '';
    const players = Object.values(store.players).sort((a, b) => (b.lastAt || b.createdAt) - (a.lastAt || a.createdAt)).slice(0, 8);
    $('continueWrap').hidden = !players.length;
    for (const p of players) {
      const b = document.createElement('button'); b.className = 'cbtn';
      const n = doneCount(p, MISSIONS);
      b.innerHTML = `<img alt="" src="${PX.sealUrl(Shop.cleanWear(p.wear), 'idle', 2, p.color)}"><span class="cn"></span><span class="cs">${'★'.repeat(n)}${'☆'.repeat(6 - n)} · 🪙${p.coins || 0}</span>`;
      b.querySelector('.cn').textContent = p.nick;
      b.onclick = () => startAs(p.nick);
      list.appendChild(b);
    }
  }
  $('btnNew').onclick = () => {
    $('title').hidden = true; $('nameScreen').hidden = false;
    $('nameSeal').src = PX.sealUrl({ head: 'hat', back: 'bag' }, 'idle', 6);
    const sg = $('suggest'); sg.innerHTML = '';
    for (const s of SUGGEST) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = s; b.onclick = () => { $('nickInput').value = s; $('nameErr').textContent = ''; }; sg.appendChild(b); }
    $('nickInput').value = ''; $('nameErr').textContent = '';
    $('netOn').checked = settings.net !== false; $('roomInput').value = settings.room || '바다';
    setTimeout(() => $('nickInput').focus(), 60);
  };
  $('nameBack').onclick = showTitle;
  $('nameForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const nick = $('nickInput').value.replace(/[<>&"'\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 10);
    if (!nick) { $('nameErr').textContent = '별명을 적거나 아래에서 골라 주세요.'; return; }
    const room = Net.clean($('roomInput').value);
    if ($('netOn').checked && room.length < 1) { $('nameErr').textContent = '방 코드를 적어 주세요. (기본: 바다)'; return; }
    if (store.players[nick]) { if (!window.confirm(`'${nick}' 기록이 이미 있어요. 이어서 할까요?\n(취소를 누르면 다른 별명을 고를 수 있어요)`)) return; }
    else store.players[nick] = newProfile(nick);
    settings.net = $('netOn').checked; settings.room = room || '바다'; saveSettings();
    startAs(nick);
  });
  // 코딩 탐험대(coding-adventure.html)에서 받은 코인: 그 게임은 자기 저장소에 '받을 코인'만 적고,
  // 여기서 id별로 한 번만 더해요. (두 화면이 동시에 열려 있어도 코인이 사라지거나 두 번 들어가지 않아요)
  function applyCodingCoins() {
    const p = prof(); if (!p) return;
    let cs = null; try { cs = JSON.parse(localStorage.getItem('ai-explorers:coding') || 'null'); } catch (e) { }
    const grants = cs && cs.players && cs.players[p.nick] && cs.players[p.nick].grants; if (!grants) return;
    p.codingApplied = p.codingApplied || {};
    let add = 0;
    for (const [id, amt] of Object.entries(grants)) {
      const n = Math.max(0, Math.min(30, Math.round(Number(amt) || 0)));
      if (!/^code:(s1|s2|s3|all)$/.test(id) || p.codingApplied[id] || !n) continue;
      p.codingApplied[id] = true; p.coins = (p.coins || 0) + n; add += n;
      p.coinLog = (p.coinLog || []).concat({ at: Date.now(), amt: n, why: '코딩 탐험대 ' + ({ 'code:s1': '스테이지 1', 'code:s2': '스테이지 2', 'code:s3': '스테이지 3', 'code:all': '전체 클리어' }[id]) }).slice(-60);
    }
    if (add) { save(); updateHud(); toast(`🧩 코딩 탐험대에서 받은 코인 +${add}! 🛍️ 상점에서 쓸 수 있어요.`, 4500); }
  }
  window.addEventListener('focus', () => { if (mode !== 'title') applyCodingCoins(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && mode !== 'title') applyCodingCoins(); });
  function startAs(nick) {
    store.current = nick; const p = prof(); p.lastAt = Date.now(); save();
    setTimeout(applyCodingCoins, 600);
    $('title').hidden = true; $('nameScreen').hidden = true;
    $('hud').hidden = false; $('dpad').hidden = false;
    if (p.pos && canStand(p.pos[0], p.pos[1])) { hero.x = p.pos[0]; hero.y = p.pos[1]; } else { hero.x = START[0]; hero.y = START[1]; }
    hero.face = 1;
    const [tx, ty] = camTarget(); cam.x = tx; cam.y = ty;
    mode = 'play'; updateHud();
    netStart();
    if (memoryOnly) toast('이 기기에서는 저장이 안 될 수 있어요. 끝까지 한 번에 해 주세요.');
    if (!p.introDone) setTimeout(() => { if (mode === 'play') introCaptain(); }, 500);
    else if (allDone(p)) toast('모든 미션 완료! 🛍️ 상점에서 꾸미고, 친구들과 섬을 탐험해요.');
    else toast(`다시 만나서 반가워요, ${p.nick} 대원! 노란 화살표를 따라가요.`, 3500);
  }

  // ================= 상점 · 메뉴 · 도움말 =================
  Shop.init({ prof, save, sfx, color: myColor, onChange: () => { updateHud(); Net.status === 'on' && Net.tick(1); }, onClose: () => { mode = 'play'; updateHud(); } });
  $('btnShop').onclick = () => { if (mode !== 'play') return; applyCodingCoins(); mode = 'quiz'; Shop.open(); };
  $('btnMenu').onclick = () => { if (mode !== 'play') return; mode = 'quiz'; $('menu').hidden = false; $('menuName').textContent = prof() ? `${prof().nick} 대원 · 🪙 ${prof().coins || 0}` : ''; $('menuNet').textContent = settings.net && Net.status === 'on' ? '🦭 혼자 하기로 바꾸기' : `🌊 친구 방(${settings.room || '바다'})에 연결하기`; };
  $('menuClose').onclick = () => { $('menu').hidden = true; mode = 'play'; };
  $('menuPromise').onclick = () => { $('menu').hidden = true; Missions.open('intro', { nick: prof().nick, sfx, review: true, onFinish: () => { mode = 'play'; }, onClose: () => { mode = 'play'; } }); };
  $('menuCert').onclick = () => { $('menu').hidden = true; if (allDone()) showCert(); else { mode = 'play'; toast(`인증서는 여섯 가지 활동을 모두 마치면 받아요. (지금 ${doneCount(prof(), MISSIONS)} / 6)`); } };
  $('menuCoins').onclick = () => {
    $('menu').hidden = true; const p = prof();
    const rows = (p.coinLog || []).slice().reverse().slice(0, 12).map((c) => `${c.amt > 0 ? '+' : ''}${c.amt} · ${c.why}`);
    ask(`🪙 지금 코인: ${p.coins || 0}\n\n${rows.length ? rows.join('\n') : '아직 내역이 없어요. 미니게임을 처음 끝내면 20코인, 최종 인증은 30코인을 받아요.'}`, [['닫기', null, 'primary']]);
  };
  $('menuNet').onclick = () => { $('menu').hidden = true; mode = 'play'; if (settings.net && Net.status === 'on') { settings.net = false; Net.leave(); } else { settings.net = true; netStart(); } saveSettings(); };
  $('menuRestart').onclick = () => { $('menu').hidden = true; confirmRestart(); };
  $('menuSwitch').onclick = () => { $('menu').hidden = true; const p = prof(); if (p) { p.pos = [Math.round(hero.x), Math.round(hero.y)]; save(); } Net.leave(); $('hud').hidden = true; $('dpad').hidden = true; $('talkBtn').hidden = true; showTitle(); };
  function confirmRestart() {
    const p = prof(); if (!p) return;
    if (!window.confirm(`'${p.nick}' 대원의 미션 기록을 지우고 처음부터 다시 할까요?\n(모은 코인과 산 물건은 그대로 남아요)`)) { if (!$('cert').hidden) return; mode = 'play'; return; }
    const keep = { coins: p.coins, coinLog: p.coinLog, owned: p.owned, wear: p.wear };
    const np = Object.assign(newProfile(p.nick), keep);
    for (const id of MISSIONS) np.missions[id].coined = p.missions[id].coined;   // 코인을 또 받지 않도록
    store.players[p.nick] = np; save();
    $('cert').hidden = true; startAs(p.nick);
  }
  $('btnHelp').onclick = () => { if (mode !== 'play') return; mode = 'quiz'; $('help').hidden = false; };
  $('helpClose').onclick = () => { $('help').hidden = true; mode = 'play'; };
  function syncSound() { $('btnSound').textContent = settings.sound ? '🔊' : '🔇'; $('btnSound').setAttribute('aria-label', settings.sound ? '소리 끄기' : '소리 켜기'); }
  $('btnSound').onclick = () => { settings.sound = !settings.sound; saveSettings(); syncSound(); sfx.pick(); };

  // ================= 화면 방향 · 태블릿 =================
  let rotateDismissed = false;
  function checkOrientation() { const portrait = window.innerHeight > window.innerWidth * 1.05; const touch = window.matchMedia('(pointer: coarse)').matches; $('rotateHint').hidden = !(portrait && touch && !rotateDismissed); }
  $('rotateOk').onclick = () => { rotateDismissed = true; checkOrientation(); };
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => { if (!e.target.closest('input')) e.preventDefault(); });
  document.addEventListener('touchmove', (e) => { if (!e.target.closest('.scroll')) e.preventDefault(); }, { passive: false });
  window.addEventListener('pagehide', () => { const p = prof(); if (p && mode !== 'title') { p.pos = [Math.round(hero.x), Math.round(hero.y)]; save(); } });

  // ================= 시작 =================
  World.init();
  for (const n of NPCS) if (!n.noBlock) World.blockRect(Math.floor(n.x / T), Math.floor((n.y - 2) / T), 1, 1);
  prepWater();
  window.addEventListener('resize', resize);
  resize(); syncSound();
  showTitle();
  requestAnimationFrame(loop);

  // 자동 테스트용: 친구를 눌렀을 때와 같은 방식으로 걸어가기
  function walkToNpc(id) { const n = NPC[id]; const g = approachPoint(n); hero.path = World.findPath(hero.x, hero.y, g[0], g[1]); hero.pending = n; return hero.path.length; }
  window.AIX = { get store() { return store; }, prof, hero, NPC, interact, nearNpc, walkToNpc, get mode() { return mode; }, fmtTime, resultCode, heroUrl: (fr) => PX.sealUrl(myWear(), fr, 4, myColor()), MISSIONS, myColor };
})();
