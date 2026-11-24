// 바다표범 꾸미기 상점 + 옷장
// 코인은 게임 안에서만 쓰는 학습 보상이에요. 실제 결제 기능은 없어요.
// 모든 아이템은 '학습 내용을 떠올리게 하는 장식'이에요. 정보가 진짜인지 자동으로 알려 주는 기능은 없어요.
(function () {
  'use strict';
  const SLOTS = [
    { id: 'head', name: '머리 장식' }, { id: 'face', name: '얼굴 장식' }, { id: 'body', name: '옷' }, { id: 'neck', name: '목 장식' },
    { id: 'back', name: '가방' }, { id: 'hand', name: '손에 드는 물건' }, { id: 'fx', name: '특별 효과' },
  ];
  // id는 첫 버전과 같아요 → 이미 산 물건이 그대로 남아요. (이름·가격만 바뀌었어요)
  const ITEMS = [
    { id: 'hat', slot: 'head', ic: '🧢', name: '탐험대 모자', price: 0, desc: '탐험대원의 기본 모자예요. 진짜 같아도 한 번 더 확인해요!', tip: '오늘도 한 번 더 확인해요!' },
    { id: 'flower', slot: 'head', ic: '🌸', name: '배려의 꽃 머리핀', price: 10, desc: '친구 얼굴과 사진을 소중히 여기는 마음을 담은 장식이에요.', tip: '친구 사진은 소중히, 허락받고!' },
    { id: 'star', slot: 'head', ic: '⭐', name: '생각 반짝 별 머리띠', price: 15, desc: '바로 믿기 전에 "진짜일까?" 한 번 더 생각하는 마음을 담았어요.', tip: '진짜일까? 한 번 더 생각해요!' },
    { id: 'alert', slot: 'head', ic: '🧢', name: '위험 탐지 모자', price: 20, desc: '수상한 정보를 만나면 잠깐 멈춰요! "멈추고 확인하기"를 기억하게 해 주는 장식이에요.', tip: '수상한 정보는 잠깐 멈춰요!' },
    { id: 'sailor', slot: 'head', ic: '⚓', name: '공식 알림 선원 모자', price: 20, desc: '학교 일정은 학교 공식 안내에서 확인해요. 날짜도 꼭 봐요!', tip: '공식 안내와 날짜를 확인해요!' },
    { id: 'phones', slot: 'head', ic: '🎧', name: '소문 차단 헤드폰', price: 20, desc: '확인하지 않은 소문은 퍼뜨리지 않아요. 그 약속을 떠올리게 하는 장식이에요.', tip: '확인 전 소문은 퍼뜨리지 않아요!' },
    { id: 'crown', slot: 'head', ic: '👑', name: 'AI 탐정 왕관', price: 35, desc: '정보의 근거를 확인하는 탐정을 위한 왕관이에요. 판단은 왕관이 아니라 내가 해요!', tip: '근거를 확인하는 멋진 탐정!' },
    { id: 'glasses', slot: 'face', ic: '👓', name: '사실 확인 안경', price: 15, desc: '정보를 한 번 더 살펴보자는 다짐을 담은 장식이에요. 확인은 안경이 아니라 내가 해요.', tip: '한 번 더 살펴봐요!' },
    { id: 'goggles', slot: 'face', ic: '🥽', name: '비교 탐험 고글', price: 20, desc: '하나의 이야기만 듣고 결정하지 않아요. 다른 믿을 만한 자료와 비교해요.', tip: '다른 곳에서도 찾아봐요!' },
    { id: 'sunglasses', slot: 'face', ic: '😎', name: '차분한 탐정 선글라스', price: 20, desc: '깜짝 놀랄 영상을 봐도 서두르지 않고 차분하게 살펴봐요.', tip: '놀라워도 차분하게!' },
    { id: 'raincoat', slot: 'body', ic: '☔', name: '소문 비 막는 우비', price: 25, desc: '소문이 비처럼 쏟아져도 먼저 확인하는 습관을 상징하는 옷이에요.', tip: '소문이 쏟아져도 먼저 확인!' },
    { id: 'vest', slot: 'body', ic: '🦺', name: '안전 탐험 조끼', price: 25, desc: '정보를 안전하게 이용하는 습관을 상징하는 조끼예요.', tip: '안전한 정보 습관!' },
    { id: 'dress', slot: 'body', ic: '👗', name: '존중의 분홍 드레스', price: 30, desc: '친구의 마음과 사진을 존중하는 마음을 담은 드레스예요.', tip: '친구 마음을 존중해요!' },
    { id: 'coat', slot: 'body', ic: '🧥', name: '근거 찾기 탐정 코트', price: 30, desc: '누가 만들었는지, 근거가 있는지 찾아보는 탐정 옷이에요.', tip: '누가 만들었는지 확인해요!' },
    { id: 'cape', slot: 'body', ic: '🦸', name: '디지털 안전 망토', price: 30, desc: '멈춰요 · 물어봐요 · 다시 찾아봐요! 세 가지 약속을 담은 망토예요.', tip: '멈춰요 · 물어봐요 · 다시 찾아봐요!' },
    { id: 'ribbon', slot: 'neck', ic: '🎀', name: '질문 요정 리본', price: 10, desc: '모르는 건 부모님이나 선생님께 물어봐요.', tip: '모르면 어른에게 물어봐요!' },
    { id: 'scarf', slot: 'neck', ic: '🧣', name: '멈춤 신호 목도리', price: 15, desc: '바로 믿거나 공유하지 않고 먼저 멈춰요. 빨간 멈춤 신호를 떠올려요.', tip: '바로 믿거나 보내지 않아요!' },
    { id: 'bag', slot: 'back', ic: '🎒', name: '탐험 가방', price: 0, desc: '탐험대원의 기본 가방이에요.', tip: '' },
    { id: 'pouch', slot: 'back', ic: '👜', name: '신중한 공유 파우치', price: 15, desc: '사진을 올리기 전에 한 번 더 확인하는 습관을 담은 파우치예요.', tip: '올리기 전에 한 번 더 확인!' },
    { id: 'backpack', slot: 'back', ic: '🔒', name: '개인정보 보호 가방', price: 20, desc: '사진을 공유하기 전에 친구 얼굴과 이름이 보이지 않는지 확인해요.', tip: '친구 얼굴과 이름을 지켜요!' },
    { id: 'lens', slot: 'hand', ic: '🔍', name: '출처 확인 돋보기', price: 15, desc: '이 정보는 누가 만들었을까요? 출처를 살펴보는 습관을 기억해요.', tip: '누가 만들었는지 확인해요!' },
    { id: 'staff', slot: 'hand', ic: '🐚', name: '질문 조개 지팡이', price: 20, desc: '혼자 판단하기 어려울 땐 믿을 만한 어른에게 물어봐요.', tip: '어려우면 물어봐요!' },
    { id: 'wand', slot: 'hand', ic: '🪄', name: '진실 찾기 별봉', price: 25, desc: '여러 자료를 비교하는 습관을 상징해요. 마법처럼 답을 알려 주지는 않아요!', tip: '여러 자료를 비교해요!' },
    { id: 'bubbles', slot: 'fx', ic: '🫧', name: '소문 멈춤 방울', price: 30, desc: '확인 전 소문은 방울 속에 멈춰 두는 모습을 표현한 효과예요.', tip: '소문은 멈추고 확인!' },
    { id: 'sparkle', slot: 'fx', ic: '✨', name: '확인 완료 반짝이', price: 35, desc: '확인하는 습관을 상징하는 반짝이 효과예요.', tip: '확인하는 습관, 반짝반짝!' },
  ];
  const BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
  const DEFAULT_WEAR = { head: 'hat', back: 'bag' };
  const FREE = ITEMS.filter((i) => i.price === 0).map((i) => i.id);

  // 받은 착용 정보 검사 (모르는 값은 버려요) — 다른 학생 화면에서도 같은 규칙을 써요
  function cleanWear(w) {
    const out = {};
    if (!w || typeof w !== 'object') return Object.assign({}, DEFAULT_WEAR);
    for (const s of SLOTS) {
      const v = w[s.id];
      if (v === 'none') out[s.id] = 'none';
      else if (typeof v === 'string' && BY_ID[v] && BY_ID[v].slot === s.id) out[s.id] = v;
    }
    for (const k in DEFAULT_WEAR) if (!out[k]) out[k] = DEFAULT_WEAR[k];
    return out;
  }
  const owns = (p, id) => FREE.includes(id) || (p.owned || []).includes(id);

  let api = null, tab = 'head', preview = null, msgT = 0;
  const $ = (id) => document.getElementById(id);

  function build() {
    const el = document.createElement('section'); el.id = 'shop'; el.className = 'screen modal'; el.hidden = true;
    el.innerHTML = `<div class="shopbox">
      <header class="shead"><h2>🛍️ 바다표범 꾸미기 상점</h2><span class="scoins">🪙 <b id="shopCoins">0</b></span><button type="button" class="qclose" id="shopClose" aria-label="상점 닫기">✕</button></header>
      <div class="sbody">
        <div class="sprev"><div class="sstage"><img id="shopPrev" alt="내 바다표범 미리보기"></div><p id="shopPrevName" class="spn">지금 내 모습</p><p id="shopColor" class="scolor"></p>
          <button type="button" class="btn small" id="shopReset">↺ 미리보기 되돌리기</button><p id="shopMsg" class="smsg" aria-live="polite"></p></div>
        <div class="slist"><div class="stabs" id="shopTabs"></div><div class="sgrid scroll" id="shopGrid"></div></div>
      </div>
      <p class="snote">🎓 아이템은 배운 내용을 떠올리게 하는 <b>장식</b>이에요. 정보가 진짜인지는 아이템이 아니라 <b>내가</b> 확인해요! · 코인은 미니게임을 처음 끝낼 때 받아요.</p>
    </div>`;
    document.body.appendChild(el);
    $('shopClose').onclick = close;
    $('shopReset').onclick = () => { preview = null; render(); };
    const tabs = $('shopTabs');
    for (const s of SLOTS) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'stab'; b.dataset.s = s.id; b.textContent = s.name;
      b.onclick = () => { tab = s.id; api.sfx.pick(); render(); }; tabs.appendChild(b);
    }
  }
  function msg(t, learn) { const m = $('shopMsg'); m.textContent = t; m.classList.toggle('learn', !!learn); clearTimeout(msgT); msgT = setTimeout(() => { m.textContent = ''; m.classList.remove('learn'); }, learn ? 5000 : 3500); }
  function curWear() { return cleanWear(api.prof().wear); }
  function thumb(item) {
    const color = api.color();
    if (item.slot === 'fx') return PX.sealUrl(DEFAULT_WEAR, 'happy', 2, color);
    const w = { head: 'none', back: 'none' }; w[item.slot] = item.id;
    return PX.sealUrl(w, 'idle', 2, color);
  }
  // 처음 사거나 처음 입을 때만 짧은 학습 문구를 보여 줘요
  function learnOnce(it) {
    const p = api.prof(); if (!it.tip) return false;
    p.tipsSeen = p.tipsSeen || [];
    if (p.tipsSeen.includes(it.id)) return false;
    p.tipsSeen.push(it.id); api.save();
    msg(`${it.ic} ${it.tip}`, true);
    return true;
  }
  function render() {
    const p = api.prof(); if (!p) return;
    const wear = curWear(), color = api.color();
    $('shopCoins').textContent = p.coins || 0;
    const show = preview ? Object.assign({}, wear, { [preview.slot]: preview.id }) : wear;
    $('shopPrev').src = PX.sealUrl(show, 'happy', 7, color);
    const st = $('shopPrev').parentElement;
    st.classList.toggle('sparkly', show.fx === 'sparkle'); st.classList.toggle('bubbly', show.fx === 'bubbles');
    $('shopPrevName').textContent = preview ? `미리보기: ${preview.name}` : '지금 내 모습';
    const c = PX.COLOR_BY_ID[color]; $('shopColor').textContent = c ? `내 몸 색: ${c.icon} ${c.name}` : '';
    $('shopReset').hidden = !preview;
    document.querySelectorAll('#shopTabs .stab').forEach((b) => b.classList.toggle('on', b.dataset.s === tab));
    const grid = $('shopGrid'); grid.innerHTML = '';
    for (const it of ITEMS.filter((i) => i.slot === tab)) {
      const own = owns(p, it.id), on = wear[it.slot] === it.id;
      const card = document.createElement('div'); card.className = 'sitem' + (on ? ' on' : '') + (preview && preview.id === it.id ? ' pv' : '');
      card.innerHTML = `<button type="button" class="stry"><img alt="" src="${thumb(it)}"><b></b><span class="sprice"></span>${it.slot === 'fx' ? `<i class="fxmark">${it.ic}</i>` : ''}</button><p class="sdesc"></p><button type="button" class="btn sact"></button>`;
      card.querySelector('.stry').setAttribute('aria-label', `${it.name} 미리 입어 보기`);
      card.querySelector('b').textContent = `${it.ic} ${it.name}`;
      card.querySelector('.sdesc').textContent = it.desc;
      card.querySelector('.sprice').textContent = it.price === 0 ? '기본 제공' : own ? '✔ 구매 완료' : `🪙 ${it.price}`;
      if (own && it.price) card.querySelector('.sprice').classList.add('owned');
      const act = card.querySelector('.sact');
      if (on) { act.textContent = '벗기'; act.classList.add('ghost'); act.onclick = () => unequip(it); }
      else if (own) { act.textContent = '입기'; act.classList.add('primary'); act.onclick = () => equip(it); }
      else if ((p.coins || 0) >= it.price) { act.textContent = `사기 🪙${it.price}`; act.classList.add('buy'); act.onclick = () => buy(it); }
      else { act.textContent = `코인 부족 (${it.price - (p.coins || 0)} 더)`; act.disabled = true; }
      card.querySelector('.stry').onclick = () => { preview = it; api.sfx.pick(); render(); };
      grid.appendChild(card);
    }
  }
  function buy(it) {
    const p = api.prof();
    if (owns(p, it.id)) { msg('이미 가지고 있어요.'); return; }          // 같은 물건 두 번 사지 않기
    if ((p.coins || 0) < it.price) { msg('코인이 부족해요. 미니게임을 해결해서 모아요!'); return; }
    p.coins -= it.price; p.owned = (p.owned || []).concat(it.id);
    p.coinLog = (p.coinLog || []).concat({ at: Date.now(), amt: -it.price, why: `${it.name} 구매` }).slice(-60);
    api.sfx.badge();
    equip(it, true);
    if (!learnOnce(it)) msg(`${it.name}을(를) 샀어요!`);
  }
  function equip(it, quiet) {
    const p = api.prof(); if (!owns(p, it.id)) return;
    p.wear = Object.assign(curWear(), { [it.slot]: it.id }); preview = null;   // 같은 자리의 아이템은 자동으로 바뀌어요
    api.save(); api.onChange();
    if (!quiet) { api.sfx.pick(); if (!learnOnce(it)) msg(`${it.name} 착용!`); }
    render();
  }
  function unequip(it) {
    const p = api.prof();
    p.wear = Object.assign(curWear(), { [it.slot]: 'none' }); preview = null;
    api.save(); api.onChange(); api.sfx.pick(); msg(`${it.name}을(를) 벗었어요.`);
    render();
  }
  function open() { preview = null; $('shop').hidden = false; render(); }
  function close() { $('shop').hidden = true; preview = null; api.onClose && api.onClose(); }

  window.Shop = {
    init(a) { api = a; build(); },
    open, close, render, ITEMS, BY_ID, SLOTS, DEFAULT_WEAR, cleanWear,
    get isOpen() { return !$('shop').hidden; },
  };
})();
