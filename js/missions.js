// AI 탐험대! 미션 내용 + 문제 화면
// 학습 기준: AI리터러시 Part3 기본 워크북(1차시 PPT 19쪽)
//  - 진짜처럼 보여도 다 진짜는 아니에요 / 멈춰요·물어봐요·다시 찾아봐요 / 확인해요·비교해요 / 올리기 전 확인
// 모든 인물·사건·학교 알림은 게임 속 '가상' 예시입니다.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NUM = ['①', '②', '③', '④', '⑤', '⑥'];
  const O = '#26344f';

  // =====================================================================
  //  미션 내용
  // =====================================================================
  const DEF = {
    intro: {
      zone: '🏅 AI 탐험대 인증 센터', title: '우리 탐험대의 세 가지 약속', npc: 'captain',
      steps: [{ type: 'promise' }],
    },

    // ---------------- 미션 1: 신기한 영상 해변 ----------------
    m1: {
      zone: '🎬 신기한 영상 해변', title: '미션 1 · 진짜처럼 보여도 확인해요', npc: 'octopus',
      steps: [
        {
          type: 'choice', scene: 'tv_dog',
          say: '강아지가 사람 목소리로 말하는 영상이 올라왔어요!',
          q: '이 영상을 보고 가장 먼저 어떻게 해야 할까요?',
          opts: [
            { t: '진짜라고 확신하고 친구에게 바로 보내요.', fb: '잠깐! 바로 보내면 사실이 아닐 수도 있는 내용이 퍼질 수 있어요. 먼저 멈춰요.' },
            { t: '영상을 누가 만들었는지 살펴보고 확인해요.', ok: true },
            { t: '강아지는 언제나 사람 말을 할 수 있다고 믿어요.', fb: '영상 하나만 보고 믿기에는 근거가 부족해요. 확인이 필요해요.' },
          ],
          explain: '맞아요! 영상은 편집하거나 AI로 만들 수도 있어요. 영상만 보고 바로 믿지 말고, 누가 만들었는지 확인해요.',
        },
        {
          type: 'choice',
          say: '문어 박사의 생각 질문이에요. 🤔',
          q: '진짜처럼 보이는 영상을 왜 한 번 더 확인해야 할까요?',
          opts: [
            { t: '이상해 보이는 영상은 모두 AI가 만든 가짜라서', fb: '이상해 보여도 진짜로 찍은 영상일 수 있어요. 겉모습만으로는 알 수 없어서 확인하는 거예요.' },
            { t: '영상은 전부 거짓말이라서', fb: '모든 영상이 거짓은 아니에요. 진짜인지 아닌지 모를 때 확인하는 거예요.' },
            { t: 'AI나 편집으로 진짜처럼 만들 수 있어서', ok: true },
            { t: '진짜처럼 보이면 진짜라서 확인할 필요가 없어요', fb: '진짜처럼 보여도 만든 것일 수 있어요. 그래서 한 번 더 확인해요.' },
          ],
          explain: '정답! 진짜처럼 보여도 만든 것일 수 있고, 이상해 보여도 진짜일 수 있어요. 겉모습만으로는 정할 수 없으니 확인해요.',
        },
        {
          type: 'multi', scene: 'photos',
          say: '이번엔 사진이에요. 콩이의 얼굴 자리에 몽실이 얼굴이 들어간 사진이 올라왔어요.',
          q: '친구 얼굴이 바뀐 사진을 발견했어요. 어떻게 하면 좋을까요?',
          hint: '알맞은 행동을 모두 골라요. (3개)',
          opts: [
            { t: '진짜 사진이라고 바로 믿지 않아요.', ok: true },
            { t: '재미있으니까 반 단체방에 퍼뜨려요.', fb: '친구가 속상할 수 있고, 사실이 아닌 사진이 퍼질 수 있어요.' },
            { t: '친구 얼굴이 허락 없이 쓰였는지 걱정하고 친구 마음을 생각해요.', ok: true },
            { t: '부모님이나 선생님 같은 믿을 만한 어른에게 알려요.', ok: true },
          ],
          explain: '잘했어요! 얼굴이 바뀐 사진은 사람을 속이거나 친구를 속상하게 할 수 있어요. 바로 믿지 말고, 믿을 만한 어른에게 알려요.',
        },
        {
          type: 'ox',
          say: '마지막은 문어 박사의 O·X 퀴즈예요!',
          items: [
            { t: 'AI는 진짜처럼 보이는 사진이나 영상을 만들 수 있어요.', ans: true, explain: '맞아요! 그래서 진짜 같아도 한 번 더 확인해요.', fb: 'AI는 진짜 같은 사진과 영상을 만들 수 있어요.' },
            { t: 'AI로 만든 그림이나 영상은 모두 나쁜 거예요.', ans: false, explain: '맞아요! AI로 만든 것도 공부나 그림 그리기에 쓸모 있게 쓸 수 있어요. 진짜인 척 사람을 속이는 것이 문제예요.', fb: 'AI로 만든 것이 모두 나쁜 건 아니에요. 쓸모 있게 쓰이기도 해요.' },
            { t: '화면에서 이상한 점을 하나 찾으면, AI가 만든 것이라고 확실히 알 수 있어요.', ans: false, explain: '맞아요! 이상한 점만으로는 확실히 알 수 없어요. 누가 만들었는지, 다른 곳에서도 확인해요.', fb: '이상한 점 하나로는 확실히 알 수 없어요. 그래서 출처를 확인해요.' },
            { t: '실제로 찍은 사진도 잘못된 설명과 함께 퍼질 수 있어요.', ans: true, explain: '맞아요! 진짜 사진이어도 설명이 틀릴 수 있어요. 그래서 내용도 확인해요.', fb: '진짜로 찍은 사진에도 틀린 설명이 붙을 수 있어요.' },
          ],
        },
      ],
    },

    // ---------------- 미션 2: 질문하는 마을 ----------------
    m2: {
      zone: '🏘️ 질문하는 마을', title: '미션 2 · 모르면 물어봐요', npc: 'turtle',
      steps: [
        {
          type: 'match',
          say: '상황 카드와 도움을 줄 사람 카드를 선으로 이어 봐요.',
          q: '어떤 상황에서 누구에게 물어보면 좋을까요?',
          hint: '왼쪽 상황을 누른 다음, 오른쪽 카드를 눌러 이어요. 같은 카드를 여러 번 써도 돼요.',
          left: [
            { id: 'a', icon: '🖼️', t: '친구 얼굴이 바뀐 사진이 올라왔어요.' },
            { id: 'b', icon: '🏫', t: '"내일 학교 쉰대!" 라는 소문을 들었어요.' },
            { id: 'c', icon: '🐶', t: '말하는 강아지 영상이 진짜인지 궁금해요.' },
          ],
          right: [
            { id: 'parent', icon: '👨‍👩‍👧', t: '부모님' },
            { id: 'teacher', icon: '🧑‍🏫', t: '선생님' },
            { id: 'notice', icon: '📢', t: '학교 공식 알림' },
            { id: 'stranger', icon: '💬', t: '처음 보는 사람의 댓글' },
          ],
          good: { a: ['parent', 'teacher'], b: ['teacher', 'notice', 'parent'], c: ['parent', 'teacher'] },
          fb: {
            stranger: '누가 썼는지 모르는 댓글은 믿을 만한 도움이 아니에요. 믿을 만한 어른에게 물어봐요.',
            'a:notice': '학교 알림은 학교 일정을 알려 주는 곳이에요. 친구 사진 일은 부모님이나 선생님께 알려요.',
            'c:notice': '학교 알림은 학교 일정을 알려 주는 곳이에요. 영상이 궁금할 땐 부모님이나 선생님께 물어봐요.',
          },
          note: { 'b:parent': '부모님께 여쭤봐도 좋아요. 부모님과 함께 학교 알림을 확인해요.' },
          explain: '잘 이었어요! 학교 일정은 선생님과 학교 공식 알림으로, 이상한 사진이나 영상은 부모님·선생님 같은 믿을 만한 어른에게 물어봐요.',
        },
        {
          type: 'choice', sayWho: 'fish',
          say: '얘들아! 인터넷에서 내일 학교 쉰다고 했어! 빨리 다 알려 주자!',
          q: '소문을 전하는 물고기에게 뭐라고 말해 주면 좋을까요?',
          opts: [
            { t: '와! 다른 친구들에게도 빨리 알려 줄게!', fb: '확인하지 않은 소문을 퍼뜨리면 친구들이 헷갈릴 수 있어요. 먼저 멈춰요.' },
            { t: '인터넷에 올라왔으니까 분명히 진짜야!', fb: '인터넷에 올라왔다고 모두 사실은 아니에요. 누가 쓴 글인지 확인해야 해요.' },
            { t: '소문은 무조건 거짓말이야! 신경 쓰지 마.', fb: '아직 확인하지 않았으니 거짓이라고 정할 수도 없어요. 지금은 "확인이 필요한 소문"이에요.' },
            { t: '잠깐! 선생님께 여쭤보고 학교 알림도 확인해 보자.', ok: true },
          ],
          explain: '맞아요! 진짜인지 거짓인지 아직 모를 땐 퍼뜨리지 말고 먼저 확인해요. "확인이 필요하다"와 "거짓이다"는 서로 달라요.',
        },
        {
          type: 'match', oneToOne: true,
          say: '거북 선생님의 낱말 공부! 비슷한 뜻을 가진 말끼리 이어 봐요.',
          q: '같은 뜻끼리 선으로 이어요.',
          hint: '왼쪽 낱말을 누른 다음, 알맞은 뜻을 눌러요.',
          left: [
            { id: 'stop', icon: '✋', t: '멈춰요' },
            { id: 'check', icon: '🔎', t: '확인해요' },
            { id: 'compare', icon: '⚖️', t: '비교해요' },
          ],
          right: [
            { id: 'r2', icon: '👀', t: '누가 만들었는지 봐요.' },
            { id: 'r3', icon: '📚', t: '다른 곳에서도 봐요.' },
            { id: 'r1', icon: '🙅', t: '바로 믿지 않아요.' },
          ],
          good: { stop: ['r1'], check: ['r2'], compare: ['r3'] },
          fb: {},
          explain: '훌륭해요! 멈춰요는 바로 믿지 않기, 확인해요는 누가 만들고 전달했는지 보기, 비교해요는 다른 곳의 정보와 견주어 보기예요.',
        },
      ],
    },

    // ---------------- 미션 3: 사실 확인 도서관 ----------------
    m3: {
      zone: '📚 사실 확인 도서관', title: '미션 3 · 출처를 확인하고 비교해요', npc: 'penguin',
      virtual: true,
      steps: [
        {
          type: 'sources',
          say: '"내일 학교 쉬는 날이래!" 이 말이 맞는지 자료 세 장을 살펴봐요.',
          q: '먼저 🔍 버튼을 눌러 자료마다 누가 만들었는지 확인해요.',
          q2: '학교 일정을 확인하기에 가장 알맞은 자료는 무엇일까요?',
          answer: 'B',
          fb: { A: '누가 썼는지 알 수 없는 글이에요. 학교 일정의 근거로 삼기 어려워요.', C: '친구도 어디선가 들은 이야기예요. 직접 확인한 정보가 아닐 수 있어요.' },
          explain: '정답! 학교 일정은 학교가 직접 보낸 공식 알림이 가장 알맞아요. 알림에 적힌 날짜가 "내일"과 맞는지도 함께 확인해요.',
        },
        {
          type: 'choice', scene: 'mini_sources',
          say: '게시글과 친구 메시지가 똑같이 "쉬는 날"이라고 말하고 있어요.',
          q: '두 곳에서 같은 말을 했으니 사실이라고 정해도 될까요?',
          opts: [
            { t: '네, 두 번이나 들었으니 사실이에요.', fb: '친구도 같은 게시글을 보고 말했을 수 있어요. 같은 소문을 여러 번 들어도 근거가 늘어나는 건 아니에요.' },
            { t: '아니요, 누가 만든 정보인지 확인하고 공식 자료와 비교해야 해요.', ok: true },
          ],
          explain: '맞아요! 여러 사람이 말해도 출처가 같은 소문일 수 있어요. 누가 만든 정보인지 확인하고, 공식 자료와 비교해요.',
        },
        {
          type: 'multi', scene: 'mini_sources',
          say: '게시글은 "쉰다", 학교 알림은 "정상 수업"이래요. 정보가 서로 달라요!',
          q: '서로 다른 정보가 있을 때 어떻게 하면 좋을까요?',
          hint: '알맞은 것을 모두 골라요. (2개)',
          opts: [
            { t: '더 많은 사람이 말한 쪽을 믿어요.', fb: '많은 사람이 말해도 틀릴 수 있어요. 출처가 믿을 만한지가 중요해요.' },
            { t: '학교 공식 알림의 날짜와 내용을 확인해요.', ok: true },
            { t: '단체방에 먼저 올려서 친구들에게 물어봐요.', fb: '확인하기 전에 올리면 소문이 더 퍼질 수 있어요. 믿을 만한 어른과 공식 자료로 확인해요.' },
            { t: '선생님께 여쭤봐요.', ok: true },
          ],
          explain: '훌륭해요! 서로 다른 정보가 있으면 학교 공식 알림(날짜도 꼭!)과 선생님의 안내로 확인해요. 이것이 "다시 찾아봐요"와 "비교해요"예요.',
        },
      ],
    },

    // ---------------- 미션 4: 안전한 공유 광장 ----------------
    m4: {
      zone: '📷 안전한 공유 광장', title: '미션 4 · 올리기 전에 한 번 더', npc: 'jelly',
      steps: [
        {
          type: 'hotspot', scene: 'share_raw',
          say: '바다표범이 만든 포스터를 사진으로 찍었어요. 그런데 사진에 다른 것도 찍혔어요!',
          q: '사진을 올리기 전에 확인해야 할 부분 2곳을 눌러 찾아요.',
          spots: [
            { id: 'face', need: true, x: 152, y: 36, w: 48, h: 48, label: '친구 얼굴', fb: '찾았어요! 친구 얼굴이 나왔어요. 친구 얼굴은 허락 없이 공개하면 안 돼요.' },
            { id: 'tag', need: true, x: 96, y: 88, w: 58, h: 30, label: '이름표', fb: '찾았어요! 이름이 보이면 누구인지 알 수 있어요. 이름도 소중한 개인정보예요.' },
            { id: 'poster', x: 52, y: 8, w: 82, h: 66, fb: '포스터는 내 활동이에요. 잘 보이면 좋아요! 👍 다른 곳을 찾아봐요.' },
            { id: 'plant', x: 4, y: 56, w: 32, h: 44, fb: '화분은 괜찮아요. 개인정보가 아니에요. 다른 곳을 찾아봐요.' },
            { id: 'clock', x: 158, y: 0, w: 28, h: 26, fb: '시계는 괜찮아요. 다른 곳을 찾아봐요.' },
            { id: 'window', x: 6, y: 6, w: 44, h: 34, fb: '창문은 괜찮아요. 다른 곳을 찾아봐요.' },
          ],
          explain: '모두 찾았어요! 사진에 친구 얼굴과 이름표가 함께 찍혀 있었어요.',
        },
        {
          type: 'choice', scene: 'share_raw_small',
          say: '친구 얼굴과 이름표가 찍힌 사진이에요.',
          q: '이 사진을 어떻게 할까요?',
          opts: [
            { t: '그대로 바로 올려요.', fb: '친구 얼굴과 이름이 그대로 공개돼요. 올리기 전에 한 번 더 확인해요.' },
            { t: '친구 얼굴이나 이름이 드러나지 않게 고치고, 공유해도 되는지 확인해요.', ok: true },
          ],
          explain: '맞아요! 내 활동만 잘 보이게 다시 찍거나, 친구 얼굴과 이름표가 보이지 않게 고쳐요. 꼭 올려야 하는 사진인지도 생각해요.',
          afterScene: 'share_fixed',
        },
        {
          type: 'checklist', scene: 'share_fixed',
          say: '고친 사진이에요! 이제 올리기 전에 마지막으로 확인해요.',
          q: '공유 전 체크리스트를 완성해요. 알맞은 질문 4개를 골라 넣어요.',
          pool: [
            { t: '내 활동이 잘 보이나요?', ok: true },
            { t: '"좋아요"를 많이 받을 수 있나요?', fb: '"좋아요" 수보다 안전이 먼저예요.' },
            { t: '친구 얼굴이 나오지 않나요?', ok: true },
            { t: '이름 등 개인정보가 보이지 않나요?', ok: true },
            { t: '친구 이름을 크게 써서 누군지 알려 줬나요?', fb: '이름은 개인정보예요. 사진에 보이지 않게 해요.' },
            { t: '공유해도 되는 내용인지, 선생님이 안내한 곳인지 확인했나요?', ok: true },
          ],
          explain: '체크리스트가 모두 "네!"예요. 이제 선생님이 안내한 곳에 안전하게 올릴 수 있어요!',
        },
      ],
    },

    // ---------------- 미션 5: 최종 시험 ----------------
    m5: {
      zone: '🏅 AI 탐험대 인증 센터', title: '최종 시험 · 등대의 불을 켜요', npc: 'captain', lamps: true,
      steps: [
        {
          type: 'yesno',
          say: '첫 번째 등불이에요!',
          q: 'AI가 만든 영상이 실제처럼 보일 수 있나요?',
          yes: '네, 그럴 수 있어요', no: '아니요, 그럴 수 없어요', ans: true,
          fb: 'AI는 진짜처럼 보이는 영상을 만들 수 있어요. 그래서 확인이 필요해요.',
          explain: '맞아요. AI가 만든 영상도 실제처럼 보일 수 있어요. 그래서 진짜 같아도 한 번 더 확인해요.',
        },
        {
          type: 'choice',
          say: '두 번째 등불이에요!',
          q: '인터넷에 올라온 내용을 보고 깜짝 놀랐어요. 바로 친구에게 보내도 될까요?',
          opts: [
            { t: '바로 보내요. 놀라운 소식은 빨리 알려야 해요.', fb: '확인하지 않고 보내면 사실이 아닌 내용이 퍼질 수 있어요.' },
            { t: '댓글이 많으니까 진짜예요. 보내요.', fb: '댓글이나 조회수가 많아도 사실이라는 근거는 아니에요.' },
            { t: '바로 보내지 않고, 먼저 멈춰서 확인해요.', ok: true },
            { t: 'AI가 만든 것 같으면 무조건 거짓이라고 알려요.', fb: 'AI가 만들었는지, 거짓인지는 겉모습만으로 정할 수 없어요. 먼저 확인해요.' },
          ],
          explain: '맞아요! 놀라운 내용일수록 바로 보내지 말고 먼저 멈춰서 확인해요.',
        },
        {
          type: 'multi',
          say: '세 번째 등불이에요!',
          q: '모르는 정보를 확인하고 싶을 때 할 수 있는 행동 두 가지는 무엇일까요?',
          hint: '알맞은 것을 모두 골라요. (2개)',
          opts: [
            { t: '믿을 만한 어른에게 물어봐요.', ok: true },
            { t: '가장 먼저 본 글을 그대로 믿어요.', fb: '먼저 봤다고 맞는 정보는 아니에요.' },
            { t: '친구 여러 명에게 퍼뜨려서 반응을 봐요.', fb: '확인하기 전에 퍼뜨리면 소문이 커질 수 있어요.' },
            { t: '공식 자료나 다른 믿을 만한 자료에서 다시 찾아봐요.', ok: true },
          ],
          explain: '정답! 믿을 만한 어른에게 물어보고, 공식 자료나 다른 믿을 만한 자료에서 다시 찾아봐요.',
        },
        {
          type: 'yesno',
          say: '네 번째 등불이에요!',
          q: '친구의 얼굴이 나온 사진을 친구 허락 없이 공유해도 될까요?',
          yes: '네, 괜찮아요', no: '아니요, 안 돼요', ans: false,
          fb: '친구 얼굴은 친구의 소중한 개인정보예요. 허락 없이 공유하면 친구가 속상할 수 있어요.',
          explain: '맞아요! 친구 얼굴이나 이름은 허락 없이 공개하지 않아요.',
        },
        {
          type: 'order',
          say: '마지막 등불이에요! 우리 탐험대의 약속을 완성해요.',
          q: '세 가지 행동 카드를 차례대로 놓아 약속을 완성해요.',
          cards: [
            { id: 'search', icon: '🔍', t: '다시 찾아봐요' },
            { id: 'stop', icon: '✋', t: '멈춰요' },
            { id: 'ask', icon: '🙋', t: '물어봐요' },
          ],
          explain: '완성! 멈춰요 → 물어봐요 → 다시 찾아봐요. 실제 생활에서는 어른에게 물어보면서 함께 다시 찾아봐도 좋아요.',
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
        RR(32, 15, 46, 11, 5, 'rgba(38,52,79,.75)'); Tx('▶ 인기 영상', 55, 20.8, 6.4, '#ffffff');
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
  //  문제 화면 엔진
  // =====================================================================
  let cur = null;
  function open(id, hooks) {
    const def = DEF[id];
    cur = { id, def, hooks, i: 0, t0: performance.now(), timers: [], locked: false };
    $('qNpc').src = PX.url(def.npc, 'idle', 5);
    $('qZone').textContent = def.zone;
    $('qTitle').textContent = def.title;
    $('quiz').hidden = false;
    $('quiz').classList.toggle('lamps', !!def.lamps);
    renderStep();
  }
  function close(done) {
    if (!cur) return;
    for (const t of cur.timers) clearInterval(t);
    $('quiz').hidden = true; $('qBody').innerHTML = '';
    const c = cur; cur = null;
    if (done) c.hooks.onFinish && c.hooks.onFinish({ secs: (performance.now() - c.t0) / 1000 });
    else c.hooks.onClose && c.hooks.onClose();
  }
  $('qClose').onclick = () => {
    if (!cur) return;
    if (cur.id === 'intro' && !cur.hooks.review) { if (!window.confirm('약속 카드를 나중에 볼까요? 탐험대장에게 다시 말을 걸면 이어서 할 수 있어요.')) return; }
    else if (cur.id !== 'intro' && !window.confirm('지도로 돌아갈까요?\n이 미션은 다음에 처음부터 다시 해요.')) return;
    close(false);
  };
  function wrong() { if (cur && cur.hooks.onWrong) cur.hooks.onWrong(); cur.hooks.sfx.no(); }
  function nextStep() {
    for (const t of cur.timers) clearInterval(t); cur.timers = [];
    cur.i++;
    if (cur.i >= cur.def.steps.length) { close(true); return; }
    renderStep();
  }
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
    if (cur.def.virtual) { const v = document.createElement('div'); v.className = 'vnote'; v.textContent = '📌 게임 속 가상 학습 사례예요. 실제 학교의 일정이 아니에요.'; root.appendChild(v); }
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
  }
  function sceneEl(name) { return SCENES[name](cur.timers); }
  // 피드백 상자: ok면 '다음' 버튼
  function feedback(root, ok, text, opts = {}) {
    let fb = root.querySelector('.fb');
    if (!fb) { fb = document.createElement('div'); fb.className = 'fb'; root.appendChild(fb); }
    fb.className = 'fb ' + (ok ? 'ok' : 'no');
    fb.innerHTML = `<img alt="" src="${PX.url('hero', ok ? 'happy' : 'think', 4)}"><div class="fbt"><b>${ok ? (opts.title || '정답이에요!') : '다시 생각해 봐요'}</b><p></p></div>`;
    fb.querySelector('p').textContent = text;
    if (opts.scene) fb.querySelector('.fbt').appendChild(sceneEl(opts.scene));
    if (ok) {
      cur.hooks.sfx.ok();
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
  function optButton(i, text) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'opt';
    b.innerHTML = `<span class="on">${NUM[i]}</span><span class="ot"></span><span class="om"></span>`;
    b.querySelector('.ot').textContent = text;
    return b;
  }

  const TYPES = {};

  // ---- 1) 상황 보고 알맞은 행동 고르기 ----
  TYPES.choice = (root, st) => {
    if (st.scene) root.appendChild(sceneEl(st.scene));
    qText(root, st.q, st.hint);
    const grid = document.createElement('div'); grid.className = 'opts n' + st.opts.length; root.appendChild(grid);
    let done = false;
    st.opts.forEach((o, i) => {
      const b = optButton(i, o.t); grid.appendChild(b);
      b.onclick = () => {
        if (done || b.disabled) return;
        if (o.ok) {
          done = true; b.classList.add('right'); b.querySelector('.om').textContent = '✔';
          grid.querySelectorAll('.opt').forEach((x) => { if (x !== b) x.disabled = true; });
          feedback(root, true, st.explain, { scene: st.afterScene });
        } else {
          b.classList.add('wrong'); b.disabled = true; b.querySelector('.om').textContent = '✗';
          wrong(); feedback(root, false, o.fb + ' 다른 답을 골라 볼까요?');
        }
      };
    });
  };

  // ---- 1-2) 알맞은 것 모두 고르기 ----
  TYPES.multi = (root, st) => {
    if (st.scene) root.appendChild(sceneEl(st.scene));
    qText(root, st.q, st.hint);
    const grid = document.createElement('div'); grid.className = 'opts multi n' + st.opts.length; root.appendChild(grid);
    const sel = new Set(); let done = false;
    const btns = st.opts.map((o, i) => {
      const b = optButton(i, o.t); b.setAttribute('aria-pressed', 'false'); b.querySelector('.on').textContent = '☐'; grid.appendChild(b);
      b.onclick = () => {
        if (done) return;
        cur.hooks.sfx.pick();
        if (sel.has(i)) sel.delete(i); else sel.add(i);
        b.classList.toggle('sel', sel.has(i)); b.setAttribute('aria-pressed', sel.has(i) ? 'true' : 'false');
        b.querySelector('.on').textContent = sel.has(i) ? '☑' : '☐';
        b.classList.remove('wrong'); b.querySelector('.om').textContent = '';
      };
      return b;
    });
    const need = st.opts.filter((o) => o.ok).length;
    const check = document.createElement('button'); check.className = 'btn primary check'; check.textContent = '다 골랐어요 ✔';
    root.appendChild(check);
    check.onclick = () => {
      if (done) return;
      if (!sel.size) { feedback(root, false, '먼저 알맞은 행동을 골라 주세요.'); return; }
      const bad = [...sel].filter((i) => !st.opts[i].ok);
      if (bad.length) {
        bad.forEach((i) => { btns[i].classList.add('wrong'); btns[i].querySelector('.om').textContent = '✗'; });
        wrong(); feedback(root, false, st.opts[bad[0]].fb + ' ✗ 표시한 것을 빼고 다시 골라 봐요.');
        return;
      }
      if (sel.size < need) { wrong(); feedback(root, false, `좋은 행동을 골랐어요! 그런데 알맞은 행동이 ${need - sel.size}개 더 있어요. 더 찾아볼까요?`); return; }
      done = true; check.disabled = true;
      btns.forEach((b, i) => { if (st.opts[i].ok) { b.classList.add('right'); b.querySelector('.om').textContent = '✔'; } else b.disabled = true; });
      feedback(root, true, st.explain);
    };
  };

  // ---- 1-3) 네 / 아니요 ----
  TYPES.yesno = (root, st) => {
    qText(root, st.q);
    const grid = document.createElement('div'); grid.className = 'opts yn'; root.appendChild(grid);
    let done = false;
    [[true, '⭕', st.yes], [false, '❌', st.no]].forEach(([v, ic, t]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'opt big';
      b.innerHTML = `<span class="ic">${ic}</span><span class="ot"></span><span class="om"></span>`; b.querySelector('.ot').textContent = t;
      grid.appendChild(b);
      b.onclick = () => {
        if (done || b.disabled) return;
        if (v === st.ans) { done = true; b.classList.add('right'); b.querySelector('.om').textContent = '✔'; grid.querySelectorAll('.opt').forEach((x) => { if (x !== b) x.disabled = true; }); feedback(root, true, st.explain); }
        else { b.classList.add('wrong'); b.disabled = true; b.querySelector('.om').textContent = '✗'; wrong(); feedback(root, false, st.fb); }
      };
    });
  };

  // ---- O·X 연속 퀴즈 ----
  TYPES.ox = (root, st) => {
    let k = 0;
    const box = document.createElement('div'); box.className = 'oxbox'; root.appendChild(box);
    const show = () => {
      const it = st.items[k];
      box.innerHTML = `<div class="oxn">${k + 1} / ${st.items.length}</div><div class="oxcard"></div><div class="opts yn"></div>`;
      box.querySelector('.oxcard').textContent = it.t;
      const grid = box.querySelector('.opts'); let done = false;
      const fbOld = root.querySelector('.fb'); if (fbOld) fbOld.remove();
      [[true, '⭕', '맞아요'], [false, '❌', '아니에요']].forEach(([v, ic, t]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'opt big';
        b.innerHTML = `<span class="ic">${ic}</span><span class="ot">${t}</span><span class="om"></span>`; grid.appendChild(b);
        b.onclick = () => {
          if (done || b.disabled) return;
          if (v === it.ans) {
            done = true; b.classList.add('right'); b.querySelector('.om').textContent = '✔';
            grid.querySelectorAll('.opt').forEach((x) => { if (x !== b) x.disabled = true; });
            const last = k === st.items.length - 1;
            feedback(root, true, it.explain, { title: it.ans ? '맞아요! ⭕' : '맞아요! ❌가 정답', nextLabel: last ? '미션 완료! ▶' : '다음 문장 ▶', onNext: last ? nextStep : () => { k++; show(); } });
          } else { b.classList.add('wrong'); b.disabled = true; b.querySelector('.om').textContent = '✗'; wrong(); feedback(root, false, it.fb); }
        };
      });
    };
    show();
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

  // ---- 4·6) 자료 비교 + 출처가 분명한 자료 찾기 ----
  TYPES.sources = (root, st) => {
    const qh = document.createElement('h3'); qh.className = 'qq'; qh.textContent = st.q; root.appendChild(qh);
    const grid = document.createElement('div'); grid.className = 'srcs'; root.appendChild(grid);
    const CARDS = [
      { id: 'A', cls: 'a', top: '🌐 인터넷 게시판', meta: '글쓴이: ??? (익명) · 날짜: 없음', text: '"내일 학교 쉬는 날이래!!! 진짜임"', tag: '출처 모름', why: '누가 썼는지 알 수 없어요. 날짜도 없어요.' },
      { id: 'B', cls: 'b', top: '📢 바다초등학교 알림 (가상)', meta: '보낸 곳: 바다초등학교 · 3월 14일(목)', text: '"내일 3월 15일(금)은 정상 수업입니다."', tag: '공식 안내', why: '학교가 직접 보낸 안내예요. 날짜도 적혀 있어요.' },
      { id: 'C', cls: 'c', top: '💬 친구 방울이의 메시지', meta: '보낸 사람: 친구 방울이', text: '"나도 쉬는 날이라고 들었어!"', tag: '들은 이야기', why: '친구도 누군가에게 들은 이야기예요.' },
    ];
    const seen = new Set(); let phase = 1, done = false;
    const els = {};
    for (const c of CARDS) {
      const a = document.createElement('div'); a.className = 'src ' + c.cls;
      a.innerHTML = `<div class="sl">자료 ${c.id}</div><div class="stop"></div><div class="smeta"></div><p class="stext"></p>
        <button type="button" class="btn scheck">🔍 누가 만들었을까?</button>
        <div class="sreveal" hidden><b></b><span></span></div>
        <button type="button" class="btn spick" hidden>이 자료를 골라요</button>`;
      a.querySelector('.stop').textContent = c.top; a.querySelector('.smeta').textContent = c.meta; a.querySelector('.stext').textContent = c.text;
      a.querySelector('.sreveal b').textContent = c.tag; a.querySelector('.sreveal span').textContent = c.why;
      a.querySelector('.scheck').onclick = () => {
        cur.hooks.sfx.pick(); seen.add(c.id);
        a.querySelector('.scheck').hidden = true; a.querySelector('.sreveal').hidden = false; a.classList.add('seen');
        if (seen.size === 3 && phase === 1) toPhase2();
      };
      a.querySelector('.spick').onclick = () => choose(c);
      grid.appendChild(a); els[c.id] = a;
    }
    function toPhase2() {
      phase = 2; qh.textContent = st.q2; qh.classList.add('pop');
      for (const c of CARDS) els[c.id].querySelector('.spick').hidden = false;
      setTimeout(() => qh.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
    function choose(c) {
      if (done) return;
      const a = els[c.id];
      if (c.id === st.answer) {
        done = true; a.classList.add('right');
        for (const k in els) els[k].querySelector('.spick').disabled = true;
        feedback(root, true, st.explain);
      } else { a.classList.add('wrong'); a.querySelector('.spick').disabled = true; wrong(); feedback(root, false, st.fb[c.id]); }
    }
  };

  // ---- 2) 사진 속 확인할 부분 누르기 ----
  TYPES.hotspot = (root, st) => {
    qText(root, st.q);
    const cnt = document.createElement('div'); cnt.className = 'hscount'; root.appendChild(cnt);
    const box = document.createElement('div'); box.className = 'hsbox'; root.appendChild(box);
    const sc = sceneEl(st.scene); box.appendChild(sc);
    // 사진과 누를 곳이 정확히 겹치도록 같은 상자에 넣어요
    const img = document.createElement('div'); img.className = 'hsimg';
    sc.insertBefore(img, sc.firstChild); img.appendChild(sc.querySelector('canvas'));
    const layer = document.createElement('div'); layer.className = 'hslayer'; img.appendChild(layer);
    const W = 204, H = 124, need = st.spots.filter((s) => s.need).length, found = new Set();
    const upd = () => { cnt.innerHTML = `찾은 곳 <b>${found.size}</b> / ${need}`; };
    upd();
    for (const s of st.spots) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'spot' + (s.need ? ' need' : '');
      b.setAttribute('aria-label', s.label || '사진 속 물건');
      Object.assign(b.style, { left: (s.x / W * 100) + '%', top: (s.y / H * 100) + '%', width: (s.w / W * 100) + '%', height: (s.h / H * 100) + '%' });
      b.onclick = () => {
        if (found.size === need) return;
        if (s.need) {
          if (found.has(s.id)) return;
          found.add(s.id); b.classList.add('found'); b.innerHTML = `<span>${s.label}</span>`; cur.hooks.sfx.pick(); upd();
          if (found.size === need) feedback(root, true, st.explain);
          else feedback(root, true, s.fb, { title: '찾았어요! 🔍', nextLabel: '', onNext: null }).querySelector('.next').remove();
        } else {
          b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
          const f = feedback(root, false, s.fb); f.querySelector('b').textContent = '음…';
        }
      };
      layer.appendChild(b);
    }
  };

  // ---- 7) 공유 전 체크리스트 완성하기 ----
  TYPES.checklist = (root, st) => {
    if (st.scene) root.appendChild(sceneEl(st.scene));
    qText(root, st.q);
    const board = document.createElement('ol'); board.className = 'cboard'; root.appendChild(board);
    const need = st.pool.filter((p) => p.ok).length; const placed = [];
    for (let i = 0; i < need; i++) { const li = document.createElement('li'); li.innerHTML = '<span class="cb">☐</span><span class="ct">여기에 질문을 넣어요</span><span class="cy"></span>'; board.appendChild(li); }
    const pool = document.createElement('div'); pool.className = 'opts pool n' + st.pool.length; root.appendChild(pool);
    st.pool.forEach((p, i) => {
      const b = optButton(i, p.t); b.querySelector('.on').textContent = '＋'; pool.appendChild(b);
      b.onclick = () => {
        if (b.disabled) return;
        if (!p.ok) { b.classList.add('wrong'); b.disabled = true; b.querySelector('.om').textContent = '✗'; wrong(); feedback(root, false, p.fb + ' 다른 질문을 골라요.'); return; }
        cur.hooks.sfx.pick();
        b.disabled = true; b.classList.add('used');
        const li = board.children[placed.length]; placed.push(i);
        li.classList.add('filled'); li.querySelector('.ct').textContent = p.t;
        const fb = root.querySelector('.fb'); if (fb) fb.remove();
        if (placed.length === need) {
          pool.querySelectorAll('.opt').forEach((x) => { x.disabled = true; });
          [...board.children].forEach((li2, j) => setTimeout(() => { li2.classList.add('yes'); li2.querySelector('.cb').textContent = '☑'; li2.querySelector('.cy').textContent = '네!'; cur.hooks.sfx.pick(); }, 300 + j * 380));
          setTimeout(() => feedback(root, true, st.explain), 300 + need * 380);
        }
      };
    });
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

  // 키보드: 1~4로 보기 고르기, Enter로 다음
  window.addEventListener('keydown', (e) => {
    if (!cur || $('quiz').hidden) return;
    if (/^Digit[1-6]$/.test(e.code)) {
      const n = +e.code.slice(5) - 1;
      const opts = $('qBody').querySelectorAll('.opts .opt');
      if (opts[n] && !opts[n].disabled) { e.preventDefault(); opts[n].click(); }
    }
  });

  window.Missions = { open, DEF, get current() { return cur; } };
})();
