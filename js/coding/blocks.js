// 코딩 탐험대: Blockly 블록 정의 (이 게임을 위해 만든 학습용 블록)
// 실행은 Blockly의 코드 생성기를 쓰지 않고, 연결된 블록 구조를 직접 읽어 js/coding/engine.js 규칙으로 실행해요.
(function () {
  'use strict';
  const C = { start: '#f5a623', move: '#4c97ff', jump: '#9966ff', wait: '#ffab19', loop: '#40bf4a', cond: '#ff6680' };
  Blockly.common.defineBlocksWithJsonArray([
    { type: 'c_start', message0: '▶ 시작하기', nextStatement: null, colour: C.start, tooltip: '여기에 연결한 블록부터 차례대로 실행돼요.', hat: 'cap' },
    { type: 'c_right', message0: '오른쪽으로 1칸 이동하기 ➡️', previousStatement: null, nextStatement: null, colour: C.move, tooltip: '오른쪽 칸으로 걸어가요.' },
    { type: 'c_right2', message0: '오른쪽으로 2칸 이동하기 ⏩', previousStatement: null, nextStatement: null, colour: C.move, tooltip: '오른쪽으로 두 칸 걸어가요.' },
    { type: 'c_left', message0: '⬅️ 왼쪽으로 1칸 이동하기', previousStatement: null, nextStatement: null, colour: C.move, tooltip: '왼쪽 칸으로 걸어가요.' },
    { type: 'c_jump', message0: '점프하기 🦘', previousStatement: null, nextStatement: null, colour: C.jump, tooltip: '앞의 1칸을 뛰어넘어 2칸 앞에 내려앉아요.' },
    { type: 'c_wait', message0: '잠깐 기다리기 ⏳', previousStatement: null, nextStatement: null, colour: C.wait, tooltip: '제자리에서 한 박자 쉬어요.' },
    {
      type: 'c_repeat', message0: '🔁 %1 번 반복하기', args0: [{ type: 'field_number', name: 'N', value: 3, min: 1, max: 10, precision: 1 }],
      message1: '%1', args1: [{ type: 'input_statement', name: 'DO' }], previousStatement: null, nextStatement: null, colour: C.loop, tooltip: '안에 넣은 블록을 정한 횟수만큼 되풀이해요.',
    },
    {
      type: 'c_if', message0: '❓ 만약 앞에 바위가 있다면', message1: '%1', args1: [{ type: 'input_statement', name: 'THEN' }],
      message2: '아니면', message3: '%1', args3: [{ type: 'input_statement', name: 'ELSE' }], previousStatement: null, nextStatement: null, colour: C.cond,
      tooltip: '실행할 때 바로 앞 칸에 바위가 있는지 확인해서 위쪽 또는 아래쪽 명령을 실행해요.',
    },
  ]);
  const NAME = { c_right: '오른쪽으로 1칸 이동하기', c_right2: '오른쪽으로 2칸 이동하기', c_left: '왼쪽으로 1칸 이동하기', c_jump: '점프하기', c_wait: '잠깐 기다리기', c_repeat: '반복하기', c_if: '만약 앞에 바위가 있다면' };
  const ACT = { c_right: 'right', c_right2: 'right2', c_left: 'left', c_jump: 'jump', c_wait: 'wait' };

  function toolbox(types, repeatDefault) {
    return { kind: 'flyoutToolbox', contents: types.map((t) => (t === 'c_repeat' ? { kind: 'block', type: t, fields: { N: repeatDefault || 3 } } : { kind: 'block', type: t })) };
  }
  // 작업 공간 만들기
  function inject(div, mission) {
    const max = Object.assign({ c_start: 1 }, mission.max || {});
    const ws = Blockly.inject(div, {
      toolbox: toolbox(mission.toolbox, mission.repeatDefault), renderer: 'zelos', theme: Blockly.Themes.Classic,
      trashcan: true, sounds: false, media: 'vendor/blockly/media/', maxInstances: max,
      move: { scrollbars: true, drag: true, wheel: false }, zoom: { controls: true, wheel: false, startScale: mission.scale || (window.innerHeight < 720 ? 0.78 : window.innerHeight < 900 || window.innerWidth < 900 ? 0.95 : 1.15), maxScale: 1.8, minScale: 0.6, pinch: true },
      grid: { spacing: 28, length: 2, colour: '#e6eef5', snap: false },
    });
    load(ws, mission);
    return ws;
  }
  // 처음 프로그램 놓기: 시작하기 + (있으면) init 블록들
  function load(ws, mission) {
    ws.clear();
    const start = ws.newBlock('c_start'); start.setDeletable(false); start.initSvg(); start.render(); start.moveBy(24, 24);
    let prev = start;
    const make = (spec) => {
      const b = ws.newBlock(spec.type);
      if (spec.type === 'c_repeat') b.setFieldValue(spec.n || 3, 'N');
      b.initSvg(); b.render();
      let inner = null;
      for (const s of spec.body || []) { const c = make(s); (inner ? inner.nextConnection : b.getInput('DO').connection).connect(c.previousConnection); inner = c; }
      return b;
    };
    for (const spec of mission.init || []) { const b = make(spec); prev.nextConnection.connect(b.previousConnection); prev = b; }
  }
  // 연결된 블록 읽기 → 실행 엔진용 구조
  function read(ws) {
    const start = ws.getBlocksByType('c_start', false)[0];
    if (!start) return { error: '시작하기 블록이 없어요.' };
    const chain = (b) => { const out = []; while (b) { out.push(node(b)); b = b.getNextBlock(); } return out; };
    function node(b) {
      if (b.type === 'c_repeat') return { id: b.id, kind: 'repeat', n: Math.max(1, Math.min(10, Math.round(Number(b.getFieldValue('N')) || 1))), body: chain(b.getInputTargetBlock('DO')) };
      if (b.type === 'c_if') return { id: b.id, kind: 'if', cond: 'rock', then: chain(b.getInputTargetBlock('THEN')), else: chain(b.getInputTargetBlock('ELSE')) };
      return { id: b.id, kind: 'act', act: ACT[b.type] };
    }
    const nodes = chain(start.getNextBlock());
    // 시작하기에 연결되지 않고 떨어져 있는 블록 (실행되지 않아요)
    const loose = ws.getTopBlocks(false).filter((b) => b !== start).reduce((a, b) => a + b.getDescendants(false).length, 0);
    return { nodes, loose, startId: start.id };
  }
  window.CodeBlocks = { inject, load, read, NAME, toolbox };
})();
