import { Redis } from "@upstash/redis";
import { promises as fs } from "node:fs";
import path from "node:path";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRemoteRedis = Boolean(redisUrl && redisToken);
const useLocalFallback = !useRemoteRedis && process.env.NODE_ENV === "development";

export const redis = useRemoteRedis
  ? new Redis({
      url: redisUrl!,
      token: redisToken!,
    })
  : null;

export const GAME_TTL_SEC = 4 * 60 * 60; // 4 hours

type MemEntry<T> = { value: T; expiresAt: number };
type DevStore = {
  memState: Map<string, MemEntry<GameState>>;
  memChat: Map<string, MemEntry<ChatMessage[]>>;
};

const devStore = (globalThis as typeof globalThis & { __mmDevStore?: DevStore }).__mmDevStore
  ?? {
    memState: new Map<string, MemEntry<GameState>>(),
    memChat: new Map<string, MemEntry<ChatMessage[]>>(),
  };

(globalThis as typeof globalThis & { __mmDevStore?: DevStore }).__mmDevStore = devStore;

const memState = devStore.memState;
const memChat = devStore.memChat;
const DEV_STORE_FILE = path.join(process.cwd(), ".tmp", "mm-dev-store.json");

interface FileStoreShape {
  state: Record<string, MemEntry<GameState>>;
  chat: Record<string, MemEntry<ChatMessage[]>>;
}

async function loadFileStore(): Promise<FileStoreShape> {
  try {
    const raw = await fs.readFile(DEV_STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as FileStoreShape;
    return {
      state: parsed.state ?? {},
      chat: parsed.chat ?? {},
    };
  } catch {
    return { state: {}, chat: {} };
  }
}

async function saveFileStore() {
  await fs.mkdir(path.dirname(DEV_STORE_FILE), { recursive: true });
  const state = Object.fromEntries(memState.entries());
  const chat = Object.fromEntries(memChat.entries());
  const payload: FileStoreShape = { state, chat };
  await fs.writeFile(DEV_STORE_FILE, JSON.stringify(payload), "utf-8");
}

function now() {
  return Date.now();
}

function isExpired<T>(entry?: MemEntry<T>) {
  return !entry || entry.expiresAt <= now();
}

export async function getGameState(roomId: string): Promise<GameState | null> {
  if (redis) return redis.get<GameState>(`game:${roomId}:state`);
  if (!useLocalFallback) throw new Error("Redis is not configured");
  const key = `game:${roomId}:state`;
  let entry = memState.get(key);
  if (!entry) {
    const fileStore = await loadFileStore();
    entry = fileStore.state[key];
    if (entry) memState.set(key, entry);
  }
  if (isExpired(entry)) {
    memState.delete(key);
    await saveFileStore();
    return null;
  }
  return structuredClone(entry!.value);
}

export async function setGameState(roomId: string, gs: GameState): Promise<void> {
  if (redis) {
    await redis.set(`game:${roomId}:state`, gs, { ex: GAME_TTL_SEC });
    return;
  }
  if (!useLocalFallback) throw new Error("Redis is not configured");
  const key = `game:${roomId}:state`;
  memState.set(key, {
    value: structuredClone(gs),
    expiresAt: now() + GAME_TTL_SEC * 1000,
  });
  await saveFileStore();
}

export async function delGameState(roomId: string): Promise<void> {
  if (redis) {
    await redis.del(`game:${roomId}:state`);
    await redis.del(`game:${roomId}:chat`);
    return;
  }
  if (!useLocalFallback) throw new Error("Redis is not configured");
  memState.delete(`game:${roomId}:state`);
  memChat.delete(`game:${roomId}:chat`);
  await saveFileStore();
}

export async function pushChat(roomId: string, msg: ChatMessage): Promise<void> {
  if (redis) {
    await redis.rpush(`game:${roomId}:chat`, msg);
    await redis.ltrim(`game:${roomId}:chat`, -200, -1);
    await redis.expire(`game:${roomId}:chat`, GAME_TTL_SEC);
    return;
  }
  if (!useLocalFallback) throw new Error("Redis is not configured");
  const key = `game:${roomId}:chat`;
  let entry = memChat.get(key);
  if (!entry) {
    const fileStore = await loadFileStore();
    entry = fileStore.chat[key];
    if (entry) memChat.set(key, entry);
  }
  const list = isExpired(entry) ? [] : [...entry!.value];
  list.push(structuredClone(msg));
  const trimmed = list.slice(-200);
  memChat.set(key, { value: trimmed, expiresAt: now() + GAME_TTL_SEC * 1000 });
  await saveFileStore();
}

export async function getChat(roomId: string, limit = 50): Promise<ChatMessage[]> {
  if (redis) return redis.lrange<ChatMessage>(`game:${roomId}:chat`, -limit, -1);
  if (!useLocalFallback) throw new Error("Redis is not configured");
  const key = `game:${roomId}:chat`;
  let entry = memChat.get(key);
  if (!entry) {
    const fileStore = await loadFileStore();
    entry = fileStore.chat[key];
    if (entry) memChat.set(key, entry);
  }
  if (isExpired(entry)) {
    memChat.delete(key);
    await saveFileStore();
    return [];
  }
  return structuredClone(entry!.value.slice(-limit));
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
  roleName: string;
  playerName: string;
  text: string;
  time: number;
}

export type GameStatus =
  | "waiting"
  | "stage_setup"
  | "role_select"
  | "cast_intro"
  | "role_brief"
  | "incident"
  | "card_pick"
  | "discussion"
  | "event"
  | "insight"
  | "final_vote"
  | "result";

export interface GameState {
  roomId: string;
  scenario: string;
  testMode?: boolean;
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
