// 바다표범 꾸미기 상점 + 옷장
// 코인은 게임 안에서만 쓰는 학습 보상이에요. 실제 결제 기능은 없어요.
(function () {
  'use strict';
  const SLOTS = [
    { id: 'head', name: '머리' }, { id: 'face', name: '얼굴' }, { id: 'neck', name: '목' }, { id: 'body', name: '의상' },
    { id: 'back', name: '등' }, { id: 'hand', name: '손·소품' }, { id: 'fx', name: '장식' },
  ];
  const ITEMS = [
    { id: 'hat', slot: 'head', name: '탐험대 모자', price: 0 },
    { id: 'flower', slot: 'head', name: '꽃 머리핀', price: 20 },
    { id: 'sailor', slot: 'head', name: '선원 모자', price: 30 },
    { id: 'star', slot: 'head', name: '별 머리띠', price: 35 },
    { id: 'glasses', slot: 'face', name: '동그란 안경', price: 25 },
    { id: 'sunglasses', slot: 'face', name: '선글라스', price: 35 },
    { id: 'ribbon', slot: 'neck', name: '빨간 리본', price: 20 },
    { id: 'scarf', slot: 'neck', name: '파란 목도리', price: 30 },
    { id: 'raincoat', slot: 'body', name: '노란 우비', price: 40 },
    { id: 'coat', slot: 'body', name: '탐정 코트', price: 50 },
    { id: 'dress', slot: 'body', name: '분홍 드레스', price: 45 },
    { id: 'bag', slot: 'back', name: '탐험 가방', price: 0 },
    { id: 'backpack', slot: 'back', name: '작은 가방', price: 35 },
    { id: 'lens', slot: 'hand', name: '돋보기', price: 25 },
    { id: 'staff', slot: 'hand', name: '조개 지팡이', price: 35 },
    { id: 'sparkle', slot: 'fx', name: '반짝이 효과', price: 50 },
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
        <div class="sprev"><div class="sstage"><img id="shopPrev" alt="내 바다표범 미리보기"></div><p id="shopPrevName" class="spn">지금 내 모습</p>
          <button type="button" class="btn small" id="shopReset">↺ 미리보기 되돌리기</button><p id="shopMsg" class="smsg" aria-live="polite"></p></div>
        <div class="slist"><div class="stabs" id="shopTabs"></div><div class="sgrid scroll" id="shopGrid"></div></div>
      </div>
      <p class="snote">코인은 미니게임을 처음 끝낼 때 받아요. 산 물건은 계속 내 것이고, 언제든 입고 벗을 수 있어요.</p>
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
  function msg(t) { const m = $('shopMsg'); m.textContent = t; clearTimeout(msgT); msgT = setTimeout(() => { m.textContent = ''; }, 3500); }
  function curWear() { return cleanWear(api.prof().wear); }
  function thumb(item) {
    if (item.slot === 'fx') return PX.sealUrl(DEFAULT_WEAR, 'happy', 2);
    const w = { head: 'none', back: 'none' }; w[item.slot] = item.id;
    return PX.sealUrl(w, 'idle', 2);
  }
  function render() {
    const p = api.prof(); if (!p) return;
    const wear = curWear();
    $('shopCoins').textContent = p.coins || 0;
    const show = preview ? Object.assign({}, wear, { [preview.slot]: preview.id }) : wear;
    $('shopPrev').src = PX.sealUrl(show, 'happy', 7);
    $('shopPrev').parentElement.classList.toggle('sparkly', show.fx === 'sparkle');
    $('shopPrevName').textContent = preview ? `미리보기: ${preview.name}` : '지금 내 모습';
    $('shopReset').hidden = !preview;
    document.querySelectorAll('#shopTabs .stab').forEach((b) => b.classList.toggle('on', b.dataset.s === tab));
    const grid = $('shopGrid'); grid.innerHTML = '';
    for (const it of ITEMS.filter((i) => i.slot === tab)) {
      const own = owns(p, it.id), on = wear[it.slot] === it.id;
      const card = document.createElement('div'); card.className = 'sitem' + (on ? ' on' : '') + (preview && preview.id === it.id ? ' pv' : '');
      card.innerHTML = `<button type="button" class="stry" aria-label="${it.name} 미리 입어 보기"><img alt="" src="${thumb(it)}"><b></b><span class="sprice"></span></button><button type="button" class="btn sact"></button>`;
      card.querySelector('b').textContent = it.name;
      card.querySelector('.sprice').textContent = it.price === 0 ? '기본 제공' : own ? '가지고 있어요' : `🪙 ${it.price}`;
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
    api.sfx.badge(); msg(`${it.name}을(를) 샀어요! 바로 입어 볼게요.`);
    equip(it, true);
  }
  function equip(it, quiet) {
    const p = api.prof(); if (!owns(p, it.id)) return;
    p.wear = Object.assign(curWear(), { [it.slot]: it.id }); preview = null;
    api.save(); api.onChange(); if (!quiet) { api.sfx.pick(); msg(`${it.name} 착용!`); }
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
