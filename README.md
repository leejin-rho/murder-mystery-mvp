# Murder Mystery Game — 저택의 비밀

실시간 멀티플레이어 머더미스터리 게임입니다. Supabase 백엔드로 Socket.IO 없이 게임 상태를 동기화합니다.

## 기술 스택

- **프론트**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **패키지 매니저**: pnpm
- **백엔드**: Supabase Edge Functions (Hono) + KV 스토어, 폴링으로 실시간 동기화

## 프로젝트 구조

```
/
├── app/                 # Next.js App Router (layout, page, globals.css)
├── src/
│   ├── components/      # GameApp, ui (button, input)
│   ├── data/           # scenario (저택의 비밀)
│   └── lib/            # supabase 설정
├── server/             # (선택) Express + Socket.IO 로컬 서버
├── supabase/
│   └── functions/      # Supabase Edge Functions (게임 API)
├── package.json        # Next.js + pnpm
└── README.md
```

## 설치 및 실행

**필수**: [Node.js](https://nodejs.org/) 설치 후 [pnpm](https://pnpm.io/) 사용 (또는 `corepack enable pnpm`).

```bash
pnpm install
pnpm dev
```

브라우저에서 http://localhost:3000 접속.

## 테스트 방법 (Figma Make 플로우)

1. **브라우저 탭 1**: "새 게임 만들기"로 방 생성
2. **브라우저 탭 2~6**: 방 코드 입력 후 "게임 참가하기"
3. 방장이 **"게임 시작"** 클릭
4. 각 플레이어가 자신의 **역할**과 **비공개 정보** 확인
5. **choice 씬**에서 선택 → 전원 투표 후 자동으로 다음 씬 진행

## 구현된 기능

- ✅ 게임 룸 생성/참가 (4–6명)
- ✅ 역할 자동 배정 (탐정, 집사, 상속자, 가정부, 주치의, 손님)
- ✅ 실시간 동기화 (Supabase KV + 폴링)
- ✅ narration / choice 씬 진행
- ✅ 역할별 비공개 정보
- ✅ 전원 선택 시 자동 다음 씬
- ✅ 다크 미스터리 UI (검정/빨강 테마)
- ✅ "저택의 비밀" 시나리오 전체 포함

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | Next.js 개발 서버 (기본 3000 포트) |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 프로덕션 서버 실행 |
| `pnpm dev:server` | server/ 폴더의 Express 서버 실행 (선택 사항) |

## 배포 (Vercel + Supabase)

프론트는 **Vercel**, 게임 API는 **Supabase Edge Functions**에 올리면 됩니다. 별도 서버 호스팅 없이 둘만 연결하면 동작합니다.

### 1. Supabase 쪽 (게임 API)

1. [Supabase](https://supabase.com) 로그인 후 프로젝트 생성 (이미 있으면 그대로 사용).
2. **Project Settings → API**에서 확인:
   - **Project URL** 예: `https://xxxxx.supabase.co` → `xxxxx`가 프로젝트 ID(Project ref)
   - **anon public** 키 복사
3. **Edge Functions 배포** (게임 로직이 들어 있는 함수):
   ```bash
   npx supabase login
   npx supabase link --project-ref 여기에_프로젝트_ID
   npx supabase functions deploy server --no-verify-jwt
   ```
   - 프로젝트 루트에서 실행. `server`는 `supabase/functions/server` 폴더 이름입니다.
   - 코드 수정 후 다시 배포할 때도 위 명령 한 번 더 실행하면 됩니다.
   - 배포 후 Supabase 대시보드 **Edge Functions**에서 `server`가 보이면 성공.

### 2. Vercel 쪽 (프론트)

1. [Vercel](https://vercel.com) 로그인 후 **Add New → Project**에서 이 저장소 연결.
2. **Environment Variables**에 다음 두 개 추가 (Supabase와 연결용):

   | 이름 | 값 |
   |------|-----|
   | `NEXT_PUBLIC_SUPABASE_PROJECT_ID` | Supabase Project ref (예: `lncxmdumvyepjkyvoamx`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |

   - Supabase 대시보드 **Project Settings → API**에서 복사.
3. **Deploy** 실행.

### 3. 연결 구조

- Vercel에 올라간 Next.js 앱이 **브라우저에서** Supabase Edge Functions를 직접 호출합니다.
- 요청 주소: `https://<PROJECT_REF>.supabase.co/functions/v1/server/make-server-0d019d5f/...` (함수 이름 `server` = 폴더 이름)
- 환경 변수로 `PROJECT_REF`와 `ANON_KEY`를 넣어 두었기 때문에, Vercel 빌드 시 해당 Supabase 프로젝트로 연결됩니다.

로컬에서도 같은 Supabase를 쓰려면 프로젝트 루트에 `.env.local`을 만들고 위 두 변수를 넣으면 됩니다. (없으면 코드의 기본값 사용)

## 주의사항

- 게임 API는 **Supabase Edge Functions** (`supabase/functions/server`)를 사용합니다. Supabase에 함수를 한 번 배포해야 방 만들기/참가/게임 진행이 됩니다.
- `NEXT_PUBLIC_*` 환경 변수는 브라우저에 노출되므로, **anon key**만 사용하고 시크릿 키는 넣지 마세요.
