import { NextRequest, NextResponse } from "next/server";
import { getGameState, setGameState, delGameState, pushChat, getChat } from "@/lib/redis";
import {
  makeId,
  makePlayerId,
  getScenario,
  createInitialGameState,
  assignRoles,
  checkAutoTransition,
  advanceToNextRound,
  applyCardPick,
  calculateResults,
} from "@/lib/game-engine";

function ok(data: object) { return NextResponse.json({ success: true, ...data }); }
function err(msg: string, status = 400) { return NextResponse.json({ success: false, error: msg }, { status }); }

async function okWithChat(gs: Awaited<ReturnType<typeof getGameState>>) {
  const chat = await getChat(gs!.roomId);
  return ok({ gameState: { ...gs, chat } });
}

async function withRoom(roomId: string, fn: (gs: NonNullable<Awaited<ReturnType<typeof getGameState>>>) => Promise<NextResponse>) {
  const gs = await getGameState(roomId.toUpperCase());
  if (!gs) return err("방을 찾을 수 없습니다", 404);
  return fn(gs);
}

/* ── Route dispatcher ── */

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  // GET /api/game/room/:roomId
  if (path[0] === "room" && path[1] && !path[2]) {
    return withRoom(path[1], async (gs) => {
      if (checkAutoTransition(gs)) await setGameState(gs.roomId, gs);
      const chat = await getChat(gs.roomId);
      return ok({ gameState: { ...gs, chat } });
    });
  }
  return err("Not found", 404);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    // POST /api/game/room  — 방 생성
    if (path[0] === "room" && !path[1]) {
      const { playerName, scenarioId = "case_001" } = body;
      if (!playerName?.trim()) return err("이름을 입력해주세요");
      getScenario(scenarioId); // unknown scenario 체크

      const roomId = makeId(6);
      const gs = createInitialGameState(roomId, scenarioId, {
        id: makePlayerId(), name: playerName.trim(),
        roleId: "", roleName: "", connected: true, joinedAt: Date.now(),
      });
      await setGameState(roomId, gs);
      return ok({ roomId, playerId: gs.players[0].id, gameState: gs });
    }

    // POST /api/game/room/join
    if (path[0] === "room" && path[1] === "join") {
      const { roomId, playerName } = body;
      if (!roomId?.trim() || !playerName?.trim()) return err("방 코드와 이름을 입력해주세요");
      return withRoom(roomId, async (gs) => {
        const existing = gs.players.find((p) => p.name === playerName.trim());
        if (existing) {
          existing.connected = true;
          await setGameState(gs.roomId, gs);
          const chat = await getChat(gs.roomId);
          return ok({ playerId: existing.id, gameState: { ...gs, chat } });
        }
        if (gs.status !== "waiting") return err("게임이 이미 시작되었습니다");
        const max = getScenario(gs.scenario).playerCount;
        if (gs.players.length >= max) return err(`방이 가득 찼습니다 (최대 ${max}명)`);
        const playerId = makePlayerId();
        gs.players.push({ id: playerId, name: playerName.trim(), roleId: "", roleName: "", connected: true, joinedAt: Date.now() });
        await setGameState(gs.roomId, gs);
        const chat = await getChat(gs.roomId);
        return ok({ playerId, gameState: { ...gs, chat } });
      });
    }

    const roomId = path[1];
    const action = path[2]; // start | ready | pick-card | chat | vote

    if (path[0] !== "room" || !roomId) return err("Not found", 404);

    return withRoom(roomId, async (gs) => {
      // POST /api/game/room/:roomId/start
      if (action === "start") {
        if (gs.status !== "waiting") return err("게임이 이미 시작되었습니다");
        const scenario = getScenario(gs.scenario);
        if (gs.players.length !== scenario.playerCount) return err(`정확히 ${scenario.playerCount}명이 필요합니다`);
        assignRoles(gs);
        gs.status = "intro";
        gs.readyPlayers = {};
        await setGameState(gs.roomId, gs);
        return okWithChat(gs);
      }

      // POST /api/game/room/:roomId/ready
      if (action === "ready") {
        const { playerId } = body;
        const phase = gs.status;
        if (!gs.readyPlayers[phase]) gs.readyPlayers[phase] = [];
        if (!gs.readyPlayers[phase].includes(playerId)) gs.readyPlayers[phase].push(playerId);
        const allReady = gs.players.every((p) => gs.readyPlayers[phase]?.includes(p.id));
        if (allReady) {
          if (phase === "intro") advanceToNextRound(gs);
          else if (phase === "event") {
            gs.currentEvent = null;
            gs.availableCards.length === 0 ? (gs.status = "final_vote") : advanceToNextRound(gs);
          }
        }
        await setGameState(gs.roomId, gs);
        return okWithChat(gs);
      }

      // POST /api/game/room/:roomId/pick-card
      if (action === "pick-card") {
        const { playerId, cardId } = body;
        if (gs.status !== "card_pick") return err("카드 선택 단계가 아닙니다");
        const turnPlayer = gs.players[gs.currentTurnIndex % gs.players.length];
        if (turnPlayer.id !== playerId) return err("당신의 턴이 아닙니다");
        const { unlockedNums, cardNumber, playerName } = applyCardPick(gs, playerId, cardId);
        const text = unlockedNums.length > 0
          ? `${playerName}님이 ${cardNumber}번 카드를 선택했습니다. → ${unlockedNums.map((n) => `${n}번`).join(", ")} 카드가 새로 등장했습니다!`
          : `${playerName}님이 ${cardNumber}번 카드를 선택했습니다.`;
        await pushChat(gs.roomId, { playerId: "__system__", name: "시스템", text, time: Date.now() });
        await setGameState(gs.roomId, gs);
        return okWithChat(gs);
      }

      // POST /api/game/room/:roomId/chat
      if (action === "chat") {
        const { playerId, text } = body;
        if (!text?.trim()) return err("메시지를 입력해주세요");
        const player = gs.players.find((p) => p.id === playerId);
        if (!player) return err("플레이어를 찾을 수 없습니다", 404);
        await pushChat(gs.roomId, { playerId, name: player.roleName || player.name, playerName: player.name, text: text.trim(), time: Date.now() });
        return okWithChat(gs);
      }

      // POST /api/game/room/:roomId/vote
      if (action === "vote") {
        const { playerId, killer, motive, method } = body;
        if (gs.status !== "final_vote") return err("투표 단계가 아닙니다");
        gs.finalVotes[playerId] = { killer, motive, method };
        if (gs.players.every((p) => gs.finalVotes[p.id])) calculateResults(gs);
        await setGameState(gs.roomId, gs);
        return okWithChat(gs);
      }

      return err("Not found", 404);
    });
  } catch (e) {
    return err(String(e), 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  if (path[0] === "room" && path[1] && !path[2]) {
    await delGameState(path[1].toUpperCase());
    return ok({});
  }
  return err("Not found", 404);
}
