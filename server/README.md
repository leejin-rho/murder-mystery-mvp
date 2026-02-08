# Murder Mystery Server

Express + Socket.IO 기반 게임 서버

## 개발 서버 실행

```bash
npm run dev
```

http://localhost:4000 에서 실행됩니다.

## 시나리오 파일

`/scenarios` 폴더에 JSON 형식의 시나리오 파일을 추가할 수 있습니다.

서버 시작 시 자동으로 검증됩니다.

## 주요 기능

- 시나리오 로딩 및 검증
- 방 생성/참가 관리
- 게임 진행 제어
- 실시간 상태 동기화
- 공개/비공개 정보 분리

## Socket.IO 이벤트

### Client -> Server

- `room:create`: 방 생성
- `room:join`: 방 참가
- `game:start`: 게임 시작
- `game:pick`: 선택지 선택

### Server -> Client

- `room:state`: 방 상태 업데이트
- `game:myPrivate`: 개인 비밀 정보
- `game:scene`: 현재 씬 정보
- `game:scenePrivate`: 씬별 개인 정보
- `error`: 에러 메시지
