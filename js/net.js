// 실시간 함께 탐험 (PeerJS · WebRTC)
//
// 방 찾기 방식: PeerJS 공용 연결 서버에는 '방 목록'이나 '방 검색' 기능이 없어요.
// 그래서 방 코드로 항상 같은 '방장 아이디'를 만들어요. (예: 바다 → aiexplorers-v2-r ebb094eb8ba4)
//  1) 들어오는 사람은 먼저 그 방장 아이디로 등록해 봐요. 성공하면 내가 방장이에요.
//  2) 'unavailable-id'(이미 누가 쓰는 중)가 오면 방장이 있다는 뜻 → 손님 아이디를 받아 방장에게 연결해요.
//  3) 방장은 0.2초마다 모두의 위치·이름·착용 아이템을 손님 모두에게 보내요. (별 모양 연결)
//  4) 방장이 나가면 손님들이 신호가 끊긴 것을 알아차리고, 다시 1)부터 해서 새 방장이 생겨요.
// 판다 탐험대(pandagrad12-…)와 아이디 앞부분이 달라서 방이 섞이지 않아요.
//
// 몸 색 정하기: 각자 브라우저가 고른 색만으로는 같은 방에서 겹치지 않는다고 보장할 수 없어요.
// 그래서 방장이 정해요. 학생은 '원하는 색'(저장된 내 색)을 보내고, 방장은
//  - 방 안에서 아무도 안 쓰는 색이면 그대로 허락하고,
//  - 이미 누가 쓰고 있으면 구분하기 쉬운 순서(ASSIGN)에서 빈 색을 골라 줘요.
//  - 14색을 모두 쓰고 있으면(15명 이상) 원래 색을 그대로 둬요. (같은 색이 생기지만 이름표로 구분)
//  - 잠깐 나간 학생(새로고침)의 색은 60초 동안 맡아 둬서, 돌아오면 같은 색을 다시 받아요.
//  - 한 번 허락받은 색은 그 학생이 있는 동안 바꾸지 않아요. (누가 나가도 다른 학생 색이 바뀌지 않게)
// 방장은 메시지를 하나씩 차례로 처리하므로 두 명이 동시에 들어와도 먼저 도착한 학생이 그 색을 가져요.
// 학생은 받은 색을 저장해서, 새로고침·재접속해도 같은 색을 다시 원하게 돼요.
(function () {
  'use strict';
  const CFG = window.AIX_CONFIG || {};
  const PREFIX = 'aiexplorers-v2-r';
  const N = { status: 'off', peer: null, host: false, conn: null, conns: new Map(), room: '', hostId: '', others: new Map(), tries: 0, sendT: 0, lastSent: '', lastAt: 0, lastRx: 0, timer: 0, retryT: 0, log: [], mine: null, onChange: null, why: '' };
  const log = (m) => { N.log.push(`${(performance.now() / 1000).toFixed(1)}s ${m}`); if (N.log.length > 60) N.log.shift(); };
  const clean = (s) => String(s || '').normalize('NFC').replace(/\s+/g, '').replace(/[^0-9A-Za-z가-힣]/g, '').toUpperCase().slice(0, 12);
  const roomKey = (room) => Array.from(new TextEncoder().encode(room), (b) => b.toString(16).padStart(2, '0')).join('');
  const changed = () => { if (N.onChange) N.onChange(); };
  const ASSIGN = ['sky', 'blossom', 'vanilla', 'mint', 'lilac', 'apricot', 'aqua', 'coral', 'sage', 'cloud', 'orchid', 'lime', 'lavblue', 'cream'];
  const validColor = (c) => typeof c === 'string' && !!(window.PX && PX.COLOR_BY_ID[c]);
  // 방장: id 학생에게 줄 색 (원하는 색 want)
  const reserved = new Map();   // 잠깐 나간 학생의 색을 60초 동안 맡아 둬요 (익명 아이디 u → { c, t })
  function reserve(o) { if (o && o.u && o.c) reserved.set(o.u, { c: o.c, t: performance.now() }); }
  function grant(id, want, uid) {
    const cur = N.others.get(id);
    if (cur && cur.c && cur.c === want) return want;   // 이미 허락받은 색은 계속 그 학생 색이에요 (다른 학생이 나가도 바꾸지 않아요)
    const used = new Map(), add = (c) => { if (c) used.set(c, (used.get(c) || 0) + 1); };
    add(N.mine().c);
    const present = new Set();
    for (const [oid, o] of N.others) if (oid !== id && !(uid && o.u === uid)) { add(o.c); if (o.u) present.add(o.u); }
    const now = performance.now();
    for (const [u, r] of [...reserved]) { if (now - r.t > 60000) { reserved.delete(u); continue; } if (u !== uid && !present.has(u)) add(r.c); }
    if (validColor(want) && !used.has(want)) return want;              // 아무도 안 쓰는 색 → 그대로
    const free = ASSIGN.find((c) => !used.has(c));
    if (free) return free;                                              // 겹치면 구분하기 쉬운 빈 색
    if (validColor(want)) return want;                                  // 14색을 다 쓰는 중(15명 이상) → 바꿔도 겹쳐서 그대로 (이름표로 구분)
    let best = ASSIGN[0], bc = Infinity; for (const c of ASSIGN) { const n = used.get(c) || 0; if (n < bc) { bc = n; best = c; } }
    return best;
  }

  // 연결 서버: 기본은 PeerJS 공용 서버. (테스트용 ?peer=localhost:9000, 또는 config.js 의 PEER_SERVER)
  function peerOptions() {
    const o = { debug: 0 };
    let srv = CFG.PEER_SERVER || null;
    try { const q = new URLSearchParams(location.search).get('peer'); if (q && /^(localhost|127\.0\.0\.1):\d{2,5}$/.test(q)) { const [h, p] = q.split(':'); srv = { host: h, port: +p, path: '/', secure: false }; } } catch (e) { }
    if (srv) Object.assign(o, srv);
    return o;
  }
  function loadLib() {
    if (window.Peer) return Promise.resolve();
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/peerjs-1.5.4.min.js'; s.onload = () => (window.Peer ? res() : rej(new Error('nolib'))); s.onerror = () => rej(new Error('nolib')); document.head.appendChild(s); });
  }

  async function start(room, mine, onChange, onColor) {
    leave();
    N.room = clean(room) || '바다'; N.hostId = PREFIX + roomKey(N.room); N.mine = mine; N.onChange = onChange; N.onColor = onColor;
    N.status = 'connecting'; N.tries = 0; N.why = ''; changed();
    try { await loadLib(); } catch (e) { fail('연결 프로그램을 불러오지 못했어요.'); return; }
    clearTimeout(N.timer); N.timer = setTimeout(() => { if (N.status === 'connecting') fail('시간 안에 연결되지 않았어요.'); }, 15000);
    tryHost();
  }
  function destroy() {
    const p = N.peer; N.peer = null; N.conn = null; N.host = false;
    for (const c of N.conns.values()) { try { c.close(); } catch (e) { } }
    N.conns.clear(); try { if (p) p.destroy(); } catch (e) { }
  }
  function tryHost() {
    destroy(); log('try host');
    let p; try { p = new window.Peer(N.hostId, peerOptions()); } catch (e) { fail('연결을 시작하지 못했어요.'); return; }
    N.peer = p;
    p.on('open', () => { if (N.peer !== p) return; N.host = true; log('I am host'); online(); });
    p.on('connection', (c) => { if (!N.host || N.peer !== p) return; hostConn(c); });
    p.on('error', (err) => {
      if (N.peer !== p) return;
      log('host err ' + (err && err.type));
      if (err && err.type === 'unavailable-id') { joinClient(); return; }   // 방장이 이미 있어요 → 손님으로
      netErr(err);
    });
    p.on('disconnected', () => { if (N.peer === p && N.status === 'on') { try { p.reconnect(); } catch (e) { } } });
  }
  function joinClient() {
    destroy(); log('join client');
    let p; try { p = new window.Peer(undefined, peerOptions()); } catch (e) { fail('연결을 시작하지 못했어요.'); return; }
    N.peer = p;
    p.on('open', () => {
      if (N.peer !== p) return;
      const c = p.connect(N.hostId, { serialization: 'json', reliable: false }); N.conn = c;
      setTimeout(() => { if (N.conn === c && !c.open) { log('conn timeout'); lost(); } }, 6000);
      c.on('open', () => { if (N.conn === c) online(); });
      c.on('data', (d) => { if (N.conn === c) apply(d); });
      c.on('close', () => { log('conn close'); if (N.conn === c) lost(); });
      c.on('error', () => { if (N.conn === c) lost(); });
    });
    p.on('error', (err) => { if (N.peer !== p) return; log('client err ' + (err && err.type)); if (err && err.type === 'peer-unavailable') { lost(); return; } netErr(err); });
    p.on('disconnected', () => { if (N.peer === p && N.status === 'on') { try { p.reconnect(); } catch (e) { } } });
  }
  function hostConn(c) {
    if (N.conns.size >= 30) { try { c.close(); } catch (e) { } return; }
    N.conns.set(c.peer, c);
    c.on('data', (d) => {
      const s = state(d); if (!s) return;
      // 새로고침한 학생: 같은 익명 아이디(u)로 남아 있던 예전 연결(유령)을 바로 지워요 → 인원·색이 겹치지 않아요
      if (s.u) reserved.delete(s.u);
      if (s.u) for (const [oid, o] of [...N.others]) if (oid !== c.peer && o.u === s.u) { N.others.delete(oid); const oc = N.conns.get(oid); N.conns.delete(oid); try { if (oc) oc.close(); } catch (e) { } changed(); }
      s.c = grant(c.peer, s.c, s.u); upsert(c.peer, s);
    });
    const bye = () => { reserve(N.others.get(c.peer)); N.conns.delete(c.peer); N.others.delete(c.peer); changed(); };
    c.on('close', bye); c.on('error', bye);
  }
  function online() { N.lastRx = performance.now(); clearTimeout(N.timer); N.status = 'on'; N.tries = 0; N.lastSent = ''; N.sendT = 0; changed(); }
  function fail(why) { clearTimeout(N.timer); clearTimeout(N.retryT); destroy(); N.status = 'fail'; N.why = why; N.others.clear(); changed(); }
  function netErr(err) {
    const t = String((err && err.type) || '알 수 없음').replace(/[^a-z-]/gi, '');
    if (N.status === 'connecting') fail(`친구들과 연결하지 못했어요. (오류: ${t})`); else lost();
  }
  // 연결이 끊겼어요 → 잠깐 뒤 다시 (방장을 이어받거나 새 방장에게 연결). 그동안 미니게임은 계속돼요.
  function lost() {
    if (N.status === 'off' || N.status === 'fail') return;
    if (N.status === 'connecting') { clearTimeout(N.retryT); N.retryT = setTimeout(() => { if (N.status === 'connecting') tryHost(); }, 400 + Math.random() * 1200); return; }
    N.status = 'retry'; N.others.clear(); changed();
    if (++N.tries > 12) { destroy(); N.status = 'fail'; N.why = '친구들과 연결이 끊겼어요.'; changed(); return; }
    clearTimeout(N.timer); N.timer = setTimeout(() => { if (N.status === 'retry') tryHost(); }, 500 + Math.random() * 2000);
  }
  function leave() { clearTimeout(N.timer); clearTimeout(N.retryT); destroy(); N.others.clear(); N.status = 'off'; changed(); }

  // 받은 상태 검사 (모르는 값은 버려요)
  function state(d) {
    if (!d || typeof d !== 'object') return null;
    const x = Number(d.x), y = Number(d.y); if (!isFinite(x) || !isFinite(y)) return null;
    return {
      n: String(d.n || '').replace(/[<>&"'\u0000-\u001f]/g, '').slice(0, 10) || '친구',
      x: Math.max(0, Math.min(2000, x)), y: Math.max(0, Math.min(2000, y)),
      f: d.f < 0 ? -1 : 1, m: !!d.m, q: !!d.q, e: typeof d.e === 'string' && /^(happy|clap|think)$/.test(d.e) ? d.e : '',
      w: window.Shop ? Shop.cleanWear(d.w) : {}, b: Math.max(0, Math.min(6, Number(d.b) || 0)),
      c: validColor(d.c) ? d.c : '',
      u: typeof d.u === 'string' && /^[a-z0-9]{6,16}$/.test(d.u) ? d.u : '',
    };
  }
  function upsert(id, s) {
    let o = N.others.get(id);
    if (!o) { o = { rx: s.x, ry: s.y }; N.others.set(id, o); changed(); }
    Object.assign(o, s, { seen: performance.now() });
  }
  function apply(d) {   // 손님: 방장이 보낸 모두의 상태
    if (!d || d.t !== 'all' || !Array.isArray(d.p)) return;
    N.lastRx = performance.now();
    const myId = N.peer && N.peer.id, seen = new Set();
    for (const it of d.p.slice(0, 40)) {
      if (it && it.id === myId) { if (validColor(it.c) && it.c !== N.mine().c && N.onColor) N.onColor(it.c); continue; }   // 방장이 정해 준 내 색
      if (!it) continue; const s = state(it); if (s && s.u && s.u === N.mine().u) continue; /* 방장 쪽에 잠깐 남은 내 예전 연결 */ if (s) { upsert(String(it.id).slice(0, 64), s); seen.add(String(it.id).slice(0, 64)); } }
    let gone = false; for (const id of [...N.others.keys()]) if (!seen.has(id)) { N.others.delete(id); gone = true; }
    if (gone) changed();
  }
  // 0.2초마다 (바뀌었을 때만, 아니면 1초마다) 보내요
  function tick(dt) {
    if (N.status !== 'on' || !N.peer) return;
    N.sendT -= dt; if (N.sendT > 0) return; N.sendT = 0.2;
    const mine = N.mine(), js = JSON.stringify(mine), now = performance.now();
    if (N.host) {
      for (const [id, o] of N.others) if (now - (o.seen || 0) > 8000) { reserve(o); N.others.delete(id); changed(); }
      const all = [{ id: N.peer.id, ...mine }, ...[...N.others].map(([id, o]) => ({ id, n: o.n, x: Math.round(o.x), y: Math.round(o.y), f: o.f, m: o.m ? 1 : 0, q: o.q ? 1 : 0, e: o.e, w: o.w, b: o.b, c: o.c, u: o.u }))];
      const msg = { t: 'all', p: all };
      for (const c of N.conns.values()) { try { if (c.open) c.send(msg); } catch (e) { } }
    } else if (now - (N.lastRx || now) > 5000) { log('host silent'); lost(); }
    else if (N.conn && N.conn.open) {
      if (js === N.lastSent && now - N.lastAt < 1000) return;
      try { N.conn.send(mine); N.lastSent = js; N.lastAt = now; } catch (e) { }
    }
  }
  function count() { return N.status === 'on' ? N.others.size + 1 : 1; }

  window.Net = {
    start, leave, tick, count, clean,
    get status() { return N.status; }, get room() { return N.room; }, get others() { return N.others; },
    get isHost() { return N.host; }, get why() { return N.why; }, get id() { return N.peer && N.peer.id; }, get log() { return N.log.slice(); }, get hostId() { return N.hostId; },
  };
  window.addEventListener('pagehide', () => destroy());
})();
