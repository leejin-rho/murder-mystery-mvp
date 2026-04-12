# Murder Mystery Game — 저택의 비밀

실시간 멀티플레이어 머더미스터리 게임입니다.

## 기술 스택

- **프론트**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **패키지 매니저**: pnpm
- **백엔드**: Next.js API Routes (`app/api/game/[[...path]]`)
- **스토리지**: Upstash Redis (게임 상태 + 채팅)
- **시나리오 데이터**: `src/data/scenario.ts` (프론트/백엔드 공유)

## 프로젝트 구조

```
/
├── app/
│   ├── api/game/[[...path]]/   # 게임 API (방 생성/참가/카드/채팅/투표)
│   ├── room/[roomId]/          # 방 URL 직접 접속
│   └── page.tsx
├── src/
│   ├── components/             # GameApp (메인 UI), ui (button, input)
│   ├── data/scenario.ts        # 시나리오 데이터 (단일 소스)
│   └── lib/
│       ├── redis.ts            # Upstash 클라이언트 + 타입 + KV 헬퍼
│       └── game-engine.ts      # 게임 로직 (턴, 카드, 결과 계산)
└── package.json
```

## Redis 키 구조

```
game:{roomId}:state   String (JSON)   게임 상태 전체, TTL 4시간
game:{roomId}:chat    List            채팅 메시지 (최대 200개), TTL 4시간
```

## 설치 및 실행

```bash
pnpm install
```

`.env.local` 생성:

```
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

```bash
pnpm dev
```

브라우저에서 http://localhost:3000 접속.

> Upstash 키 발급: [upstash.com](https://upstash.com) → Create Database → REST API 탭

## 게임 상태 머신

```
waiting → intro → card_pick → discussion → event(선택) → final_vote → result
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | Next.js 개발 서버 (3000 포트) |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 프로덕션 서버 실행 |

## 배포 (Vercel + Upstash)

### 1. Upstash Redis 생성
(이미 있으면 그대로 사용)
1. [upstash.com](https://upstash.com) 로그인 후 **Create Database**
2. 생성 후 **REST API** 탭에서 URL과 Token 복사

### 2. Vercel 배포

1. [vercel.com](https://vercel.com) 에서 이 저장소 연결
2. **Environment Variables**에 추가:

   | 이름 | 값 |
   |------|-----|
   | `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
   | `UPSTASH_REDIS_REST_TOKEN` | Upstash REST Token |

3. **Deploy** 실행

> 팁: Upstash 대시보드에서 **Vercel Integration**을 연결하면 환경변수가 자동으로 주입됩니다.

## 구현된 기능

- ✅ 게임 룸 생성/참가
- ✅ 역할 자동 배정
- ✅ 카드 선택 (턴제, 해금 체인)
- ✅ 실시간 동기화
- ✅ 토론 타이머
- ✅ 라운드 이벤트
- ✅ 채팅
- ✅ 최종 투표 및 결과
- ✅ 역할별 비밀 정보
