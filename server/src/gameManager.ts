import { Server, Socket } from 'socket.io';
import { Room, Player, PublicRoomState, PrivatePlayerInfo, PublicScenePayload, PrivateScenePayload, Scenario, Scene } from './types';
import { ScenarioLoader } from './scenarioLoader';

export class GameManager {
  private rooms: Map<string, Room> = new Map();
  private scenarioLoader: ScenarioLoader;

  constructor(private io: Server, scenarioLoader: ScenarioLoader) {
    this.scenarioLoader = scenarioLoader;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private getScenario(scenarioId: string): Scenario {
    const scenario = this.scenarioLoader.getScenario(scenarioId);
    if (!scenario) {
      throw new Error('Scenario not found');
    }
    return scenario;
  }

  private getScene(scenario: Scenario, sceneId: string): Scene | undefined {
    return scenario.scenes.find(s => s.id === sceneId);
  }

  createRoom(socket: Socket, playerName: string): void {
    const roomId = this.generateId();
    const playerId = this.generateId();
    const scenario = this.scenarioLoader.getDefaultScenario();

    const player: Player = {
      id: playerId,
      name: playerName,
      roleId: '',
      socketId: socket.id,
      isHost: true
    };

    const room: Room = {
      id: roomId,
      scenarioId: scenario.id,
      players: new Map([[playerId, player]]),
      gameStarted: false,
      currentSceneId: null,
      playerChoices: new Map()
    };

    this.rooms.set(roomId, room);
    socket.join(roomId);

    socket.emit('room:created', { roomId, playerId });
    this.broadcastRoomState(roomId);

    console.log(`Room ${roomId} created by ${playerName}`);
  }

  joinRoom(socket: Socket, roomId: string, playerName: string): void {
    const room = this.rooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: '방을 찾을 수 없습니다.' });
      return;
    }

    if (room.gameStarted) {
      socket.emit('error', { message: '이미 시작된 게임입니다.' });
      return;
    }

    const scenario = this.getScenario(room.scenarioId);

    if (room.players.size >= scenario.playerCount.max) {
      socket.emit('error', { message: `최대 인원(${scenario.playerCount.max}명)을 초과했습니다.` });
      return;
    }

    const playerId = this.generateId();
    const player: Player = {
      id: playerId,
      name: playerName,
      roleId: '',
      socketId: socket.id,
      isHost: false
    };

    room.players.set(playerId, player);
    socket.join(roomId);

    socket.emit('room:joined', { roomId, playerId });
    this.broadcastRoomState(roomId);

    console.log(`Player ${playerName} joined room ${roomId}`);

    // Auto-start if minimum players reached
    if (room.players.size >= scenario.playerCount.min && !room.gameStarted) {
      setTimeout(() => {
        this.startGame(roomId);
      }, 1000);
    }
  }

  startGame(roomId: string): void {
    const room = this.rooms.get(roomId);

    if (!room) {
      return;
    }

    if (room.gameStarted) {
      return;
    }

    const scenario = this.getScenario(room.scenarioId);

    if (room.players.size < scenario.playerCount.min) {
      this.io.to(roomId).emit('error', { message: `최소 ${scenario.playerCount.min}명이 필요합니다.` });
      return;
    }

    if (room.players.size > scenario.playerCount.max) {
      this.io.to(roomId).emit('error', { message: `최대 ${scenario.playerCount.max}명까지 가능합니다.` });
      return;
    }

    // Assign roles
    const shuffledRoles = [...scenario.roles].sort(() => Math.random() - 0.5);
    const playerArray = Array.from(room.players.values());

    playerArray.forEach((player, index) => {
      const role = shuffledRoles[index % shuffledRoles.length];
      player.roleId = role.id;
    });

    room.gameStarted = true;
    room.currentSceneId = scenario.startSceneId;

    console.log(`Game started in room ${roomId}`);

    // Send private info to each player
    room.players.forEach(player => {
      const role = scenario.roles.find(r => r.id === player.roleId)!;
      const privateInfo: PrivatePlayerInfo = {
        roleId: role.id,
        roleName: role.name,
        privateIntro: role.privateIntro
      };

      this.io.to(player.socketId).emit('game:myPrivate', privateInfo);
    });

    this.broadcastRoomState(roomId);
    this.broadcastCurrentScene(roomId);
  }

  handlePlayerPick(socket: Socket, roomId: string, playerId: string, choiceId: string): void {
    const room = this.rooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: '방을 찾을 수 없습니다.' });
      return;
    }

    if (!room.gameStarted) {
      socket.emit('error', { message: '게임이 아직 시작되지 않았습니다.' });
      return;
    }

    const player = room.players.get(playerId);
    if (!player) {
      socket.emit('error', { message: '플레이어를 찾을 수 없습니다.' });
      return;
    }

    const scenario = this.getScenario(room.scenarioId);
    const currentScene = this.getScene(scenario, room.currentSceneId!);

    if (!currentScene || currentScene.type !== 'choice') {
      socket.emit('error', { message: '현재는 선택할 수 없습니다.' });
      return;
    }

    const validChoice = currentScene.choices.find(c => c.id === choiceId);
    if (!validChoice) {
      socket.emit('error', { message: '잘못된 선택입니다.' });
      return;
    }

    // Store choice (overwrite if already picked)
    room.playerChoices.set(playerId, choiceId);

    console.log(`Player ${player.name} picked ${choiceId} in room ${roomId}`);

    this.broadcastRoomState(roomId);

    // Check if all players have picked
    const allPicked = Array.from(room.players.keys()).every(pid => 
      room.playerChoices.has(pid)
    );

    if (allPicked && currentScene.gate.type === 'all_players_picked') {
      // Determine next scene (using first player's choice for simplicity, or most common)
      const choiceCounts = new Map<string, number>();
      room.playerChoices.forEach(cid => {
        choiceCounts.set(cid, (choiceCounts.get(cid) || 0) + 1);
      });

      const mostCommonChoice = Array.from(choiceCounts.entries())
        .sort((a, b) => b[1] - a[1])[0][0];

      const nextSceneId = currentScene.choices.find(c => c.id === mostCommonChoice)?.next;

      if (nextSceneId) {
        room.currentSceneId = nextSceneId;
        room.playerChoices.clear();

        setTimeout(() => {
          this.broadcastRoomState(roomId);
          this.broadcastCurrentScene(roomId);
        }, 1500);
      }
    }
  }

  handleDisconnect(socket: Socket): void {
    // Find room and player
    for (const [roomId, room] of this.rooms.entries()) {
      for (const [playerId, player] of room.players.entries()) {
        if (player.socketId === socket.id) {
          console.log(`Player ${player.name} disconnected from room ${roomId}`);
          
          room.players.delete(playerId);

          if (room.players.size === 0) {
            this.rooms.delete(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
          } else {
            // Assign new host if needed
            if (player.isHost) {
              const newHost = Array.from(room.players.values())[0];
              newHost.isHost = true;
            }

            this.broadcastRoomState(roomId);
          }

          return;
        }
      }
    }
  }

  private broadcastRoomState(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const scenario = this.getScenario(room.scenarioId);

    const publicState: PublicRoomState = {
      roomId: room.id,
      scenarioTitle: scenario.title,
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        hasPicked: room.playerChoices.has(p.id)
      })),
      gameStarted: room.gameStarted,
      currentSceneId: room.currentSceneId
    };

    this.io.to(roomId).emit('room:state', publicState);
  }

  private broadcastCurrentScene(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentSceneId) return;

    const scenario = this.getScenario(room.scenarioId);
    const scene = this.getScene(scenario, room.currentSceneId);

    if (!scene) return;

    const publicPayload: PublicScenePayload = {
      sceneId: scene.id,
      type: scene.type,
      publicText: scene.public.text,
      choices: scene.type === 'choice' ? scene.choices : undefined
    };

    this.io.to(roomId).emit('game:scene', publicPayload);

    // Send private info to each player
    if (scene.privateByRole) {
      room.players.forEach(player => {
        const privateText = scene.privateByRole?.[player.roleId]?.text;
        if (privateText) {
          const privatePayload: PrivateScenePayload = {
            privateText
          };
          this.io.to(player.socketId).emit('game:scenePrivate', privatePayload);
        }
      });
    }
  }
}
