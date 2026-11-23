// AI 탐험 바다섬: 지형·건물·충돌·그리기
(function () {
  'use strict';
  const T = 16, MW = 44, MH = 30, WPX = MW * T, HPX = MH * T;
  const VIEW_W = 400, VIEW_H = 225;

  // ---------- 결정적 난수 ----------
  function hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

  // ---------- 지형 모양 (타일 단위 연속 좌표) ----------
  function islandV(x, y) {
    const dx = x - 21.5, dy = y - 14.3;
    const a = Math.atan2(dy, dx);
    const wob = 1 + 0.035 * Math.sin(a * 5 + 0.6) + 0.025 * Math.sin(a * 9 + 2.1);
    const rx = 19.6 * wob, ry = 12.4 * wob;
    return Math.pow(Math.abs(dx) / rx, 3.2) + Math.pow(Math.abs(dy) / ry, 3.2);
  }
  function inRR(x, y, rx, ry, rw, rh, r = 0.5) {
    if (x < rx || y < ry || x > rx + rw || y > ry + rh) return false;
    const cx = Math.max(rx + r, Math.min(x, rx + rw - r)), cy = Math.max(ry + r, Math.min(y, ry + rh - r));
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  }
  const PATHS = [
    [5, 15, 34, 2], [10, 9.2, 2, 7], [6, 9.2, 10, 2.8], [32, 9, 2, 7], [28, 9, 10, 3], [10, 16, 2, 4.6],
    [32, 16, 2, 3], [21, 16, 2, 11],
  ];
  const POND = { x: 4.4, y: 11.3, r: 1.75 };
  // 지형 종류: W 깊은 물, w 얕은 물, f 물거품, s 모래, g 풀, p 길, q 중앙 광장, r 공유 광장, d 나무 부두, o 연못
  function classify(x, y) {
    if (inRR(x, y, 21, 26, 2, 3.8, 0.2)) return 'd';
    const v = islandV(x, y);
    if (v > 1) return v < 1.04 ? 'f' : v < 1.28 ? 'w' : 'W';
    const pd = Math.hypot(x - POND.x, y - POND.y);
    if (pd < POND.r) return pd < POND.r - 0.22 ? 'o' : 'k';
    if (Math.hypot((x - 21.5) / 1.0, (y - 15.2) / 0.85) < 4.4) return 'q';
    if (inRR(x, y, 27, 18, 13, 7.6, 1)) return 'r';
    for (const p of PATHS) if (inRR(x, y, p[0], p[1], p[2], p[3], 0.6)) return 'p';
    const beach = x < 19.5 + Math.sin(y * 1.3) * 0.4 && y > 17.6 + Math.sin(x * 0.9) * 0.35;
    if (v > 0.8 || beach) return 's';
    return 'g';
  }

  // ---------- 타일 이동 가능 여부 ----------
  const walk = new Uint8Array(MW * MH);
  function computeWalk() {
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
      let ok = true;
      for (const [ox, oy] of [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8], [0.5, 0.5]]) {
        const c = classify(tx + ox, ty + oy);
        if ('Wwfok'.includes(c)) { ok = false; break; }
      }
      walk[ty * MW + tx] = ok ? 1 : 0;
    }
  }
  function blockRect(x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < MW && j < MH) walk[j * MW + i] = 0; }
  function walkableTile(tx, ty) { return tx >= 0 && ty >= 0 && tx < MW && ty < MH && walk[ty * MW + tx] === 1; }
  function walkablePx(px, py) { return walkableTile(Math.floor(px / T), Math.floor(py / T)); }

  // ---------- 그리기 도우미 ----------
  function mk(w, h, fn) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const R = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh)); };
    fn(g, R); return c;
  }
  const O = '#26344f';
  function circ(R, cx, cy, r, col) { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); R(cx - w, cy + y, w * 2 + 1, 1, col); } }

  // ---------- 건물·소품 그림 ----------
  const ART = {};
  ART.lighthouse = () => mk(56, 120, (g, R) => {
    // 받침돌
    R(4, 100, 48, 18, O); R(6, 102, 44, 15, '#c9d2dc'); R(6, 102, 44, 3, '#e4eaf0');
    for (let i = 0; i < 5; i++) R(8 + i * 9, 108, 7, 1, '#aab6c3');
    // 탑 (위로 갈수록 좁아짐) 코랄·흰 줄무늬
    for (let y = 30; y < 102; y++) {
      const t = (y - 30) / 72, half = Math.round(11 + t * 7);
      const band = Math.floor((y - 30) / 12) % 2 === 0;
      R(28 - half - 1, y, 1, 1, O); R(28 + half, y, 1, 1, O);
      R(28 - half, y, half * 2, 1, band ? '#ff8a80' : '#fffaf2');
      R(28 - half, y, 3, 1, band ? '#ff6f66' : '#efe6da');
      R(28 + half - 3, y, 3, 1, band ? '#e85d55' : '#e2d8ca');
    }
    // 문과 창문
    R(22, 84, 12, 18, O); R(23, 85, 10, 17, '#5b8fd6'); R(23, 85, 10, 3, '#7aa7e6'); R(31, 93, 1, 2, '#ffd84a');
    R(24, 52, 8, 10, O); R(25, 53, 6, 8, '#bfe8ff'); R(27, 53, 1, 8, O);
    // 전망대 난간
    R(10, 26, 36, 6, O); R(11, 27, 34, 4, '#3f86e0'); for (let x = 13; x < 44; x += 4) R(x, 27, 1, 4, '#2a5fae');
    // 등불 방
    R(15, 10, 26, 17, O); R(17, 12, 22, 14, '#fff3a6'); R(18, 13, 6, 12, '#fffbe0'); R(27, 12, 1, 14, '#e3c96a'); R(33, 12, 1, 14, '#e3c96a');
    // 지붕
    for (let y = 0; y < 11; y++) { const half = Math.round(4 + y * 1.35); R(28 - half - 1, y + 1, half * 2 + 2, 1, O); R(28 - half, y + 1, half * 2, 1, y < 2 ? '#ff8a80' : '#ff6f66'); }
    R(26, 0, 4, 2, O); R(27, 0, 2, 1, '#ffd84a');
  });
  ART.house = (roof, roofDark, wall) => mk(60, 62, (g, R) => {
    // 굴뚝
    R(41, 6, 8, 14, O); R(42, 7, 6, 13, '#e6a57a'); R(42, 7, 6, 2, '#f3c09a');
    // 벽
    R(6, 30, 48, 30, O); R(7, 31, 46, 29, wall); R(7, 56, 46, 4, '#e8d6c2');
    // 조개 모양 둥근 지붕
    for (let y = 0; y < 26; y++) { const t = y / 25, half = Math.round(Math.sqrt(1 - (1 - t) * (1 - t)) * 29); R(30 - half - 1, 8 + y, half * 2 + 2, 1, O); R(30 - half, 8 + y, half * 2, 1, roof); }
    for (const dx of [-16, -8, 0, 8, 16]) for (let y = 12; y < 34; y++) { const x = 30 + Math.round(dx * (y - 6) / 28); R(x, y, 1, 1, roofDark); }
    R(2, 32, 56, 3, O); R(3, 32, 54, 2, roofDark);
    // 문
    R(25, 41, 12, 19, O); R(26, 42, 10, 18, '#b9774a'); R(26, 42, 10, 2, '#cf8f5f'); R(33, 51, 2, 2, '#ffd84a');
    // 동그란 창문
    circ(R, 15, 45, 5, O); circ(R, 15, 45, 4, '#bfe8ff'); R(15, 41, 1, 9, O); R(11, 45, 9, 1, O); R(13, 43, 2, 1, '#ffffff');
    circ(R, 46, 45, 5, O); circ(R, 46, 45, 4, '#bfe8ff'); R(46, 41, 1, 9, O); R(42, 45, 9, 1, O); R(44, 43, 2, 1, '#ffffff');
    // 꽃 화분
    R(9, 53, 12, 4, O); R(10, 54, 10, 2, '#c97b4a'); R(10, 51, 2, 2, '#ff7aa8'); R(14, 50, 2, 2, '#ffd84a'); R(18, 51, 2, 2, '#ff7aa8');
    R(40, 53, 12, 4, O); R(41, 54, 10, 2, '#c97b4a'); R(41, 51, 2, 2, '#ffffff'); R(45, 50, 2, 2, '#ff7aa8'); R(49, 51, 2, 2, '#ffd84a');
  });
  ART.library = () => mk(136, 110, (g, R) => {
    // 계단
    R(46, 98, 44, 12, O); R(47, 99, 42, 4, '#e9e2d6'); R(47, 104, 42, 5, '#d8cfbf');
    // 벽
    R(6, 42, 124, 58, O); R(7, 43, 122, 56, '#bff0e2'); R(7, 92, 122, 7, '#9fd9c8');
    for (let y = 50; y < 92; y += 8) R(7, y, 122, 1, '#aee5d4');
    // 기둥 4개
    for (const x of [22, 44, 86, 108]) { R(x, 44, 8, 52, O); R(x + 1, 44, 6, 52, '#ffffff'); R(x + 5, 44, 1, 52, '#dfe8ef'); R(x - 1, 92, 10, 5, O); R(x, 93, 8, 3, '#eef2f6'); }
    // 큰 문
    R(56, 62, 24, 36, O); R(57, 63, 22, 35, '#6b8fd6'); R(57, 63, 22, 3, '#86a7e6'); R(67, 63, 2, 35, O); R(64, 80, 2, 3, '#ffd84a'); R(70, 80, 2, 3, '#ffd84a');
    for (let y = 0; y < 8; y++) { const w = Math.round(Math.sqrt(64 - (8 - y) * (8 - y)) * 1.5); R(68 - w, 54 + y, w * 2, 1, O); }
    // 창문 (책장 보이는)
    for (const x of [10, 116]) { R(x, 56, 10, 26, O); R(x + 1, 57, 8, 24, '#d9f3ff'); R(x + 1, 66, 8, 1, O); R(x + 1, 74, 8, 1, O); R(x + 2, 59, 2, 7, '#ff8a80'); R(x + 5, 60, 2, 6, '#5fb4ff'); R(x + 2, 68, 3, 6, '#ffd84a'); R(x + 6, 69, 2, 5, '#7ad7a0'); }
    for (const x of [32, 96]) { R(x, 56, 10, 26, O); R(x + 1, 57, 8, 24, '#d9f3ff'); R(x + 1, 69, 8, 1, O); R(x + 2, 60, 3, 8, '#ff8a80'); R(x + 6, 61, 2, 7, '#5fb4ff'); R(x + 3, 72, 4, 6, '#7ad7a0'); }
    // 삼각 지붕
    for (let y = 0; y < 34; y++) { const half = Math.round(10 + y * 1.8); R(68 - half - 1, 8 + y, half * 2 + 2, 1, O); R(68 - half, 8 + y, half * 2, 1, y % 6 < 3 ? '#3fb8a6' : '#35a594'); }
    R(2, 40, 132, 5, O); R(3, 41, 130, 3, '#2a8f80');
    // 지붕 안 동그란 책 창문
    circ(R, 68, 28, 10, O); circ(R, 68, 28, 9, '#fff6d6');
    R(60, 25, 8, 8, '#5fb4ff'); R(69, 25, 8, 8, '#7ad7a0'); R(68, 24, 1, 10, O); R(60, 24, 8, 1, O); R(69, 24, 8, 1, O); R(60, 33, 17, 1, O);
    R(62, 27, 4, 1, '#d8eeff'); R(62, 29, 4, 1, '#d8eeff'); R(71, 27, 4, 1, '#d9f7e5'); R(71, 29, 4, 1, '#d9f7e5');
    R(66, 4, 4, 6, O); R(67, 2, 2, 3, '#ffd84a');
  });
  ART.screen = () => mk(88, 70, (g, R) => {
    // 다리
    R(10, 44, 6, 26, O); R(11, 44, 4, 26, '#c98d55'); R(72, 44, 6, 26, O); R(73, 44, 4, 26, '#c98d55');
    // 화면 틀
    R(0, 0, 88, 52, O); R(2, 2, 84, 48, '#ffb3a7'); R(2, 2, 84, 3, '#ffcfc6');
    R(6, 6, 76, 40, O); R(7, 7, 74, 38, '#1f2c4a');
    // 조명 전구
    for (let x = 6; x < 84; x += 8) { R(x, 0, 3, 2, '#ffd84a'); }
  });
  ART.fountain = () => mk(72, 50, (g, R) => {
    // 둥근 물통
    for (let y = 0; y < 26; y++) { const t = (y - 13) / 13, half = Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * 34); R(36 - half - 1, 22 + y, half * 2 + 2, 1, O); R(36 - half, 22 + y, half * 2, 1, y > 18 ? '#d9c6b0' : '#efe2d0'); }
    for (let y = 0; y < 16; y++) { const t = (y - 8) / 8, half = Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * 28); R(36 - half, 24 + y, half * 2, 1, '#8fd8ea'); }
    R(18, 28, 8, 1, '#d2f4fb'); R(44, 33, 10, 1, '#d2f4fb');
    // 가운데 기둥
    R(31, 6, 10, 26, O); R(32, 7, 8, 25, '#efe2d0'); R(26, 4, 20, 5, O); R(27, 5, 18, 3, '#ffb3a7');
  });
  ART.board = () => mk(56, 52, (g, R) => {
    R(8, 30, 5, 22, O); R(9, 30, 3, 22, '#b9774a'); R(43, 30, 5, 22, O); R(44, 30, 3, 22, '#b9774a');
    R(0, 0, 56, 38, O); R(2, 2, 52, 34, '#d9a066'); R(4, 4, 48, 30, '#f2d3a2');
    const pics = [[7, 7, '#bfe8ff'], [21, 9, '#ffe08a'], [36, 6, '#c9f2c7'], [10, 21, '#ffc8d8'], [27, 21, '#d8ccff']];
    for (const [x, y, c] of pics) { R(x, y, 13, 11, O); R(x + 1, y + 1, 11, 9, '#ffffff'); R(x + 2, y + 2, 9, 6, c); R(x + 5, y - 1, 3, 2, '#ff6b6b'); }
    R(41, 22, 9, 9, O); R(42, 23, 7, 7, '#7ad7a0'); R(43, 26, 1, 1, '#fff'); R(44, 27, 1, 1, '#fff'); R(45, 26, 1, 1, '#fff'); R(46, 25, 1, 1, '#fff');
  });
  ART.palm = (v = 0) => mk(48, 62, (g, R) => {
    // 줄기 (살짝 휘어짐)
    for (let y = 18; y < 62; y++) { const x = 22 + Math.round(Math.sin((62 - y) / 18) * 4 * (v ? -1 : 1)); R(x - 1, y, 7, 1, O); R(x, y, 5, 1, y % 6 < 2 ? '#b57a45' : '#cf9558'); }
    // 잎사귀
    const leaf = (dir, len, up) => { for (let i = 0; i < len; i++) { const x = 25 + dir * i, y = 16 - up + Math.round((i * i) / (len * 0.9)); R(x - 1, y - 2, 3, 6, O); } for (let i = 0; i < len; i++) { const x = 25 + dir * i, y = 16 - up + Math.round((i * i) / (len * 0.9)); R(x, y - 1, 1, 4, i % 3 ? '#5cc66f' : '#7ddc85'); } };
    leaf(1, 20, 4); leaf(-1, 20, 4); leaf(1, 14, 10); leaf(-1, 14, 10);
    circ(R, 25, 14, 6, O); circ(R, 25, 14, 5, '#5cc66f'); R(23, 11, 3, 2, '#8ee696');
    circ(R, 21, 20, 3, O); circ(R, 21, 20, 2, '#a5653a'); circ(R, 28, 21, 3, O); circ(R, 28, 21, 2, '#a5653a');
  });
  ART.umbrella = () => mk(44, 48, (g, R) => {
    R(21, 14, 3, 34, O); R(22, 14, 1, 34, '#ffffff');
    for (let y = 0; y < 16; y++) { const half = Math.round(Math.sqrt(1 - ((15 - y) / 15) ** 2) * 21); R(22 - half - 1, y + 1, half * 2 + 2, 1, O); for (let x = -half; x < half; x++) R(22 + x, y + 1, 1, 1, Math.floor((x + 22) / 7) % 2 ? '#ff8a80' : '#fffaf2'); }
    R(0, 16, 44, 2, O);
  });
  ART.chair = () => mk(30, 18, (g, R) => { R(0, 4, 30, 10, O); for (let x = 1; x < 29; x++) R(x, 5, 1, 8, Math.floor(x / 4) % 2 ? '#5fb4ff' : '#ffffff'); R(2, 13, 3, 5, O); R(25, 13, 3, 5, O); R(0, 0, 8, 8, O); R(1, 1, 6, 6, '#5fb4ff'); });
  ART.castle = () => mk(34, 26, (g, R) => {
    R(2, 10, 30, 16, O); R(3, 11, 28, 15, '#f1d08e'); R(3, 22, 28, 3, '#e2bb73');
    for (const x of [2, 13, 24]) { R(x, 2, 8, 10, O); R(x + 1, 3, 6, 9, '#f6dc9f'); R(x + 1, 0, 2, 3, O); R(x + 5, 0, 2, 3, O); }
    R(14, 16, 6, 9, O); R(15, 17, 4, 8, '#c99a55'); R(16, -1, 1, 4, O); R(17, -1, 4, 2, '#ff6b6b');
  });
  ART.bench = () => mk(34, 18, (g, R) => { R(0, 0, 34, 6, O); R(1, 1, 32, 4, '#d9a066'); R(0, 7, 34, 5, O); R(1, 8, 32, 3, '#c98d55'); R(3, 12, 3, 6, O); R(28, 12, 3, 6, O); });
  ART.flowers = () => mk(36, 18, (g, R) => {
    R(0, 6, 36, 12, O); R(1, 7, 34, 10, '#9a6a42'); R(1, 7, 34, 3, '#7ccf7a');
    const cols = ['#ff7aa8', '#ffd84a', '#ffffff', '#c58fe0'];
    for (let i = 0; i < 7; i++) { const x = 3 + i * 4.6, y = 1 + (i % 2) * 3; R(x - 1, y, 4, 4, O); R(x, y + 1, 2, 2, cols[i % 4]); }
  });
  ART.cart = () => mk(28, 26, (g, R) => {
    R(0, 4, 28, 16, O); R(1, 5, 26, 14, '#d9a066'); R(1, 11, 26, 1, O);
    const bk = ['#ff8a80', '#5fb4ff', '#ffd84a', '#7ad7a0', '#c58fe0'];
    for (let i = 0; i < 5; i++) { R(3 + i * 5, 0 + (i % 2), 4, 11 - (i % 2), O); R(4 + i * 5, 1 + (i % 2), 2, 9 - (i % 2), bk[i]); }
    circ(R, 6, 22, 3, O); circ(R, 22, 22, 3, O); R(5, 21, 2, 2, '#aab6c3'); R(21, 21, 2, 2, '#aab6c3');
  });
  ART.boat = () => mk(56, 40, (g, R) => {
    R(26, 0, 3, 26, O); R(27, 0, 1, 26, '#ffffff');
    for (let y = 2; y < 22; y++) { const w = Math.round((y - 2) * 0.95); R(29, y, w + 1, 1, O); R(29, y, w, 1, y % 5 ? '#fffaf2' : '#ffe08a'); }
    for (let y = 0; y < 12; y++) { const inset = Math.round(y * y / 14); R(2 + inset, 26 + y, 52 - inset * 2, 1, O); if (y < 11) R(3 + inset, 26 + y, 50 - inset * 2, 1, y < 3 ? '#ff8a80' : '#5fb4ff'); }
    R(10, 30, 36, 1, '#ffffff');
  });
  ART.sign = () => mk(52, 30, (g, R) => {
    R(24, 16, 5, 14, O); R(25, 16, 3, 14, '#b9774a');
    R(0, 0, 52, 19, O); R(2, 2, 48, 15, '#f2d3a2'); R(2, 2, 48, 2, '#fbe6c4'); R(2, 15, 48, 2, '#d9a066');
  });
  ART.rock = () => mk(20, 14, (g, R) => { circ(R, 10, 8, 6, O); circ(R, 10, 8, 5, '#b9c4d0'); R(7, 5, 4, 2, '#dfe6ee'); R(3, 11, 15, 3, O); R(4, 11, 13, 2, '#9aa7b6'); });
  ART.crate = () => mk(18, 18, (g, R) => { R(0, 0, 18, 18, O); R(1, 1, 16, 16, '#d9a066'); R(1, 8, 16, 2, '#b9774a'); R(8, 1, 2, 16, '#b9774a'); });

  // ---------- 섬 위 물건 배치 (x,y = 바닥 가운데, 타일 단위 / fp = 충돌 타일) ----------
  const PROPS = [];
  function prop(art, x, y, fp, opt = {}) { PROPS.push(Object.assign({ art, x: x * T, y: y * T, fp }, opt)); }

  // 인증 센터 (등대)
  prop('lighthouse', 21.5, 11.6, [20, 10, 3, 2]);
  // 질문하는 마을
  prop('houseA', 5.6, 7.6, [4, 6, 3, 2]);
  prop('houseB', 11.0, 7.0, [9, 5, 3, 2]);
  prop('houseC', 16.4, 7.6, [15, 6, 3, 2]);
  prop('flowers', 8.2, 12.6, [7, 12, 2, 1]);
  // 사실 확인 도서관
  prop('library', 33, 9.0, [29, 7, 8, 2]);
  prop('cart', 29.4, 11.0, [29, 10, 1, 1]);
  prop('bench', 37.8, 12.6, [37, 12, 2, 1]);
  // 신기한 영상 해변
  prop('screen', 6.8, 21.0, [4, 20, 6, 1], { anim: 'screen' });
  prop('umbrella', 15.6, 23.6, [15, 23, 1, 1]);
  prop('chair', 13.6, 24.6, [13, 24, 2, 1]);
  prop('chair', 17.4, 24.4, [17, 24, 1, 1]);
  prop('castle', 6.0, 24.6, [5, 24, 2, 1]);
  // 안전한 공유 광장
  prop('fountain', 33.5, 23.0, [31, 21, 5, 2], { anim: 'fountain' });
  prop('board', 37.9, 20.6, [37, 19, 2, 2]);
  prop('bench', 28.8, 24.8, [28, 24, 2, 1]);
  prop('flowers', 28.6, 19.6, [28, 19, 2, 1]);
  prop('flowers', 38.4, 24.8, [37, 24, 3, 1]);
  // 부두
  prop('boat', 24.6, 29.4, null, { bob: true });
  prop('crate', 20.0, 26.4, [19, 25, 1, 1]);
  // 야자수·바위
  for (const [x, y, v] of [[3.4, 14.4, 0], [40.4, 13.6, 1], [26.4, 26.0, 1], [18.2, 26.0, 0], [3.0, 20.0, 0], [39.0, 8.4, 1], [25.6, 6.0, 0], [17.4, 4.8, 1], [3.8, 5.0, 0], [14.6, 26.6, 1], [40.2, 18.6, 1]]) prop(v ? 'palm1' : 'palm0', x, y, [Math.floor(x - 0.5), Math.floor(y - 1), 1, 1]);
  for (const [x, y] of [[19.0, 21.0], [25.2, 21.0], [27.4, 4.2], [8.0, 3.6], [36.2, 4.0], [12.4, 2.8]]) prop('rock', x, y, [Math.floor(x - 0.5), Math.floor(y - 1), 1, 1]);

  // 구역 표지판 (글자는 화면 해상도로 선명하게)
  const SIGNS = [
    { x: 13.4 * T, y: 13.4 * T, text: '질문하는 마을', icon: '🏘️' },
    { x: 27.4 * T, y: 13.4 * T, text: '사실 확인 도서관', icon: '📚' },
    { x: 14.0 * T, y: 18.8 * T, text: '신기한 영상 해변', icon: '🎬' },
    { x: 29.6 * T, y: 18.0 * T, text: '안전한 공유 광장', icon: '📷' },
    { x: 17.6 * T, y: 12.0 * T, text: 'AI 탐험대 인증 센터', icon: '🏅' },
    { x: 24.0 * T, y: 26.0 * T, text: '소문 바다', icon: '🫧' },
  ];
  SIGNS.forEach((s) => { s.fp = [Math.floor(s.x / T), Math.floor(s.y / T) - 1, 1, 1]; });

  // ---------- 바닥 그림 미리 만들기 ----------
  let ground = null;
  const COL = {
    W: '#86d1e6', W2: '#7cc6df', w: '#a9e6ef', f: '#f2fcff', s: '#f8e6b4', s2: '#edd59c', s3: '#fff5d8', g: '#b3e8a7', g2: '#98d98f', g3: '#cdf5c2',
    p: '#f2e5cc', p2: '#dccaa6', q: '#f7efe2', q2: '#e6d6bc', r: '#ffe5dc', r2: '#fff4ee', r3: '#f4c8ba', d: '#dba468', d2: '#b47a44', o: '#8fd8ea', k: '#cdd6de',
  };
  function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  const RGB = {}; for (const k in COL) RGB[k] = hex(COL[k]);
  function buildGround() {
    const c = document.createElement('canvas'); c.width = WPX; c.height = HPX;
    const g = c.getContext('2d');
    const img = g.createImageData(WPX, HPX), D = img.data;
    for (let py = 0; py < HPX; py++) for (let px = 0; px < WPX; px++) {
      const x = (px + 0.5) / T, y = (py + 0.5) / T, t = classify(x, y);
      let k = t;
      const h = hash(px, py, 3);
      if (t === 'W') { k = islandV(x, y) > 1.7 ? 'W2' : 'W'; if (h < 0.006) k = 'w'; }
      else if (t === 's') { k = h < 0.03 ? 's2' : h < 0.05 ? 's3' : 's'; if (classify(x, y - 0.1) === 'g' || classify(x, y + 0.1) === 'g' || classify(x - 0.1, y) === 'g' || classify(x + 0.1, y) === 'g') k = 'g2'; }
      else if (t === 'g') { k = h < 0.025 ? 'g2' : h < 0.04 ? 'g3' : 'g'; }
      else if (t === 'p') { const cx = px % 10, cy = (py + (Math.floor(px / 10) % 2) * 5) % 10; k = (cx === 0 || cy === 0) ? 'p2' : 'p'; if (!edgeSame(x, y, 'p')) k = 'p2'; }
      else if (t === 'q') { const d = Math.hypot((x - 21.5), (y - 15.2) / 0.85); const ring = Math.abs((d * 16) % 16) < 1; const ang = Math.atan2(y - 15.2, x - 21.5); const spoke = Math.abs(Math.sin(ang * 4)) < 0.04 && d > 1.2; k = ring || spoke ? 'q2' : 'q'; if (d > 4.25) k = 'q2'; }
      else if (t === 'r') { const ch = (Math.floor(px / 8) + Math.floor(py / 8)) % 2; k = ch ? 'r' : 'r2'; if (!edgeSame(x, y, 'r')) k = 'r3'; }
      else if (t === 'd') { k = (py % 6 === 0) ? 'd2' : 'd'; if (px % 32 === 21 * 16 % 32 || Math.abs(x - 21) < 0.08 || Math.abs(x - 23) < 0.08) k = 'd2'; }
      const [r, gg, b] = RGB[k];
      const i = (py * WPX + px) * 4; D[i] = r; D[i + 1] = gg; D[i + 2] = b; D[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // 장식: 꽃·풀·조개·불가사리·산호
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
      const cx = tx * T + 4 + Math.floor(hash(tx, ty, 7) * 8), cy = ty * T + 4 + Math.floor(hash(tx, ty, 8) * 8);
      const t = classify(cx / T, cy / T), r = hash(tx, ty, 9);
      if (t === 'g') {
        if (r < 0.16) { const col = ['#ff8fb6', '#ffd84a', '#ffffff', '#c9a3ff'][Math.floor(r * 25) % 4]; R(cx, cy, 3, 3, col); R(cx + 1, cy + 1, 1, 1, '#ffb02e'); R(cx + 1, cy + 3, 1, 2, '#5aa95f'); }
        else if (r < 0.42) { R(cx, cy, 1, 2, '#86cc7e'); R(cx + 2, cy - 1, 1, 3, '#86cc7e'); R(cx + 4, cy, 1, 2, '#86cc7e'); }
      } else if (t === 's') {
        if (r < 0.07) { R(cx, cy, 4, 3, '#26344f'); R(cx + 1, cy, 2, 2, '#ffc0b0'); R(cx, cy + 1, 4, 1, '#ffb0a0'); }
        else if (r < 0.11) { R(cx + 2, cy, 1, 5, '#ff9c6b'); R(cx, cy + 2, 5, 1, '#ff9c6b'); R(cx + 2, cy + 2, 1, 1, '#ffd27a'); }
        else if (r < 0.2) { R(cx, cy, 2, 1, '#e3c98c'); }
      } else if (t === 'w') {
        if (r < 0.1) { R(cx, cy, 2, 5, '#ff9a8a'); R(cx - 2, cy + 1, 2, 2, '#ff9a8a'); R(cx + 2, cy + 2, 2, 2, '#ff9a8a'); R(cx, cy + 5, 2, 1, '#e07a6c'); }
        else if (r < 0.16) { R(cx, cy, 5, 3, '#9fdbe6'); }
      }
    }
    // 연못 테두리 수련잎
    R(Math.round(POND.x * T) + 6, Math.round(POND.y * T) - 10, 6, 4, '#5cc66f'); R(Math.round(POND.x * T) - 14, Math.round(POND.y * T) + 4, 5, 3, '#5cc66f');
    // 부두 기둥
    for (const yy of [27, 28.6]) { R(21 * T - 2, yy * T, 4, 6, '#8a5a2a'); R(23 * T - 2, yy * T, 4, 6, '#8a5a2a'); }
    ground = c;
  }
  function edgeSame(x, y, t) { const e = 0.07; return classify(x - e, y) === t && classify(x + e, y) === t && classify(x, y - e) === t && classify(x, y + e) === t; }

  // ---------- 물건 그림 캐시 ----------
  const artCache = {};
  function artOf(name) {
    if (artCache[name]) return artCache[name];
    let c;
    if (name === 'houseA') c = ART.house('#ff9f8f', '#ef7f70', '#fff6e6');
    else if (name === 'houseB') c = ART.house('#ffd36b', '#efb94a', '#f3fbff');
    else if (name === 'houseC') c = ART.house('#7fc4ff', '#5fa6ea', '#fff9ef');
    else if (name === 'palm0') c = ART.palm(0); else if (name === 'palm1') c = ART.palm(1);
    else c = ART[name]();
    artCache[name] = c; return c;
  }

  function init() {
    computeWalk();
    for (const p of PROPS) if (p.fp) blockRect(...p.fp);
    for (const s of SIGNS) blockRect(...s.fp);
    buildGround();
  }

  // ---------- 길찾기 (BFS) ----------
  function findPath(sx, sy, gx, gy) {
    const s = [Math.floor(sx / T), Math.floor(sy / T)], goal = [Math.floor(gx / T), Math.floor(gy / T)];
    const prev = new Int32Array(MW * MH).fill(-1), seen = new Uint8Array(MW * MH);
    const key = (x, y) => y * MW + x;
    const q = [s]; seen[key(...s)] = 1; let found = null, best = null, bestD = 1e9;
    while (q.length) {
      const [x, y] = q.shift();
      const d = Math.abs(x - goal[0]) + Math.abs(y - goal[1]);
      if (d < bestD) { bestD = d; best = [x, y]; }
      if (x === goal[0] && y === goal[1]) { found = [x, y]; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!walkableTile(nx, ny) || seen[key(nx, ny)]) continue;
        seen[key(nx, ny)] = 1; prev[key(nx, ny)] = key(x, y); q.push([nx, ny]);
      }
    }
    const end = found || best; if (!end) return [];
    const out = []; let k = key(...end);
    while (k !== key(...s) && k >= 0) { out.push([(k % MW) * T + T / 2, Math.floor(k / MW) * T + T / 2]); k = prev[k]; }
    out.reverse();
    if (found && walkablePx(gx, gy)) out.push([gx, gy]);
    return out;
  }

  window.World = { T, MW, MH, WPX, HPX, VIEW_W, VIEW_H, init, blockRect, PROPS, SIGNS, artOf, get ground() { return ground; }, walkablePx, walkableTile, findPath, hash, classify, islandV };
})();
