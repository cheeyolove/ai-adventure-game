// AI 탐험대! 설정 파일
// 이 게임은 판다 탐험대와 완전히 분리된 프로젝트입니다.
// 저장 키는 모두 'ai-explorers:' 로 시작하므로 판다 탐험대('panda-...') 저장 데이터와 겹치지 않아요.
window.AIX_CONFIG = {
  // 브라우저 저장소(localStorage) 키
  STORAGE_KEY: 'ai-explorers:v1',
  SETTINGS_KEY: 'ai-explorers:settings',

  // (선택) 교사용 결과 전송 주소.
  // 비워 두면 아무 데이터도 밖으로 보내지 않아요. (기본값: 전송 안 함)
  // 선생님이 직접 만든 Google Apps Script 웹앱 주소 등을 넣으면,
  // 미션을 마칠 때마다 '별명·미션 완료 여부·다시 도전 횟수·걸린 시간'만 보냅니다.
  // 자세한 방법은 docs/teacher-results.md 를 보세요.
  RESULT_ENDPOINT: '',

  // (선택) 함께 탐험 연결 서버. 비워 두면(null) PeerJS 공용 서버(0.peerjs.com)를 써요.
  // 학교에서 직접 PeerJS 서버를 운영한다면 예: { host: 'peer.school.example', port: 443, path: '/', secure: true }
  PEER_SERVER: null,
};
