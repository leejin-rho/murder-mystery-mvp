export interface Role {
  id: string;
  name: string;
  privateIntro: string;
}

export interface NarrationScene {
  id: string;
  type: 'narration';
  public: {
    text: string;
  };
  privateByRole?: Record<string, { text: string }>;
  next: string;
}

export interface Choice {
  id: string;
  label: string;
  next: string;
}

export interface ChoiceScene {
  id: string;
  type: 'choice';
  public: {
    text: string;
  };
  privateByRole?: Record<string, { text: string }>;
  choices: Choice[];
  gate: {
    type: 'all_players_picked';
  };
}

export type Scene = NarrationScene | ChoiceScene;

export interface Scenario {
  id: string;
  title: string;
  version: number;
  playerCount: {
    min: number;
    max: number;
  };
  roles: Role[];
  startSceneId: string;
  scenes: Scene[];
}

export interface Player {
  id: string;
  name: string;
  roleId: string;
  socketId: string;
  isHost: boolean;
}

export interface PlayerChoice {
  playerId: string;
  choiceId: string;
}

export interface Room {
  id: string;
  scenarioId: string;
  players: Map<string, Player>;
  gameStarted: boolean;
  currentSceneId: string | null;
  playerChoices: Map<string, string>; // playerId -> choiceId
}

export interface PublicPlayer {
  id: string;
  name: string;
  isHost: boolean;
  hasPicked?: boolean;
}

export interface PublicRoomState {
  roomId: string;
  scenarioTitle: string;
  players: PublicPlayer[];
  gameStarted: boolean;
  currentSceneId: string | null;
}

export interface PrivatePlayerInfo {
  roleId: string;
  roleName: string;
  privateIntro: string;
}

export interface PublicScenePayload {
  sceneId: string;
  type: 'narration' | 'choice';
  publicText: string;
  choices?: Choice[];
}

export interface PrivateScenePayload {
  privateText?: string;
}
