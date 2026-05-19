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
} from "@/lib/game-engine";

function ok(data: object) { return NextResponse.json({ success: true, ...data }); }
function err(msg: string, status = 400) { return NextResponse.json({ success: false, error: msg }, { status }); }

function isBot(playerId: string) {
  return playerId.startsWith("bot_");
}

function addBotPlayers(gs: NonNullable<Awaited<ReturnType<typeof getGameState>>>, count: number) {
  const existingBotNums = gs.players
    .map((p) => p.name.match(/^테스트봇(\d+)$/)?.[1])
    .filter(Boolean)
    .map((n) => Number(n));
  let nextBotNum = existingBotNums.length > 0 ? Math.max(...existingBotNums) + 1 : 1;

  for (let i = 0; i < count; i++) {
    gs.players.push({
      id: `bot_${makePlayerId()}`,
      name: `테스트봇${nextBotNum++}`,
      roleId: "",
      roleName: "",
      connected: true,
      joinedAt: Date.now(),
    });
  }
}

function markBotsReady(gs: NonNullable<Awaited<ReturnType<typeof getGameState>>>) {
  const phase = gs.status;
  if (!gs.readyPlayers[phase]) gs.readyPlayers[phase] = [];
  for (const p of gs.players) {
    if (isBot(p.id) && !gs.readyPlayers[phase].includes(p.id)) gs.readyPlayers[phase].push(p.id);
  }
}

function autoBotVotes(gs: NonNullable<Awaited<ReturnType<typeof getGameState>>>) {
  const suspects = gs.players.filter((p) => !isBot(p.id));
  const target = suspects[0] ?? gs.players[0];
  for (const p of gs.players) {
    if (!isBot(p.id)) continue;
    if (gs.finalVotes[p.id]) continue;
    gs.finalVotes[p.id] = {
      accused: target?.roleName ?? "알 수 없음",
      motive: "테스트 모드 자동 제출",
      method: "테스트 모드 자동 제출",
      timeline: "테스트 모드 자동 제출",
      personalGoal: "테스트 모드 자동 제출",
    };
  }
}

function autoAssignBotRoles(gs: NonNullable<Awaited<ReturnType<typeof getGameState>>>) {
  if (!gs.testMode || gs.status !== "role_select") return;
  const scenario = getScenario(gs.scenario);
  const taken = new Set(gs.players.map((p) => p.roleId).filter(Boolean));
  const openRoles = scenario.roles.filter((r) => !taken.has(r.id));

  for (const p of gs.players) {
    if (!isBot(p.id) || p.roleId) continue;
    const role = openRoles.shift();
    if (!role) break;
    p.roleId = role.id;
    p.roleName = role.name;
  }
}

function allRolesSelected(gs: NonNullable<Awaited<ReturnType<typeof getGameState>>>) {
  return gs.players.length > 0 && gs.players.every((p) => Boolean(p.roleId));
}

async function runBotTurns(gs: NonNullable<Awaited<ReturnType<typeof getGameState>>>) {
  if (!gs.testMode) return;
  while (gs.status === "card_pick") {
    const turnPlayer = gs.players[gs.currentTurnIndex % gs.players.length];
    if (!turnPlayer || !isBot(turnPlayer.id)) break;
    const cardId = gs.availableCards[0];
    if (!cardId) break;
    const { unlockedLabels, cardLabel, roleName } = applyCardPick(gs, turnPlayer.id, cardId);
    const text = unlockedLabels.length > 0
      ? `[봇] ${roleName}님이 ${cardLabel}번 카드를 선택했습니다. → ${unlockedLabels.map((n) => `${n}번`).join(", ")} 카드가 새로 등장했습니다!`
      : `[봇] ${roleName}님이 ${cardLabel}번 카드를 선택했습니다.`;
    await pushChat(gs.roomId, {
      playerId: "__system__",
      roleName: "시스템",
      playerName: "시스템",
      text,
      time: Date.now(),
    });
  }
}

function seedDummyForRound(gs: NonNullable<Awaited<ReturnType<typeof getGameState>>>, targetRound: number) {
  const scenario = getScenario(gs.scenario);
  const cardIds = [...scenario.hintCards.map((c) => c.id)];
  const totalBefore = Math.max(0, (targetRound - 1) * gs.players.length);
  const takenCount = Math.min(totalBefore, cardIds.length);
  const taken = cardIds.slice(0, takenCount);
  const remaining = cardIds.slice(takenCount);

  gs.playerHands = {};
  for (const p of gs.players) gs.playerHands[p.id] = [];
  taken.forEach((cardId, idx) => {
    const owner = gs.players[idx % gs.players.length];
    gs.playerHands[owner.id].push(cardId);
  });

  gs.availableCards = remaining;
  gs.currentRound = Math.max(1, targetRound);
  gs.status = "card_pick";
  gs.currentTurnIndex = 0;
  gs.cardsPickedThisRound = 0;
  gs.discussionEndsAt = null;
  gs.currentEvent = null;
  gs.readyPlayers = {};
  gs.finalVotes = {};
}

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
      const { playerName, scenarioId = "case_001", testMode = false } = body;
      if (!playerName?.trim()) return err("이름을 입력해주세요");
      getScenario(scenarioId); // unknown scenario 체크

      const roomId = makeId(6);
      const gs = createInitialGameState(roomId, scenarioId, {
        id: makePlayerId(), name: playerName.trim(),
        roleId: "", roleName: "", connected: true, joinedAt: Date.now(),
      });
      gs.testMode = Boolean(testMode);
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
    const action = path[2]; // start | ready | select-role | confirm-role-select | pick-card | chat | vote

    if (path[0] !== "room" || !roomId) return err("Not found", 404);

    return withRoom(roomId, async (gs) => {
      // POST /api/game/room/:roomId/start
      if (action === "start") {
        if (gs.status !== "waiting") return err("게임이 이미 시작되었습니다");
        const scenario = getScenario(gs.scenario);
        if (gs.testMode && gs.players.length < scenario.playerCount) {
          addBotPlayers(gs, scenario.playerCount - gs.players.length);
        }
        if (gs.players.length !== scenario.playerCount) return err(`정확히 ${scenario.playerCount}명이 필요합니다`);
        gs.status = "stage_setup";
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
        if (gs.testMode) markBotsReady(gs);
        const allReady = gs.players.every((p) => gs.readyPlayers[phase]?.includes(p.id));
        if (allReady) {
          if (phase === "stage_setup") {
            gs.players.forEach((p) => {
              p.roleId = "";
              p.roleName = "";
              gs.playerHands[p.id] = [];
            });
            gs.status = "role_select";
          } else if (phase === "role_brief") {
            if (gs.players.some((p) => !p.roleId)) assignRoles(gs);
            gs.status = "cast_intro";
          } else if (phase === "cast_intro") gs.status = "incident";
          else if (phase === "incident") advanceToNextRound(gs);
          else if (phase === "event") {
            gs.currentEvent = null;
            gs.availableCards.length === 0 ? (gs.status = "insight") : advanceToNextRound(gs);
          } else if (phase === "insight") gs.status = "final_vote";
          await runBotTurns(gs);
        }
        await setGameState(gs.roomId, gs);
        return okWithChat(gs);
      }

      // POST /api/game/room/:roomId/select-role
      if (action === "select-role") {
        const { playerId, roleId } = body;
        if (gs.status !== "role_select") return err("역할 선택 단계가 아닙니다");
        const scenario = getScenario(gs.scenario);
        const me = gs.players.find((p) => p.id === playerId);
        if (!me) return err("플레이어를 찾을 수 없습니다", 404);

        // 같은 역할을 다시 누르면 선택 해제
        if (me.roleId === roleId) {
          me.roleId = "";
          me.roleName = "";
          await setGameState(gs.roomId, gs);
          return okWithChat(gs);
        }

        const role = scenario.roles.find((r) => r.id === roleId);
        if (!role) return err("존재하지 않는 역할입니다");

        const alreadyTaken = gs.players.find((p) => p.id !== playerId && p.roleId === roleId);
        if (alreadyTaken) return err("이미 선택된 역할입니다");

        me.roleId = role.id;
        me.roleName = role.name;
        gs.playerHands[me.id] = gs.playerHands[me.id] ?? [];

        autoAssignBotRoles(gs);

        await setGameState(gs.roomId, gs);
        return okWithChat(gs);
      }

      // POST /api/game/room/:roomId/confirm-role-select
      if (action === "confirm-role-select") {
        if (gs.status !== "role_select") return err("역할 선택 단계가 아닙니다");
        autoAssignBotRoles(gs);
        if (!allRolesSelected(gs)) return err("아직 모든 플레이어가 역할을 선택하지 않았습니다");
        gs.status = "role_brief";
        gs.readyPlayers = {};
        await setGameState(gs.roomId, gs);
        return okWithChat(gs);
      }

      // POST /api/game/room/:roomId/pick-card
      if (action === "pick-card") {
        const { playerId, cardId } = body;
        if (gs.status !== "card_pick") return err("카드 선택 단계가 아닙니다");
        const turnPlayer = gs.players[gs.currentTurnIndex % gs.players.length];
        if (turnPlayer.id !== playerId) return err("당신의 턴이 아닙니다");
        const { unlockedLabels, cardLabel, roleName } = applyCardPick(gs, playerId, cardId);
        const text = unlockedLabels.length > 0
          ? `${roleName}님이 ${cardLabel}번 카드를 선택했습니다. → ${unlockedLabels.map((n) => `${n}번`).join(", ")} 카드가 새로 등장했습니다!`
          : `${roleName}님이 ${cardLabel}번 카드를 선택했습니다.`;
        await pushChat(gs.roomId, { playerId: "__system__", roleName: "시스템", playerName: "시스템", text, time: Date.now() });
        await runBotTurns(gs);
        await setGameState(gs.roomId, gs);
        return okWithChat(gs);
      }

      // POST /api/game/room/:roomId/chat
      if (action === "chat") {
        const { playerId, text } = body;
        if (!text?.trim()) return err("메시지를 입력해주세요");
        const player = gs.players.find((p) => p.id === playerId);
        if (!player) return err("플레이어를 찾을 수 없습니다", 404);
        await pushChat(gs.roomId, { playerId, roleName: player.roleName || player.name, playerName: player.name, text: text.trim(), time: Date.now() });
        return okWithChat(gs);
      }

      // POST /api/game/room/:roomId/vote
      if (action === "vote") {
        const { playerId, notes } = body;
        if (gs.status !== "final_vote") return err("투표 단계가 아닙니다");
        gs.finalVotes[playerId] = notes ?? {};
        if (gs.testMode) autoBotVotes(gs);
        if (gs.players.every((p) => gs.finalVotes[p.id])) gs.status = "result";
        await setGameState(gs.roomId, gs);
        return okWithChat(gs);
      }

      // POST /api/game/room/:roomId/test-add-bots
      if (action === "test-add-bots") {
        if (!gs.testMode) return err("테스트 모드 방에서만 사용할 수 있습니다");
        if (gs.status !== "waiting") return err("대기실에서만 봇을 추가할 수 있습니다");
        const scenario = getScenario(gs.scenario);
        const remain = Math.max(0, scenario.playerCount - gs.players.length);
        const count = Math.max(1, Math.min(remain, Number(body?.count ?? remain)));
        if (remain <= 0) return err("이미 정원이 가득 찼습니다");
        addBotPlayers(gs, count);
        await setGameState(gs.roomId, gs);
        return okWithChat(gs);
      }

      // POST /api/game/room/:roomId/test-jump-round
      if (action === "test-jump-round") {
        if (!gs.testMode) return err("테스트 모드 방에서만 사용할 수 있습니다");
        const targetRound = Math.max(1, Number(body?.targetRound ?? 1));
        if (gs.players.length === 0) return err("플레이어가 없습니다");
        if (gs.players.some((p) => !p.roleId)) assignRoles(gs);
        seedDummyForRound(gs, targetRound);
        await pushChat(gs.roomId, {
          playerId: "__system__",
          roleName: "시스템",
          playerName: "시스템",
          text: `[테스트] 라운드 ${targetRound}로 점프했습니다. 이전 라운드 더미 데이터가 생성되었습니다.`,
          time: Date.now(),
        });
        await runBotTurns(gs);
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
