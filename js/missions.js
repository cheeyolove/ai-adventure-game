// AI 탐험대! 체험형 미니게임
// 학습 기준: AI리터러시 Part3 기본 워크북(1차시 PPT 19쪽) — 학습 목표와 판단 기준은 그대로, 활동 방식만 체험형으로 바꿨어요.
//  ① AI가 만든 사진·영상도 진짜처럼 보일 수 있어요  ② 멈춰요 → 물어봐요 → 다시 찾아봐요 (+ 확인해요·비교해요)
//  ③ 출처를 살펴보고 비교해요 (말한 사람 수보다 출처)  ④ 올리기 전에 한 번 더 확인해요 (친구 얼굴·이름)
// 모든 인물·영상·사진·학교 알림은 게임 속 '가상' 예시예요.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const O = '#26344f';

  // =====================================================================
  //  미션 내용
  // =====================================================================
  const DEF = {
    intro: { zone: '🏅 AI 탐험대 인증 센터', title: '우리 탐험대의 세 가지 약속', npc: 'captain', steps: [{ type: 'promise' }] },

    // ① 수상한 영상 탐정 — 신기한 영상 해변
    m1: {
      zone: '🎬 신기한 영상 해변', title: '미니게임 ① 수상한 영상 탐정', npc: 'octopus',
      steps: [
        {
          type: 'clues',
          say: '말하는 강아지 영상이 올라왔어요! 돋보기를 끌어서 단서 3개를 찾아요.',
          clues: [
            { id: 'who', tool: '👤 누가 만들었을까?', x: 56, y: 103, w: 140, h: 22, card: '올린 사람 이름이 없어요. 누가 만들었는지 알 수 없어요.' },
            { id: 'orig', tool: '🎞️ 원래 영상이 있을까?', x: 30, y: 12, w: 56, h: 16, card: '"퍼온 영상"이라고만 적혀 있어요. 처음 올린 곳을 찾을 수 없어요.' },
            { id: 'other', tool: '📚 다른 자료에서도 확인할까?', x: 102, y: 16, w: 86, h: 44, card: '가상 동물 도감을 찾아보니 "강아지는 사람처럼 말하지 못해요"래요. 편집이나 AI로 만든 영상일 수 있어요.' },
          ],
          q: '단서를 모두 모았어요. 이 영상, 어떻게 생각해야 할까요?',
          opts: [
            { ic: '😱', t: '수상해 보이니까 무조건 가짜!', fb: '겉모습만 보고 정하면 틀릴 수 있어요. 우리는 단서(만든 사람·원래 영상·다른 자료)로 판단해요.' },
            { ic: '🔍', t: '영상만 보고 정하지 말고, 만든 사람과 근거를 확인해요', ok: true },
            { ic: '😍', t: '진짜 같으니까 친구에게 보내자!', fb: '진짜처럼 보여도 만든 영상일 수 있어요. 확인하기 전에는 보내지 않아요.' },
          ],
          explain: '탐정 도장 쾅! 영상만 보고 확정하지 말고, 만든 사람과 근거를 확인해요. 확인 전에는 믿거나 퍼뜨리지 않아요.',
        },
        {
          type: 'stamp',
          say: '탐정 도장 놀이! 카드에 ⭕ 또는 ❌ 도장을 끌어다 찍어요.',
          items: [
            { t: 'AI는 진짜처럼 보이는 사진이나 영상을 만들 수 있어요.', ans: true, explain: '맞아요! 그래서 진짜 같아도 한 번 더 확인해요.' },
            { t: 'AI로 만든 그림이나 영상은 모두 나쁘고 거짓이에요.', ans: false, explain: 'AI로 만든 것도 공부·그림에 쓸모 있게 쓰여요. 진짜인 척 속이는 게 문제예요.' },
            { t: '이상한 점을 하나 찾으면 AI가 만든 것이라고 확실히 알 수 있어요.', ans: false, explain: '겉모습만으로는 확실히 알 수 없어요. 만든 사람과 다른 자료로 확인해요.' },
            { t: '실제로 찍은 사진도 틀린 설명과 함께 퍼질 수 있어요.', ans: true, explain: '맞아요! 진짜 사진이어도 설명이 틀릴 수 있어요.' },
            { t: '엄마가 보내 준 가족사진이니까, 사진에 붙은 설명도 무조건 모두 사실이에요.', ans: false, explain: '가족이 보낸 사진은 대개 믿을 수 있지만 "무조건"은 아니에요. 궁금하면 엄마께 여쭤봐요.' },
          ],
        },
      ],
    },

    // ② 소문을 멈춰라! — 소문 바다(부두)
    m2: {
      zone: '🫧 소문 바다', title: '미니게임 ② 소문을 멈춰라!', npc: 'fish',
      steps: [
        {
          type: 'bubbles',
          say: '소문 물방울이 친구들에게 가고 있어! 물방울을 누르거나 ✋ 멈춰요! 버튼을 눌러 줘. 천천히 해도 괜찮아!',
          rumors: [
            {
              t: '내일 학교 쉰대!', ic: '🏫',
              opts: [
                { t: '선생님께 여쭤보고 학교 공식 알림을 확인해요', ok: true },
                { t: '친구들에게 빨리 알려 줘요', fb: '확인하지 않은 소문을 퍼뜨리면 친구들이 헷갈려요.' },
                { t: '소문이니까 무조건 거짓말이에요', fb: '아직 확인 전이라 거짓이라고 정할 수도 없어요. "확인이 필요한 소문"이에요.' },
              ],
              why: '학교 일정은 선생님과 학교 공식 알림이 가장 정확해요.',
            },
            {
              t: '강아지가 사람 말을 한대!', ic: '🐶',
              opts: [
                { t: '영상이 있으니까 진짜예요', fb: '영상은 편집하거나 AI로 만들 수도 있어요.' },
                { t: '누가 만든 영상인지 보고, 어른과 다른 자료를 찾아봐요', ok: true },
                { t: '신기하니까 단체방에 올려요', fb: '확인 전에 올리면 소문이 더 퍼져요.' },
              ],
              why: '영상만 보고 정하지 말고 만든 사람과 근거를 확인해요.',
            },
            {
              t: '친구 사진이 바뀌었대!', ic: '🖼️',
              opts: [
                { t: '재밌으니까 나도 보내요', fb: '친구가 속상할 수 있고, 사실이 아닌 사진이 퍼져요.' },
                { t: '못 본 척 그냥 넘어가요', fb: '친구가 곤란할 수 있어요. 믿을 만한 어른에게 알려 도움을 받아요.' },
                { t: '퍼뜨리지 않고 부모님이나 선생님께 알려요', ok: true },
              ],
              why: '친구 얼굴이 허락 없이 쓰였을 수 있어요. 어른에게 알려요.',
            },
          ],
          explain: '소문 3개를 모두 멈췄어요! 확인되지 않은 정보는 바로 믿거나 퍼뜨리지 않고, 먼저 멈춘 뒤 확인해요.',
        },
      ],
    },

    // ③ 누구에게 물어볼까? — 질문하는 마을
    m3: {
      zone: '🏘️ 질문하는 마을', title: '미니게임 ③ 누구에게 물어볼까?', npc: 'turtle',
      steps: [
        {
          type: 'deliver',
          say: '상황 카드를 끌어서 도움을 줄 친구에게 배달해요. (눌러서 고른 뒤 받을 사람을 눌러도 돼요)',
          helpers: [
            { id: 'teacher', spr: 'turtle', name: '선생님' },
            { id: 'parent', spr: 'parents', name: '부모님' },
            { id: 'notice', spr: 'notice', name: '학교 공식 안내' },
            { id: 'anon', spr: 'anon', name: '익명 댓글' },
          ],
          cards: [
            { id: 'rumor', ic: '🏫', t: '"내일 학교 쉰대!" 소문이 돌아요', good: ['teacher', 'notice'], okay: ['parent'],
              thanks: { teacher: '잘 물어봤어요! 선생님이 내일 일정을 알려 줄게요.', notice: '학교 공식 안내에서 날짜를 확인해요!', parent: '부모님과 함께 학교 알림을 확인해 봐요.' } },
            { id: 'photo', ic: '🖼️', t: '친구 얼굴이 바뀐 사진이 올라왔어요', good: ['teacher', 'parent'],
              thanks: { teacher: '알려 줘서 고마워요. 친구를 함께 도와줄게요.', parent: '잘했어. 함께 어떻게 할지 생각해 보자.' } },
            { id: 'video', ic: '🎬', t: '진짜인지 모르겠는 인터넷 영상이 있어요', good: ['teacher', 'parent'],
              thanks: { teacher: '좋은 질문이에요! 누가 만들었는지 같이 찾아봐요.', parent: '같이 다른 자료도 찾아보자.' } },
          ],
          wrong: {
            anon: '누가 썼는지 모르는 댓글은 믿을 만한 도움이 아니에요.',
            notice: '학교 공식 안내는 학교 일정을 알려 주는 곳이에요. 이 일은 믿을 만한 어른에게 물어봐요.',
          },
          explain: '배달 완료! 혼자 판단하기 어려우면 부모님·선생님 같은 믿을 만한 어른에게 물어봐요. 알맞은 사람은 여러 명일 수 있어요.',
        },
      ],
    },

    // ④ 사실 확인 연구소 — 사실 확인 도서관
    m4: {
      zone: '📚 사실 확인 연구소', title: '미니게임 ④ 사실 확인 연구소', npc: 'penguin', virtual: true,
      steps: [
        { type: 'lab', say: '"내일 학교 쉰대!" 정보 카드 3장을 뒤집고 출처 도장을 확인해요.' },
        {
          type: 'scale',
          say: '익명 글과 친구 이야기는 "쉰다", 학교 알림은 "정상 수업"이래요.',
          q: '무엇으로 판단해야 할까요?',
          opts: [
            { ic: '👥', t: '말한 사람이 더 많은 쪽', fb: '친구도 같은 소문을 듣고 말했을 수 있어요. 같은 소문이 여러 번 들려도 근거가 늘어나지 않아요.' },
            { ic: '🏷️', t: '출처가 믿을 만한 쪽', ok: true },
          ],
          explain: '정답! 말한 사람 수보다 출처가 중요해요. 학교 일정은 학교 공식 알림과 선생님 안내로 확인해요.',
        },
      ],
    },

    // ⑤ 사진 속 비밀을 찾아라! — 안전한 공유 광장
    m5: {
      zone: '📷 안전한 공유 광장', title: '미니게임 ⑤ 사진 속 비밀을 찾아라!', npc: 'jelly',
      steps: [{ type: 'photo', say: '포스터 사진을 학급 게시판에 올리기 전에 확인해요!' }],
    },

    // 최종 미션 — AI 탐험대 인증
    fin: {
      zone: '🏅 AI 탐험대 인증 센터', title: '최종 미션 · AI 탐험대 인증', npc: 'captain', lamps: true,
      steps: [
        {
          type: 'match',
          say: '세 가지 행동 카드를 알맞은 상황에 이어요!',
          q: '이럴 때 어떤 행동을 할까요?',
          hint: '왼쪽 상황을 누른 다음, 오른쪽 행동 카드를 눌러 이어요.',
          left: [
            { id: 'a', icon: '😲', t: '깜짝 놀랄 영상을 봤어요. 바로 보내고 싶어요!' },
            { id: 'b', icon: '🤔', t: '진짜인지 혼자 판단하기 어려워요.' },
            { id: 'c', icon: '📚', t: '다른 곳에서도 같은 내용인지 궁금해요.' },
          ],
          right: [
            { id: 'ask', icon: '🙋', t: '물어봐요' },
            { id: 'search', icon: '🔍', t: '다시 찾아봐요 (확인해요·비교해요)' },
            { id: 'stop', icon: '✋', t: '멈춰요' },
          ],
          good: { a: ['stop'], b: ['ask'], c: ['search'] }, oneToOne: true, fb: {},
          explain: '완벽해요! 실제 생활에서는 이 행동들을 함께 쓰기도 해요. 예를 들어 어른에게 물어보면서 같이 다시 찾아볼 수 있어요.',
        },
        {
          type: 'order',
          say: '마지막! 약속 카드를 차례대로 놓아요.',
          q: '세 가지 행동 카드를 차례대로 놓아 약속을 완성해요.',
          cards: [
            { id: 'search', icon: '🔍', t: '다시 찾아봐요' },
            { id: 'stop', icon: '✋', t: '멈춰요' },
            { id: 'ask', icon: '🙋', t: '물어봐요' },
          ],
          explain: '완성! 멈춰요 → 물어봐요 → 다시 찾아봐요. 상황에 따라 함께 쓰거나 순서를 바꿔 써도 좋아요.',
        },
      ],
    },
  };

  // =====================================================================
  //  그림 장면 (가상 사진·영상)
  // =====================================================================
  function sceneCanvas(w, h, k = 4) {
    const c = document.createElement('canvas'); c.width = w * k; c.height = h * k;
    c.className = 'scv'; c.style.aspectRatio = `${w} / ${h}`;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const R = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(Math.round(x * k), Math.round(y * k), Math.round(ww * k), Math.round(hh * k)); };
    const RR = (x, y, ww, hh, r, col) => { g.fillStyle = col; g.beginPath(); g.roundRect ? g.roundRect(x * k, y * k, ww * k, hh * k, r * k) : g.rect(x * k, y * k, ww * k, hh * k); g.fill(); };
    const Tx = (s, x, y, size, col = O, align = 'center', font = 'Jua') => { g.font = `${size * k}px ${font}, "Gowun Dodum", sans-serif`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x * k, y * k); };
    const SP = (name, frame, x, y, sc) => { const s = PX.sprite(name, frame); g.drawImage(s, Math.round(x * k), Math.round(y * k), s.width * sc * k, s.height * sc * k); };
    return { c, g, R, RR, Tx, SP, k };
  }
  const SCENES = {
    tv_dog(timers) {
      const W = 220, H = 128, s = sceneCanvas(W, H);
      let talk = false;
      const draw = () => {
        const { g, R, RR, Tx, SP } = s;
        g.clearRect(0, 0, s.c.width, s.c.height);
        RR(18, 2, 184, 124, 10, O); RR(20, 4, 180, 120, 9, '#3b4a6b');
        R(28, 12, 164, 92, '#bfe8ff'); R(28, 76, 164, 28, '#a6e3a1'); R(28, 76, 164, 2, '#8fd48a');
        R(150, 22, 18, 6, '#ffffff'); R(146, 25, 26, 5, '#ffffff');   // 구름
        SP('puppy', talk ? 'talk' : 'idle', 40, 36, 2.4);
        // 말풍선
        RR(104, 18, 82, 40, 8, O); RR(105, 19, 80, 38, 7, '#ffffff');
        g.fillStyle = O; g.beginPath(); g.moveTo(110 * s.k, 50 * s.k); g.lineTo(98 * s.k, 64 * s.k); g.lineTo(120 * s.k, 55 * s.k); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(111 * s.k, 51 * s.k); g.lineTo(101 * s.k, 61 * s.k); g.lineTo(118 * s.k, 54 * s.k); g.fill();
        Tx('나는 사람처럼', 145, 31, 8.5); Tx('이야기할 수 있어!', 145, 45, 8.5);
        RR(32, 15, 50, 11, 5, 'rgba(38,52,79,.75)'); Tx('▶ 퍼온 인기 영상', 57, 20.8, 6.2, '#ffffff');
        // 재생 막대
        R(28, 104, 164, 16, '#26344f'); R(46, 108, 140, 2, '#5d6b8a'); R(46, 108, 90, 2, '#ff6b6b'); R(135, 106, 3, 6, '#ffffff');
        g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(33 * s.k, 106 * s.k); g.lineTo(33 * s.k, 114 * s.k); g.lineTo(40 * s.k, 110 * s.k); g.fill();
        Tx('조회수 99,999회 · 올린 사람: ???', 116, 115.5, 5.4, '#ffffff');
      };
      draw();
      timers.push(setInterval(() => { talk = !talk; draw(); }, 320));
      return wrap(s.c, '게임 속 가상 영상');
    },
    photos() {
      const W = 230, H = 112, s = sceneCanvas(W, H);
      const { R, Tx, SP } = s;
      const photo = (x, bg, spr, cap) => {
        R(x - 1, 1, 98, 106, O); R(x, 2, 96, 104, '#ffffff');
        R(x + 6, 8, 84, 72, bg);
        R(x + 6, 66, 84, 14, '#f3e3ff');
        SP(spr, 'idle', x + 22, 14, 2.4);
        Tx(cap, x + 48, 93, 7.6);
      };
      photo(8, '#ffe9f0', 'kong', '콩이의 원래 사진');
      photo(126, '#e9f3ff', 'swap', '누군가 올린 사진');
      // 물음표
      for (const [x, y] of [[198, 16], [140, 22]]) { s.RR(x, y, 14, 14, 7, O); s.RR(x + 1, y + 1, 12, 12, 6, '#ffd84a'); Tx('?', x + 7, y + 7.6, 9); }
      return wrap(s.c, '게임 속 가상 친구 사진 (콩이 · 몽실이)');
    },
    share_raw() { return shareScene(false, false); },
    share_raw_small() { return shareScene(false, true); },
    share_fixed() { return shareScene(true, false); },
    mini_sources() {
      const el = document.createElement('div'); el.className = 'minisrc';
      el.innerHTML = `
        <div class="ms a"><b>🌐 익명 게시글</b><span>"내일 학교 쉰대!"</span><em>출처 모름</em></div>
        <div class="ms b"><b>📢 바다초 공식 알림</b><span>"내일은 정상 수업입니다."</span><em>공식 안내</em></div>
        <div class="ms c"><b>💬 친구 메시지</b><span>"나도 쉰다고 들었어!"</span><em>들은 이야기</em></div>`;
      return el;
    },
  };
  function shareScene(fixed, small) {
    const W = 204, H = 124, s = sceneCanvas(W, H);
    const { g, R, RR, Tx, SP, k } = s;
    R(0, 0, W, H, '#fff1dc'); R(0, 0, W, 2, '#f3dcbc');
    // 창문
    R(6, 6, 44, 34, O); R(8, 8, 40, 30, '#bfe8ff'); R(27, 8, 2, 30, O); R(8, 22, 40, 2, O); R(12, 12, 10, 4, '#ffffff');
    // 시계
    RR(160, 2, 24, 24, 12, O); RR(162, 4, 20, 20, 10, '#ffffff'); R(171, 8, 2, 7, O); R(171, 13, 6, 2, O);
    // 포스터 (내 활동)
    R(54, 8, 80, 66, O); R(56, 10, 76, 62, '#fffdf6'); R(92, 6, 4, 4, '#ff6b6b');
    Tx('AI 탐정의 세 가지 약속', 94, 18, 6.2);
    const box = (x, col, ic, t) => { R(x, 26, 22, 40, O); R(x + 1, 27, 20, 38, col); Tx(ic, x + 11, 38, 9, O, 'center', 'sans-serif'); Tx(t, x + 11, 56, t.length > 4 ? 3.9 : 4.6); };
    box(60, '#ffd0c8', '✋', '멈춰요'); box(83, '#fff0a8', '🙋', '물어봐요'); box(106, '#c9f2d9', '🔍', '다시 찾아봐요');
    // 책상
    R(0, 92, W, 32, '#e6b47e'); R(0, 92, W, 3, '#f3c995'); R(0, 120, W, 4, '#c9905a');
    // 화분
    R(10, 78, 20, 16, O); R(12, 80, 16, 14, '#e0866a'); for (const [x, y] of [[13, 62], [20, 58], [26, 64], [17, 70], [24, 72]]) { RR(x - 4, y - 4, 10, 10, 5, O); RR(x - 3, y - 3, 8, 8, 4, '#6fcf73'); }
    // 연필꽂이
    R(138, 70, 16, 22, O); R(140, 72, 12, 20, '#7fc4ff'); R(141, 60, 2, 12, '#ffd84a'); R(145, 62, 2, 10, '#ff8a80'); R(149, 58, 2, 14, '#7ad7a0');
    // 친구 얼굴(가상 친구 몽실이)
    SP('monghead', 'idle', 154, 38, 2.2);
    R(150, 80, 54, 12, '#7ed492'); R(150, 80, 54, 1, O);
    // 이름표
    R(98, 90, 54, 26, O); R(100, 92, 50, 22, '#ffffff'); R(100, 92, 50, 6, '#5fb4ff'); R(122, 84, 6, 8, '#3f86e0');
    Tx('이름: 몽실이', 125, 106, 7.2);
    if (fixed) {
      // 친구 얼굴 위 별 스티커
      const cx = 177 * k, cy = 60 * k, r1 = 27 * k, r2 = 12 * k;
      g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath();
      g.fillStyle = '#ffd84a'; g.fill(); g.lineWidth = 2 * k; g.strokeStyle = O; g.stroke();
      // 이름표 가리기 (모자이크)
      for (let y = 0; y < 3; y++) for (let x = 0; x < 6; x++) R(100 + x * 8.4, 92 + y * 7.4, 8.4, 7.4, (x + y) % 2 ? '#c9d6e6' : '#dfe8f2');
      RR(4, 102, 64, 16, 8, O); RR(5, 103, 62, 14, 7, '#ffffff'); Tx('✨ 고친 사진', 36, 110.5, 7.6);
    }
    return wrap(s.c, fixed ? '얼굴과 이름표를 가린 사진 (가상)' : '게임 속 가상 사진', small ? 'small' : '');
  }
  function wrap(canvas, cap, cls = '') {
    const el = document.createElement('figure'); el.className = 'scene ' + cls;
    el.appendChild(canvas);
    if (cap) { const f = document.createElement('figcaption'); f.textContent = cap; el.appendChild(f); }
    return el;
  }

  // =====================================================================
  //  미니게임 엔진
  // =====================================================================
  let cur = null;
  function open(id, hooks) {
    const def = DEF[id];
    cur = { id, def, hooks, i: 0, t0: performance.now(), timers: [], rafs: [], locked: false };
    $('qNpc').src = PX.url(def.npc, 'idle', 5);
    $('qZone').textContent = def.zone + (hooks.practice ? ' · 다시 공부하기' : '');
    $('qTitle').textContent = def.title;
    $('quiz').hidden = false;
    $('quiz').classList.toggle('lamps', !!def.lamps);
    renderStep();
  }
  function stopTimers() {
    for (const t of cur.timers) { clearInterval(t); clearTimeout(t); }
    for (const r of cur.rafs) cancelAnimationFrame(r.id);
    cur.timers = []; cur.rafs = [];
  }
  function close(done) {
    if (!cur) return;
    stopTimers();
    $('quiz').hidden = true; $('qBody').innerHTML = '';
    const c = cur; cur = null;
    if (done) c.hooks.onFinish && c.hooks.onFinish({ secs: (performance.now() - c.t0) / 1000 });
    else c.hooks.onClose && c.hooks.onClose();
  }
  $('qClose').onclick = () => {
    if (!cur) return;
    if (cur.id === 'intro' && !cur.hooks.review) { if (!window.confirm('약속 카드를 나중에 볼까요? 탐험대장에게 다시 말을 걸면 이어서 할 수 있어요.')) return; }
    else if (cur.id !== 'intro' && !window.confirm('지도로 돌아갈까요?\n이 미니게임은 다음에 처음부터 다시 해요.')) return;
    close(false);
  };
  function wrong() { if (cur && cur.hooks.onWrong) cur.hooks.onWrong(); cur.hooks.sfx.no(); }
  function nextStep() {
    stopTimers();
    cur.i++;
    if (cur.i >= cur.def.steps.length) { close(true); return; }
    renderStep();
  }
  // 반복 애니메이션 (미니게임이 바뀌면 자동으로 멈춰요)
  function animate(fn) {
    const r = { id: 0 }; let last = performance.now();
    const tick = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; if (fn(dt) === false) return; r.id = requestAnimationFrame(tick); };
    r.id = requestAnimationFrame(tick); cur.rafs.push(r); return r;
  }
  function later(fn, ms) { const t = setTimeout(fn, ms); cur.timers.push(t); return t; }
  function renderSteps() {
    const box = $('qSteps'); box.innerHTML = '';
    const n = cur.def.steps.length; if (n < 2 && !cur.def.lamps) return;
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i');
      d.className = (i < cur.i ? 'done' : i === cur.i ? 'now' : '');
      if (cur.def.lamps) d.textContent = i < cur.i ? '💡' : '○';
      box.appendChild(d);
    }
    box.setAttribute('aria-label', `${n}단계 중 ${cur.i + 1}단계`);
  }
  function renderStep() {
    const st = cur.def.steps[cur.i];
    renderSteps();
    const body = $('qBody'); body.innerHTML = ''; body.scrollTop = 0;
    const root = document.createElement('div'); root.className = 'step t-' + st.type;
    if (cur.def.virtual) { const v = document.createElement('div'); v.className = 'vnote'; v.textContent = '📌 게임 속 가상 학교·가상 알림이에요. 실제 학교 일정이나 뉴스가 아니에요.'; root.appendChild(v); }
    if (st.say) root.appendChild(sayBubble(st.sayWho || cur.def.npc, st.say));
    body.appendChild(root);
    TYPES[st.type](root, st);
  }
  function sayBubble(who, text) {
    const el = document.createElement('div'); el.className = 'say';
    el.innerHTML = `<img alt="" src="${PX.url(who, 'idle', 4)}"><p></p>`;
    el.querySelector('p').textContent = text;
    return el;
  }
  function qText(root, q, hint) {
    const h = document.createElement('h3'); h.className = 'qq'; h.textContent = q; root.appendChild(h);
    if (hint) { const p = document.createElement('p'); p.className = 'qhint'; p.textContent = hint; root.appendChild(p); }
    return h;
  }
  function sceneEl(name) { return SCENES[name](cur.timers); }
  const heroUrl = (frame) => (window.AIX && AIX.heroUrl ? AIX.heroUrl(frame) : PX.url('hero', frame, 4));
  // 반짝이는 코인 (정답 표시용 효과, 실제 코인은 미션을 처음 끝낼 때 받아요)
  function sparkle(el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 5; i++) {
      const s = document.createElement('i'); s.className = 'spk'; s.textContent = i % 2 ? '✨' : '🪙';
      s.style.left = (r.left + r.width * (0.2 + Math.random() * 0.6)) + 'px'; s.style.top = (r.top + r.height * 0.4) + 'px';
      s.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px'); s.style.animationDelay = (i * 0.05) + 's';
      document.getElementById('fx').appendChild(s); setTimeout(() => s.remove(), 1200);
    }
  }
  // 피드백 상자: ok면 '다음' 버튼
  function feedback(root, ok, text, opts = {}) {
    let fb = root.querySelector(':scope > .fb');
    if (!fb) { fb = document.createElement('div'); fb.className = 'fb'; root.appendChild(fb); }
    fb.className = 'fb ' + (ok ? 'ok' : 'no');
    fb.innerHTML = `<img alt="" src="${heroUrl(ok ? 'happy' : 'think')}"><div class="fbt"><b>${ok ? (opts.title || '정답이에요!') : (opts.title || '다시 생각해 봐요')}</b><p></p></div>`;
    fb.querySelector('p').textContent = text;
    if (opts.scene) fb.querySelector('.fbt').appendChild(sceneEl(opts.scene));
    if (ok) {
      cur.hooks.sfx.ok(); sparkle(fb);
      if (opts.noNext) return fb;
      const b = document.createElement('button'); b.className = 'btn primary next';
      b.textContent = opts.nextLabel || (cur.i === cur.def.steps.length - 1 ? '미션 완료! ▶' : '다음 ▶');
      b.onclick = opts.onNext || nextStep;
      fb.appendChild(b);
      setTimeout(() => { fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); b.focus({ preventScroll: true }); }, 60);
    } else {
      fb.classList.remove('shake'); void fb.offsetWidth; fb.classList.add('shake');
      setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 30);
    }
    return fb;
  }
  function clearFb(root) { const f = root.querySelector(':scope > .fb'); if (f) f.remove(); }
  function bigOpt(ic, text) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'opt bigic';
    b.innerHTML = `<span class="ic">${ic || ''}</span><span class="ot"></span><span class="om"></span>`;
    b.querySelector('.ot').textContent = text;
    return b;
  }
  function optButton(i, text) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'opt';
    b.innerHTML = `<span class="on">${['①', '②', '③', '④', '⑤', '⑥'][i]}</span><span class="ot"></span><span class="om"></span>`;
    b.querySelector('.ot').textContent = text;
    return b;
  }
  // 고르기 (한 개 정답): opts [{ic,t,ok,fb}]
  function choiceRow(root, opts, onRight, cls = '') {
    const grid = document.createElement('div'); grid.className = 'opts n' + opts.length + ' ' + cls; root.appendChild(grid);
    let done = false;
    opts.forEach((o) => {
      const b = bigOpt(o.ic, o.t); grid.appendChild(b);
      b.onclick = () => {
        if (done || b.disabled) return;
        if (o.ok) { done = true; b.classList.add('right'); b.querySelector('.om').textContent = '✔'; grid.querySelectorAll('.opt').forEach((x) => { if (x !== b) x.disabled = true; }); onRight(b); }
        else { b.classList.add('wrong'); b.disabled = true; b.querySelector('.om').textContent = '✗'; wrong(); feedback(root, false, o.fb); }
      };
    });
    return grid;
  }

  // ---- 끌어서 놓기 (터치·마우스 공통). 살짝 누르면 '고르기'로 동작해요 ----
  function makeDrag(el, opt) {
    el.addEventListener('pointerdown', (e) => {
      if (el.disabled || el.classList.contains('locked') || (opt.enabled && !opt.enabled())) return;
      if (e.button !== undefined && e.button > 0) return;
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY, r = el.getBoundingClientRect();
      let moved = false, ghost = null, over = null;
      const targetAt = (x, y) => { const hit = document.elementsFromPoint(x, y); return opt.targets().find((t) => hit.some((h) => t === h || t.contains(h))) || null; };
      const move = (ev) => {
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) {
          moved = true; ghost = el.cloneNode(true); ghost.classList.add('dragghost'); ghost.removeAttribute('id');
          ghost.style.width = r.width + 'px'; ghost.style.height = r.height + 'px'; document.body.appendChild(ghost); el.classList.add('dragging');
        }
        if (!moved) return;
        ghost.style.left = (ev.clientX - (sx - r.left)) + 'px'; ghost.style.top = (ev.clientY - (sy - r.top)) + 'px';
        const t = targetAt(ev.clientX, ev.clientY);
        if (t !== over) { if (over) over.classList.remove('over'); over = t; if (over) over.classList.add('over'); }
      };
      const up = (ev) => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        if (over) over.classList.remove('over');
        if (moved) { ghost.remove(); el.classList.remove('dragging'); const t = ev.type === 'pointercancel' ? null : targetAt(ev.clientX, ev.clientY); if (t) opt.onDrop(t); }
        else if (opt.onTap) opt.onTap();
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });
  }
  // 그림 위에 겹치는 층 (그림 좌표 W×H 기준 %로 배치)
  function overlayScene(name, W, H) {
    const sc = sceneEl(name);
    const img = document.createElement('div'); img.className = 'hsimg';
    sc.insertBefore(img, sc.firstChild); img.appendChild(sc.querySelector('canvas'));
    const layer = document.createElement('div'); layer.className = 'hslayer'; img.appendChild(layer);
    const place = (el, x, y, w, h) => Object.assign(el.style, { left: (x / W * 100) + '%', top: (y / H * 100) + '%', width: (w / W * 100) + '%', height: (h / H * 100) + '%' });
    return { sc, img, layer, place };
  }

  const TYPES = {};

  // ================= ① 수상한 영상 탐정: 돋보기로 단서 찾기 =================
  TYPES.clues = (root, st) => {
    const W = 220, H = 128;
    const tools = document.createElement('div'); tools.className = 'tools'; root.appendChild(tools);
    const box = document.createElement('div'); box.className = 'hsbox'; root.appendChild(box);
    const { sc, layer, place } = overlayScene('tv_dog', W, H); box.appendChild(sc);
    sc.classList.add('wide');
    const notes = document.createElement('div'); notes.className = 'notes'; root.appendChild(notes);
    const found = new Set(), spotEl = {}, noteEl = {}, toolEl = {};
    for (const c of st.clues) {
      const s = document.createElement('div'); s.className = 'clue'; place(s, c.x, c.y, c.w, c.h); layer.appendChild(s); spotEl[c.id] = s;
      const t = document.createElement('button'); t.type = 'button'; t.className = 'tool'; t.textContent = c.tool; tools.appendChild(t); toolEl[c.id] = t;
      t.onclick = () => { cur.hooks.sfx.pick(); s.classList.remove('hint'); void s.offsetWidth; s.classList.add('hint'); };
      const n = document.createElement('div'); n.className = 'note';
      n.innerHTML = `<b></b><p>돋보기로 찾아요 🔍</p><span class="dojang">탐정<br>도장</span>`; n.querySelector('b').textContent = c.tool; notes.appendChild(n); noteEl[c.id] = n;
    }
    const lens = document.createElement('div'); lens.className = 'lens'; lens.innerHTML = '<i></i>'; layer.appendChild(lens);
    let lx = 0.5, ly = 0.55, drag = false;
    const setLens = () => { lens.style.left = (lx * 100) + '%'; lens.style.top = (ly * 100) + '%'; check(); };
    function check() {
      const px = lx * W, py = ly * H;
      for (const c of st.clues) {
        if (found.has(c.id)) continue;
        if (px > c.x - 6 && px < c.x + c.w + 6 && py > c.y - 6 && py < c.y + c.h + 6) reveal(c);
      }
    }
    function reveal(c) {
      found.add(c.id); cur.hooks.sfx.ok();
      spotEl[c.id].classList.add('found'); toolEl[c.id].classList.add('done'); toolEl[c.id].textContent = '✔ ' + c.tool;
      const n = noteEl[c.id]; n.classList.add('open'); n.querySelector('p').textContent = c.card; sparkle(n);
      if (found.size === st.clues.length) later(conclude, 500);
    }
    const toLens = (e) => { const r = layer.getBoundingClientRect(); lx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); ly = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); setLens(); };
    layer.addEventListener('pointerdown', (e) => { e.preventDefault(); drag = true; try { layer.setPointerCapture(e.pointerId); } catch (er) { } toLens(e); });
    layer.addEventListener('pointermove', (e) => { if (drag) toLens(e); });
    layer.addEventListener('pointerup', () => { drag = false; });
    layer.addEventListener('pointercancel', () => { drag = false; });
    setLens();
    // 오래 못 찾으면 살짝 반짝이는 힌트
    later(() => { for (const c of st.clues) if (!found.has(c.id)) spotEl[c.id].classList.add('hint'); }, 9000);
    let concluded = false;
    function conclude() {
      if (concluded) return; concluded = true;
      const h = qText(root, st.q); h.classList.add('pop');
      choiceRow(root, st.opts, () => feedback(root, true, st.explain, { title: '탐정 도장 쾅! 🔍' }), 'n3big');
      setTimeout(() => h.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    }
  };

  // ================= ① 탐정 도장: ⭕/❌ 도장 끌어다 찍기 =================
  TYPES.stamp = (root, st) => {
    let k = 0;
    const area = document.createElement('div'); area.className = 'stamparea'; root.appendChild(area);
    const show = () => {
      clearFb(root);
      const it = st.items[k];
      area.innerHTML = `<div class="oxn">${k + 1} / ${st.items.length}</div><div class="stcard" tabindex="-1"><p></p><span class="mark"></span></div>
        <div class="stamps2"><button type="button" class="stampbtn yes" data-v="1"><span>⭕</span>맞아요</button><button type="button" class="stampbtn no" data-v="0"><span>❌</span>아니에요</button></div>`;
      const card = area.querySelector('.stcard'); card.querySelector('p').textContent = it.t;
      let done = false;
      const apply = (v) => {
        if (done) return;
        const mark = card.querySelector('.mark'); mark.textContent = v ? '⭕' : '❌'; mark.className = 'mark on';
        cur.hooks.sfx.pick();
        if (v === it.ans) {
          done = true; card.classList.add('good');
          area.querySelectorAll('.stampbtn').forEach((b) => { b.disabled = true; });
          const last = k === st.items.length - 1;
          feedback(root, true, it.explain, { title: it.ans ? '맞아요! ⭕' : '맞아요! ❌가 정답', nextLabel: last ? '미션 완료! ▶' : '다음 카드 ▶', onNext: last ? nextStep : () => { k++; show(); } });
        } else {
          wrong(); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
          later(() => { mark.className = 'mark'; }, 700);
          feedback(root, false, '다시 읽고 생각해 봐요. 💡 ' + it.explain.replace(/^맞아요!\s*/, ''));
        }
      };
      area.querySelectorAll('.stampbtn').forEach((b) => makeDrag(b, { targets: () => [card], onDrop: () => apply(b.dataset.v === '1'), onTap: () => apply(b.dataset.v === '1') }));
    };
    show();
  };

  // ================= ② 소문을 멈춰라!: 떠다니는 소문 물방울 =================
  TYPES.bubbles = (root, st) => {
    const sea = document.createElement('div'); sea.className = 'sea'; root.appendChild(sea);
    sea.innerHTML = `<div class="seasrc"><img alt="" src="${PX.url('jelly', 'idle', 4)}"><span>인터넷 소문</span></div>
      <div class="friends"><img alt="" src="${PX.url('fish', 'idle', 3)}"><img alt="" src="${PX.url('fish', 'blink', 3)}"><img alt="" src="${PX.url('fish', 'idle', 3)}"><span>친구들</span><i class="shieldfx"></i></div>
      <div class="seanote" aria-live="polite"></div>`;
    for (let i = 0; i < 14; i++) { const d = document.createElement('i'); d.className = 'dot'; d.style.left = (Math.random() * 100) + '%'; d.style.animationDelay = (Math.random() * 6) + 's'; sea.appendChild(d); }
    const bar = document.createElement('div'); bar.className = 'seabar'; root.appendChild(bar);
    bar.innerHTML = `<button type="button" class="btn stopbtn">✋ 멈춰요!</button><span class="cnt">멈추고 확인한 소문 <b>0</b> / ${st.rumors.length}</span>`;
    const panel = document.createElement('div'); panel.className = 'bq'; panel.hidden = true; root.appendChild(panel);
    const B = st.rumors.map((r, i) => {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'rb';
      el.innerHTML = `<span class="ri">${r.ic}</span><span class="rt"></span>`; el.querySelector('.rt').textContent = r.t;
      sea.appendChild(el);
      return { r, i, el, x: 0.1, base: 0.2 + i * 0.29, ph: Math.random() * 6, state: 'wait', t: -1.4 - i * 2.6 };
    });
    let paused = false, handled = 0;
    const note = sea.querySelector('.seanote');
    const say = (m) => { note.textContent = m; note.classList.remove('show'); void note.offsetWidth; note.classList.add('show'); };
    const pos = (b) => { b.el.style.left = (b.x * 100) + '%'; b.el.style.top = ((b.base + Math.sin(b.ph) * 0.05) * 100) + '%'; };
    B.forEach(pos);
    animate((dt) => {
      if (paused) return;
      for (const b of B) {
        if (b.state === 'wait') { b.t += dt; if (b.t >= 0) { b.state = 'float'; b.el.classList.add('show'); } continue; }
        if (b.state !== 'float') continue;
        b.x += dt * 0.055; b.ph += dt * 1.6;
        if (b.x > 0.74) { b.x = 0.1; say('휴! 친구들에게 닿기 전에 소문이 다시 돌아왔어요. 천천히 멈춰 봐요.'); }
        pos(b);
      }
    });
    const stop = (b) => {
      if (paused || !b || b.state !== 'float') return;
      paused = true; b.state = 'stopped'; b.el.classList.add('stopped'); cur.hooks.sfx.pick();
      panel.hidden = false; panel.innerHTML = '';
      const h = document.createElement('h3'); h.className = 'qq'; h.textContent = `✋ 멈췄어요! "${b.r.t}" — 어떻게 확인할까요?`; panel.appendChild(h);
      const grid = document.createElement('div'); grid.className = 'opts n3'; panel.appendChild(grid);
      let ok = false;
      b.r.opts.forEach((o, i) => {
        const btn = optButton(i, o.t); grid.appendChild(btn);
        btn.onclick = () => {
          if (ok || btn.disabled) return;
          if (o.ok) {
            ok = true; btn.classList.add('right'); btn.querySelector('.om').textContent = '✔'; grid.querySelectorAll('.opt').forEach((x) => { x.disabled = true; });
            b.state = 'done'; b.el.classList.remove('stopped'); b.el.classList.add('done'); b.el.querySelector('.ri').textContent = '🔍';
            handled++; bar.querySelector('b').textContent = handled; sparkle(b.el);
            const last = handled === B.length;
            if (last) sea.classList.add('shielded');
            const fb = feedback(panel, true, b.r.why + (last ? ' ' + st.explain : ''), { title: last ? '친구들에게 안전 보호막! 🛡️' : '확인 완료!', nextLabel: last ? '미션 완료! ▶' : '다음 소문 멈추기 ▶', onNext: last ? nextStep : () => { panel.hidden = true; paused = false; } });
            void fb;
          } else { btn.classList.add('wrong'); btn.disabled = true; btn.querySelector('.om').textContent = '✗'; wrong(); feedback(panel, false, o.fb + ' 다른 방법을 골라 봐요.'); }
        };
      });
      setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    };
    B.forEach((b) => { b.el.addEventListener('pointerdown', (e) => { e.preventDefault(); stop(b); }); });
    bar.querySelector('.stopbtn').onclick = () => {
      const fl = B.filter((b) => b.state === 'float').sort((a, b) => b.x - a.x)[0];
      if (fl) stop(fl); else if (!paused) say('잠깐 기다려요. 소문 물방울이 곧 나타나요!');
    };
  };

  // ================= ③ 누구에게 물어볼까?: 상황 카드 배달 =================
  TYPES.deliver = (root, st) => {
    const deck = document.createElement('div'); deck.className = 'deck'; root.appendChild(deck);
    const row = document.createElement('div'); row.className = 'helpers'; root.appendChild(row);
    const H = {};
    for (const h of st.helpers) {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'helper h-' + h.id;
      el.innerHTML = `<img alt="" src="${PX.url(h.spr, 'idle', 4)}"><b></b><span class="hgot"></span><span class="hbub" hidden></span>`;
      el.querySelector('b').textContent = h.name; row.appendChild(el); H[h.id] = el;
      el.onclick = () => { if (sel) give(h.id); };
    }
    let k = 0, sel = false, busy = false;
    const names = Object.fromEntries(st.helpers.map((h) => [h.id, h.name]));
    function show() {
      clearFb(root); sel = false; busy = false;
      const c = st.cards[k];
      deck.innerHTML = `<div class="dcount">카드 ${k + 1} / ${st.cards.length}</div><div class="scard" role="button" tabindex="0"><span class="si">${c.ic}</span><span class="stx"></span><em>끌어서 배달해요 ✉️</em></div>`;
      const card = deck.querySelector('.scard'); card.querySelector('.stx').textContent = c.t;
      makeDrag(card, { targets: () => Object.values(H), onDrop: (t) => give(Object.keys(H).find((id) => H[id] === t)), onTap: () => { sel = !sel; card.classList.toggle('picked', sel); if (sel) cur.hooks.sfx.pick(); } });
    }
    function bubble(id, text, good) { Object.values(H).forEach((h) => { h.querySelector('.hbub').hidden = true; }); const b = H[id].querySelector('.hbub'); b.textContent = text; b.hidden = false; b.className = 'hbub ' + (good ? 'g' : 'n'); later(() => { b.hidden = true; }, 3800); }
    function give(id) {
      if (busy || !id) return;
      const c = st.cards[k], card = deck.querySelector('.scard');
      const okay = (c.good || []).includes(id) || (c.okay || []).includes(id);
      if (okay) {
        busy = true; card.classList.add('sent'); bubble(id, c.thanks[id], true);
        H[id].querySelector('.hgot').textContent += c.ic;
        const others = c.good.filter((x) => x !== id).map((x) => names[x]);
        const last = k === st.cards.length - 1;
        const msg = (others.length ? `${others.join('·')}에게 물어봐도 좋아요. ` : '') + (last ? st.explain : '');
        feedback(root, true, msg || '잘 배달했어요!', { title: `${names[id]}에게 잘 물어봤어요!`, nextLabel: last ? '미션 완료! ▶' : '다음 카드 ▶', onNext: last ? nextStep : () => { k++; show(); } });
      } else {
        wrong(); bubble(id, st.wrong[id] || '음, 여기는 아닌 것 같아요.', false);
        card.classList.remove('shake', 'picked'); void card.offsetWidth; card.classList.add('shake'); sel = false;
        feedback(root, false, (st.wrong[id] || '다른 사람에게 물어봐요.') + ' 카드가 돌아왔어요. 다시 배달해 봐요.');
      }
    }
    show();
  };

  // ================= ④ 사실 확인 연구소: 카드 뒤집기 → 출처 분류 → 날짜 확인 =================
  const LAB = [
    { id: 'A', cls: 'a', top: '🌐 익명 게시판', meta: '글쓴이: ??? · 날짜: 없음', text: '"내일 학교 쉰대!!!"', stamp: '출처 모름', tray: 'check' },
    { id: 'B', cls: 'b', top: '📢 바다초등학교 알림 (가상)', meta: '보낸 곳: 바다초 · 3월 14일(목) · 대상: 전교생', text: '"내일 3월 15일(금)은 정상 수업입니다."', stamp: '공식 안내', tray: 'clear' },
    { id: 'C', cls: 'c', top: '💬 친구 방울이', meta: '보낸 사람: 친구 (들은 이야기)', text: '"나도 쉬는 날이라고 들었어!"', stamp: '들은 이야기', tray: 'check' },
  ];
  const LAB_D = { id: 'D', cls: 'd', top: '📢 바다초등학교 알림 (가상)', meta: '보낸 곳: 바다초 · 작년 3월 14일 · 대상: 전교생', text: '"내일 3월 15일은 개교기념일 휴업입니다."', stamp: '공식 안내 · 작년 날짜' };
  function labCard(c) {
    const el = document.createElement('div'); el.className = 'lcard ' + c.cls; el.dataset.id = c.id;
    el.innerHTML = `<div class="lback"><b>정보 카드 ${c.id}</b><span>눌러서 뒤집기</span></div>
      <div class="lfront"><div class="ltop"></div><div class="lmeta"></div><p class="ltext"></p><span class="lstamp"></span></div>`;
    el.querySelector('.ltop').textContent = c.top; el.querySelector('.lmeta').textContent = c.meta; el.querySelector('.ltext').textContent = c.text; el.querySelector('.lstamp').textContent = c.stamp;
    return el;
  }
  TYPES.lab = (root) => {
    const h = qText(root, '① 카드를 눌러 뒤집고, 출처 도장을 확인해요.');
    const grid = document.createElement('div'); grid.className = 'lgrid'; root.appendChild(grid);
    const els = {};
    const flipped = new Set();
    for (const c of LAB) {
      const el = labCard(c); grid.appendChild(el); els[c.id] = el;
      el.addEventListener('click', () => {
        if (flipped.has(c.id)) return;
        flipped.add(c.id); el.classList.add('flip'); cur.hooks.sfx.pick();
        later(() => { el.classList.add('stamped'); cur.hooks.sfx.pick(); }, 450);
        if (flipped.size === LAB.length) later(sortPhase, 1100);
      });
    }
    function sortPhase() {
      h.textContent = '② 카드를 끌어서 알맞은 상자에 넣어요.'; h.classList.add('pop');
      const trays = document.createElement('div'); trays.className = 'trays'; root.appendChild(trays);
      trays.innerHTML = `<div class="tray" data-t="clear"><b>✅ 출처가 분명한 자료</b><div class="tin"></div></div><div class="tray" data-t="check"><b>❓ 추가 확인이 필요한 자료</b><div class="tin"></div></div>`;
      const T = [...trays.querySelectorAll('.tray')];
      let picked = null, placed = 0;
      const put = (c, tray) => {
        if (!tray) return;
        const el = els[c.id];
        if (tray.dataset.t === c.tray) {
          tray.querySelector('.tin').appendChild(el); el.classList.add('placed', 'locked'); el.classList.remove('picked'); picked = null; placed++;
          cur.hooks.sfx.pick(); sparkle(el); clearFb(root);
          if (placed === LAB.length) later(datePhase, 500);
        } else {
          wrong(); el.classList.remove('shake', 'picked'); void el.offsetWidth; el.classList.add('shake'); picked = null;
          feedback(root, false, c.tray === 'clear' ? '이 카드는 학교가 직접 보낸 공식 안내예요. 도장을 다시 보세요!' : `"${c.stamp}" 도장이에요. 누가 처음 말했는지 알 수 없으니 추가 확인이 필요해요.`);
        }
      };
      for (const c of LAB) {
        const el = els[c.id];
        makeDrag(el, { targets: () => T, onDrop: (t) => put(c, t), onTap: () => { picked = picked === c ? null : c; LAB.forEach((x) => els[x.id].classList.toggle('picked', picked === x)); } });
      }
      T.forEach((t) => t.addEventListener('click', () => { if (picked) put(picked, t); }));
      setTimeout(() => trays.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    }
    function datePhase() {
      clearFb(root);
      root.appendChild(sayBubble('penguin', '앗! 학교 알림이 하나 더 나왔어요. 두 알림의 날짜를 잘 보세요.'));
      const q = qText(root, '③ 내일 일정은 어떤 알림으로 확인할까요?'); q.classList.add('pop');
      const pair = document.createElement('div'); pair.className = 'lpair'; root.appendChild(pair);
      const bEl = labCard(LAB[1]), dEl = labCard(LAB_D);
      for (const [el, ok] of [[bEl, true], [dEl, false]]) {
        el.classList.add('flip', 'stamped', 'pickable'); pair.appendChild(el);
        el.addEventListener('click', () => {
          if (root.dataset.done) return;
          if (ok) { root.dataset.done = '1'; el.classList.add('right'); feedback(root, true, '정답! B는 학교가 보낸 공식 알림이고, 날짜(3월 14일에 보낸 "내일 3월 15일")도 맞아요. 공식 안내도 날짜와 대상을 함께 확인해요.', { title: '출처 + 날짜 확인 완료!' }); }
          else { el.classList.add('wrong'); wrong(); feedback(root, false, 'D도 학교 알림이지만 작년 날짜예요! 공식 안내도 날짜가 맞는지 꼭 확인해요.'); }
        });
      }
      setTimeout(() => q.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  };

  // ================= ④ 저울: 사람 수 vs 출처 =================
  TYPES.scale = (root, st) => {
    const sc = document.createElement('div'); sc.className = 'scale tilt-l'; root.appendChild(sc);
    sc.innerHTML = `<div class="beam"><div class="pan l"><span>🌐 쉰대!</span><span>💬 쉰대!</span><em>익명 글 + 친구 이야기</em></div><div class="pan r"><span>📢 정상 수업</span><em>학교 공식 알림</em></div></div><div class="pole"></div><div class="slabel">사람 수로만 재면… 👥 2 : 1</div>`;
    qText(root, st.q);
    choiceRow(root, st.opts, () => { sc.className = 'scale tilt-r'; sc.querySelector('.slabel').textContent = '출처로 재면! 🏷️ 공식 알림이 더 믿을 만해요'; feedback(root, true, st.explain); });
  };

  // ================= ⑤ 사진 속 비밀: 찾기 → 스티커로 가리기 → 전후 비교 → 체크리스트 =================
  const PHOTO_SPOTS = [
    { id: 'face', need: true, x: 150, y: 34, w: 52, h: 52, label: '친구 얼굴', fb: '찾았어요! 친구 얼굴은 허락 없이 공개하면 안 돼요.' },
    { id: 'tag', need: true, x: 96, y: 86, w: 60, h: 32, label: '이름표', fb: '찾았어요! 이름이 보이면 누구인지 알 수 있어요. 이름은 개인정보예요.' },
    { id: 'poster', x: 52, y: 8, w: 82, h: 66, fb: '포스터는 내 활동이에요. 잘 보이면 좋아요! 👍' },
    { id: 'plant', x: 4, y: 56, w: 32, h: 44, fb: '화분은 개인정보가 아니에요. 괜찮아요.' },
    { id: 'clock', x: 158, y: 0, w: 28, h: 26, fb: '시계는 괜찮아요.' },
    { id: 'window', x: 6, y: 6, w: 44, h: 34, fb: '창문은 괜찮아요.' },
  ];
  TYPES.photo = (root) => {
    const W = 204, H = 124;
    const h = qText(root, '① 올리기 전에 확인해야 할 곳 2군데를 눌러 찾아요.');
    const cnt = document.createElement('div'); cnt.className = 'hscount'; root.appendChild(cnt);
    const box = document.createElement('div'); box.className = 'hsbox'; root.appendChild(box);
    const { sc, layer, place } = overlayScene('share_raw', W, H); box.appendChild(sc);
    const need = PHOTO_SPOTS.filter((s) => s.need), found = new Set(), spotEl = {};
    const upd = () => { cnt.innerHTML = `찾은 곳 <b>${found.size}</b> / ${need.length}`; };
    upd();
    let phase = 1;
    for (const s of PHOTO_SPOTS) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'spot' + (s.need ? ' need' : ''); b.setAttribute('aria-label', s.label || '사진 속 물건');
      place(b, s.x, s.y, s.w, s.h); layer.appendChild(b); spotEl[s.id] = b;
      b.onclick = () => {
        if (phase === 2 && s.need) { if (pickedSticker) cover(s.id, pickedSticker); return; }
        if (phase !== 1) return;
        if (s.need) {
          if (found.has(s.id)) return;
          found.add(s.id); b.classList.add('found'); b.innerHTML = `<span>${s.label}</span>`; cur.hooks.sfx.pick(); upd();
          feedback(root, true, s.fb, { title: '찾았어요! 🔍', noNext: true });
          if (found.size === need.length) later(coverPhase, 900);
        } else { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); feedback(root, false, s.fb + ' 다른 곳을 찾아봐요.', { title: '음…' }); }
      };
    }
    // ② 스티커로 가리기
    let pickedSticker = null; const covered = {};
    function coverPhase() {
      phase = 2; clearFb(root); cnt.innerHTML = '가린 곳 <b>0</b> / 2';
      h.textContent = '② 스티커를 끌어서 친구 얼굴과 이름표를 가려요.'; h.classList.add('pop');
      const tray = document.createElement('div'); tray.className = 'stickers'; box.after(tray);
      for (const em of ['⭐', '🐚', '🌸']) {
        const s = document.createElement('button'); s.type = 'button'; s.className = 'sticker'; s.textContent = em; tray.appendChild(s);
        makeDrag(s, { targets: () => need.map((n) => spotEl[n.id]), onDrop: (t) => cover(Object.keys(spotEl).find((id) => spotEl[id] === t), em), onTap: () => { pickedSticker = em; tray.querySelectorAll('.sticker').forEach((x) => x.classList.toggle('picked', x === s)); } });
      }
      setTimeout(() => tray.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    }
    function cover(id, em) {
      if (!id || covered[id]) return;
      covered[id] = em; const el = spotEl[id];
      el.classList.add('covered'); el.innerHTML = `<i class="stk">${em}</i>`; cur.hooks.sfx.pick(); sparkle(el);
      const n = Object.keys(covered).length; cnt.innerHTML = `가린 곳 <b>${n}</b> / 2`;
      if (n === 2) later(comparePhase, 700);
    }
    // ③ 전후 비교
    function comparePhase() {
      phase = 3;
      const raw = sc.querySelector('canvas');
      const after = document.createElement('canvas'); after.width = raw.width; after.height = raw.height;
      const g = after.getContext('2d'); g.drawImage(raw, 0, 0);
      const k = raw.width / W;
      for (const s of need) {
        const cx = (s.x + s.w / 2) * k, cy = (s.y + s.h / 2) * k;
        g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(cx, cy, s.w * 0.55 * k, s.h * 0.55 * k, 0, 0, Math.PI * 2); g.fill();
        g.font = `${Math.min(s.w, s.h) * 0.95 * k}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(covered[s.id], cx, cy + 2 * k);
      }
      h.textContent = '③ 막대를 움직여 고치기 전과 후를 비교해요.';
      const cmp = document.createElement('div'); cmp.className = 'compare';
      cmp.innerHTML = '<div class="cwrap"><img class="ca" alt="고친 후"><div class="cb"><img alt="고치기 전"></div><div class="handle"></div><span class="lb l">고치기 전</span><span class="lb r">고친 후 ✨</span></div><input type="range" min="0" max="100" value="50" aria-label="전후 비교 막대">';
      cmp.querySelector('.ca').src = after.toDataURL(); cmp.querySelector('.cb img').src = raw.toDataURL();
      box.replaceWith(cmp); root.querySelector('.stickers').remove(); cnt.remove();
      const rng = cmp.querySelector('input'), cb = cmp.querySelector('.cb'), hd = cmp.querySelector('.handle');
      const setV = (v) => { cb.style.width = v + '%'; hd.style.left = v + '%'; };
      let moved = 0;
      rng.addEventListener('input', () => { setV(rng.value); if (++moved === 3) checklistPhase(); });
      const wrapEl = cmp.querySelector('.cwrap');
      let dragging = false;
      const toV = (e) => { const r = wrapEl.getBoundingClientRect(); const v = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); rng.value = v; setV(v); if (++moved === 3) checklistPhase(); };
      wrapEl.addEventListener('pointerdown', (e) => { e.preventDefault(); dragging = true; try { wrapEl.setPointerCapture(e.pointerId); } catch (er) { } toV(e); });
      wrapEl.addEventListener('pointermove', (e) => { if (dragging) toV(e); });
      wrapEl.addEventListener('pointerup', () => { dragging = false; });
      setV(50);
      h.after(cmp);
      const skip = document.createElement('button'); skip.className = 'btn small'; skip.textContent = '비교했어요 ▶'; skip.onclick = () => checklistPhase(); cmp.appendChild(skip);
    }
    // ④ 공유 전 체크리스트 + 올릴 곳
    let listed = false;
    function checklistPhase() {
      if (listed) return; listed = true;
      const sk = root.querySelector('.compare .btn'); if (sk) sk.remove();
      const q = qText(root, '④ 올리기 전 체크리스트! 하나씩 눌러 확인해요.'); q.classList.add('pop');
      const items = ['내 활동(포스터)이 잘 보이나요?', '친구 얼굴이 나오지 않나요?', '이름 등 개인정보가 보이지 않나요?', '올리기 전에 한 번 더 확인했나요?'];
      const ol = document.createElement('ol'); ol.className = 'cboard'; root.appendChild(ol);
      let n = 0;
      items.forEach((t) => {
        const li = document.createElement('li'); li.className = 'filled tap'; li.innerHTML = '<span class="cb">☐</span><span class="ct"></span><span class="cy"></span>'; li.querySelector('.ct').textContent = t; ol.appendChild(li);
        li.onclick = () => { if (li.classList.contains('yes')) return; li.classList.add('yes'); li.querySelector('.cb').textContent = '☑'; li.querySelector('.cy').textContent = '네!'; cur.hooks.sfx.pick(); if (++n === items.length) later(wherePhase, 300); };
      });
      setTimeout(() => q.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
    function wherePhase() {
      const q = qText(root, '⑤ 어디에 올릴까요?');
      choiceRow(root, [
        { ic: '🌐', t: '누구나 볼 수 있는 인터넷 게시판', fb: '모르는 사람도 볼 수 있어요. 선생님이 안내한 안전한 곳에만 올려요.' },
        { ic: '🏫', t: '선생님이 안내한 학급 게시판', ok: true },
      ], () => feedback(root, true, '📤 안전하게 올렸어요! 내 활동은 잘 보이게, 친구 얼굴과 이름은 보이지 않게, 올리기 전에 한 번 더 확인했어요.', { title: '안전한 공유 완료!' }));
      setTimeout(() => q.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  };

  // ---- 3) 상황과 도움 요청 대상 / 낱말과 뜻 연결하기 ----
  TYPES.match = (root, st) => {
    qText(root, st.q, st.hint);
    const COLORS = ['#ff7a6b', '#3f8fe8', '#2fb47a', '#b86bd6'];
    const wrapEl = document.createElement('div'); wrapEl.className = 'match'; root.appendChild(wrapEl);
    wrapEl.innerHTML = '<div class="mcol ml"></div><svg class="mlines" aria-hidden="true"></svg><div class="mcol mr"></div>';
    const L = wrapEl.querySelector('.ml'), Rr = wrapEl.querySelector('.mr'), svg = wrapEl.querySelector('svg');
    const links = {}; let sel = null, done = false;
    const lBtn = {}, rBtn = {};
    st.left.forEach((c, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mcard'; b.style.setProperty('--c', COLORS[i]);
      b.innerHTML = `<span class="mi">${c.icon}</span><span class="mt"></span><span class="mdot"></span>`; b.querySelector('.mt').textContent = c.t;
      b.onclick = () => pick('L', c.id); L.appendChild(b); lBtn[c.id] = b;
    });
    st.right.forEach((c) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mcard r';
      b.innerHTML = `<span class="mi">${c.icon}</span><span class="mt"></span><span class="mdots"></span>`; b.querySelector('.mt').textContent = c.t;
      b.onclick = () => pick('R', c.id); Rr.appendChild(b); rBtn[c.id] = b;
    });
    function pick(side, id) {
      if (done) return;
      cur.hooks.sfx.pick();
      if (!sel || sel.side === side) { sel = { side, id }; refresh(); return; }
      const lid = side === 'L' ? id : sel.id, rid = side === 'R' ? id : sel.id;
      if (st.oneToOne) for (const k in links) if (links[k] === rid) delete links[k];
      links[lid] = rid; sel = null;
      lBtn[lid].classList.remove('bad');
      refresh();
    }
    function refresh() {
      Object.values(lBtn).forEach((b) => b.classList.remove('picked')); Object.values(rBtn).forEach((b) => b.classList.remove('picked'));
      if (sel) (sel.side === 'L' ? lBtn : rBtn)[sel.id].classList.add('picked');
      Object.entries(rBtn).forEach(([rid, b]) => {
        const dots = b.querySelector('.mdots'); dots.innerHTML = '';
        st.left.forEach((c, i) => { if (links[c.id] === rid) { const d = document.createElement('i'); d.style.background = COLORS[i]; dots.appendChild(d); } });
      });
      st.left.forEach((c) => lBtn[c.id].classList.toggle('linked', !!links[c.id]));
      check.disabled = Object.keys(links).length < st.left.length;
      drawLines();
    }
    function drawLines() {
      const box = wrapEl.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`); svg.innerHTML = '';
      st.left.forEach((c, i) => {
        const rid = links[c.id]; if (!rid) return;
        const a = lBtn[c.id].getBoundingClientRect(), b = rBtn[rid].getBoundingClientRect();
        const x1 = a.right - box.left, y1 = a.top + a.height / 2 - box.top, x2 = b.left - box.left, y2 = b.top + b.height / 2 - box.top;
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`);
        p.setAttribute('stroke', COLORS[i]); p.setAttribute('stroke-width', '4'); p.setAttribute('fill', 'none'); p.setAttribute('stroke-linecap', 'round');
        svg.appendChild(p);
      });
    }
    const check = document.createElement('button'); check.className = 'btn primary check'; check.textContent = '다 이었어요 ✔'; check.disabled = true;
    root.appendChild(check);
    check.onclick = () => {
      const bad = st.left.filter((c) => !(st.good[c.id] || []).includes(links[c.id]));
      if (bad.length) {
        const c = bad[0], rid = links[c.id];
        const msg = st.fb[`${c.id}:${rid}`] || st.fb[rid] || '이 연결은 알맞지 않아요. 다시 이어 볼까요?';
        bad.forEach((b) => { lBtn[b.id].classList.add('bad'); delete links[b.id]; });
        refresh(); wrong();
        feedback(root, false, `“${c.t}” — ${msg}`);
        return;
      }
      done = true; check.disabled = true;
      Object.values(lBtn).forEach((b) => b.classList.add('good'));
      const notes = st.left.map((c) => st.note && st.note[`${c.id}:${links[c.id]}`]).filter(Boolean);
      feedback(root, true, st.explain + (notes.length ? ' ' + notes.join(' ') : ''));
    };
    const ro = new ResizeObserver(() => drawLines()); ro.observe(wrapEl);
    cur.timers.push(setInterval(() => { if (!document.body.contains(wrapEl)) ro.disconnect(); }, 1000));
    refresh();
  };

  // ---- 5) 행동 카드 순서 배열하기 ----
  TYPES.order = (root, st) => {
    qText(root, st.q, '카드를 누르면 빈칸에 차례대로 들어가요. 빈칸을 누르면 카드가 돌아가요.');
    const slots = document.createElement('div'); slots.className = 'oslots'; root.appendChild(slots);
    const deck = document.createElement('div'); deck.className = 'odeck'; root.appendChild(deck);
    const seq = [null, null, null]; let done = false;
    const cardBtn = {};
    st.cards.forEach((c) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ocard';
      b.innerHTML = `<span class="ic">${c.icon}</span><span>${c.t}</span>`;
      b.onclick = () => { if (done) return; const k = seq.indexOf(null); if (k < 0) return; seq[k] = c.id; cur.hooks.sfx.pick(); draw(); if (!seq.includes(null)) setTimeout(checkSeq, 250); };
      deck.appendChild(b); cardBtn[c.id] = b;
    });
    function draw() {
      slots.innerHTML = '';
      seq.forEach((id, i) => {
        const s = document.createElement('button'); s.type = 'button'; s.className = 'oslot' + (id ? ' full' : '');
        const c = st.cards.find((x) => x.id === id);
        s.innerHTML = `<span class="onum">${i + 1}</span>${c ? `<span class="ic">${c.icon}</span><span>${c.t}</span>` : '<span class="oempty">?</span>'}`;
        s.onclick = () => { if (done || !id) return; seq[i] = null; draw(); };
        slots.appendChild(s);
        if (i < 2) { const a = document.createElement('span'); a.className = 'oarrow'; a.textContent = '→'; slots.appendChild(a); }
      });
      for (const id in cardBtn) cardBtn[id].disabled = seq.includes(id);
    }
    function checkSeq() {
      if (seq[0] !== 'stop') {
        wrong(); feedback(root, false, '무엇이든 바로 믿거나 보내기 전에, 가장 먼저 "멈춰요"부터 해요! 카드가 돌아왔어요. 다시 놓아 봐요.');
        slots.classList.add('shake');
        setTimeout(() => { slots.classList.remove('shake'); seq.fill(null); draw(); }, 700);
        return;
      }
      done = true;
      slots.querySelectorAll('.oslot').forEach((s) => s.classList.add('good'));
      if (seq[1] === 'ask') feedback(root, true, st.explain, { title: '약속 완성! 💡' });
      else feedback(root, true, '좋아요! 먼저 멈추고 다시 찾아본 뒤 물어봐도 괜찮아요. 우리 포스터의 약속 순서는 멈춰요 → 물어봐요 → 다시 찾아봐요예요. 실제 생활에서는 두 가지를 함께 해도 좋아요.', { title: '약속 완성! 💡' });
    }
    draw();
  };

  // ---- 시작: 세 가지 약속 카드 ----
  TYPES.promise = (root) => {
    const intro = document.createElement('p'); intro.className = 'pintro';
    intro.textContent = '1차시에 만든 「AI 안전 약속 포스터」를 떠올려 봐요. 포스터가 없어도 괜찮아요! 카드를 눌러 뒤집어 봐요.';
    root.appendChild(intro);
    const P = [
      { ic: '✋', t: '멈춰요', d: '바로 믿거나 다른 사람에게 전달하지 않아요.', also: [] , cls: 'p1' },
      { ic: '🙋', t: '물어봐요', d: '부모님, 선생님처럼 믿을 만한 어른에게 물어봐요.', also: [], cls: 'p2' },
      { ic: '🔍', t: '다시 찾아봐요', d: '다른 믿을 만한 자료나 공식 안내에서도 찾아봐요.', also: [['확인해요', '누가 만들고 전달한 정보인지 살펴봐요.'], ['비교해요', '다른 곳의 정보와 비교해 봐요.']], cls: 'p3' },
    ];
    const row = document.createElement('div'); row.className = 'promises'; root.appendChild(row);
    const flipped = new Set();
    P.forEach((p, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pcard ' + p.cls;
      b.innerHTML = `<div class="pf"><span class="pn">${i + 1}</span><span class="pic">${p.ic}</span><b>${p.t}</b><em>눌러서 뒤집기</em></div>
        <div class="pb"><b>${p.ic} ${p.t}</b><p>${esc(p.d)}</p>${p.also.map(([a, d]) => `<div class="also"><span>${a}</span>${esc(d)}</div>`).join('')}</div>`;
      b.onclick = () => {
        b.classList.toggle('flip'); flipped.add(i); cur.hooks.sfx.pick();
        if (flipped.size === 3 && !root.querySelector('.slogan')) {
          const s = document.createElement('div'); s.className = 'slogan';
          s.innerHTML = '<b>진짜 같아도 한 번 더 확인해요!</b><span>멈춰요 · 물어봐요 · 다시 찾아봐요</span>';
          root.appendChild(s);
          const ok = document.createElement('button'); ok.className = 'btn primary next'; ok.textContent = cur.hooks.review ? '지도로 돌아가기 ▶' : '약속했어요! ✋';
          ok.onclick = () => { cur.hooks.sfx.ok(); close(true); };
          root.appendChild(ok);
          setTimeout(() => ok.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
        }
      };
      row.appendChild(b);
    });
  };

  // 키보드: 1~6으로 보기 고르기
  window.addEventListener('keydown', (e) => {
    if (!cur || $('quiz').hidden) return;
    if (/^Digit[1-6]$/.test(e.code)) {
      const n = +e.code.slice(5) - 1;
      const opts = [...$('qBody').querySelectorAll('.opts .opt')].filter((b) => !b.disabled);
      const all = $('qBody').querySelectorAll('.opts:last-of-type .opt');
      if (all[n] && !all[n].disabled) { e.preventDefault(); all[n].click(); } else void opts;
    }
  });

  window.Missions = { open, DEF, get current() { return cur; } };
})();
