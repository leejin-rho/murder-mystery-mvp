# Murder Mystery MVP

Real-time multiplayer murder mystery party game (4–5 players). Players pick hint cards in turns, discuss, then vote on killer/motive/method.

## Stack
Next.js 14 App Router · Upstash Redis · Tailwind CSS · pnpm · Vercel

## Key Files
- `src/components/GameApp.tsx` — all UI screens and game phases (single large component)
- `src/data/scenario.ts` — scenario/role/card/truth data; add new scenarios to `SCENARIO_REGISTRY` here
- `src/lib/game-engine.ts` — state transitions, card unlock chain, result calc
- `src/lib/redis.ts` — Redis client + shared types (used by both frontend and API)
- `app/api/game/[[...path]]/route.ts` — all API endpoints in one dynamic route

## Game Status Flow
`waiting → intro → card_pick → discussion → [event] → … → final_vote → result`

Server auto-transitions on timer expiry, detected during GET polling. No WebSockets.

Each round = all players pick 1 card each → timed discussion. Game ends when `availableCards` is empty after discussion.

## Card System
Cards have two identifiers: `id` (internal, used in `availableCards`/`playerHands`) and `number` (displayed to players, used in `unlocks`). Don't mix them.

Cards enter the pool via two paths only:
1. `scenario.initialCards` — seeded at game start
2. `HintCard.unlocks` — added to pool when the parent card is picked

Every card must be reachable from `initialCards` through the unlock graph, or it will never appear. There is no auto-fill fallback.

Total card count (initialCards + all reachable via unlocks) must be a multiple of `playerCount`. Otherwise the last round ends with some players unable to pick.

`visibleTo` on secret cards is client-side filtered only — full GameState is sent to all clients.

`actionRule` (`show_all`, `keep_secret`, `ask_question`) is defined in card data but not enforced in UI — currently text hints only.
