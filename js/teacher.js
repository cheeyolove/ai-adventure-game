// AI 탐험대! 선생님용 기록 화면 (이 기기 저장소 + 결과 코드)
(function () {
  'use strict';
  const CFG = window.AIX_CONFIG;
  const IMPORT_KEY = 'ai-explorers:teacher-imports';
  const M = ['m1', 'm2', 'm3', 'm4', 'm5'];
  const MN = ['① 영상 해변', '② 질문 마을', '③ 도서관', '④ 공유 광장', '⑤ 최종 시험'];
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtTime = (sec) => { sec = Math.round(sec || 0); const m = Math.floor(sec / 60), s = sec % 60; return m ? `${m}분 ${s}초` : `${s}초`; };
  const fmtDate = (t) => { if (!t) return '-'; const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

  function loadLocal() {
    try { const s = JSON.parse(localStorage.getItem(CFG.STORAGE_KEY) || 'null'); if (s && s.players) return s; } catch (e) { }
    return { v: 1, current: null, players: {} };
  }
  function loadImports() { try { return JSON.parse(localStorage.getItem(IMPORT_KEY) || '[]'); } catch (e) { return []; } }
  function saveImports(a) { try { localStorage.setItem(IMPORT_KEY, JSON.stringify(a)); } catch (e) { } }

  // 표로 바꾸기 쉬운 한 줄 모양
  function rowFromProfile(p) {
    return { nick: p.nick, done: M.map((id) => !!p.missions[id].done), wrong: M.map((id) => p.missions[id].wrong || 0), playSecs: p.playSecs || 0, finishedAt: p.finishedAt || 0 };
  }
  function rowFromCode(code) {
    const raw = code.trim().replace(/^AIX1-/, '');
    const o = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (!o || typeof o.n !== 'string' || !/^[01]{5}$/.test(o.m)) throw new Error('bad');
    return { nick: o.n.slice(0, 20), done: o.m.split('').map((c) => c === '1'), wrong: String(o.w || '').split('.').map((x) => +x || 0), playSecs: +o.s || 0, finishedAt: +o.f || 0 };
  }

  function renderTable(el, rows, withDelete) {
    if (!rows.length) { el.innerHTML = '<tr><td class="empty">아직 기록이 없어요.</td></tr>'; return; }
    let h = '<tr><th>별명</th>' + MN.map((n) => `<th>${n}</th>`).join('') + '<th>전체 완료</th><th>다시 도전(합계)</th><th>미션별 다시 도전</th><th>플레이 시간</th><th>완료 시각</th>' + (withDelete ? '<th></th>' : '') + '</tr>';
    for (const r of rows) {
      const all = r.done.every(Boolean), total = r.wrong.reduce((a, b) => a + b, 0);
      h += `<tr><td class="nick">${esc(r.nick)}</td>` + r.done.map((d) => `<td class="${d ? 'y' : 'n'}">${d ? '✔' : '–'}</td>`).join('') +
        `<td class="all">${all ? '🏅 완료' : `${r.done.filter(Boolean).length} / 5`}</td><td>${total}</td><td>${r.wrong.join(' · ')}</td><td>${fmtTime(r.playSecs)}</td><td>${fmtDate(r.finishedAt)}</td>` +
        (withDelete ? `<td><button class="mini" data-del="${esc(r.nick)}" type="button">지우기</button></td>` : '') + '</tr>';
    }
    el.innerHTML = h;
  }
  function toCSV(rows) {
    const head = ['별명', ...MN.map((n) => n + ' 완료'), '전체 완료', '다시 도전 합계', ...MN.map((n) => n + ' 다시 도전'), '플레이 시간(초)', '완료 시각'];
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [head.map(q).join(',')];
    for (const r of rows) lines.push([r.nick, ...r.done.map((d) => (d ? 'O' : 'X')), r.done.every(Boolean) ? 'O' : 'X', r.wrong.reduce((a, b) => a + b, 0), ...r.wrong, Math.round(r.playSecs), r.finishedAt ? new Date(r.finishedAt).toLocaleString('ko-KR') : ''].map(q).join(','));
    return '﻿' + lines.join('\r\n');
  }
  function download(name, text) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function localRows() { return Object.values(loadLocal().players).map(rowFromProfile).sort((a, b) => a.nick.localeCompare(b.nick, 'ko')); }
  function refresh() {
    renderTable($('localTable'), localRows(), true);
    renderTable($('importTable'), loadImports(), false);
    $('endpointState').textContent = CFG.RESULT_ENDPOINT ? '결과 전송 켜짐' : '결과 전송 꺼짐 (기본값)';
  }
  $('localTable').addEventListener('click', (e) => {
    const nick = e.target && e.target.dataset && e.target.dataset.del; if (!nick) return;
    if (!confirm(`'${nick}' 학생의 이 기기 기록을 지울까요?`)) return;
    const s = loadLocal(); delete s.players[nick]; if (s.current === nick) s.current = null;
    try { localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(s)); } catch (er) { }
    refresh();
  });
  $('reload').onclick = refresh;
  $('csvLocal').onclick = () => download('AI탐험대_이기기_기록.csv', toCSV(localRows()));
  $('clearLocal').onclick = () => {
    if (!confirm('이 기기에 저장된 AI 탐험대 학생 기록을 모두 지울까요? (판다 탐험대 등 다른 게임 기록은 지우지 않아요)')) return;
    try { localStorage.removeItem(CFG.STORAGE_KEY); } catch (e) { }
    refresh();
  };
  $('addCodes').onclick = () => {
    const lines = $('codes').value.split(/\s+/).filter((l) => l.startsWith('AIX1-'));
    const list = loadImports(); let ok = 0, bad = 0;
    for (const l of lines) {
      try { const r = rowFromCode(l); const i = list.findIndex((x) => x.nick === r.nick); if (i >= 0) list[i] = r; else list.push(r); ok++; } catch (e) { bad++; }
    }
    saveImports(list); $('codes').value = '';
    $('importMsg').textContent = `${ok}개 추가했어요.` + (bad ? ` (${bad}개는 읽을 수 없는 코드예요)` : '');
    refresh();
  };
  $('csvImport').onclick = () => download('AI탐험대_결과코드_모음.csv', toCSV(loadImports()));
  $('clearImport').onclick = () => { if (confirm('모은 결과 코드를 지울까요?')) { saveImports([]); refresh(); } };
  refresh();
})();
