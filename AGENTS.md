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

## Non-obvious Decisions
- Cards have both `id` (internal key) and `number` (shown to players) — don't confuse them; `availableCards` uses `id`, `unlocks` uses `number`
- `visibleTo` on secret cards is client-side filtered only — full GameState is sent to all clients
- `actionRule` (show_all, ask_question, etc.) is defined in card data but **not enforced in UI** — currently just text hints