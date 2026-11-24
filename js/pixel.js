// 픽셀 아트 도구 + 캐릭터 그림
// 모든 그림은 코드로 한 점씩 만들어요 (외부 이미지 없음).
// 모양을 채운 뒤 자동으로 진한 테두리를 둘러서 선명한 윤곽을 만들어요.
(function () {
  'use strict';

  const OUT = '#26344f';   // 공통 윤곽선(진한 남색)

  function Buf(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  Buf.prototype.set = function (x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[y * this.w + x] = c; };
  Buf.prototype.get = function (x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; return this.d[y * this.w + x]; };
  Buf.prototype.rect = function (x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; };
  // 타원 채우기. onlyOn: 이미 칠해진 곳에만 칠하기(배 무늬 등)
  Buf.prototype.ell = function (cx, cy, rx, ry, c, onlyOn) {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) { if (onlyOn && !this.get(x, y)) continue; this.set(x, y, c); }
    }
    return this;
  };
  Buf.prototype.ring = function (cx, cy, r, c) {
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= r && d > r - 1.05) this.set(x, y, c);
    }
    return this;
  };
  Buf.prototype.map = function (fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.get(x, y); if (c) { const n = fn(x, y, c); if (n !== undefined) this.d[y * this.w + x] = n; } } return this; };
  Buf.prototype.px = function (list, c) { for (const [x, y] of list) this.set(x, y, c); return this; };
  // 바깥 윤곽선 (상하좌우 이웃)
  Buf.prototype.outline = function (c = OUT) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
    }
    for (const [x, y] of add) this.set(x, y, c);
    return this;
  };
  Buf.prototype.canvas = function () {
    const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h;
    const g = cv.getContext('2d');
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.d[y * this.w + x]; if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } }
    return cv;
  };

  function mirror(cv) {
    const m = document.createElement('canvas'); m.width = cv.width; m.height = cv.height;
    const g = m.getContext('2d'); g.translate(cv.width, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0); return m;
  }
  function upscale(cv, k) {
    const c = document.createElement('canvas'); c.width = cv.width * k; c.height = cv.height * k;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(cv, 0, 0, c.width, c.height); return c;
  }

  const K = '#1b2236', EYE_HI = '#ffffff', CHEEK = '#ff9fb6', MOUTH = '#7a3a4a';

  // ---------------- 바다표범 ----------------
  // frame: idle | blink | walk1 | walk2 | happy | think | clap
  const SEAL_PALETTES = {
    hero: { body: '#e3f3fc', shade: '#a9cde6', belly: '#fffaf0', hat: '#3f86e0', hatDark: '#2a5fae', badge: '#ffd84a', bag: '#f2a54a', bagDark: '#c27a2c', kind: 'explorer' },
    captain: { body: '#efe2d2', shade: '#c9b39b', belly: '#fffaf2', hat: '#ffffff', hatDark: '#2a3f6e', badge: '#f6c445', bag: null, kind: 'captain' },
  };
  // 몸통 색 14종 (파스텔이지만 배경·서로와 구분되게 조금 진하게). 눈·코·입·볼·배·윤곽선은 그대로예요.
  const SEAL_COLORS = [
    { id: 'sky', name: '하늘색', icon: '🩵', body: '#c4e4fb', shade: '#8ebfe4' },
    { id: 'blossom', name: '벚꽃 분홍', icon: '🩷', body: '#ffcfe0', shade: '#ee9fbd' },
    { id: 'lilac', name: '연보라', icon: '💜', body: '#dccdfb', shade: '#ae96e3' },
    { id: 'vanilla', name: '바닐라 노랑', icon: '💛', body: '#fff09c', shade: '#e2c55a' },
    { id: 'mint', name: '민트', icon: '💚', body: '#bdf0d6', shade: '#84d1ad' },
    { id: 'apricot', name: '살구', icon: '🧡', body: '#ffd2ab', shade: '#ecaa72' },
    { id: 'cream', name: '크림', icon: '🤍', body: '#f3e2c2', shade: '#d2b68a' },
    { id: 'lavblue', name: '라벤더 블루', icon: '💙', body: '#c3cffa', shade: '#8e9fe2' },
    { id: 'coral', name: '코랄 핑크', icon: '🌸', body: '#ffbcb0', shade: '#ec8676' },
    { id: 'sage', name: '세이지 그린', icon: '🌿', body: '#cfe3bd', shade: '#9fbe86' },
    { id: 'aqua', name: '아쿠아', icon: '🫧', body: '#b6ecee', shade: '#76cbd0' },
    { id: 'lime', name: '연두 라임', icon: '🍈', body: '#e3f3a6', shade: '#b9d065' },
    { id: 'orchid', name: '라일락 핑크', icon: '🪻', body: '#f1c6f0', shade: '#cf8fcf' },
    { id: 'cloud', name: '구름 회색', icon: '☁️', body: '#dde2ea', shade: '#aab3c2' },
  ];
  const COLOR_BY_ID = Object.fromEntries(SEAL_COLORS.map((c) => [c.id, c]));
  function heroPal(colorId) { const c = COLOR_BY_ID[colorId] || SEAL_COLORS[0]; return Object.assign({}, SEAL_PALETTES.hero, { body: c.body, shade: c.shade }); }

  // 착용 아이템(wear)을 함께 그려요. wear = { head, face, neck, body, back, hand } (fx는 지도에서 따로 그려요)
  // 그림 칸 36×32: 위쪽에 모자·머리띠, 오른쪽에 지팡이 자리를 남겨 두었어요. 발바닥은 항상 아래에서 2칸 위.
  const CLOTH = {
    raincoat: { c: '#ffd84a', d: '#e5b52a' },
    coat: { c: '#b98a5e', d: '#8f6440' },
    dress: { c: '#ff9ec0', d: '#ef78a4' },
    vest: { c: '#ffa94d', d: '#e8862a' },
  };
  function sealBuf(pal, frame, wear) {
    const b = new Buf(36, 32);
    const bob = frame === 'walk1' ? 1 : 0;
    const oy = 5 + bob;
    const P = pal;
    const W = P.kind === 'explorer' ? Object.assign({ head: 'hat', back: 'bag' }, wear || {}) : {};
    // 꼬리 지느러미
    const tailUp = frame === 'walk2' ? -1 : 0;
    b.ell(4, 20 + oy + tailUp, 3.2, 1.6, P.shade);
    b.ell(4, 23 + oy, 3.4, 1.6, P.shade);
    // 몸통 + 머리
    b.ell(14, 19 + oy, 11.5, 6.2, P.body);
    b.ell(19.5, 13 + oy, 7.6, 7, P.body);
    b.map((x, y, c) => (c === P.body && y >= 23 + oy && x < 24 ? P.shade : undefined));
    b.ell(19, 20 + oy, 6.5, 4, P.belly, true);
    b.ell(20, 17 + oy, 5.2, 2.4, P.belly, true);
    // 옷 (몸통 색 바꾸기)
    const cl = CLOTH[W.body];
    if (cl) {
      b.map((x, y, c) => {
        if (c !== P.body && c !== P.shade && c !== P.belly) return undefined;
        const torso = y >= 18 + oy || (x < 13 && y >= 14 + oy);
        if (!torso || x < 5) return undefined;
        return y >= 23 + oy || x < 9 ? cl.d : cl.c;
      });
      if (W.body === 'dress') {   // 치마 자락 + 흰 레이스
        for (let x = 6; x <= 25; x++) { b.set(x, 24 + oy, cl.d); b.set(x, 25 + oy, x % 2 ? '#ffffff' : cl.c); }
      } else if (W.body === 'coat') {   // 옷깃 + 허리띠 + 단추
        b.px([[17, 18 + oy], [18, 19 + oy], [22, 18 + oy], [21, 19 + oy]], '#e2c49a');
        b.rect(7, 21 + oy, 17, 1, '#5e3f27'); b.set(19, 21 + oy, '#ffd84a');
        b.set(20, 20 + oy, '#5e3f27'); b.set(20, 23 + oy, '#5e3f27');
      } else if (W.body === 'vest') {   // 안전 조끼: 반사띠
        b.rect(7, 20 + oy, 17, 1, '#fff6a8'); b.rect(12, 17 + oy, 1, 7, '#fff6a8'); b.rect(22, 17 + oy, 1, 6, '#fff6a8');
      } else {   // 우비 단추
        b.set(20, 20 + oy, '#2c7fd6'); b.set(20, 22 + oy, '#2c7fd6'); b.rect(15, 18 + oy, 10, 1, '#fff1a8');
      }
    }
    if (W.body === 'cape') {   // 디지털 안전 망토: 등 뒤로 흘러내린 망토 + 세 가지 약속 점
      b.ell(9, 18 + oy, 6.5, 6, '#a68af0', true); b.ell(9, 21 + oy, 6, 3, '#8a6ce0', true);
      b.rect(13, 16 + oy, 11, 2, '#7d5cd0'); b.set(19, 16 + oy, '#ffd84a');
      b.set(6, 17 + oy, '#ff8a80'); b.set(9, 16 + oy, '#ffd84a'); b.set(11, 18 + oy, '#7ad7a0');
    }
    // 앞 지느러미
    const fl = cl ? cl.d : P.shade;
    if (frame === 'happy' || frame === 'clap') {
      b.ell(11, 12 + oy, 1.8, 3.2, fl);
      if (frame === 'clap') b.ell(27, 16 + oy, 1.6, 2.6, fl);
    } else if (frame === 'think') {
      b.ell(24, 19 + oy, 2.6, 1.7, fl);
    } else {
      const fx = frame === 'walk1' ? 15 : frame === 'walk2' ? 17 : 16;
      b.ell(fx, 24 + oy, 2.8, 1.6, fl);
    }
    // 등 (가방)
    if (W.back === 'bag') {
      b.rect(6, 13 + oy, 6, 5, '#f2a54a'); b.rect(6, 13 + oy, 6, 2, '#c27a2c'); b.set(8, 15 + oy, '#ffd84a'); b.set(9, 15 + oy, '#ffd84a');
      b.px([[12, 13 + oy], [13, 14 + oy], [14, 15 + oy], [15, 16 + oy]], '#c27a2c');
    } else if (W.back === 'backpack') {
      b.rect(5, 12 + oy, 7, 7, '#c58fe0'); b.rect(5, 12 + oy, 7, 2, '#9d63c0'); b.rect(7, 16 + oy, 3, 2, '#ffd84a'); b.set(8, 15 + oy, '#ffd84a'); b.set(8, 17 + oy, '#9d63c0');
      b.px([[12, 13 + oy], [13, 14 + oy], [14, 15 + oy], [15, 16 + oy]], '#9d63c0');
    }
    if (W.back === 'pouch') {   // 신중한 공유 파우치 (어깨에 멘 작은 가방)
      b.px([[13, 15 + oy], [14, 16 + oy], [15, 17 + oy], [16, 18 + oy], [17, 19 + oy]], '#c2558a');
      b.rect(16, 20 + oy, 6, 4, '#ff9ec0'); b.rect(16, 20 + oy, 6, 1, '#e0709e'); b.set(18, 21 + oy, '#ffffff'); b.set(19, 21 + oy, '#ffffff');
    }
    // 눈
    const eyes = [[16, 11 + oy], [22, 11 + oy]];
    for (const [ex, ey] of eyes) {
      if (frame === 'blink') { b.rect(ex, ey + 2, 2, 1, K); }
      else if (frame === 'happy' || frame === 'clap') { b.px([[ex - 1, ey + 2], [ex, ey + 1], [ex + 1, ey + 1], [ex + 2, ey + 2]], K); }
      else { b.rect(ex, ey, 2, 3, K); b.set(frame === 'think' ? ex + 1 : ex, ey, EYE_HI); }
    }
    b.rect(14, 15 + oy, 2, 1, CHEEK); b.rect(24, 15 + oy, 2, 1, CHEEK);
    b.rect(19, 14 + oy, 2, 1, '#3a2a35');
    if (frame === 'happy' || frame === 'clap') { b.rect(19, 16 + oy, 2, 1, MOUTH); b.set(18, 15 + oy, MOUTH); b.set(21, 15 + oy, MOUTH); }
    else if (frame === 'think') { b.rect(19, 16 + oy, 2, 1, MOUTH); }
    else { b.set(18, 15 + oy, MOUTH); b.set(21, 15 + oy, MOUTH); b.rect(19, 15 + oy, 2, 1, MOUTH); }
    b.set(17, 16 + oy, '#9fb5c8'); b.set(22, 16 + oy, '#9fb5c8');
    // 목
    if (W.neck === 'ribbon') {
      b.rect(16, 17 + oy, 3, 3, '#ff5a5a'); b.rect(21, 17 + oy, 3, 3, '#ff5a5a'); b.rect(19, 18 + oy, 2, 1, '#d63c3c'); b.set(17, 18 + oy, '#ff9a9a'); b.set(22, 18 + oy, '#ff9a9a');
    } else if (W.neck === 'scarf') {
      for (let x = 13; x < 26; x++) { b.set(x, 17 + oy, x % 3 === 0 ? '#ffffff' : '#ff5a5a'); b.set(x, 18 + oy, '#d63c3c'); }
      b.rect(14, 19 + oy, 2, 4, '#ff5a5a'); b.set(14, 20 + oy, '#ffffff'); b.set(15, 20 + oy, '#ffffff'); b.set(14, 22 + oy, '#d63c3c'); b.set(15, 22 + oy, '#d63c3c');
    }
    // 얼굴
    if (W.face === 'glasses') {
      for (const ex of [15, 21]) { b.rect(ex, 10 + oy, 4, 1, '#6b4a2a'); b.rect(ex, 14 + oy, 4, 1, '#6b4a2a'); b.rect(ex, 10 + oy, 1, 5, '#6b4a2a'); b.rect(ex + 3, 10 + oy, 1, 5, '#6b4a2a'); }
      b.rect(19, 11 + oy, 2, 1, '#6b4a2a');
    } else if (W.face === 'goggles') {   // 비교 탐험 고글
      b.rect(12, 11 + oy, 2, 2, '#5b6b8c'); b.rect(25, 11 + oy, 2, 2, '#5b6b8c');
      for (const ex of [14, 20]) { b.rect(ex, 9 + oy, 6, 1, '#2fa89a'); b.rect(ex, 14 + oy, 6, 1, '#2fa89a'); b.rect(ex, 9 + oy, 1, 6, '#2fa89a'); b.rect(ex + 5, 9 + oy, 1, 6, '#2fa89a'); b.set(ex + 1, 10 + oy, '#d9fbf6'); b.set(ex + 4, 13 + oy, '#d9fbf6'); }
    } else if (W.face === 'sunglasses') {
      for (const ex of [15, 21]) { b.rect(ex, 10 + oy, 4, 4, '#1b2236'); b.set(ex, 10 + oy, '#7d8db0'); b.set(ex + 1, 10 + oy, '#7d8db0'); }
      b.rect(19, 11 + oy, 2, 1, '#1b2236');
    }
    // 머리
    if (P.kind === 'explorer') {
      if (W.head === 'hat') {
        b.ell(19.5, 6 + oy, 6, 3.6, P.hat);
        b.map((x, y, c) => (c === P.hat && y > 6 + oy ? null : undefined));
        b.rect(14, 6 + oy, 11, 1, P.hatDark); b.rect(13, 7 + oy, 15, 1, P.hatDark); b.rect(19, 3 + oy, 2, 2, P.badge);
      } else if (W.head === 'sailor') {
        b.ell(19.5, 6 + oy, 6.4, 3.2, '#ffffff');
        b.map((x, y, c) => (c === '#ffffff' && y > 6 + oy && y < 9 + oy && x > 12 && x < 27 ? null : undefined));
        b.rect(13, 6 + oy, 14, 2, '#2a3f6e'); b.px([[12, 7 + oy], [11, 8 + oy], [12, 9 + oy], [10, 9 + oy]], '#3f86e0'); b.set(19, 4 + oy, '#ff6b6b');
      } else if (W.head === 'star') {
        b.px([[14, 7 + oy], [15, 6 + oy], [16, 6 + oy], [17, 5 + oy], [18, 5 + oy], [19, 5 + oy], [20, 5 + oy], [21, 5 + oy], [22, 5 + oy], [23, 6 + oy], [24, 6 + oy], [25, 7 + oy]], '#ff8fb6');
        b.px([[21, 0 + oy], [20, 1 + oy], [21, 1 + oy], [22, 1 + oy], [18, 2 + oy], [19, 2 + oy], [20, 2 + oy], [21, 2 + oy], [22, 2 + oy], [23, 2 + oy], [24, 2 + oy], [20, 3 + oy], [21, 3 + oy], [22, 3 + oy], [19, 4 + oy], [20, 4 + oy], [22, 4 + oy], [23, 4 + oy]], '#ffd84a');
      } else if (W.head === 'alert') {   // 위험 탐지 모자 (경고 삼각형 배지)
        b.ell(19.5, 6 + oy, 6, 3.6, '#ff8a5b');
        b.map((x, y, c) => (c === '#ff8a5b' && y > 6 + oy ? null : undefined));
        b.rect(14, 6 + oy, 11, 1, '#d9623a'); b.rect(13, 7 + oy, 15, 1, '#d9623a');
        b.px([[20, 2 + oy], [19, 3 + oy], [20, 3 + oy], [21, 3 + oy], [18, 4 + oy], [19, 4 + oy], [20, 4 + oy], [21, 4 + oy], [22, 4 + oy]], '#ffe14a'); b.set(20, 3 + oy, '#3a2a35');
      } else if (W.head === 'crown') {   // AI 탐정 왕관
        b.rect(15, 4 + oy, 10, 3, '#ffd84a'); b.rect(15, 6 + oy, 10, 1, '#e0a800');
        b.px([[15, 2 + oy], [15, 3 + oy], [19, 1 + oy], [20, 1 + oy], [19, 2 + oy], [20, 2 + oy], [19, 3 + oy], [20, 3 + oy], [24, 2 + oy], [24, 3 + oy]], '#ffd84a');
        b.set(17, 5 + oy, '#ff5a7a'); b.set(20, 5 + oy, '#5fb4ff'); b.set(22, 5 + oy, '#7ad7a0');
      } else if (W.head === 'phones') {   // 소문 차단 헤드폰
        b.px([[13, 8 + oy], [13, 7 + oy], [14, 6 + oy], [15, 5 + oy], [16, 4 + oy], [17, 4 + oy], [18, 3 + oy], [19, 3 + oy], [20, 3 + oy], [21, 3 + oy], [22, 4 + oy], [23, 4 + oy], [24, 5 + oy], [25, 6 + oy], [26, 7 + oy], [26, 8 + oy]], '#5b6b8c');
        b.rect(11, 8 + oy, 3, 5, '#ff8fb6'); b.rect(25, 8 + oy, 3, 5, '#ff8fb6'); b.set(12, 10 + oy, '#ffffff'); b.set(26, 10 + oy, '#ffffff');
      } else if (W.head === 'flower') {
        b.px([[14, 6 + oy], [16, 6 + oy], [13, 7 + oy], [17, 7 + oy], [14, 8 + oy], [16, 8 + oy], [15, 5 + oy], [15, 9 + oy]], '#ff7aa8');
        b.set(15, 7 + oy, '#ffd84a'); b.px([[14, 7 + oy], [16, 7 + oy], [15, 6 + oy], [15, 8 + oy]], '#ffb3c9'); b.set(17, 9 + oy, '#5cbf62');
      }
    } else {
      // 선장 모자: 흰 모자 + 남색 챙 + 금색 닻
      b.ell(19.5, 5.5 + oy, 7, 3.4, P.hat);
      b.map((x, y, c) => (c === P.hat && y > 6 + oy ? null : undefined));
      b.rect(13, 6 + oy, 13, 1, P.hatDark); b.rect(15, 7 + oy, 12, 1, '#16264a');
      b.px([[19, 2 + oy], [20, 2 + oy], [19, 3 + oy], [20, 3 + oy], [18, 4 + oy], [21, 4 + oy]], P.badge);
      b.px([[17, 15 + oy], [18, 15 + oy], [21, 15 + oy], [22, 15 + oy]], '#9c8a78');
    }
    // 손에 든 소품
    if (W.hand === 'lens') {
      b.ring(30, 14 + oy, 3.2, '#8a5a2a'); b.ell(30, 14 + oy, 2.2, 2.2, '#cdeeff'); b.set(29, 13 + oy, '#ffffff');
      b.px([[28, 17 + oy], [27, 18 + oy], [26, 19 + oy]], '#8a5a2a');
    } else if (W.hand === 'staff') {
      for (let y = 8; y <= 25; y++) b.set(30, y + oy, '#b9774a');
      b.ell(30, 6 + oy, 3, 2.6, '#ffb3a7'); b.px([[29, 5 + oy], [30, 4 + oy], [31, 5 + oy]], '#f08a7c'); b.set(30, 6 + oy, '#ffffff');
    }
    else if (W.hand === 'wand') {   // 진실 찾기 별봉
      for (let y = 9; y <= 25; y++) b.set(30, y + oy, y % 4 === 0 ? '#ffffff' : '#c58fe0');
      b.px([[30, 3 + oy], [29, 4 + oy], [30, 4 + oy], [31, 4 + oy], [27, 5 + oy], [28, 5 + oy], [29, 5 + oy], [30, 5 + oy], [31, 5 + oy], [32, 5 + oy], [33, 5 + oy], [29, 6 + oy], [30, 6 + oy], [31, 6 + oy], [28, 7 + oy], [29, 7 + oy], [31, 7 + oy], [32, 7 + oy]], '#ffd84a');
    }
    if (frame === 'think') { b.set(28, 8 + oy, '#7cc8ff'); b.rect(27, 9 + oy, 3, 2, '#7cc8ff'); }
    b.outline();
    if (P.kind === 'explorer' && W.head === 'hat') b.set(17, 4 + oy, '#8fc0ff');
    return b;
  }

  // ---------------- 해양 친구들 ----------------
  function octopusBuf(frame) {
    const b = new Buf(30, 30);
    const sway = frame === 'walk1' ? 1 : 0;
    const C = '#d995e8', S = '#b16fcb', L = '#f1c9f8';
    // 다리 6개 (끝이 동그랗게 말림)
    for (let i = 0; i < 6; i++) {
      const x = 5 + i * 4 + (i % 2 ? sway : -sway) * 0.5;
      b.ell(x, 22, 1.9, 4.2, i % 2 ? C : S);
      b.ell(x + (i < 3 ? -1 : 1), 26, 1.6, 1.3, i % 2 ? C : S);
    }
    b.ell(15, 13, 10, 9, C);
    b.ell(11, 8, 2, 1.4, L); b.set(18, 6, L); b.set(20, 8, L);
    // 박사 모자
    b.rect(6, 2, 19, 2, '#2d2f45'); b.rect(10, 4, 11, 2, '#3a3d5a');
    b.outline();
    b.px([[24, 4], [24, 5], [24, 6]], '#ffd84a'); b.rect(23, 7, 3, 1, '#ffd84a');
    // 동그란 안경 + 눈
    const eyeY = 13;
    b.ring(11, eyeY, 3.6, '#5a3d7a'); b.ring(19, eyeY, 3.6, '#5a3d7a'); b.rect(14, eyeY - 1, 2, 1, '#5a3d7a');
    if (frame === 'blink') { b.rect(10, eyeY, 2, 1, K); b.rect(18, eyeY, 2, 1, K); }
    else { b.rect(10, eyeY - 1, 2, 2, K); b.rect(18, eyeY - 1, 2, 2, K); b.set(10, eyeY - 1, EYE_HI); b.set(18, eyeY - 1, EYE_HI); }
    b.rect(7, 17, 2, 1, CHEEK); b.rect(21, 17, 2, 1, CHEEK);
    b.px([[14, 18], [15, 19], [16, 18]], MOUTH);
    return b;
  }

  function turtleBuf(frame) {
    const b = new Buf(36, 26);
    const SH = '#6fbf73', SD = '#4f9a5a', SK = '#b9e38f', SKD = '#8cc46a', RIM = '#f0d98f';
    // 다리
    const st = frame === 'walk1' ? 1 : 0;
    b.ell(8 - st, 20, 2.4, 3, SK); b.ell(20 + st, 20, 2.4, 3, SK);
    b.ell(3, 17, 2, 1.2, SK);          // 꼬리
    // 등껍질
    b.ell(14, 15, 11, 8.5, SH);
    b.map((x, y) => (y > 16 ? null : undefined));
    b.rect(3, 16, 23, 2, RIM);
    // 등껍질 무늬
    b.px([[10, 9], [11, 9], [12, 9], [9, 10], [13, 10], [9, 11], [13, 11], [10, 12], [11, 12], [12, 12]], SD);
    b.px([[17, 10], [18, 10], [19, 10], [16, 11], [20, 11], [16, 12], [20, 12], [17, 13], [18, 13], [19, 13]], SD);
    b.px([[6, 13], [7, 13], [12, 14], [13, 14], [14, 14], [21, 14], [22, 14]], SD);
    // 머리
    b.ell(26, 12, 4.8, 4.5, SK);
    b.ell(23.5, 15.5, 2.5, 1.8, SK);
    b.outline();
    // 안경 + 눈
    if (frame === 'blink') b.rect(27, 11, 2, 1, K); else { b.rect(27, 10, 2, 2, K); b.set(27, 10, EYE_HI); }
    b.px([[26, 8], [27, 8], [28, 8], [29, 8], [25, 9], [30, 9], [25, 10], [30, 10]], '#7a5230');
    b.rect(28, 14, 2, 1, CHEEK);
    b.px([[25, 14], [26, 15]], MOUTH);
    // 빨간 나비넥타이
    b.px([[22, 16], [22, 17], [23, 16], [24, 16], [24, 17], [25, 16], [25, 17]], '#ff6b6b');
    b.set(18, 8, '#9be09f'); b.set(19, 8, '#9be09f');
    return b;
  }

  function penguinBuf(frame) {
    const b = new Buf(26, 30);
    const N = '#34497a', W = '#f7fbff', O = '#ffa53d';
    const wave = frame === 'walk1';
    b.ell(7, 27, 2.6, 1.3, O); b.ell(15, 27, 2.6, 1.3, O);
    b.ell(11, 16, 8, 10, N);
    b.ell(3.5, wave ? 13 : 17, 1.6, 4.2, N);   // 날개
    b.ell(18.5, 17, 1.6, 4.2, N);
    b.ell(11, 18, 5.8, 7.5, W, true);
    b.ell(11, 11, 5, 3.2, W, true);
    // 목도리 (민트)
    b.rect(5, 14, 13, 2, '#5fd3b8'); b.rect(15, 16, 2, 3, '#5fd3b8');
    b.outline();
    // 눈·부리
    if (frame === 'blink') { b.rect(8, 10, 2, 1, K); b.rect(13, 10, 2, 1, K); }
    else { b.rect(8, 9, 2, 2, K); b.rect(13, 9, 2, 2, K); b.set(8, 9, EYE_HI); b.set(13, 9, EYE_HI); }
    b.rect(10, 11, 3, 1, O); b.set(11, 12, O);
    b.set(7, 12, CHEEK); b.set(15, 12, CHEEK);
    // 확인 배지 (초록 동그라미 + 체크)
    b.ell(11, 20, 3, 3, '#3fbf7f');
    b.px([[9, 20], [10, 21], [11, 20], [12, 19]], '#ffffff');
    // 돋보기
    b.ring(22, 9, 3.2, '#8a5a2a'); b.set(21, 8, '#cdeeff'); b.set(22, 8, '#cdeeff'); b.set(21, 9, '#cdeeff'); b.set(22, 9, '#cdeeff'); b.set(23, 9, '#e8f7ff'); b.set(22, 10, '#cdeeff');
    b.px([[20, 12], [19, 13], [18, 14]], '#8a5a2a');
    return b;
  }

  function fishBuf(frame) {
    const b = new Buf(26, 18);
    const C = '#ff9d62', L = '#ffd7ad', D = '#ff7a45';
    const flap = frame === 'walk1' ? 1 : 0;
    // 꼬리
    for (let y = 3; y <= 14; y++) { const w = Math.round(4 - Math.abs(y - 8.5) * 0.55 + flap * (y < 8 ? 0.6 : -0.6)); for (let x = 1; x < 1 + Math.max(1, w); x++) b.set(x, y, D); }
    b.ell(14, 9, 9, 6, C);
    b.ell(14, 12, 7, 3, L, true);
    b.ell(13, 3, 3.6, 1.6, D);
    b.ell(12, 13.5, 2, 1.2, D);
    // 줄무늬
    for (let y = 4; y <= 13; y++) { if (b.get(10, y) === C) b.set(10, y, '#ffc24a'); }
    b.outline();
    if (frame === 'blink') b.rect(17, 8, 3, 1, K); else { b.rect(17, 6, 3, 3, K); b.set(17, 6, EYE_HI); b.set(18, 6, EYE_HI); }
    b.rect(16, 10, 2, 1, CHEEK);
    b.px([[21, 10], [22, 11]], MOUTH);
    return b;
  }

  function jellyBuf(frame) {
    const b = new Buf(26, 30);
    const C = '#f4b8e8', R = '#e18ad0', H = '#ffe4f7', T = '#e7a0db';
    const ph = frame === 'walk1' ? 1 : 0;
    // 머리 (반구)
    b.ell(13, 12, 11, 10, C);
    b.map((x, y) => (y > 12 ? null : undefined));
    b.rect(2, 12, 23, 2, R);
    // 촉수 4개 (굵고 물결 모양)
    [6, 11, 16, 20].forEach((x0, i) => { for (let y = 14; y <= 25 - (i % 2) * 2; y++) { const x = x0 + Math.round(Math.sin((y + i * 2 + ph * 2) * 0.55) * 1.2); b.set(x, y, T); b.set(x + 1, y, T); } });
    b.outline('#5d3a6e');
    b.ell(8, 5, 2.4, 1.6, H); b.set(12, 4, H);
    if (frame === 'blink') { b.rect(8, 8, 2, 1, K); b.rect(16, 8, 2, 1, K); }
    else { b.rect(8, 7, 2, 2, K); b.rect(16, 7, 2, 2, K); b.set(8, 7, EYE_HI); b.set(16, 7, EYE_HI); }
    b.rect(6, 10, 2, 1, CHEEK); b.rect(18, 10, 2, 1, CHEEK);
    b.px([[12, 10], [13, 11], [14, 10]], MOUTH);
    // 작은 휴대폰 (인터넷)
    b.rect(19, 17, 5, 7, '#4b5675'); b.rect(20, 18, 3, 4, '#9fe7ff'); b.set(21, 23, '#cfd6e6');
    return b;
  }

  // ---------------- 장면용 친구들 (가상 캐릭터) ----------------
  // 말하는 강아지
  function puppyBuf(frame) {
    const b = new Buf(26, 24);
    const C = '#e8b57c', D = '#b37a45', L = '#fff1dc';
    b.ell(13, 18, 7, 4.5, C);
    b.rect(8, 20, 2, 3, C); b.rect(16, 20, 2, 3, C);
    b.ell(21, 15, 2.4, 1.2, D);
    b.ell(13, 10, 7.5, 6.5, C);
    b.ell(13, 13, 4, 2.6, L, true);
    b.ell(5.5, 10, 2.2, 4.5, D); b.ell(20.5, 10, 2.2, 4.5, D);
    b.outline();
    b.rect(9, 8, 2, 2, K); b.rect(16, 8, 2, 2, K); b.set(9, 8, EYE_HI); b.set(16, 8, EYE_HI);
    b.rect(12, 11, 3, 2, K);
    if (frame === 'talk') { b.rect(12, 14, 3, 2, MOUTH); b.set(13, 15, '#ff8fa3'); }
    else b.px([[12, 14], [14, 14]], MOUTH);
    b.rect(7, 12, 2, 1, CHEEK); b.rect(18, 12, 2, 1, CHEEK);
    return b;
  }
  // 가상 친구 얼굴(상반신): 'kong' 분홍 아기 바다표범, 'mong' 수달
  function friendHead(b, who, ox, oy) {
    if (who === 'kong') {
      b.ell(ox + 10, oy + 10, 7.5, 7, '#ffc8d8');
      b.ell(ox + 10, oy + 13, 4, 2.4, '#fff0f4', true);
    } else {
      b.ell(ox + 4, oy + 5, 2, 2, '#9a6a42'); b.ell(ox + 16, oy + 5, 2, 2, '#9a6a42');
      b.ell(ox + 10, oy + 10, 7.5, 7, '#b98a5e');
      b.ell(ox + 10, oy + 13, 4.4, 2.8, '#f3dcc0', true);
    }
  }
  function friendFace(b, who, ox, oy, mood) {
    b.rect(ox + 6, oy + 8, 2, 2, K); b.rect(ox + 12, oy + 8, 2, 2, K); b.set(ox + 6, oy + 8, EYE_HI); b.set(ox + 12, oy + 8, EYE_HI);
    b.rect(ox + 9, oy + 12, 2, 1, '#3a2a35');
    if (mood === 'sad') b.px([[ox + 9, oy + 14], [ox + 10, oy + 14]], MOUTH); else b.px([[ox + 8, oy + 13], [ox + 11, oy + 13], [ox + 9, oy + 14], [ox + 10, oy + 14]], MOUTH);
    b.rect(ox + 4, oy + 12, 2, 1, CHEEK); b.rect(ox + 14, oy + 12, 2, 1, CHEEK);
    if (who === 'kong') { b.rect(ox + 13, oy + 2, 2, 2, '#ffd84a'); b.set(ox + 12, oy + 2, '#ffb02e'); b.set(ox + 15, oy + 2, '#ffb02e'); }
  }
  // body: 'kong' | 'mong' (옷 색), head: 'kong' | 'mong'
  function friendBust(body, head, mood) {
    const b = new Buf(22, 26);
    b.ell(11, 23, 9, 5, body === 'kong' ? '#ffd166' : '#7ed492');
    friendHead(b, head, 1, 1);
    b.outline();
    friendFace(b, head, 1, 1, mood);
    return b;
  }
  function friendHeadOnly(who) { const b = new Buf(22, 20); friendHead(b, who, 1, 1); b.outline(); friendFace(b, who, 1, 1); return b; }

  // ---------------- 미니게임 도우미 그림 ----------------
  function parentsBuf() {   // 바다표범 부모님 두 분
    const b = new Buf(34, 26);
    b.ell(10, 16, 8, 7, '#d9cfc4'); b.ell(10, 18, 5, 3.6, '#fffaf2', true);
    b.ell(24, 15, 9, 8, '#c4d4e2'); b.ell(24, 17, 5.6, 4, '#fffaf2', true);
    b.rect(20, 7, 9, 2, '#ff8fb6');
    b.outline();
    for (const [x, y] of [[7, 13], [12, 13], [21, 12], [26, 12]]) { b.rect(x, y, 2, 2, K); b.set(x, y, EYE_HI); }
    b.px([[9, 17], [10, 18], [11, 17]], MOUTH); b.px([[23, 16], [24, 17], [25, 16]], MOUTH);
    b.rect(5, 16, 2, 1, CHEEK); b.rect(14, 16, 2, 1, CHEEK); b.rect(19, 15, 2, 1, CHEEK); b.rect(28, 15, 2, 1, CHEEK);
    return b;
  }
  function noticeBuf() {   // 학교 공식 알림 게시판
    const b = new Buf(28, 30);
    b.rect(5, 18, 3, 12, '#b9774a'); b.rect(20, 18, 3, 12, '#b9774a');
    b.rect(1, 1, 26, 20, '#3f86e0'); b.rect(3, 3, 22, 16, '#ffffff');
    b.rect(5, 6, 18, 2, '#3f86e0'); b.rect(5, 10, 14, 1, '#aab6c3'); b.rect(5, 13, 16, 1, '#aab6c3'); b.rect(5, 16, 10, 1, '#aab6c3');
    b.rect(18, 13, 5, 5, '#ff6b6b'); b.set(20, 15, '#ffffff');
    b.outline();
    return b;
  }
  function anonBuf() {   // 누가 썼는지 모르는 댓글
    const b = new Buf(28, 26);
    b.ell(14, 11, 12, 9, '#c9cfd8'); b.px([[6, 18], [5, 19], [4, 20], [3, 21], [6, 19], [5, 20]], '#c9cfd8');
    b.outline('#5a6478');
    b.rect(8, 8, 3, 2, '#5a6478'); b.rect(17, 8, 3, 2, '#5a6478');
    b.px([[12, 13], [13, 12], [14, 12], [15, 13]], '#5a6478');
    return b;
  }

  // ---------------- 배지 아이콘 (16×16) ----------------
  function badgeBuf(id) {
    const b = new Buf(18, 18);
    if (id === 'lens') {   // 탐정 돋보기
      b.ring(7, 7, 5.5, '#8a5a2a'); b.ring(7, 7, 4.6, '#c9874a');
      b.ell(7, 7, 3.8, 3.8, '#cdefff'); b.ell(5.6, 5.6, 1.4, 1.4, '#ffffff');
      b.px([[11, 11], [12, 12], [13, 13], [14, 14], [12, 11], [13, 12], [14, 13], [15, 14], [11, 12], [12, 13], [13, 14], [14, 15]], '#8a5a2a');
    } else if (id === 'shell') {   // 질문 조개
      b.ell(9, 10, 7.5, 6, '#ffb3a7'); b.map((x, y) => (y > 13 ? null : undefined));
      b.rect(3, 13, 13, 2, '#f08a7c');
      for (const x of [5, 9, 13]) for (let y = 5; y < 13; y++) b.set(x + Math.round((y - 13) * (x - 9) / 16), y, '#f08a7c');
      b.outline();
      b.px([[8, 6], [9, 6], [10, 7], [9, 8], [9, 10]], '#ffffff');
    } else if (id === 'book') {   // 비교 책갈피(책 두 권)
      b.rect(2, 4, 6, 10, '#5fb4ff'); b.rect(9, 4, 6, 10, '#7ad7a0'); b.rect(8, 4, 1, 10, '#ffffff');
      b.rect(3, 6, 4, 1, '#d8eeff'); b.rect(3, 8, 4, 1, '#d8eeff'); b.rect(10, 6, 4, 1, '#d9f7e5'); b.rect(10, 8, 4, 1, '#d9f7e5');
      b.rect(12, 1, 2, 5, '#ff7a7a'); b.set(12, 6, '#ff7a7a');
      b.outline();
    } else if (id === 'bubble') {   // 소문 멈춤 물방울 방패
      b.ell(9, 9, 7, 7, '#bfeaff'); b.ell(9, 9, 5.5, 5.5, '#e6f8ff'); b.ell(6.5, 6, 1.6, 1.2, '#ffffff');
      b.rect(7, 6, 1, 6, '#ff8a80'); b.rect(9, 5, 1, 7, '#ff8a80'); b.rect(11, 6, 1, 6, '#ff8a80'); b.rect(7, 10, 6, 3, '#ff8a80'); b.rect(13, 8, 1, 3, '#ff8a80');
      b.outline();
    } else if (id === 'coin') {
      b.ell(9, 9, 7, 7, '#ffd84a'); b.ell(9, 9, 5, 5, '#ffe68a'); b.rect(8, 5, 2, 8, '#e0a800'); b.rect(6, 6, 6, 1, '#e0a800'); b.rect(6, 11, 6, 1, '#e0a800'); b.set(6, 5, '#ffffff'); b.set(5, 6, '#ffffff');
      b.outline('#a86a00');
    } else if (id === 'shield') {   // 안전 공유 방패
      b.rect(3, 2, 12, 7, '#6fd3c3'); b.ell(9, 9, 6, 7, '#6fd3c3'); b.map((x, y) => (y < 2 ? null : undefined));
      b.rect(8, 4, 2, 10, '#ffffff'); b.rect(5, 7, 8, 2, '#ffffff');
      b.outline();
    } else {   // 인증 메달
      b.px([[5, 0], [6, 1], [7, 2], [12, 0], [11, 1], [10, 2]], '#ff7a7a'); b.rect(5, 0, 2, 4, '#5fb4ff'); b.rect(11, 0, 2, 4, '#5fb4ff');
      b.ell(9, 10, 6, 6, '#ffd84a'); b.ell(9, 10, 4, 4, '#ffb02e');
      b.px([[9, 7], [8, 9], [9, 9], [10, 9], [9, 11], [8, 12], [10, 12]], '#fff6c8');
      b.outline();
    }
    return b;
  }

  // ---------------- 캐시 + 공개 API ----------------
  const cache = new Map();
  function sprite(name, frame = 'idle') {
    const key = name + ':' + frame;
    if (cache.has(key)) return cache.get(key);
    let buf;
    switch (name) {
      case 'hero': buf = sealBuf(SEAL_PALETTES.hero, frame, null); break;
      case 'captain': buf = sealBuf(SEAL_PALETTES.captain, frame); break;
      case 'octopus': buf = octopusBuf(frame); break;
      case 'turtle': buf = turtleBuf(frame); break;
      case 'penguin': buf = penguinBuf(frame); break;
      case 'fish': buf = fishBuf(frame); break;
      case 'jelly': buf = jellyBuf(frame); break;
      case 'puppy': buf = puppyBuf(frame); break;
      case 'kong': buf = friendBust('kong', 'kong', frame); break;
      case 'mong': buf = friendBust('mong', 'mong', frame); break;
      case 'swap': buf = friendBust('kong', 'mong', frame); break;   // 콩이 몸 + 몽실이 얼굴 (얼굴이 바뀐 가상 사진)
      case 'monghead': buf = friendHeadOnly('mong'); break;
      case 'badge': buf = badgeBuf(frame); break;
      case 'parents': buf = parentsBuf(); break;
      case 'notice': buf = noticeBuf(); break;
      case 'anon': buf = anonBuf(); break;
      default: buf = new Buf(1, 1);
    }
    const cv = buf.canvas();
    cache.set(key, cv);
    return cv;
  }
  function flipped(name, frame) {
    const key = 'flip:' + name + ':' + frame;
    if (!cache.has(key)) cache.set(key, mirror(sprite(name, frame)));
    return cache.get(key);
  }
  // 꾸민 바다표범 (착용 아이템별로 따로 저장)
  const WEAR_SLOTS = ['head', 'face', 'neck', 'body', 'back', 'hand'];
  function wearKey(w) { return WEAR_SLOTS.map((k) => (w && w[k]) || '-').join('.'); }
  function seal(wear, frame = 'idle', flip = false, color = 'sky') {
    const key = 'seal:' + (color || 'sky') + ':' + wearKey(wear) + ':' + frame + (flip ? ':f' : '');
    if (cache.has(key)) return cache.get(key);
    const cv = flip ? mirror(seal(wear, frame, false, color)) : sealBuf(heroPal(color), frame, wear).canvas();
    cache.set(key, cv); return cv;
  }
  function sealUrl(wear, frame = 'idle', k = 6, color = 'sky') {
    const key = 'sealurl:' + (color || 'sky') + ':' + wearKey(wear) + ':' + frame + ':' + k;
    if (!urlCache.has(key)) urlCache.set(key, upscale(seal(wear, frame, false, color), k).toDataURL());
    return urlCache.get(key);
  }
  const urlCache = new Map();
  // HTML <img>용 큰 그림 (선명하게 미리 확대)
  function url(name, frame = 'idle', k = 6) {
    const key = name + ':' + frame + ':' + k;
    if (!urlCache.has(key)) urlCache.set(key, upscale(sprite(name, frame), k).toDataURL());
    return urlCache.get(key);
  }

  window.PX = { Buf, sprite, flipped, url, upscale, mirror, OUT, seal, sealUrl, wearKey, WEAR_SLOTS, SEAL_COLORS, COLOR_BY_ID };
})();
