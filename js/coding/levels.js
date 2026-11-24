// 코딩 탐험대: 스테이지 · 미션 데이터
// 블록 이름은 이 게임을 위해 만든 학습용 블록이에요. (엔트리·KT AI 코디니 공식 블록 이름과 다를 수 있어요)
(function (root) {
  'use strict';
  // world: cols(칸 수), start, goal, rocks[칸], stars[{col, high}], crab{col, leaveAt(이 박자 수가 되면 떠나요)}, needStars, stopAtGoal
  // toolbox: 쓸 수 있는 블록 · max: 블록별 최대 개수 · init: 처음 놓여 있는 프로그램(시작하기 아래)
  const STAGES = [
    {
      id: 's1', name: '스테이지 1 · 블록을 연결하라!', place: '햇살 코딩 해변', theme: 'beach', helper: 'octopus', helperName: '문어 박사',
      badge: '순차 코딩 배지', badgeIc: '🧩', learn: '블록 연결 · 시작과 실행 · 순서대로 실행',
      intro: [
        '코딩 섬에 온 걸 환영해요! 섬의 다리와 문이 멈춰 버렸어요.',
        '블록은 컴퓨터에게 시킬 일을 적은 "명령 조각"이에요. 블록을 연결해서 장치를 고쳐 봐요!',
        '반짝이는 코딩 수정 앞에서 🧩 퍼즐을 열어요. (E 키 또는 🧩 버튼)',
      ],
      missions: [
        {
          title: '처음 실행해 보기', goal: '시작하기 아래에 "오른쪽으로 1칸" 블록을 연결하고 ▶ 실행을 눌러요.',
          world: { cols: 2, goal: 1 }, toolbox: ['c_right'], max: { c_right: 1 },
          hints: ['오른쪽 블록 상자에서 "오른쪽으로 1칸 이동하기"를 끌어와 "▶ 시작하기" 아래에 딱 붙여요.', '블록이 붙으면 ▶ 실행 버튼을 눌러요. 시작하기에 붙은 블록만 실행돼요!'],
          ok: '잘했어! 블록을 실행했더니 캐릭터가 움직였어!',
          learn: '▶ 시작하기에 연결된 블록이 위에서부터 실행돼요. ▶ 실행 버튼은 만든 프로그램을 작동시켜요.',
        },
        {
          title: '순서대로 움직이기', goal: '높이 떠 있는 ⭐ 별을 모으고 깃발까지 가요.',
          world: { cols: 5, goal: 4, stars: [{ col: 3, high: true }], needStars: true }, toolbox: ['c_right2', 'c_jump'], max: { c_right2: 1, c_jump: 1 },
          hints: ['점프하기는 앞의 1칸을 뛰어넘어 2칸 앞에 내려앉아요. 뛰어넘는 칸 위의 별을 모을 수 있어요.', '먼저 별 바로 앞 칸까지 가야 해요. 어떤 블록이 먼저일까요?'],
          ok: '별을 모았어요! 블록은 연결한 순서대로 하나씩 실행돼요.',
          learn: '명령은 위에서 아래로, 연결한 순서대로 실행돼요.',
        },
        {
          title: '블록 순서 바꾸기', goal: '같은 두 블록으로 순서를 바꿔 가며 두 번 실행해 봐요. ① 이동 → 점프 ② 점프 → 이동',
          world: { cols: 4, goal: 3, rocks: [1] }, toolbox: ['c_right', 'c_jump'], max: { c_right: 1, c_jump: 1 }, compare: true,
          hints: ['두 블록을 연결해서 실행하고, 결과를 봐요.', '블록을 떼었다가 순서를 바꿔 다시 붙여요. 결과가 어떻게 달라질까요?'],
          ok: '같은 블록이라도 순서가 바뀌면 결과가 달라져요! 이동을 먼저 하면 바위에 막히고, 점프를 먼저 하면 바위를 넘어요.',
          learn: '같은 블록이라도 순서가 바뀌면 결과가 달라져요.',
        },
      ],
    },
    {
      id: 's2', name: '스테이지 2 · 반복의 마법!', place: '하늘 코딩 구름섬', theme: 'cloud', helper: 'penguin', helperName: '확인 도우미 펭귄',
      badge: '반복 마법 배지', badgeIc: '🔁', learn: '반복 블록 · 반복 횟수 · 짧은 프로그램',
      intro: ['구름섬에는 긴 길이 있어요. 같은 명령을 여러 번 써야 해요.', '반복하기 블록을 쓰면 같은 명령을 짧게 여러 번 실행할 수 있어요!'],
      missions: [
        {
          title: '같은 행동 세 번', goal: '"오른쪽으로 1칸" 블록을 세 번 연결해서 별 3개를 모아요.',
          world: { cols: 4, goal: 3, stars: [{ col: 1 }, { col: 2 }, { col: 3 }], needStars: true }, toolbox: ['c_right'], max: { c_right: 3 },
          hints: ['"오른쪽으로 1칸" 블록을 세 개 끌어와 차례로 붙여요.'],
          ok: '세 칸을 이동해서 별 3개를 모았어요!',
          learn: '같은 블록을 여러 번 연결하면 그만큼 실행돼요.',
        },
        {
          title: '반복 블록 쓰기', goal: '반복하기 안에 "오른쪽으로 1칸"을 넣어, 더 짧은 프로그램으로 같은 곳에 가요.',
          world: { cols: 4, goal: 3, stars: [{ col: 1 }, { col: 2 }, { col: 3 }], needStars: true }, toolbox: ['c_repeat', 'c_right'], max: { c_repeat: 1, c_right: 1 }, repeatDefault: 3,
          hints: ['"🔁 3번 반복하기"를 시작하기 아래에 붙여요.', '"오른쪽으로 1칸"을 반복하기 블록의 입 안쪽(안)에 넣어요.'],
          ok: '우와! 같은 명령을 여러 번 쓰지 않아도 되네!',
          learn: '반복하기 안의 명령은 정한 횟수만큼 되풀이돼요. 블록 1개로 3칸을 갔어요!',
        },
        {
          title: '반복 횟수 바꾸기', goal: '이번 깃발은 4칸 떨어져 있어요. 반복 횟수를 고쳐서 도착해요.',
          world: { cols: 5, goal: 4 }, toolbox: ['c_repeat', 'c_right'], max: { c_repeat: 1, c_right: 1 },
          init: [{ type: 'c_repeat', n: 3, body: [{ type: 'c_right' }] }],
          hints: ['반복하기 블록의 숫자 3을 눌러서 바꿀 수 있어요.', '4칸을 가야 하니 몇 번 반복하면 될까요?'],
          ok: '반복 횟수를 바꾸니 딱 4칸을 갔어요!',
          learn: '반복 횟수를 바꾸면 명령이 실행되는 횟수가 바뀌어요.',
        },
      ],
    },
    {
      id: 's3', name: '스테이지 3 · 오류를 고쳐라!', place: '별빛 코딩 성', theme: 'castle', helper: 'turtle', helperName: '거북 선생님',
      badge: '코딩 해결사 배지', badgeIc: '🛠️', learn: '오류 찾기 · 블록 수정 · 다시 실행 · 스스로 만들기',
      intro: ['성문 앞 장치들이 잘못 만들어져 있어요.', '먼저 ▶ 실행해서 어디서 문제가 생기는지 보고, 블록을 고쳐 다시 실행해요. 이걸 "디버깅"이라고 해요!'],
      missions: [
        {
          title: '잘못된 순서 고치기', goal: '이 프로그램은 바위에 막혀요. 순서를 고쳐서 바위를 넘어 깃발까지 가요.',
          world: { cols: 5, goal: 4, rocks: [3] }, toolbox: ['c_right2', 'c_jump'], max: { c_right2: 1, c_jump: 1 },
          init: [{ type: 'c_jump' }, { type: 'c_right2' }],
          hints: ['먼저 ▶ 실행해서 어느 블록에서 멈추는지 봐요. 빨간 표시가 생겨요.', '바위는 3번째 칸에 있어요. 바위 바로 앞까지 간 다음에 점프해야 해요.'],
          ok: '오류를 고쳤어요! 바위 앞까지 이동한 뒤에 점프하니 넘을 수 있어요.',
          learn: '결과가 이상하면 어느 블록에서 문제가 생겼는지 찾아서 고치고 다시 실행해요.',
        },
        {
          title: '잘못된 반복 횟수 고치기', goal: '깃발까지 4칸인데 반복 횟수가 잘못됐어요. 고쳐서 다시 실행해요.',
          world: { cols: 5, goal: 4 }, toolbox: ['c_repeat', 'c_right'], max: { c_repeat: 1, c_right: 1 },
          init: [{ type: 'c_repeat', n: 2, body: [{ type: 'c_right' }] }],
          hints: ['먼저 실행해서 몇 칸 가는지 세어 봐요.', '깃발까지 4칸이에요. 반복 숫자를 바꿔요.'],
          ok: '반복 횟수를 고쳐서 도착했어요!',
          learn: '숫자 하나만 틀려도 결과가 달라져요. 실행 결과를 보고 고쳐요.',
        },
        {
          title: '나만의 코딩', goal: '⭐ 별 2개를 모두 모으고 깃발까지 가요. 꽃게 🦀는 잠시 뒤에 길을 비켜 줘요. 방법은 여러 가지예요!',
          world: { cols: 10, goal: 9, stars: [{ col: 2 }, { col: 5, high: true }], crab: { col: 7, leaveAt: 6 }, needStars: true },
          toolbox: ['c_right', 'c_left', 'c_jump', 'c_wait', 'c_repeat'], max: {}, free: true,
          hints: ['반복하기를 쓰면 짧게 만들 수 있어요. 높은 별은 바로 앞 칸에서 점프!', '꽃게는 6번 움직인 뒤에 떠나요. "잠깐 기다리기"를 쓰거나 꽃게를 뛰어넘어도 돼요.'],
          ok: '나만의 프로그램으로 별을 모았어요! 정답은 하나가 아니에요.',
          learn: '같은 목표도 여러 가지 프로그램으로 해결할 수 있어요.',
        },
      ],
    },
  ];
  // 보너스: 조건 (본 게임 클리어에는 필요 없어요)
  const BONUS = {
    id: 'bonus', name: '보너스 · 장애물이 있으면?', place: '수수께끼 산호섬', theme: 'reef', helper: 'jelly', helperName: '해파리',
    badge: '조건 탐정 배지', badgeIc: '❓', learn: '만약 ~라면 (조건)',
    intro: ['이 길은 바위 위치가 매번 달라요!', '"만약 앞에 바위가 있다면" 블록은 실행할 때 진짜로 앞을 확인하고, 그때그때 다른 명령을 해요.'],
    missions: [{
      title: '바위가 있으면 점프!', goal: '하나의 프로그램으로 길 3개(바위 위치가 다름)를 모두 통과해요. 깃발에 도착하면 멈춰요.',
      worlds: [
        { name: '길 1', cols: 9, goal: 8, rocks: [2, 5], stopAtGoal: true },
        { name: '길 2', cols: 9, goal: 8, rocks: [3, 6], stopAtGoal: true },
        { name: '길 3 (바위 없음)', cols: 9, goal: 8, rocks: [], stopAtGoal: true },
      ],
      toolbox: ['c_repeat', 'c_if', 'c_right', 'c_jump'], max: { c_repeat: 1, c_if: 1, c_right: 1, c_jump: 1 }, repeatDefault: 10,
      hints: ['"🔁 반복하기" 안에 "만약 앞에 바위가 있다면"을 넣어요.', '바위가 있으면 → 점프하기, 아니면 → 오른쪽으로 1칸. 반복은 넉넉하게 10번!'],
      ok: '조건 블록이 실행할 때마다 앞을 확인해서, 바위가 있으면 점프하고 없으면 걸어갔어요!',
      learn: '조건은 "지금 상황"을 확인해서 다른 명령을 골라 실행해요.',
    }],
  };
  // 실제 수업(AI 코디니 등)과 연결 — 공식 블록 이름이라고 주장하지 않아요
  const LINK = [
    ['시작과 실행', '블록을 연결한 뒤 프로그램 실행하기'],
    ['순서대로 실행', '도·레·미 연주 순서 정하기'],
    ['기다리기', '소리 사이에 시간 간격 두기'],
    ['반복', '같은 동작이나 소리를 여러 번 실행하기'],
    ['오류 고치기', '소리가 나지 않을 때 명령 확인하기'],
  ];
  const api = { STAGES, BONUS, LINK };
  if (typeof module !== 'undefined') module.exports = api; else root.CodeLevels = api;
})(this);
