# (선택) 학생 결과를 Google 시트로 받기

기본 설정에서 「AI 탐험대!」는 **어떤 데이터도 밖으로 보내지 않아요.**
학생 기록은 각 기기의 브라우저 저장소(`localStorage`, 키 `ai-explorers:v1`)에만 저장됩니다.
(함께 탐험 기능은 별명·위치·착용 아이템만 같은 방 친구들에게 실시간으로 주고받고, 기록은 보내지 않아요.)

여러 태블릿의 결과를 한곳에서 보고 싶을 때만 아래 방법을 쓰세요.
(판다 탐험대의 Google 시트 설정은 복사하지 않았어요. 이 게임 전용으로 새로 만들어야 합니다.)

## 보내는 정보 (최소한)

```json
{ "game": "ai-explorers", "nick": "반짝 바다표범",
  "missions": { "m1": { "done": true, "wrong": 1, "secs": 95 }, "...": "...", "fin": { "done": true, "wrong": 0, "secs": 60 } },
  "allDone": true, "playSecs": 640, "finishedAt": "2026-11-23T05:12:00.000Z" }
```

- 실명·얼굴·사진·기기 정보는 보내지 않아요. 별명은 실명이 아니도록 지도해 주세요.
- 미션을 하나 마칠 때마다 한 줄씩 보냅니다.

## 1. 새 Google 시트 + Apps Script 만들기

1. 새 Google 시트를 만들고 **확장 프로그램 → Apps Script**를 엽니다.
2. 아래 코드를 붙여 넣고 저장합니다.

```js
function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('결과') || ss.insertSheet('결과');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['받은 시각', '별명', '①', '②', '③', '④', '⑤', '최종', '전체 완료',
      '① 다시 도전', '② 다시 도전', '③ 다시 도전', '④ 다시 도전', '⑤ 다시 도전', '최종 다시 도전', '플레이 시간(초)', '완료 시각']);
  }
  const d = JSON.parse(e.postData.contents);
  if (d.game !== 'ai-explorers') return ContentService.createTextOutput('ignored');
  const ids = ['m1', 'm2', 'm3', 'm4', 'm5', 'fin'];
  sheet.appendRow([new Date(), String(d.nick).slice(0, 20),
    ...ids.map((k) => (d.missions[k] && d.missions[k].done ? 'O' : 'X')), d.allDone ? 'O' : 'X',
    ...ids.map((k) => (d.missions[k] ? d.missions[k].wrong : '')), d.playSecs, d.finishedAt]);
  return ContentService.createTextOutput('ok');
}
```

3. **배포 → 새 배포 → 유형: 웹 앱**, 실행 사용자: 나, 액세스 권한: 모든 사용자 → 배포.
4. 나오는 웹 앱 주소(`https://script.google.com/macros/s/.../exec`)를 복사합니다.

## 2. 게임에 주소 넣기

`js/config.js` 의 `RESULT_ENDPOINT` 값을 바꾸고 GitHub에 올립니다.

```js
RESULT_ENDPOINT: 'https://script.google.com/macros/s/....../exec',
```

- 주소를 비워 두면(`''`) 전송 기능은 꺼지고, 게임은 그대로 정상 작동해요.
- 전송이 실패해도 학생 화면에는 아무 영향이 없어요.

## 서버 없이 모으는 방법

인증서 화면의 「선생님께 보여 줄 결과 코드」(`AIX1-…`)를 학급 게시판 등에 붙여 넣게 한 뒤,
`teacher.html` 의 「결과 코드 모으기」에 붙여 넣으면 표와 CSV로 모을 수 있어요.
