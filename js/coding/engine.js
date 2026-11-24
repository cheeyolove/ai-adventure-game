// 코딩 탐험대: 블록 실행 엔진 (화면과 분리된 '칸' 규칙)
// 퍼즐 길은 칸(0, 1, 2, …)으로 나뉘어 있어요. 블록 하나하나가 아래 규칙대로 정확히 실행돼요.
// 물리 계산을 쓰지 않으니, 틀린 순서가 우연히 성공하거나 맞는 순서가 실패하는 일이 없어요.
//  - 오른쪽/왼쪽 1칸 이동: 옆 칸으로 걸어가요. 바위·닫힌 문·꽃게가 있으면 부딪혀서 멈춰요.
//  - 오른쪽 2칸 이동: 1칸 이동을 두 번 해요.
//  - 점프하기: 앞의 1칸을 뛰어넘어 2칸 앞에 내려앉아요. (뛰어넘는 칸의 바위·꽃게는 넘을 수 있고, 그 칸 위에 떠 있는 별을 모아요)
//  - 잠깐 기다리기: 제자리에서 한 박자 쉬어요.
//  - 만약 앞에 바위가 있다면: 바로 앞(오른쪽) 칸에 바위가 있는지 실제로 확인해요.
(function (root) {
  'use strict';

  function newState(world) {
    return { col: world.start || 0, got: new Set(), tick: 0, dead: false };
  }
  const crabAt = (world, st, col) => !!(world.crab && world.crab.col === col && st.tick < world.crab.leaveAt);
  const rockAt = (world, col) => (world.rocks || []).includes(col);

  // 한 칸 걸어가기 (dir: +1 오른쪽, -1 왼쪽)
  function walk(world, st, dir, ev) {
    const to = st.col + dir;
    if (to < 0) return { code: 'edge', msg: '더 왼쪽으로는 갈 수 없어요.' };
    if (to > world.cols - 1) return { code: 'gate', msg: '목표를 지나쳐서 문에 부딪혔어요. 몇 칸 가야 하는지 다시 세어 봐요.' };
    if (rockAt(world, to)) { ev.push({ t: 'bump', to, what: 'rock' }); return { code: 'rock', msg: '바위에 부딪혔어요. 바위는 점프로 넘어야 해요.' }; }
    if (crabAt(world, st, to)) { ev.push({ t: 'bump', to, what: 'crab' }); return { code: 'crab', msg: '꽃게가 아직 길에 있어요! 기다리거나 뛰어넘어 봐요.' }; }
    ev.push({ t: 'move', from: st.col, to });
    st.col = to; st.tick++;
    collect(world, st, to, false, ev);
    crabCheck(world, st, ev);
    return null;
  }
  function collect(world, st, col, inAir, ev) {
    (world.stars || []).forEach((s, i) => {
      if (s.col === col && !!s.high === inAir && !st.got.has(i)) { st.got.add(i); ev.push({ t: 'star', i }); }
    });
  }
  function crabCheck(world, st, ev) {
    if (world.crab && st.tick === world.crab.leaveAt) ev.push({ t: 'crabgo' });
  }

  // 블록 하나 실행 → 결과(ev: 화면에 보여 줄 일들, err: 실패 이유)
  function step(world, st, act) {
    const ev = [];
    let err = null;
    if (act === 'right') err = walk(world, st, 1, ev);
    else if (act === 'left') err = walk(world, st, -1, ev);
    else if (act === 'right2') { err = walk(world, st, 1, ev); if (!err) err = walk(world, st, 1, ev); }
    else if (act === 'jump') {
      const over = st.col + 1, to = st.col + 2;
      if (to > world.cols - 1) { ev.push({ t: 'bump', to: Math.min(over, world.cols - 1), what: 'gate' }); err = { code: 'gate', msg: '점프했더니 문에 부딪혔어요. 점프는 2칸 앞에 내려앉아요.' }; }
      else if (rockAt(world, to)) { ev.push({ t: 'bump', to, what: 'rock' }); err = { code: 'rock', msg: '바위 위에는 내려앉을 수 없어요. 점프하기 전 위치를 확인해요.' }; }
      else if (crabAt(world, st, to)) { ev.push({ t: 'bump', to, what: 'crab' }); err = { code: 'crab', msg: '꽃게가 있는 칸에는 내려앉을 수 없어요.' }; }
      else {
        ev.push({ t: 'jump', from: st.col, over, to });
        collect(world, st, over, true, ev);
        st.col = to; st.tick++;
        collect(world, st, to, false, ev);
        crabCheck(world, st, ev);
      }
    } else if (act === 'wait') { ev.push({ t: 'wait' }); st.tick++; crabCheck(world, st, ev); }
    if (err) st.dead = true;
    return { ev, err };
  }
  function cond(world, st, c) { if (c === 'rock') return rockAt(world, st.col + 1); return false; }

  // 프로그램이 끝났을 때 목표를 이뤘는지
  function judge(world, st) {
    const need = (world.stars || []).length, got = st.got.size;
    if (st.col !== world.goal) {
      const d = world.goal - st.col;
      return { ok: false, code: 'short', msg: d > 0 ? `프로그램이 끝났는데 목표까지 ${d}칸이 남았어요. 블록을 더 연결하거나 반복 횟수를 확인해요.` : `목표보다 ${-d}칸 더 갔어요.` };
    }
    if (world.needStars && got < need) return { ok: false, code: 'stars', msg: `목표에는 왔지만 ⭐ 별 ${need - got}개를 놓쳤어요. 높이 떠 있는 별은 그 바로 앞 칸에서 점프해야 모을 수 있어요.` };
    return { ok: true };
  }

  // 블록 묶음(트리) → 한 줄씩 실행 (실행할 블록 id를 알려 주며 진행)
  // nodes: [{ id, kind: 'act', act } | { id, kind: 'repeat', n, body } | { id, kind: 'if', cond, then, else }]
  async function run(world, nodes, opt) {
    const st = newState(world);
    const ctx = { count: 0, stopped: false };
    async function exec(list, loopInfo) {
      for (const node of list) {
        if (opt.stopped()) return 'stop';
        if (node.kind === 'repeat') {
          if (!node.body.length) { await opt.onError(node, { code: 'empty', msg: '반복하기 블록 안이 비어 있어요. 반복할 명령을 안에 넣어요.' }, st); return 'err'; }
          for (let k = 1; k <= node.n; k++) { await opt.onRepeat(node, k); const r = await exec(node.body, { node, k }); if (r) return r; }
          continue;
        }
        if (node.kind === 'if') {
          const yes = cond(world, st, node.cond);
          await opt.onCond(node, yes, st);
          const r = await exec(yes ? node.then : node.else, loopInfo); if (r) return r;
          continue;
        }
        if (++ctx.count > 80) { await opt.onError(node, { code: 'long', msg: '명령이 너무 많아요.' }, st); return 'err'; }
        const res = step(world, st, node.act);
        await opt.onStep(node, res, st, loopInfo);
        if (res.err) { await opt.onError(node, res.err, st); return 'err'; }
        if (world.stopAtGoal && st.col === world.goal) return 'goal';
      }
      return null;
    }
    const r = await exec(nodes, null);
    return { result: r, state: st, judge: r === 'err' || r === 'stop' ? null : judge(world, st) };
  }

  // 순서 비교용: 실행된 기본 명령 순서 ('right'·'jump' …)
  function flatActs(nodes) { const out = []; (function f(l) { for (const n of l) { if (n.kind === 'act') out.push(n.act); else if (n.kind === 'repeat') for (let i = 0; i < n.n; i++) f(n.body); else f(n.then.concat(n.else)); } })(nodes); return out; }
  function uses(nodes, kind) { let y = false; (function f(l) { for (const n of l) { if (n.kind === kind) y = true; if (n.body) f(n.body); if (n.then) { f(n.then); f(n.else); } } })(nodes); return y; }

  const api = { newState, step, cond, judge, run, flatActs, uses };
  if (typeof module !== 'undefined') module.exports = api; else root.CodeEngine = api;
})(this);
