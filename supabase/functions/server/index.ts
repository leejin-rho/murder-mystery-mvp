import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import * as kv from "./kv_store.ts";

/* ── Types ── */

interface Player {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
  connected: boolean;
  joinedAt: number;
}

interface ChatMessage {
  playerId: string;
  name: string;
  playerName?: string;
  text: string;
  time: number;
}

type GameStatus =
  | "waiting"
  | "intro"
  | "card_pick"
  | "discussion"
  | "event"
  | "final_vote"
  | "result";

interface FinalVote {
  killer: string;
  motive: string;
  method: string;
}

interface GameState {
  roomId: string;
  scenario: string;
  players: Player[];
  status: GameStatus;
  createdAt: number;
  // round tracking
  currentRound: number;
  totalRounds: number;
  currentTurnIndex: number;
  cardsPickedThisRound: number;
  cardsPerPlayerThisRound: number;
  // card system
  availableCards: string[];
  playerHands: Record<string, string[]>;
  // discussion
  chat: ChatMessage[];
  discussionEndsAt: number | null;
  // event
  currentEvent: { title: string; text: string } | null;
  // voting & result
  finalVotes: Record<string, FinalVote>;
  readyPlayers: Record<string, string[]>;
  results: Record<string, { won: boolean; reason: string }> | null;
}

/* ── Scenario data (minimal server-side, roles + rounds config) ── */

interface CardMeta { id: string; number: number; unlocks?: number[] }
interface ScenarioData {
  roles: { id: string; name: string; isMurderer: boolean }[];
  cards: CardMeta[];
  initialCardNumbers: number[];
  rounds: { id: number; cardsPerPlayer: number; discussionSeconds: number; event?: { title: string; text: string } }[];
  truth: { killerId: string; motive: string; method: string };
}

const SCENARIOS: Record<string, ScenarioData> = {
  case_001: {
    roles: [
      { id: "detective", name: "탐정 — 서하진", isMurderer: false },
      { id: "butler", name: "집사 — 윤기섭", isMurderer: false },
      { id: "heir", name: "상속자 — 한서준", isMurderer: false },
      { id: "doctor", name: "주치의 — 강민혁", isMurderer: true },
    ],
    cards: [
      { id: "card_01", number: 1, unlocks: [15, 16] },
      { id: "card_02", number: 2, unlocks: [17] },
      { id: "card_03", number: 3 },
      { id: "card_04", number: 4, unlocks: [18] },
      { id: "card_05", number: 5, unlocks: [19] },
      { id: "card_06", number: 6, unlocks: [20] },
      { id: "card_07", number: 7 },
      { id: "card_08", number: 8, unlocks: [21] },
      { id: "card_09", number: 9, unlocks: [22, 23] },
      { id: "card_10", number: 10, unlocks: [24] },
      { id: "card_11", number: 11 },
      { id: "card_12", number: 12 },
      { id: "card_13", number: 13 },
      { id: "card_14", number: 14 },
      { id: "card_15", number: 15, unlocks: [25] },
      { id: "card_16", number: 16 },
      { id: "card_17", number: 17 },
      { id: "card_18", number: 18, unlocks: [26] },
      { id: "card_19", number: 19 },
      { id: "card_20", number: 20 },
      { id: "card_21", number: 21 },
      { id: "card_22", number: 22, unlocks: [27] },
      { id: "card_23", number: 23 },
      { id: "card_24", number: 24 },
      { id: "card_25", number: 25 },
      { id: "card_26", number: 26 },
      { id: "card_27", number: 27 },
      { id: "card_28", number: 28 },
      { id: "card_29", number: 29 },
      { id: "card_30", number: 30 },
      { id: "card_31", number: 31 },
      { id: "card_32", number: 32 },
    ],
    initialCardNumbers: [1, 2, 3, 4, 5, 6, 7, 8],
    rounds: [
      { id: 1, cardsPerPlayer: 2, discussionSeconds: 180, event: { title: "긴급 발견", text: "수사관이 서재를 추가 조사하던 중, 벽난로 안에서 태운 흔적이 있는 라텍스 장갑 조각을 발견했습니다." } },
      { id: 2, cardsPerPlayer: 2, discussionSeconds: 180, event: { title: "집사의 추가 증언", text: "집사가 새로운 기억을 떠올렸습니다. '서재에서 나오는 사람의 손에 작은 병 같은 것이 쥐어져 있었습니다.'" } },
      { id: 3, cardsPerPlayer: 1, discussionSeconds: 120 },
    ],
    truth: {
      killerId: "doctor",
      motive: "10년간 미상환된 5억 원의 빚에 대한 원한",
      method: "졸피뎀(수면제)을 와인에 타서 의식을 잃게 한 후 질식사",
    },
  },
  case_002: {
    roles: [
      { id: "lawyer", name: "변호사 — 한지훈", isMurderer: false },
      { id: "secretary", name: "비서 — 윤세라", isMurderer: false },
      { id: "brother", name: "동생 — 강민우", isMurderer: false },
      { id: "doctor", name: "의사 — 최도현", isMurderer: true },
      { id: "journalist", name: "기자 — 이수진", isMurderer: false },
    ],
    cards: Array.from({ length: 40 }, (_, i) => ({ id: `card_${String(i + 1).padStart(2, "0")}`, number: i + 1 })),
    initialCardNumbers: Array.from({ length: 40 }, (_, i) => i + 1),
    rounds: [
      { id: 1, cardsPerPlayer: 1, discussionSeconds: 180 },
      { id: 2, cardsPerPlayer: 1, discussionSeconds: 180 },
      { id: 3, cardsPerPlayer: 1, discussionSeconds: 180 },
      { id: 4, cardsPerPlayer: 1, discussionSeconds: 180 },
      { id: 5, cardsPerPlayer: 1, discussionSeconds: 180 },
    ],
    truth: {
      killerId: "doctor",
      motive: "피해자는 건강 이상을 눈치채고 병원을 바꾸려 했고, 의료 기록 조작이 들킬 것을 우려해 독살했다.",
      method: "와인잔에 독극물 투입",
    },
  },
};

/* ── Helpers ── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Check discussion timer and advance state if expired */
function checkAutoTransition(gs: GameState): boolean {
  if (gs.status === "discussion" && gs.discussionEndsAt && Date.now() >= gs.discussionEndsAt) {
    const scenarioData = SCENARIOS[gs.scenario];
    if (!scenarioData) return false;

    const currentRoundData = scenarioData.rounds.find(r => r.id === gs.currentRound);
    if (currentRoundData?.event) {
      gs.status = "event";
      gs.currentEvent = currentRoundData.event;
      gs.readyPlayers["event"] = [];
    } else if (gs.currentRound >= gs.totalRounds) {
      gs.status = "final_vote";
      gs.discussionEndsAt = null;
    } else {
      startNextRound(gs, scenarioData);
    }
    gs.discussionEndsAt = null;
    return true;
  }
  return false;
}

function startNextRound(gs: GameState, scenarioData: typeof SCENARIOS["case_001"]) {
  gs.currentRound++;
  const roundData = scenarioData.rounds.find(r => r.id === gs.currentRound);
  gs.status = "card_pick";
  gs.currentTurnIndex = 0;
  gs.cardsPickedThisRound = 0;
  gs.cardsPerPlayerThisRound = roundData?.cardsPerPlayer ?? 1;
  gs.currentEvent = null;

  const need = gs.players.length * gs.cardsPerPlayerThisRound;
  const inHands = new Set(Object.values(gs.playerHands).flat());
  const alreadyInPool = new Set(gs.availableCards);
  if (gs.availableCards.length < need) {
    const sortedCards = [...scenarioData.cards].sort((a, b) => a.number - b.number);
    for (const c of sortedCards) {
      if (gs.availableCards.length >= need) break;
      if (inHands.has(c.id) || alreadyInPool.has(c.id)) continue;
      gs.availableCards.push(c.id);
      alreadyInPool.add(c.id);
    }
  }
}

/* ── App ── */

const app = new Hono().basePath("/server");

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  maxAge: 600,
}));

app.get("/make-server-0d019d5f/health", (c) => c.json({ status: "ok" }));

const GAME_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/* ── Delete Room ── */
app.delete("/make-server-0d019d5f/room/:roomId", async (c) => {
  try {
    const roomId = c.req.param("roomId");
    await kv.del(`game:${roomId}`);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500);
  }
});

/* ── Cleanup stale games (called periodically or manually) ── */
app.post("/make-server-0d019d5f/cleanup", async (c) => {
  try {
    const all = await kv.getByPrefix("game:") as GameState[];
    const now = Date.now();
    let cleaned = 0;
    for (const gs of all) {
      if (gs?.createdAt && (now - gs.createdAt > GAME_TTL_MS)) {
        await kv.del(`game:${gs.roomId}`);
        cleaned++;
      }
    }
    return c.json({ success: true, cleaned });
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500);
  }
});

/* ── Room Create ── */
app.post("/make-server-0d019d5f/room/create", async (c) => {
  try {
    const { playerName, scenarioId } = await c.req.json();
    const sid = scenarioId || "case_001";
    const scenarioData = SCENARIOS[sid];
    if (!scenarioData) return c.json({ success: false, error: "Unknown scenario" }, 400);

    const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    const playerId = `p_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;

    const gs: GameState = {
      roomId,
      scenario: sid,
      players: [{ id: playerId, name: playerName, roleId: "", roleName: "", connected: true, joinedAt: Date.now() }],
      status: "waiting",
      createdAt: Date.now(),
      currentRound: 0,
      totalRounds: scenarioData.rounds.length,
      currentTurnIndex: 0,
      cardsPickedThisRound: 0,
      cardsPerPlayerThisRound: 0,
      availableCards: shuffle(
        scenarioData.cards
          .filter(c => scenarioData.initialCardNumbers.includes(c.number))
          .map(c => c.id)
      ),
      playerHands: {},
      chat: [],
      discussionEndsAt: null,
      currentEvent: null,
      finalVotes: {},
      readyPlayers: {},
      results: null,
    };

    await kv.set(`game:${roomId}`, gs);
    return c.json({ success: true, roomId, playerId, gameState: gs });
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500);
  }
});

/* ── Room Join / Rejoin ── */
app.post("/make-server-0d019d5f/room/join", async (c) => {
  try {
    const { roomId, playerName } = await c.req.json();
    const gs = await kv.get<GameState>(`game:${roomId}`);
    if (!gs) return c.json({ success: false, error: "Room not found" }, 404);

    const existing = gs.players.find(p => p.name === playerName);
    if (existing) {
      existing.connected = true;
      await kv.set(`game:${roomId}`, gs);
      return c.json({ success: true, playerId: existing.id, gameState: gs, rejoin: true });
    }

    const scenarioData = SCENARIOS[gs.scenario];
    const maxPlayers = scenarioData?.roles?.length ?? 4;
    if (gs.status !== "waiting") return c.json({ success: false, error: "게임이 이미 시작되었습니다" }, 400);
    if (gs.players.length >= maxPlayers) return c.json({ success: false, error: `방이 가득 찼습니다 (최대 ${maxPlayers}명)` }, 400);

    const playerId = `p_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    gs.players.push({ id: playerId, name: playerName, roleId: "", roleName: "", connected: true, joinedAt: Date.now() });
    await kv.set(`game:${roomId}`, gs);
    return c.json({ success: true, playerId, gameState: gs });
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500);
  }
});

/* ── Get Game State (with auto-transition + TTL check) ── */
app.get("/make-server-0d019d5f/room/:roomId", async (c) => {
  try {
    const gs = await kv.get<GameState>(`game:${c.req.param("roomId")}`);
    if (!gs) return c.json({ success: false, error: "Room not found" }, 404);
    if (Date.now() - gs.createdAt > GAME_TTL_MS) {
      await kv.del(`game:${gs.roomId}`);
      return c.json({ success: false, error: "게임이 만료되었습니다 (2시간 초과)" }, 410);
    }
    if (checkAutoTransition(gs)) await kv.set(`game:${gs.roomId}`, gs);
    return c.json({ success: true, gameState: gs });
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500);
  }
});

/* ── Start Game ── */
app.post("/make-server-0d019d5f/room/:roomId/start", async (c) => {
  try {
    const gs = await kv.get<GameState>(`game:${c.req.param("roomId")}`);
    if (!gs) return c.json({ success: false, error: "Room not found" }, 404);
    if (gs.status !== "waiting") return c.json({ success: false, error: "Game already started" }, 400);
    const scenarioData = SCENARIOS[gs.scenario];
    if (!scenarioData) return c.json({ success: false, error: "Unknown scenario" }, 400);
    const requiredPlayers = scenarioData.roles.length;
    if (gs.players.length !== requiredPlayers) return c.json({ success: false, error: `정확히 ${requiredPlayers}명의 플레이어가 필요합니다` }, 400);
    const shuffledRoles = shuffle(scenarioData.roles);
    gs.players.forEach((p, i) => {
      p.roleId = shuffledRoles[i].id;
      p.roleName = shuffledRoles[i].name;
      gs.playerHands[p.id] = [];
    });

    gs.status = "intro";
    gs.readyPlayers = {};
    await kv.set(`game:${gs.roomId}`, gs);
    return c.json({ success: true, gameState: gs });
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500);
  }
});

/* ── Ready (intro / event confirmation) ── */
app.post("/make-server-0d019d5f/room/:roomId/ready", async (c) => {
  try {
    const { playerId } = await c.req.json();
    const gs = await kv.get<GameState>(`game:${c.req.param("roomId")}`);
    if (!gs) return c.json({ success: false, error: "Room not found" }, 404);

    const phase = gs.status;
    if (!gs.readyPlayers[phase]) gs.readyPlayers[phase] = [];
    if (!gs.readyPlayers[phase].includes(playerId)) gs.readyPlayers[phase].push(playerId);

    const allReady = gs.players.every(p => gs.readyPlayers[phase]?.includes(p.id));
    if (allReady) {
      const scenarioData = SCENARIOS[gs.scenario];
      if (phase === "intro" && scenarioData) {
        startNextRound(gs, scenarioData);
      } else if (phase === "event" && scenarioData) {
        if (gs.currentRound >= gs.totalRounds) {
          gs.status = "final_vote";
        } else {
          startNextRound(gs, scenarioData);
        }
        gs.currentEvent = null;
      }
    }

    await kv.set(`game:${gs.roomId}`, gs);
    return c.json({ success: true, gameState: gs });
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500);
  }
});

/* ── Pick Card (turn-based) ── */
app.post("/make-server-0d019d5f/room/:roomId/pick-card", async (c) => {
  try {
    const { playerId, cardId } = await c.req.json();
    const gs = await kv.get<GameState>(`game:${c.req.param("roomId")}`);
    if (!gs) return c.json({ success: false, error: "Room not found" }, 404);
    if (gs.status !== "card_pick") return c.json({ success: false, error: "카드 선택 단계가 아닙니다" }, 400);

    const turnPlayer = gs.players[gs.currentTurnIndex % gs.players.length];
    if (turnPlayer.id !== playerId) return c.json({ success: false, error: "당신의 턴이 아닙니다" }, 400);

    const cardIndex = gs.availableCards.indexOf(cardId);
    if (cardIndex === -1) return c.json({ success: false, error: "이미 선택된 카드입니다" }, 400);

    gs.availableCards.splice(cardIndex, 1);
    if (!gs.playerHands[playerId]) gs.playerHands[playerId] = [];
    gs.playerHands[playerId].push(cardId);

    const scenarioCards = SCENARIOS[gs.scenario]?.cards ?? [];
    const pickedCard = scenarioCards.find(c => c.id === cardId);
    const unlockedNums: number[] = [];
    if (pickedCard?.unlocks) {
      const allOwned = Object.values(gs.playerHands).flat();
      for (const num of pickedCard.unlocks) {
        const unlockCard = scenarioCards.find(c => c.number === num);
        if (unlockCard && !gs.availableCards.includes(unlockCard.id) && !allOwned.includes(unlockCard.id)) {
          gs.availableCards.push(unlockCard.id);
          unlockedNums.push(num);
        }
      }
    }

    const playerName = turnPlayer.roleName || turnPlayer.name;
    gs.chat.push({
      playerId: "__system__",
      name: "시스템",
      text: unlockedNums.length > 0
        ? `${playerName}님이 ${pickedCard!.number}번 카드를 선택했습니다. → ${unlockedNums.map(n => `${n}번`).join(", ")} 카드가 새로 등장했습니다!`
        : `${playerName}님이 ${pickedCard!.number}번 카드를 선택했습니다.`,
      time: Date.now(),
    });

    gs.currentTurnIndex++;
    gs.cardsPickedThisRound++;

    const totalPicksNeeded = gs.players.length * gs.cardsPerPlayerThisRound;
    if (gs.cardsPickedThisRound >= totalPicksNeeded || gs.availableCards.length === 0) {
      const scenarioData = SCENARIOS[gs.scenario];
      const roundData = scenarioData?.rounds.find(r => r.id === gs.currentRound);
      gs.status = "discussion";
      gs.discussionEndsAt = Date.now() + (roundData?.discussionSeconds ?? 120) * 1000;
    }

    await kv.set(`game:${gs.roomId}`, gs);
    return c.json({ success: true, gameState: gs });
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500);
  }
});

/* ── Chat ── */
app.post("/make-server-0d019d5f/room/:roomId/chat", async (c) => {
  try {
    const { playerId, text } = await c.req.json();
    const gs = await kv.get<GameState>(`game:${c.req.param("roomId")}`);
    if (!gs) return c.json({ success: false, error: "Room not found" }, 404);

    const player = gs.players.find(p => p.id === playerId);
    if (!player) return c.json({ success: false, error: "Player not found" }, 404);

    gs.chat.push({
      playerId,
      name: player.roleName || player.name,
      playerName: player.name,
      text,
      time: Date.now(),
    });
    if (gs.chat.length > 200) gs.chat = gs.chat.slice(-200);

    await kv.set(`game:${gs.roomId}`, gs);
    return c.json({ success: true, gameState: gs });
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500);
  }
});

/* ── Final Vote ── */
app.post("/make-server-0d019d5f/room/:roomId/vote", async (c) => {
  try {
    const { playerId, killer, motive, method } = await c.req.json();
    const gs = await kv.get<GameState>(`game:${c.req.param("roomId")}`);
    if (!gs) return c.json({ success: false, error: "Room not found" }, 404);
    if (gs.status !== "final_vote") return c.json({ success: false, error: "투표 단계가 아닙니다" }, 400);

    gs.finalVotes[playerId] = { killer, motive, method };

    const allVoted = gs.players.every(p => gs.finalVotes[p.id]);
    if (allVoted) {
      const scenarioData = SCENARIOS[gs.scenario];
      if (scenarioData) {
        const truth = scenarioData.truth;
        const results: Record<string, { won: boolean; reason: string }> = {};
        const murdererPlayer = gs.players.find(p => p.roleId === truth.killerId);
        const accuseCount = Object.values(gs.finalVotes).filter(v => v.killer === truth.killerId).length;
        const majorityAccused = accuseCount > gs.players.length / 2;

        for (const p of gs.players) {
          const vote = gs.finalVotes[p.id];
          const role = scenarioData.roles.find(r => r.id === p.roleId);
          if (role?.isMurderer) {
            results[p.id] = majorityAccused
              ? { won: false, reason: "추리 끝, 모두가 당신을 범인으로 지목했습니다. 비밀이 드러나고 말았습니다." }
              : { won: true, reason: "의심은 다른 이들에게 돌아갔고, 당신의 정체는 끝까지 감춰졌습니다." };
          } else {
            const correctKiller = vote.killer === truth.killerId;
            const correctMotive = vote.motive === truth.motive;
            const correctMethod = vote.method === truth.method;
            const score = [correctKiller, correctMotive, correctMethod].filter(Boolean).length;
            if (score === 3) {
              results[p.id] = { won: true, reason: "범인과 동기, 그리고 범행 방법까지 정확히 꿰뚫었습니다. 진실을 온전히 밝혀낸 추리였습니다." };
            } else if (correctKiller) {
              results[p.id] = { won: true, reason: `범인을 올바르게 지목했습니다. 동기와 방법까지 더 파고들었다면 완벽했을 텐데요. (${score}/3)` };
            } else {
              results[p.id] = { won: false, reason: `진범을 놓쳤습니다. 단서는 곳곳에 있었지만, 결국 맞추지 못했네요. (${score}/3)` };
            }
          }
        }
        gs.results = results;
      }
      gs.status = "result";
    }

    await kv.set(`game:${gs.roomId}`, gs);
    return c.json({ success: true, gameState: gs });
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500);
  }
});

Deno.serve(app.fetch);
