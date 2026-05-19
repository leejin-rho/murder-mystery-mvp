import { SCENARIO_REGISTRY } from "@/data/scenarios";
import type { GameState, Player } from "./redis";

/* ── Helpers ── */

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeId(len = 6): string {
  return Math.random().toString(36).substring(2, 2 + len).toUpperCase();
}

export function makePlayerId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

export function getScenario(scenarioId: string) {
  const s = SCENARIO_REGISTRY[scenarioId];
  if (!s) throw new Error(`Unknown scenario: ${scenarioId}`);
  return s;
}

function toCardLabel(card: { id: string; number: number }): string {
  const m = card.id.match(/^card_(\d+)([a-z])$/i);
  if (m) return String(Number(m[1]));
  return String(card.number);
}

/* ── State transitions ── */

/**
 * discussionEndsAt이 지났으면 상태를 자동 전환.
 * 변경이 있으면 true 반환.
 */
export function checkAutoTransition(gs: GameState): boolean {
  if (gs.status !== "discussion") return false;
  if (!gs.discussionEndsAt || Date.now() < gs.discussionEndsAt) return false;

  const scenario = SCENARIO_REGISTRY[gs.scenario];
  if (!scenario) return false;

  const event = scenario.events?.find((e) => e.afterRound === gs.currentRound);

  if (event) {
    gs.status = "event";
    gs.currentEvent = { title: event.title, text: event.text };
    gs.readyPlayers["event"] = [];
  } else if (gs.availableCards.length === 0) {
    gs.status = "insight";
    gs.readyPlayers["insight"] = [];
  } else {
    advanceToNextRound(gs);
  }

  gs.discussionEndsAt = null;
  return true;
}

export function advanceToNextRound(gs: GameState): void {
  gs.currentRound++;
  gs.status = "card_pick";
  gs.currentTurnIndex = 0;
  gs.cardsPickedThisRound = 0;
  gs.currentEvent = null;
  // 카드 등장은 unlock chain이 담당
}

/* ── Room / Game initialization ── */

export function createInitialGameState(
  roomId: string,
  scenarioId: string,
  firstPlayer: Player
): GameState {
  const scenario = getScenario(scenarioId);

  const initialCardIds = shuffle(
    scenario.hintCards
      .filter((c) => scenario.initialCards.includes(c.number))
      .map((c) => c.id)
  );

  return {
    roomId,
    scenario: scenarioId,
    players: [firstPlayer],
    status: "waiting",
    createdAt: Date.now(),
    currentRound: 0,
    currentTurnIndex: 0,
    cardsPickedThisRound: 0,
    availableCards: initialCardIds,
    playerHands: {},
    discussionEndsAt: null,
    currentEvent: null,
    finalVotes: {},
    readyPlayers: {},
  };
}

export function assignRoles(gs: GameState): void {
  const scenario = getScenario(gs.scenario);
  const shuffledRoles = shuffle(scenario.roles);
  gs.players.forEach((p, i) => {
    p.roleId = shuffledRoles[i].id;
    p.roleName = shuffledRoles[i].name;
    gs.playerHands[p.id] = [];
  });
}

/* ── Card picking with unlock chain ── */

export function applyCardPick(
  gs: GameState,
  playerId: string,
  cardId: string
): { unlockedNums: number[]; unlockedLabels: string[]; cardNumber: number; cardLabel: string; roleName: string } {
  const scenario = getScenario(gs.scenario);
  const pickedCard = scenario.hintCards.find((c) => c.id === cardId);
  if (!pickedCard) throw new Error("카드를 찾을 수 없습니다");

  // 카드 풀에서 제거
  const idx = gs.availableCards.indexOf(cardId);
  if (idx === -1) throw new Error("이미 선택된 카드입니다");
  gs.availableCards.splice(idx, 1);

  // 손패에 추가
  if (!gs.playerHands[playerId]) gs.playerHands[playerId] = [];
  gs.playerHands[playerId].push(cardId);

  // 해금 처리
  const unlockedNums: number[] = [];
  const unlockedLabels: string[] = [];
  if (pickedCard.unlocks) {
    const allOwned = new Set(Object.values(gs.playerHands).flat());
    for (const num of pickedCard.unlocks) {
      const unlockCard = scenario.hintCards.find((c) => c.number === num);
      if (
        unlockCard &&
        !gs.availableCards.includes(unlockCard.id) &&
        !allOwned.has(unlockCard.id)
      ) {
        gs.availableCards.push(unlockCard.id);
        unlockedNums.push(num);
        unlockedLabels.push(toCardLabel(unlockCard));
      }
    }
  }

  gs.currentTurnIndex++;
  gs.cardsPickedThisRound++;

  const turnPlayer = gs.players.find((p) => p.id === playerId)!;
  const roleName = turnPlayer.roleName || turnPlayer.name;
  const discussionMs = gs.testMode ? 300 : (scenario.discussionSeconds ?? 180) * 1000;

  if (pickedCard.actionRule === "force_discussion") {
    gs.status = "discussion";
    gs.discussionEndsAt = Date.now() + (gs.testMode ? 300 : (pickedCard.forceDiscussionSeconds ?? 300) * 1000);
  } else if (gs.cardsPickedThisRound >= gs.players.length || gs.availableCards.length === 0) {
    gs.status = "discussion";
    gs.discussionEndsAt = Date.now() + discussionMs;
  }

  return {
    unlockedNums,
    unlockedLabels,
    cardNumber: pickedCard.number,
    cardLabel: toCardLabel(pickedCard),
    roleName,
  };
}
