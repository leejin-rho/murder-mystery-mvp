import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const GAME_TTL_SEC = 4 * 60 * 60; // 4 hours

export async function getGameState(roomId: string): Promise<GameState | null> {
  return redis.get<GameState>(`game:${roomId}:state`);
}

export async function setGameState(roomId: string, gs: GameState): Promise<void> {
  await redis.set(`game:${roomId}:state`, gs, { ex: GAME_TTL_SEC });
}

export async function delGameState(roomId: string): Promise<void> {
  await redis.del(`game:${roomId}:state`);
  await redis.del(`game:${roomId}:chat`);
}

export async function pushChat(roomId: string, msg: ChatMessage): Promise<void> {
  await redis.rpush(`game:${roomId}:chat`, msg);
  await redis.ltrim(`game:${roomId}:chat`, -200, -1);
  await redis.expire(`game:${roomId}:chat`, GAME_TTL_SEC);
}

export async function getChat(roomId: string, limit = 50): Promise<ChatMessage[]> {
  return redis.lrange<ChatMessage>(`game:${roomId}:chat`, -limit, -1);
}

/* ── Shared Types ── */

export interface Player {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
  connected: boolean;
  joinedAt: number;
}

export interface ChatMessage {
  playerId: string;
  name: string;
  playerName?: string;
  text: string;
  time: number;
}

export type GameStatus =
  | "waiting"
  | "intro"
  | "card_pick"
  | "discussion"
  | "event"
  | "final_vote"
  | "result";

export interface GameState {
  roomId: string;
  scenario: string;
  players: Player[];
  status: GameStatus;
  createdAt: number;
  currentRound: number;       // sweep counter (increments each time all players pick once)
  currentTurnIndex: number;
  cardsPickedThisRound: number;
  availableCards: string[];
  playerHands: Record<string, string[]>;
  discussionEndsAt: number | null;
  currentEvent: { title: string; text: string } | null;
  finalVotes: Record<string, Record<string, string>>;  // playerId → { roleId: 주관식 메모 }
  readyPlayers: Record<string, string[]>;
  // chat is stored separately in Redis List, but merged for API responses
  chat?: ChatMessage[];
}
