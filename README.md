# Murder Mystery

실시간 멀티플레이어 머더미스터리 파티 게임. 4~5인이 역할을 맡아 단서 카드를 수집하고 토론 후 범인을 지목한다.

## 시작하기

```bash
pnpm install
```

`.env.local`:
```
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx...
```

```bash
pnpm dev
```

Upstash 키는 [upstash.com](https://upstash.com) → Create Database → REST API 탭에서 발급.

## 시나리오 추가

`src/data/scenario.ts`에 `Scenario` 객체를 작성하고 `SCENARIO_REGISTRY`에 등록.

```ts
export const CASE_XXX: Scenario = {
  id: "case_xxx",
  // roles, hintCards, initialCards, unlocks chain, truth ...
};

export const SCENARIO_REGISTRY = {
  case_001: CASE_001,
  case_002: CASE_002,
  case_xxx: CASE_XXX, // 추가
};
```

카드 설계 규칙:
- `initialCards`에 포함된 카드 + `unlocks` 체인으로 도달 가능한 카드만 게임에 등장
- 모든 카드는 initialCards에서 unlock chain으로 반드시 도달 가능해야 함
- 총 카드 수(initialCards + unlock으로 열리는 모든 카드)는 `playerCount`의 배수여야 함
- 역할별 비밀 정보는 카드가 아닌 `Role.knownInfo`에 작성

## 배포

Vercel에 저장소 연결 후 환경변수 추가:

| 키 | 값 |
|----|----|
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST Token |

> Upstash Vercel Integration을 연결하면 환경변수가 자동 주입됩니다.
