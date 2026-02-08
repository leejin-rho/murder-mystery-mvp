import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

// Game types
interface Player {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
  connected: boolean;
  joinedAt: number;
}

interface GameState {
  roomId: string;
  scenario: string; // "case_001"
  players: Player[];
  currentSceneId: string;
  createdAt: number;
  status: "waiting" | "playing" | "finished";
  choices: Record<string, Record<string, string>>; // sceneId -> playerId -> choiceId
}

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-0d019d5f/health", (c) => {
  return c.json({ status: "ok" });
});

// Create a new game room
app.post("/make-server-0d019d5f/room/create", async (c) => {
  try {
    const body = await c.req.json();
    const { playerName } = body;
    
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const gameState: GameState = {
      roomId,
      scenario: "case_001",
      players: [{
        id: playerId,
        name: playerName,
        roleId: "",
        roleName: "",
        connected: true,
        joinedAt: Date.now(),
      }],
      currentSceneId: "scene_001",
      createdAt: Date.now(),
      status: "waiting",
      choices: {},
    };
    
    await kv.set(`game:${roomId}`, gameState);
    
    return c.json({ success: true, roomId, playerId, gameState });
  } catch (error) {
    console.error("Error creating room:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Join an existing game room
app.post("/make-server-0d019d5f/room/join", async (c) => {
  try {
    const body = await c.req.json();
    const { roomId, playerName } = body;
    
    const gameState = await kv.get<GameState>(`game:${roomId}`);
    
    if (!gameState) {
      return c.json({ success: false, error: "Room not found" }, 404);
    }
    
    if (gameState.status !== "waiting") {
      return c.json({ success: false, error: "Game already started" }, 400);
    }
    
    if (gameState.players.length >= 6) {
      return c.json({ success: false, error: "Room is full" }, 400);
    }
    
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    gameState.players.push({
      id: playerId,
      name: playerName,
      roleId: "",
      roleName: "",
      connected: true,
      joinedAt: Date.now(),
    });
    
    await kv.set(`game:${roomId}`, gameState);
    
    return c.json({ success: true, playerId, gameState });
  } catch (error) {
    console.error("Error joining room:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get game state
app.get("/make-server-0d019d5f/room/:roomId", async (c) => {
  try {
    const roomId = c.req.param("roomId");
    const gameState = await kv.get<GameState>(`game:${roomId}`);
    
    if (!gameState) {
      return c.json({ success: false, error: "Room not found" }, 404);
    }
    
    return c.json({ success: true, gameState });
  } catch (error) {
    console.error("Error getting game state:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Start game (assign roles)
app.post("/make-server-0d019d5f/room/:roomId/start", async (c) => {
  try {
    const roomId = c.req.param("roomId");
    const gameState = await kv.get<GameState>(`game:${roomId}`);
    
    if (!gameState) {
      return c.json({ success: false, error: "Room not found" }, 404);
    }
    
    if (gameState.status !== "waiting") {
      return c.json({ success: false, error: "Game already started" }, 400);
    }
    
    if (gameState.players.length < 4) {
      return c.json({ success: false, error: "Need at least 4 players" }, 400);
    }
    
    // Assign roles randomly
    const roles = [
      { id: "detective", name: "탐정" },
      { id: "butler", name: "집사" },
      { id: "heir", name: "상속자" },
      { id: "maid", name: "가정부" },
      { id: "doctor", name: "주치의" },
      { id: "guest", name: "손님" },
    ];
    
    const shuffledRoles = roles.slice(0, gameState.players.length)
      .sort(() => Math.random() - 0.5);
    
    gameState.players.forEach((player, index) => {
      player.roleId = shuffledRoles[index].id;
      player.roleName = shuffledRoles[index].name;
    });
    
    gameState.status = "playing";
    gameState.currentSceneId = "scene_001";
    
    await kv.set(`game:${roomId}`, gameState);
    
    return c.json({ success: true, gameState });
  } catch (error) {
    console.error("Error starting game:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Make a choice
app.post("/make-server-0d019d5f/room/:roomId/choice", async (c) => {
  try {
    const roomId = c.req.param("roomId");
    const body = await c.req.json();
    const { playerId, sceneId, choiceId } = body;
    
    const gameState = await kv.get<GameState>(`game:${roomId}`);
    
    if (!gameState) {
      return c.json({ success: false, error: "Room not found" }, 404);
    }
    
    if (!gameState.choices[sceneId]) {
      gameState.choices[sceneId] = {};
    }
    
    gameState.choices[sceneId][playerId] = choiceId;
    
    await kv.set(`game:${roomId}`, gameState);
    
    return c.json({ success: true, gameState });
  } catch (error) {
    console.error("Error making choice:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Advance to next scene
app.post("/make-server-0d019d5f/room/:roomId/next-scene", async (c) => {
  try {
    const roomId = c.req.param("roomId");
    const body = await c.req.json();
    const { nextSceneId } = body;
    
    const gameState = await kv.get<GameState>(`game:${roomId}`);
    
    if (!gameState) {
      return c.json({ success: false, error: "Room not found" }, 404);
    }
    
    gameState.currentSceneId = nextSceneId;
    
    if (nextSceneId === "scene_end") {
      gameState.status = "finished";
    }
    
    await kv.set(`game:${roomId}`, gameState);
    
    return c.json({ success: true, gameState });
  } catch (error) {
    console.error("Error advancing scene:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);