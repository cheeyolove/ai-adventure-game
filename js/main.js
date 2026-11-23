// AI 탐험대! 메인: 저장·화면 전환·이동·대화·지도 그리기
(function () {
  'use strict';
  const CFG = window.AIX_CONFIG;
  const $ = (id) => document.getElementById(id);
  const T = World.T;
  const MISSIONS = ['m1', 'm2', 'm3', 'm4', 'm5'];

  // ================= 저장 =================
  // 저장 키는 'ai-explorers:' 로 시작 → 판다 탐험대('panda-...')와 겹치지 않아요.
  function loadStore() {
    try { const s = JSON.parse(localStorage.getItem(CFG.STORAGE_KEY) || 'null'); if (s && s.v === 1 && s.players) return s; } catch (e) { /* 저장소 사용 불가 */ }
    return { v: 1, current: null, players: {} };
  }
  let store = loadStore();
  let memoryOnly = false;
  function save() {
    try { localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(store)); } catch (e) { memoryOnly = true; }
  }
  let settings = { sound: true };
  try { Object.assign(settings, JSON.parse(localStorage.getItem(CFG.SETTINGS_KEY) || '{}')); } catch (e) { }
  function saveSettings() { try { localStorage.setItem(CFG.SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { } }

  function newProfile(nick) {
    const m = {}; for (const id of MISSIONS) m[id] = { done: false, wrong: 0, secs: 0, doneAt: null };
    return { nick, createdAt: Date.now(), introDone: false, missions: m, finishedAt: null, playSecs: 0, pos: null };
  }
  function prof() { return store.current ? store.players[store.current] : null; }
  function doneCount(p = prof()) { return p ? MISSIONS.filter((id) => p.missions[id].done).length : 0; }

  // ================= 소리 (짧은 효과음) =================
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
  };

  // ================= NPC =================
  const NPCS = [
    { id: 'captain', spr: 'captain', x: 24.4 * T, y: 13.3 * T, name: '탐험대장 바다표범', short: '탐험대장', icon: '🦭', face: -1 },
    { id: 'octopus', spr: 'octopus', x: 12.9 * T, y: 21.3 * T, name: '생각하는 문어 박사', short: '문어 박사', icon: '🐙', mission: 'm1', zone: '신기한 영상 해변' },
    { id: 'turtle', spr: 'turtle', x: 13.7 * T, y: 11.5 * T, name: '차분한 바다거북 선생님', short: '거북 선생님', icon: '🐢', mission: 'm2', zone: '질문하는 마을', face: -1 },
    { id: 'fish', spr: 'fish', x: 4.4 * T, y: 11.9 * T, lift: 6, name: '소문을 전하는 작은 물고기', short: '작은 물고기', icon: '🐟', float: true, noBlock: true },
    { id: 'penguin', spr: 'penguin', x: 35.6 * T, y: 10.9 * T, name: '확인 도우미 펭귄', short: '확인 도우미 펭귄', icon: '🐧', mission: 'm3', zone: '사실 확인 도서관' },
    { id: 'jelly', spr: 'jelly', x: 33.5 * T, y: 23.4 * T, lift: 26, name: '인터넷 소문 해파리', short: '해파리', icon: '🪼', mission: 'm4', zone: '안전한 공유 광장', float: true },
  ];
  const NPC = Object.fromEntries(NPCS.map((n) => [n.id, n]));
  const MISSION_NPC = { m1: 'octopus', m2: 'turtle', m3: 'penguin', m4: 'jelly', m5: 'captain' };

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
    document.documentElement.style.setProperty('--vh', h + 'px');
    checkOrientation();
  }

  const hero = { x: 22.6 * T, y: 16.4 * T, face: 1, moving: false, anim: 0, blink: 0, emote: null, emoteT: 0, path: null, pending: null };
  const cam = { x: 0, y: 0 };
  let mode = 'title';   // title | play | dialog | quiz
  let time = 0;

  function camTarget() {
    let tx = hero.x - VW / 2, ty = hero.y - VH / 2 - 10;
    if (mode === 'dialog') {
      // 대화창이 아래를 덮으니, 말하는 친구와 나를 화면 위쪽에 함께 보여 줘요
      const f = dlg && dlg.focus;
      const fx = f ? (hero.x + f.x) / 2 : hero.x, fy = f ? (Math.min(hero.y, f.y) + Math.max(hero.y, f.y)) / 2 : hero.y;
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

  // 가상 방향키
  document.querySelectorAll('#dpad [data-k]').forEach((b) => {
    const k = b.dataset.k;
    const on = (e) => { e.preventDefault(); if (mode !== 'play') return; keys.add(k); hero.path = null; hero.pending = null; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (er) { } };
    const off = (e) => { keys.delete(k); b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
  });

  // 화면 누르기: 친구를 누르면 찾아가서 대화, 땅을 누르면 그곳으로 이동
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
    // 친구 옆에서 걸어갈 수 있는 가장 가까운 칸
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
  function canStand(x, y) {
    for (const [ox, oy] of [[-6, 0], [6, 0], [-6, -4], [6, -4]]) if (!World.walkablePx(x + ox, y + oy)) return false;
    return true;
  }
  function moveHero(dt) {
    let vx = 0, vy = 0;
    if (keys.has('l')) vx -= 1; if (keys.has('r')) vx += 1; if (keys.has('u')) vy -= 1; if (keys.has('d')) vy += 1;
    if (!vx && !vy && hero.path && hero.path.length) {
      const [px, py] = hero.path[0];
      const dx = px - hero.x, dy = py - hero.y, d = Math.hypot(dx, dy);
      if (d < 2.5) { hero.path.shift(); }
      else { vx = dx / d; vy = dy / d; }
      if (!hero.path.length) { hero.path = null; }
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
    else if (hero.path) { /* 모서리에 걸리면 살짝 밀어 주기 */ if (canStand(hero.x, hero.y + Math.sign(vy || 1) * step)) hero.y += Math.sign(vy || 1) * step; }
    if (canStand(hero.x, ny)) hero.y = ny;
    else if (hero.path && canStand(hero.x + Math.sign(vx || 1) * step, hero.y)) hero.x += Math.sign(vx || 1) * step;
    hero.anim += dt;
  }
  function nearNpc() {
    let best = null, bd = TALK_R;
    for (const n of NPCS) { const d = dist(hero, n); if (d < bd) { bd = d; best = n; } }
    return best;
  }

  // ================= 다음 목표 =================
  function nextTarget() {
    const p = prof(); if (!p) return null;
    if (!p.introDone) return NPC.captain;
    for (const id of ['m1', 'm2', 'm3', 'm4']) if (!p.missions[id].done) return NPC[MISSION_NPC[id]];
    if (!p.missions.m5.done) return NPC.captain;
    return null;
  }
  function firstOpenMission() { const p = prof(); for (const id of MISSIONS) if (!p.missions[id].done) return id; return null; }
  const MISSION_INFO = {
    m1: { title: '신기한 영상 해변', who: '🐙 문어 박사' },
    m2: { title: '질문하는 마을', who: '🐢 거북 선생님' },
    m3: { title: '사실 확인 도서관', who: '🐧 확인 도우미 펭귄' },
    m4: { title: '안전한 공유 광장', who: '🪼 해파리' },
    m5: { title: 'AI 탐험대 인증 센터', who: '🦭 탐험대장' },
  };
  function updateHud() {
    const p = prof(); if (!p) return;
    $('hudName').textContent = '🦭 ' + p.nick;
    const wrap = $('hudBadges'); wrap.innerHTML = '';
    for (const id of MISSIONS) {
      const d = p.missions[id].done;
      const el = document.createElement('span'); el.className = 'hb' + (d ? ' on' : '');
      el.title = MISSION_INFO[id].title + (d ? ' 완료' : '');
      const img = document.createElement('img'); img.src = PX.url('badge', id, 4); img.alt = '';
      el.appendChild(img); wrap.appendChild(el);
    }
    const id = firstOpenMission(), t = nextTarget();
    let goal;
    if (!p.introDone) goal = '🦭 탐험대장에게 말을 걸어요';
    else if (!id) goal = '🏅 모든 미션 완료! 인증서를 받았어요';
    else goal = `다음: ${MISSION_INFO[id].who} · ${MISSION_INFO[id].title}`;
    $('hudGoal').textContent = goal;
    $('hudGoal').hidden = false;
    void t;
  }

  // ================= 대화 =================
  let dlg = null;   // { lines, i, shown, done }
  const WHO = {
    hero: () => ({ name: prof() ? prof().nick : '나', spr: 'hero' }),
    captain: () => ({ name: '탐험대장 바다표범', spr: 'captain' }),
    octopus: () => ({ name: '문어 박사', spr: 'octopus' }),
    turtle: () => ({ name: '거북 선생님', spr: 'turtle' }),
    fish: () => ({ name: '작은 물고기', spr: 'fish' }),
    penguin: () => ({ name: '확인 도우미 펭귄', spr: 'penguin' }),
    jelly: () => ({ name: '해파리', spr: 'jelly' }),
  };
  function say(lines, onDone) {
    mode = 'dialog'; keys.clear(); hero.path = null;
    dlg = { lines, i: -1, onDone };
    $('dialog').hidden = false; $('talkBtn').hidden = true;
    nextLine();
  }
  function nextLine() {
    dlg.i++;
    if (dlg.i >= dlg.lines.length) { closeDialog(); return; }
    const [who, text, frame] = dlg.lines[dlg.i];
    const w = WHO[who]();
    if (NPC[who]) dlg.focus = NPC[who];
    $('dlgPic').src = PX.url(w.spr, frame || (who === 'hero' ? 'happy' : 'idle'), 5);
    $('dlgName').textContent = w.name;
    dlg.text = text.replace(/\{nick\}/g, prof() ? prof().nick : '대원'); dlg.shown = 0; dlg.full = false;
    $('dlgText').textContent = '';
    $('dlgNext').textContent = dlg.i === dlg.lines.length - 1 ? '확인 ▶' : '다음 ▶';
    sfx.blip();
  }
  function advanceDialog() {
    if (!dlg) return;
    if (!dlg.full) { dlg.shown = dlg.text.length; dlg.full = true; $('dlgText').textContent = dlg.text; return; }
    nextLine();
  }
  function closeDialog() {
    const cb = dlg && dlg.onDone; dlg = null;
    $('dialog').hidden = true; mode = 'play';
    if (cb) cb();
  }
  $('dialog').addEventListener('click', advanceDialog);

  // ================= 친구와 상호작용 =================
  function interact(n) {
    const p = prof(); if (!p || mode !== 'play') return;
    hero.face = n.x < hero.x ? -1 : 1;
    sfx.open();
    if (n.id === 'captain') return talkCaptain();
    if (n.id === 'fish') {
      if (p.missions.m2.done) return say([['fish', '나 이제 소문을 들으면 먼저 멈추고, 선생님께 여쭤보고, 학교 알림도 확인할 거야! 🫧']]);
      return say([['fish', '얘들아! 인터넷에서 내일 학교 쉰대! 빨리 다 알려 주자! 🫧'], ['hero', '(음… 진짜일까? 질문하는 마을의 거북 선생님께 가 보자.)', 'think']]);
    }
    const mid = n.mission;
    if (p.missions[mid].done) return say(DONE_LINES[mid]);
    const idx = MISSIONS.indexOf(mid);
    if (!p.introDone) return say([[n.id, '안녕! 먼저 등대 앞의 탐험대장님을 만나고 와 줄래요?']]);
    if (idx > 0 && !p.missions[MISSIONS[idx - 1]].done) {
      const prev = MISSIONS[idx - 1];
      return say([[n.id, `반가워요! 하지만 먼저 ${MISSION_INFO[prev].who}이(가) 있는 '${MISSION_INFO[prev].title}'에 다녀와 줄래요? 순서대로 하면 더 쉬워요!`]]);
    }
    say(INTRO_LINES[mid], () => startMission(mid));
  }

  const INTRO_LINES = {
    m1: [['octopus', '어서 와요! 여기는 신기한 영상이 상영되는 해변 극장이에요. 🎬'], ['octopus', '그런데 오늘 이상한 영상과 사진이 잔뜩 올라왔어요. 함께 살펴봐 줄래요?'], ['hero', '좋아요! 진짜 같아도 한 번 더 확인할게요!', 'happy']],
    m2: [['turtle', '어서 오세요. 혼자 판단하기 어려울 땐 어떻게 하면 좋을까요?'], ['turtle', '바로 \'물어봐요\'예요. 누구에게 물어보면 좋을지 함께 연결해 봐요.']],
    m3: [['penguin', '사실 확인 도서관에 온 걸 환영해요! 나는 확인 도우미 펭귄이에요. 📚'], ['penguin', '인터넷에 "내일 학교 쉬는 날이래!"라는 글이 퍼졌어요. 자료를 비교해서 확인해 봐요!']],
    m4: [['jelly', '안녕! 나는 예전에 소문을 이것저것 퍼뜨리던 해파리야…'], ['jelly', '이제는 올리기 전에 확인하는 해파리가 되고 싶어! 📷'], ['jelly', '바다표범 친구가 만든 포스터 사진을 선생님이 안내한 학급 게시판에 올리려고 해. 같이 확인해 줄래?']],
    m5: [['captain', '배지 네 개를 모두 모았군요, {nick} 대원! 이제 AI 탐험대 최종 시험이에요.'], ['captain', '문제를 하나 풀 때마다 등대의 불이 하나씩 켜져요. 다섯 개를 모두 켜 봐요! 💡']],
  };
  const DONE_LINES = {
    m1: [['octopus', '이상해 보여도 진짜일 수 있고, 진짜 같아도 만든 것일 수 있어요. 그래서 확인하는 거예요! 🔍']],
    m2: [['turtle', '혼자 판단하기 어려울 땐 언제든 믿을 만한 어른에게 물어봐요.']],
    m3: [['penguin', '누가 만든 정보인지 확인하고, 다른 자료와 비교하기! 잊지 마요. 📖']],
    m4: [['jelly', '올리기 전에 한 번 더 확인! 이제 나도 잘할 수 있어! ✨']],
    m5: [['captain', '{nick} 대원, 진짜 같아도 한 번 더 확인해요! 멈춰요 · 물어봐요 · 다시 찾아봐요!']],
  };
  const AFTER_LINES = {
    m1: [['octopus', '멋져요! 이 탐정 돋보기를 줄게요. 🔍'], ['octopus', '다음은 위쪽 \'질문하는 마을\'의 거북 선생님이 기다리고 있어요.']],
    m2: [['turtle', '훌륭해요! 질문 조개를 줄게요. 🐚'], ['turtle', '이제 오른쪽 위 \'사실 확인 도서관\'의 펭귄에게 가 봐요.']],
    m3: [['penguin', '확인 완료! 비교 책갈피를 줄게요. 📖'], ['penguin', '다음은 오른쪽 아래 \'안전한 공유 광장\'의 해파리가 도움이 필요하대요.']],
    m4: [['jelly', '고마워! 이제 나도 올리기 전에 꼭 확인할게. 안전 공유 방패를 줄게! 🛡️'], ['jelly', '등대의 탐험대장님이 마지막 시험을 준비했대!']],
  };

  function talkCaptain() {
    const p = prof();
    if (!p.introDone) {
      return say([
        ['captain', '어서 와요, {nick} 대원! 나는 AI 탐험대의 탐험대장이에요.'],
        ['captain', '요즘은 AI가 진짜 같은 사진과 영상도 만들 수 있어요. 그래서 진짜처럼 보여도 한 번 더 확인하는 힘이 필요해요.'],
        ['captain', '우리 탐험대의 세 가지 약속을 기억하나요? 지난 시간에 포스터로 만들었던 바로 그 약속이에요!'],
      ], () => {
        mode = 'quiz';
        Missions.open('intro', {
          nick: p.nick, sfx,
          onFinish: () => {
            mode = 'play'; p.introDone = true; save(); updateHud();
            say([
              ['captain', '좋아요! 이제 직접 실천해 볼 시간이에요. 섬의 네 곳을 돌며 친구들을 돕고 배지를 모아요.'],
              ['captain', '먼저 왼쪽 아래 \'신기한 영상 해변\'의 문어 박사를 찾아가 봐요. 노란 화살표를 따라가면 돼요!'],
            ], () => toast('방향키·WASD 또는 화면을 눌러 이동해요. 친구 가까이에서 E 키나 💬 버튼으로 이야기해요.'));
          },
          onClose: () => { mode = 'play'; },
        });
      });
    }
    if (doneCount() === 5) return say(DONE_LINES.m5, () => showCert());
    const open = ['m1', 'm2', 'm3', 'm4'].filter((id) => !p.missions[id].done);
    if (open.length) {
      const id = open[0];
      return say([['captain', `잘하고 있어요! 지금 모은 배지는 ${4 - open.length}개예요.`], ['captain', `다음은 '${MISSION_INFO[id].title}'의 ${MISSION_INFO[id].who}을(를) 만나 봐요. 노란 화살표를 따라가요!`]]);
    }
    say(INTRO_LINES.m5, () => startMission('m5'));
  }

  // ================= 미션 =================
  function startMission(id) {
    const p = prof(); mode = 'quiz';
    const rec = p.missions[id];
    Missions.open(id, {
      nick: p.nick, sfx,
      onWrong: () => { rec.wrong++; save(); },
      onFinish: (r) => {
        rec.done = true; rec.secs = Math.round(r.secs); rec.doneAt = Date.now();
        if (id === 'm5') p.finishedAt = Date.now();
        save(); updateHud(); sendResult();
        hero.emote = 'clap'; hero.emoteT = 2.5;
        showBadge(id, () => {
          mode = 'play';
          if (id === 'm5') return ending();
          say(AFTER_LINES[id]);
        });
      },
      onClose: () => { mode = 'play'; },
    });
  }
  const BADGE_NAME = { m1: '탐정 돋보기', m2: '질문 조개', m3: '비교 책갈피', m4: '안전 공유 방패', m5: 'AI 탐험대 인증 메달' };
  const BADGE_MSG = {
    m1: '진짜처럼 보이는 영상도 한 번 더 확인할 수 있어요!',
    m2: '혼자 판단하기 어려우면 믿을 만한 어른에게 물어봐요!',
    m3: '누가 만든 정보인지 확인하고, 공식 자료와 비교할 수 있어요!',
    m4: '사진을 올리기 전에 친구 얼굴과 개인정보를 확인해요!',
    m5: '멈춰요 · 물어봐요 · 다시 찾아봐요를 모두 해냈어요!',
  };
  function showBadge(id, cb) {
    mode = 'quiz';
    $('badgePic').src = PX.url('badge', id, 8);
    $('badgeName').textContent = BADGE_NAME[id];
    $('badgeMsg').textContent = BADGE_MSG[id];
    $('badgeCount').textContent = `배지 ${doneCount()} / 5`;
    $('badgeSeal').src = PX.url('hero', 'clap', 5);
    $('badgeModal').hidden = false;
    sfx.badge(); confetti();
    const btn = $('badgeOk');
    btn.onclick = () => { $('badgeModal').hidden = true; cb && cb(); };
    setTimeout(() => btn.focus(), 50);
  }
  function ending() {
    say([['captain', '축하해요! 이제 {nick} 대원은 정보를 한 번 더 확인하는 멋진 AI 탐험대원이 되었어요!', 'happy']], () => {
      mode = 'quiz';
      $('finale').hidden = false; confetti();
      $('finaleSeal').src = PX.url('hero', 'clap', 6);
      $('finaleOk').onclick = () => { $('finale').hidden = true; showCert(); };
    });
  }

  // ================= 인증서 =================
  function fmtTime(sec) { sec = Math.round(sec); const m = Math.floor(sec / 60), s = sec % 60; return m ? `${m}분 ${s}초` : `${s}초`; }
  function resultCode(p) {
    const o = { n: p.nick, m: MISSIONS.map((id) => (p.missions[id].done ? 1 : 0)).join(''), w: MISSIONS.map((id) => Math.min(99, p.missions[id].wrong)).join('.'), s: Math.round(p.playSecs), f: p.finishedAt || 0 };
    return 'AIX1-' + btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, '');
  }
  function showCert() {
    const p = prof(); mode = 'quiz';
    $('certSeal').src = PX.url('hero', 'happy', 7);
    $('certCaptain').src = PX.url('captain', 'idle', 5);
    $('certName').textContent = p.nick;
    const d = new Date(p.finishedAt || Date.now());
    $('certDate').textContent = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    const st = $('certStamps'); st.innerHTML = '';
    for (const id of MISSIONS) {
      const el = document.createElement('div'); el.className = 'stamp';
      el.innerHTML = `<img alt="" src="${PX.url('badge', id, 4)}"><b>${MISSION_INFO[id].title}</b><span>완료 ✔</span>`;
      st.appendChild(el);
    }
    const wrong = MISSIONS.reduce((a, id) => a + p.missions[id].wrong, 0);
    $('certStats').textContent = `다섯 가지 활동 모두 완료 · 다시 도전 ${wrong}번 · 플레이 시간 ${fmtTime(p.playSecs)}`;
    $('certCode').textContent = resultCode(p);
    $('certCodeBox').hidden = true;
    $('cert').hidden = false;
  }
  $('certPrint').onclick = () => window.print();
  $('certShowCode').onclick = () => { $('certCodeBox').hidden = !$('certCodeBox').hidden; };
  $('certClose').onclick = () => { $('cert').hidden = true; mode = 'play'; };
  $('certRestart').onclick = () => confirmRestart();

  // ================= (선택) 교사용 결과 전송 =================
  function sendResult() {
    const url = CFG.RESULT_ENDPOINT; const p = prof();
    if (!url || !p) return;   // 기본값: 보내지 않음
    const body = { game: 'ai-explorers', nick: p.nick, missions: Object.fromEntries(MISSIONS.map((id) => [id, { done: p.missions[id].done, wrong: p.missions[id].wrong, secs: p.missions[id].secs }])), allDone: doneCount() === 5, playSecs: Math.round(p.playSecs), finishedAt: p.finishedAt ? new Date(p.finishedAt).toISOString() : '' };
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
  function prepWater() {
    for (let ty = 0; ty < World.MH; ty++) for (let tx = 0; tx < World.MW; tx++) {
      const c = World.classify(tx + 0.5, ty + 0.5);
      if (c === 'W' || c === 'w') waterTiles.push([tx, ty, World.hash(tx, ty, 11), World.hash(tx, ty, 12)]);
    }
  }
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#7cc6df'; ctx.fillRect(0, 0, cv.width, cv.height);
    const cx = Math.round(cam.x), cy = Math.round(cam.y);
    const P = (v) => Math.round(v) * S;   // 월드 픽셀 → 화면
    // 바닥
    const sx = Math.max(0, cx), sy = Math.max(0, cy), ex = Math.min(World.WPX, cx + Math.ceil(VW) + 1), ey = Math.min(World.HPX, cy + Math.ceil(VH) + 1);
    if (ex > sx && ey > sy) ctx.drawImage(World.ground, sx, sy, ex - sx, ey - sy, (sx - cx) * S, (sy - cy) * S, (ex - sx) * S, (ey - sy) * S);
    // 물결
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (const [tx, ty, h1, h2] of waterTiles) {
      const wx = tx * T, wy = ty * T;
      if (wx + T < cx || wy + T < cy || wx > cx + VW || wy > cy + VH) continue;
      const ph = (time * 0.7 + h1 * 6) % 3;
      if (ph > 1.6) continue;
      const len = ph < 0.8 ? Math.round(ph * 6) + 2 : Math.round((1.6 - ph) * 6) + 2;
      ctx.fillRect(P(wx + 3 + h2 * 8 - cx), P(wy + 4 + h1 * 9 - cy), len * S, S);
    }
    // 그릴 것 모으기 (아래쪽에 있는 것을 나중에)
    const list = [];
    for (const p of World.PROPS) list.push({ y: p.y, draw: () => drawProp(p, cx, cy) });
    for (const s of World.SIGNS) list.push({ y: s.y, draw: () => drawSign(s, cx, cy) });
    for (const n of NPCS) list.push({ y: n.y, draw: () => drawNpc(n, cx, cy) });
    list.push({ y: hero.y, draw: () => drawHero(cx, cy) });
    list.sort((a, b) => a.y - b.y);
    for (const d of list) d.draw();
    // 탭한 곳 표시
    if (tapMark) { tapMark.t += 1 / 60; const r = 3 + tapMark.t * 10; ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, 1 - tapMark.t * 2)})`; ctx.lineWidth = S; ctx.beginPath(); ctx.ellipse(P(tapMark.x - cx), P(tapMark.y - cy), r * S, r * 0.55 * S, 0, 0, Math.PI * 2); ctx.stroke(); if (tapMark.t > 0.6) tapMark = null; }
    // 이름표·표시
    for (const n of NPCS) drawNpcLabel(n, cx, cy);
    drawGuide(cx, cy);
  }
  function shadow(x, y, w) { ctx.fillStyle = 'rgba(38,52,79,0.18)'; ctx.beginPath(); ctx.ellipse(x * S, y * S, w * S, w * 0.32 * S, 0, 0, Math.PI * 2); ctx.fill(); }
  function drawProp(p, cx, cy) {
    let img = World.artOf(p.art), bob = 0;
    if (p.bob) bob = Math.round(Math.sin(time * 1.6) * 1.2);
    const x = Math.round(p.x - img.width / 2 - cx), y = Math.round(p.y - img.height - cy + bob);
    if (x > VW || y > VH || x + img.width < 0 || y + img.height < 0) return;
    ctx.drawImage(img, x * S, y * S, img.width * S, img.height * S);
    if (p.anim === 'screen') {
      // 해변 극장 화면: 영상이 재생 중인 모습
      const ix = x + 7, iy = y + 7, f = Math.floor(time * 2) % 4;
      const cols = ['#ffd84a', '#7ad7a0', '#ff8a80', '#5fb4ff'];
      ctx.fillStyle = '#2c3f66'; ctx.fillRect(ix * S, iy * S, 74 * S, 38 * S);
      ctx.fillStyle = cols[f]; ctx.fillRect((ix + 4) * S, (iy + 30) * S, (16 + f * 14) * S, 3 * S);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 9; i++) ctx.fillRect((ix + 31) * S, (iy + 9 + i) * S, (i < 5 ? i + 1 : 9 - i) * 1.4 * S, S);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect((ix + 2) * S, (iy + 2) * S, 20 * S, 3 * S);
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
    // 글자는 판보다 커도 읽기 쉽게 (선명한 화면 글씨)
    const fs = 6.2 * S;
    ctx.font = `${fs}px Jua, "Gowun Dodum", sans-serif`;
    const label = s.icon + ' ' + s.text, tw = ctx.measureText(label).width;
    const bw = Math.max(img.width * S - 4 * S, tw + 8 * S), bx = (x + img.width / 2) * S - bw / 2, by = (y + 2) * S;
    ctx.fillStyle = '#26344f'; roundRect(bx - S, by - S, bw + 2 * S, 15 * S + 2 * S, 3 * S); ctx.fill();
    ctx.fillStyle = '#fbe6c4'; roundRect(bx, by, bw, 15 * S, 3 * S); ctx.fill();
    ctx.fillStyle = '#26344f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, (x + img.width / 2) * S, by + 7.8 * S);
  }
  function npcFrame(n) {
    const ph = (time + n.x * 0.01) % 4;
    if (ph > 3.82) return 'blink';
    if (n.float || n.id === 'octopus') return Math.floor((time + n.x * 0.003) * 2) % 2 ? 'walk1' : 'idle';
    return 'idle';
  }
  function drawNpc(n, cx, cy) {
    const fr = npcFrame(n);
    let face = n.face || 1;
    if (dist(hero, n) < 60 && (n.id === 'captain' || n.id === 'turtle' || n.id === 'fish')) face = hero.x < n.x ? -1 : 1;
    const img = face < 0 ? PX.flipped(n.spr, fr) : PX.sprite(n.spr, fr);
    const lift = (n.lift || 0) + (n.float ? Math.round(Math.sin(time * 2 + n.x) * 2) : (fr === 'walk1' ? 0 : 0));
    const x = Math.round(n.x - img.width / 2 - cx), y = Math.round(n.y - img.height - cy - lift);
    if (x > VW || y > VH + 40 || x + img.width < 0) return;
    if (!n.float) shadow(n.x - cx, n.y - cy - 1, img.width * 0.38);
    ctx.drawImage(img, x * S, y * S, img.width * S, img.height * S);
  }
  function drawHero(cx, cy) {
    let fr = 'idle';
    if (hero.emoteT > 0) fr = hero.emote;
    else if (hero.moving) fr = Math.floor(hero.anim / 0.16) % 2 ? 'walk1' : 'walk2';
    else if ((time % 3.4) > 3.25) fr = 'blink';
    const img = hero.face < 0 ? PX.flipped('hero', fr) : PX.sprite('hero', fr);
    const x = Math.round(hero.x - img.width / 2 - cx), y = Math.round(hero.y - img.height + 2 - cy);
    shadow(hero.x - cx, hero.y - cy - 1, 12);
    ctx.drawImage(img, x * S, y * S, img.width * S, img.height * S);
  }
  function drawNpcLabel(n, cx, cy) {
    const p = prof(); if (!p) return;
    const sp = PX.sprite(n.spr);
    const top = n.y - sp.height - (n.lift || 0) - 3 - cy, mx = n.x - cx;
    if (mx < -60 || mx > VW + 60 || top > VH || top < -40) return;
    const near = dist(hero, n) < 80;
    const done = n.mission && p.missions[n.mission].done;
    const fs = 5.6 * S;
    ctx.font = `${fs}px Jua, "Gowun Dodum", sans-serif`;
    const label = (near ? n.icon + ' ' + n.name : n.icon + ' ' + n.short) + (done ? ' ✔' : '');
    const tw = ctx.measureText(label).width, bw = tw + 8 * S, bh = 10 * S;
    const bx = mx * S - bw / 2, by = (top - 12) * S;
    ctx.fillStyle = done ? 'rgba(220,245,232,0.95)' : 'rgba(255,255,255,0.93)';
    roundRect(bx, by, bw, bh, 5 * S); ctx.fill();
    ctx.strokeStyle = '#26344f'; ctx.lineWidth = Math.max(1, S * 0.7); ctx.stroke();
    ctx.fillStyle = '#26344f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, mx * S, by + bh / 2 + S * 0.4);
  }
  function drawGuide(cx, cy) {
    const t = nextTarget(); if (!t || mode === 'title') return;
    const sp = PX.sprite(t.spr);
    const ax = t.x - cx, ay = t.y - sp.height - (t.lift || 0) - 18 - cy + Math.sin(time * 5) * 2.5;
    const on = ax > 8 && ax < VW - 8 && ay > 6 && ay < VH - 10;
    if (on) {
      // 머리 위 노란 화살표
      ctx.fillStyle = '#26344f';
      ctx.beginPath(); ctx.moveTo((ax - 7) * S, (ay - 6) * S); ctx.lineTo((ax + 7) * S, (ay - 6) * S); ctx.lineTo(ax * S, (ay + 3) * S); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd84a';
      ctx.beginPath(); ctx.moveTo((ax - 5) * S, (ay - 5) * S); ctx.lineTo((ax + 5) * S, (ay - 5) * S); ctx.lineTo(ax * S, (ay + 1) * S); ctx.closePath(); ctx.fill();
    } else {
      // 화면 가장자리 방향 표시
      const hx = hero.x - cx, hy = hero.y - cy - 12;
      const ang = Math.atan2(t.y - hero.y, t.x - hero.x);
      const r = Math.min(VW, VH) * 0.5 - 22;
      let px = VW / 2 + Math.cos(ang) * (VW / 2 - 18), py = VH / 2 + Math.sin(ang) * (VH / 2 - 18);
      px = Math.max(16, Math.min(VW - 16, px)); py = Math.max(30, Math.min(VH - 16, py));
      void hx; void hy; void r;
      const pulse = 1 + Math.sin(time * 6) * 0.08;
      ctx.save(); ctx.translate(px * S, py * S); ctx.rotate(ang); ctx.scale(pulse, pulse);
      ctx.fillStyle = '#26344f'; ctx.beginPath(); ctx.moveTo(11 * S, 0); ctx.lineTo(-7 * S, -9 * S); ctx.lineTo(-3 * S, 0); ctx.lineTo(-7 * S, 9 * S); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(8.5 * S, 0); ctx.lineTo(-5 * S, -6.5 * S); ctx.lineTo(-1.8 * S, 0); ctx.lineTo(-5 * S, 6.5 * S); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  // ================= 반복 =================
  let last = performance.now(), saveTimer = 0;
  const dpadEl = $('dpad');
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    if (mode === 'play') moveHero(dt);
    if (hero.emoteT > 0) hero.emoteT -= dt;
    const p = prof();
    if (p && mode !== 'title' && !document.hidden) {
      p.playSecs += dt; saveTimer += dt;
      if (saveTimer > 4) { saveTimer = 0; p.pos = [Math.round(hero.x), Math.round(hero.y)]; save(); }
    }
    const [tx, ty] = camTarget();
    const k = 1 - Math.pow(0.0015, dt);
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
    if (mode !== 'title') render();
    // 대화 글자 하나씩
    if (dlg && !dlg.full) { dlg.shown += dt * 38; const n = Math.floor(dlg.shown); if (n >= dlg.text.length) { dlg.full = true; $('dlgText').textContent = dlg.text; } else $('dlgText').textContent = dlg.text.slice(0, n); }
    // 지도를 움직일 때만 방향키를 보여 줘요
    dpadEl.classList.toggle('off', mode !== 'play');
    if (mode !== 'play') $('talkBtn').hidden = true;
    // 대화 버튼
    if (mode === 'play') {
      const n = nearNpc(); const b = $('talkBtn');
      if (n) { b.hidden = false; b.querySelector('span').textContent = `${n.icon} ${n.short}에게 말 걸기`; b.onclick = () => interact(n); }
      else b.hidden = true;
    }
    requestAnimationFrame(loop);
  }

  // ================= 시작 화면 · 별명 =================
  const SUGGEST = ['반짝 바다표범', '용감한 파도', '똑똑 조개', '방울 탐정', '별빛 대원', '푸른 등대', '몽글 해초', '씩씩 물개'];
  function showTitle() {
    mode = 'title';
    $('title').hidden = false; $('nameScreen').hidden = true;
    $('titleSeal').src = PX.url('hero', 'happy', 8);
    $('titleCaptain').src = PX.url('captain', 'idle', 6);
    const list = $('continueList'); list.innerHTML = '';
    const players = Object.values(store.players).sort((a, b) => (b.lastAt || b.createdAt) - (a.lastAt || a.createdAt)).slice(0, 8);
    $('continueWrap').hidden = !players.length;
    for (const p of players) {
      const b = document.createElement('button'); b.className = 'cbtn';
      const n = doneCount(p);
      b.innerHTML = `<span class="cn"></span><span class="cs">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;
      b.querySelector('.cn').textContent = p.nick;
      b.onclick = () => startAs(p.nick);
      list.appendChild(b);
    }
  }
  $('btnNew').onclick = () => {
    $('title').hidden = true; $('nameScreen').hidden = false;
    $('nameSeal').src = PX.url('hero', 'idle', 6);
    const sg = $('suggest'); sg.innerHTML = '';
    for (const s of SUGGEST) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = s; b.onclick = () => { $('nickInput').value = s; $('nameErr').textContent = ''; }; sg.appendChild(b); }
    $('nickInput').value = ''; $('nameErr').textContent = '';
    setTimeout(() => $('nickInput').focus(), 60);
  };
  $('nameBack').onclick = showTitle;
  $('nameForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const nick = $('nickInput').value.replace(/\s+/g, ' ').trim().slice(0, 10);
    if (!nick) { $('nameErr').textContent = '별명을 적거나 아래에서 골라 주세요.'; return; }
    if (store.players[nick]) {
      if (!window.confirm(`'${nick}' 기록이 이미 있어요. 이어서 할까요?\n(취소를 누르면 다른 별명을 고를 수 있어요)`)) return;
    } else store.players[nick] = newProfile(nick);
    startAs(nick);
  });
  function startAs(nick) {
    store.current = nick; const p = prof(); p.lastAt = Date.now(); save();
    $('title').hidden = true; $('nameScreen').hidden = true;
    $('hud').hidden = false; $('dpad').hidden = false;
    if (p.pos && canStand(p.pos[0], p.pos[1])) { hero.x = p.pos[0]; hero.y = p.pos[1]; } else { hero.x = 22.6 * T; hero.y = 16.4 * T; }
    hero.face = 1;
    const [tx, ty] = camTarget(); cam.x = tx; cam.y = ty;
    mode = 'play'; updateHud();
    if (memoryOnly) toast('이 기기에서는 저장이 안 될 수 있어요. 끝까지 한 번에 해 주세요.');
    if (!p.introDone) setTimeout(() => { if (mode === 'play') talkCaptain(); }, 500);
    else if (doneCount() === 5) toast('모든 미션을 완료했어요! 등대의 탐험대장에게 가면 인증서를 다시 볼 수 있어요.');
    else toast(`다시 만나서 반가워요, ${p.nick} 대원! 노란 화살표를 따라가요.`, 3500);
  }

  // ================= 메뉴 · 도움말 =================
  $('btnMenu').onclick = () => { if (mode === 'dialog') return; mode = 'quiz'; $('menu').hidden = false; $('menuName').textContent = prof() ? prof().nick + ' 대원' : ''; };
  $('menuClose').onclick = () => { $('menu').hidden = true; mode = 'play'; };
  $('menuPromise').onclick = () => { $('menu').hidden = true; Missions.open('intro', { nick: prof().nick, sfx, review: true, onFinish: () => { mode = 'play'; }, onClose: () => { mode = 'play'; } }); };
  $('menuCert').onclick = () => { $('menu').hidden = true; if (doneCount() === 5) showCert(); else { mode = 'play'; toast(`인증서는 다섯 가지 활동을 모두 마치면 받을 수 있어요. (지금 ${doneCount()} / 5)`); } };
  $('menuRestart').onclick = () => { $('menu').hidden = true; confirmRestart(); };
  $('menuSwitch').onclick = () => { $('menu').hidden = true; const p = prof(); if (p) { p.pos = [Math.round(hero.x), Math.round(hero.y)]; save(); } $('hud').hidden = true; $('dpad').hidden = true; $('talkBtn').hidden = true; showTitle(); };
  function confirmRestart() {
    const p = prof(); if (!p) return;
    if (!window.confirm(`'${p.nick}' 대원의 기록을 지우고 처음부터 다시 할까요?`)) { if (!$('cert').hidden) return; mode = 'play'; return; }
    store.players[p.nick] = newProfile(p.nick); save();
    $('cert').hidden = true; startAs(p.nick);
  }
  $('btnHelp').onclick = () => { if (mode === 'dialog') return; mode = 'quiz'; $('help').hidden = false; };
  $('helpClose').onclick = () => { $('help').hidden = true; mode = 'play'; };
  function syncSound() { $('btnSound').textContent = settings.sound ? '🔊' : '🔇'; $('btnSound').setAttribute('aria-label', settings.sound ? '소리 끄기' : '소리 켜기'); }
  $('btnSound').onclick = () => { settings.sound = !settings.sound; saveSettings(); syncSound(); sfx.pick(); };

  // ================= 화면 방향 =================
  let rotateDismissed = false;
  function checkOrientation() {
    const portrait = window.innerHeight > window.innerWidth * 1.05;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    $('rotateHint').hidden = !(portrait && touch && !rotateDismissed);
  }
  $('rotateOk').onclick = () => { rotateDismissed = true; checkOrientation(); };

  // 태블릿 확대·스크롤 막기
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => { if (!e.target.closest('input')) e.preventDefault(); });
  document.addEventListener('touchmove', (e) => { if (!e.target.closest('.scroll')) e.preventDefault(); }, { passive: false });
  window.addEventListener('pagehide', () => { const p = prof(); if (p && mode !== 'title') { p.pos = [Math.round(hero.x), Math.round(hero.y)]; save(); } });

  // ================= 시작 =================
  World.init();
  for (const n of NPCS) if (!n.noBlock) World.blockRect(Math.floor(n.x / T), Math.floor((n.y - 2) / T), 1, 1);   // 친구가 서 있는 칸은 지나갈 수 없어요
  prepWater();
  window.addEventListener('resize', resize);
  resize(); syncSound();
  showTitle();
  requestAnimationFrame(loop);

  // 테스트·교사 화면에서 쓰는 정보
  // 친구를 눌렀을 때와 같은 방식으로 걸어가기 (자동 테스트용)
  function walkToNpc(id) { const n = NPC[id]; const g = approachPoint(n); hero.path = World.findPath(hero.x, hero.y, g[0], g[1]); hero.pending = n; return hero.path.length; }
  window.AIX = { get store() { return store; }, prof, hero, NPC, interact, nearNpc, walkToNpc, get mode() { return mode; }, fmtTime, resultCode };
})();
