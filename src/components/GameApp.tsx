"use client";

import { useState, useEffect } from "react";
import { supabaseUrl, publicAnonKey } from "@/lib/supabase";
import { CASE_001, type Scene } from "@/data/scenario";
import { Users, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = `${supabaseUrl}/functions/v1/server/make-server-0d019d5f`;

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
  scenario: string;
  players: Player[];
  currentSceneId: string;
  createdAt: number;
  status: "waiting" | "playing" | "finished";
  choices: Record<string, Record<string, string>>;
}

export default function GameApp() {
  const [screen, setScreen] = useState<"home" | "create" | "join" | "lobby" | "game">("home");
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  useEffect(() => {
    if (!gameState?.roomId) return;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/room/${gameState.roomId}`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        const data = await response.json();
        if (data.success) setGameState(data.gameState);
      } catch (err) {
        console.error("Error polling game state:", err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [gameState?.roomId]);

  const createRoom = async () => {
    if (!playerName.trim()) {
      setError("이름을 입력해주세요");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/room/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ playerName: playerName.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setRoomId(data.roomId);
        setPlayerId(data.playerId);
        setGameState(data.gameState);
        setScreen("lobby");
      } else {
        setError(data.error || "방 생성에 실패했습니다");
      }
    } catch (err) {
      console.error("Create room error:", err);
      setError("서버 연결에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomId.trim()) {
      setError("이름과 방 코드를 입력해주세요");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/room/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ roomId: roomId.trim(), playerName: playerName.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setPlayerId(data.playerId);
        setGameState(data.gameState);
        setScreen("lobby");
      } else {
        setError(data.error || "방 참가에 실패했습니다");
      }
    } catch (err) {
      console.error("Join room error:", err);
      setError("서버 연결에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (!gameState) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/room/${gameState.roomId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setGameState(data.gameState);
        setScreen("game");
      } else {
        setError(data.error || "게임 시작에 실패했습니다");
      }
    } catch (err) {
      console.error("Start game error:", err);
      setError("서버 연결에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const makeChoice = async (choiceId: string) => {
    if (!gameState || !currentScene) return;
    setSelectedChoice(choiceId);
    setError("");
    try {
      const response = await fetch(`${API_URL}/room/${gameState.roomId}/choice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          playerId,
          sceneId: currentScene.id,
          choiceId,
        }),
      });
      const data = await response.json();
      if (data.success) setGameState(data.gameState);
      else setError(data.error || "선택 저장에 실패했습니다");
    } catch (err) {
      console.error("Make choice error:", err);
      setError("서버 연결에 실패했습니다");
    }
  };

  const currentScene: Scene | undefined = gameState
    ? CASE_001.scenes.find((s) => s.id === gameState.currentSceneId)
    : undefined;
  const currentPlayer = gameState?.players.find((p) => p.id === playerId);
  const currentRole = CASE_001.roles.find((r) => r.id === currentPlayer?.roleId);

  const advanceScene = async (nextSceneId: string) => {
    if (!gameState) return;
    setError("");
    try {
      const response = await fetch(`${API_URL}/room/${gameState.roomId}/next-scene`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ nextSceneId }),
      });
      const data = await response.json();
      if (data.success) {
        setGameState(data.gameState);
        setSelectedChoice(null);
      } else {
        setError(data.error || "씬 전환에 실패했습니다");
      }
    } catch (err) {
      console.error("Advance scene error:", err);
      setError("서버 연결에 실패했습니다");
    }
  };

  useEffect(() => {
    if (!gameState || !currentScene) return;
    if (currentScene.type !== "choice") return;
    if (!currentScene.gate || currentScene.gate.type !== "all_players_picked") return;
    const sceneChoices = gameState.choices[currentScene.id] || {};
    const allPlayersPicked = gameState.players.every((player) => sceneChoices[player.id]);
    if (allPlayersPicked && currentScene.choices) {
      const voteCounts: Record<string, number> = {};
      Object.values(sceneChoices).forEach((choiceId) => {
        voteCounts[choiceId] = (voteCounts[choiceId] || 0) + 1;
      });
      let winningChoice = currentScene.choices[0];
      let maxVotes = 0;
      currentScene.choices.forEach((choice) => {
        const votes = voteCounts[choice.id] || 0;
        if (votes > maxVotes) {
          maxVotes = votes;
          winningChoice = choice;
        }
      });
      setTimeout(() => advanceScene(winningChoice.next), 2000);
    }
  }, [gameState?.choices, currentScene]);

  useEffect(() => {
    if (gameState?.status === "playing" && screen === "lobby") setScreen("game");
  }, [gameState?.status]);

  if (screen === "home") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 mystery-spotlight">
        <div className="max-w-2xl w-full">
          {/* 레퍼: 별장 살인/시체와 은혼 스타일 — 검정 배경 + 빨간 타이틀 + 서브 */}
          <div className="text-center mb-10">
            <p className="text-[#a3a3a3] text-xs uppercase tracking-[0.3em] mb-2 font-sans">
              추리 게임
            </p>
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-[#b91c1c] tracking-tight mb-2 drop-shadow-[0_0_20px_rgba(185,28,28,0.3)]">
              저택의 비밀
            </h1>
            <p className="text-[#f5f5dc] font-display text-lg sm:text-xl tracking-wide">
              4–6인용 머더 미스터리
            </p>
          </div>
          <div className="mystery-card rounded-sm p-8 relative">
            <div className="mystery-card-accent rounded-l-sm" aria-hidden />
            <div className="pl-4 space-y-4">
              <Button
                onClick={() => setScreen("create")}
                className="w-full bg-[#b91c1c] hover:bg-[#7f1d1d] text-[#f5f5dc] font-display text-lg py-6 rounded-sm border-0"
              >
                새 게임 만들기
              </Button>
              <Button
                onClick={() => setScreen("join")}
                className="w-full bg-[#262626] hover:bg-[#404040] text-[#f5f5dc] font-display text-lg py-6 rounded-sm border border-[#404040]"
              >
                게임 참가하기
              </Button>
            </div>
            <div className="mt-8 pt-8 border-t border-[#404040] pl-4">
              <h3 className="text-[#f5f5dc] font-display text-lg mb-3">게임 정보</h3>
              <ul className="text-[#d4d4d4] space-y-2 text-sm font-sans">
                <li>· 플레이어 4–6명</li>
                <li>· 실시간 멀티플레이</li>
                <li>· 역할별 비공개 정보</li>
                <li>· 선택에 따라 달라지는 스토리</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "create") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 mystery-spotlight">
        <div className="max-w-md w-full">
          <p className="text-[#a3a3a3] text-xs uppercase tracking-[0.2em] mb-1 text-center font-sans">방 만들기</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#b91c1c] mb-8 text-center">
            새 게임 만들기
          </h2>
          <div className="mystery-card rounded-sm p-8 relative">
            <div className="mystery-card-accent rounded-l-sm" aria-hidden />
            <div className="pl-4 space-y-6">
              <div>
                <label className="block text-[#f5f5dc] font-display mb-2">당신의 이름</label>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="bg-[#0a0a0a] border-[#404040] text-[#f5f5dc] placeholder:text-[#737373] rounded-sm"
                  onKeyDown={(e) => e.key === "Enter" && createRoom()}
                />
              </div>
              {error && (
                <div className="bg-[#b91c1c]/20 border border-[#b91c1c] rounded-sm p-3 text-[#f87171] text-sm font-sans">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={() => setScreen("home")}
                  variant="outline"
                  className="flex-1 border-[#404040] text-[#f5f5dc] hover:bg-[#262626] rounded-sm font-sans"
                  disabled={loading}
                >
                  취소
                </Button>
                <Button
                  onClick={createRoom}
                  className="flex-1 bg-[#b91c1c] hover:bg-[#7f1d1d] text-[#f5f5dc] rounded-sm font-sans"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    "방 만들기"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "join") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 mystery-spotlight">
        <div className="max-w-md w-full">
          <p className="text-[#a3a3a3] text-xs uppercase tracking-[0.2em] mb-1 text-center font-sans">방 참가</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#b91c1c] mb-8 text-center">
            게임 참가하기
          </h2>
          <div className="mystery-card rounded-sm p-8 relative">
            <div className="mystery-card-accent rounded-l-sm" aria-hidden />
            <div className="pl-4 space-y-6">
              <div>
                <label className="block text-[#f5f5dc] font-display mb-2">방 코드</label>
                <Input
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="room_xxxxx"
                  className="bg-[#0a0a0a] border-[#404040] text-[#f5f5dc] placeholder:text-[#737373] rounded-sm"
                />
              </div>
              <div>
                <label className="block text-[#f5f5dc] font-display mb-2">당신의 이름</label>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="bg-[#0a0a0a] border-[#404040] text-[#f5f5dc] placeholder:text-[#737373] rounded-sm"
                  onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                />
              </div>
              {error && (
                <div className="bg-[#b91c1c]/20 border border-[#b91c1c] rounded-sm p-3 text-[#f87171] text-sm font-sans">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={() => setScreen("home")}
                  variant="outline"
                  className="flex-1 border-[#404040] text-[#f5f5dc] hover:bg-[#262626] rounded-sm font-sans"
                  disabled={loading}
                >
                  취소
                </Button>
                <Button
                  onClick={joinRoom}
                  className="flex-1 bg-[#b91c1c] hover:bg-[#7f1d1d] text-[#f5f5dc] rounded-sm font-sans"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      참가 중...
                    </>
                  ) : (
                    "참가하기"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "lobby" && gameState) {
    const isHost = gameState.players[0]?.id === playerId;
    const canStart = gameState.players.length >= 4 && gameState.players.length <= 6;
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 mystery-spotlight">
        <div className="max-w-2xl w-full">
          <p className="text-[#a3a3a3] text-xs uppercase tracking-[0.2em] mb-1 text-center font-sans">대기실</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#b91c1c] mb-8 text-center">대기실</h2>
          <div className="mystery-card rounded-sm p-8 relative">
            <div className="mystery-card-accent rounded-l-sm" aria-hidden />
            <div className="pl-4">
              <div className="mb-6 pb-6 border-b border-[#404040]">
                <div className="text-[#a3a3a3] text-xs uppercase tracking-wider mb-2 font-sans">방 코드</div>
                <div className="flex items-center gap-3">
                  <code className="bg-black px-4 py-2 rounded-sm border border-[#404040] text-[#b91c1c] font-mono text-sm flex-1">
                    {gameState.roomId}
                  </code>
                  <Button
                    onClick={() => navigator.clipboard.writeText(gameState.roomId)}
                    variant="outline"
                    className="border-[#404040] text-[#f5f5dc] hover:bg-[#262626] rounded-sm font-sans"
                    size="sm"
                  >
                    복사
                  </Button>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2 text-[#f5f5dc] font-display mb-4">
                  <Users className="w-5 h-5 text-[#b91c1c]" />
                  <span>플레이어 ({gameState.players.length}/6)</span>
                </div>
                <div className="space-y-2">
                  {gameState.players.map((player, index) => (
                    <div
                      key={player.id}
                      className="bg-black border border-[#404040] rounded-sm px-4 py-3 flex items-center justify-between"
                    >
                      <span className="text-[#f5f5dc] font-sans">
                        {player.name}
                        {player.id === playerId && " (나)"}
                        {index === 0 && " 👑"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {isHost && (
                <div className="space-y-3">
                  {!canStart && (
                    <div className="bg-[#b91c1c]/20 border border-[#b91c1c] rounded-sm p-3 text-[#f87171] text-sm text-center font-sans">
                      4–6명의 플레이어가 필요합니다
                    </div>
                  )}
                  {error && (
                    <div className="bg-[#b91c1c]/20 border border-[#b91c1c] rounded-sm p-3 text-[#f87171] text-sm font-sans">
                      {error}
                    </div>
                  )}
                  <Button
                    onClick={startGame}
                    disabled={!canStart || loading}
                    className="w-full bg-[#b91c1c] hover:bg-[#7f1d1d] text-[#f5f5dc] py-6 text-lg font-display rounded-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        시작 중...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-5 w-5" />
                        게임 시작
                      </>
                    )}
                  </Button>
                </div>
              )}
              {!isHost && (
                <div className="bg-[#262626] border border-[#404040] rounded-sm p-4 text-center text-[#d4d4d4] font-sans text-sm">
                  방장이 게임을 시작하기를 기다리는 중...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "game" && gameState && currentScene && currentPlayer) {
    const privateText = currentScene.privateByRole?.[currentPlayer.roleId]?.text;
    const sceneChoices = gameState.choices[currentScene.id] || {};
    const hasChosenInCurrentScene = !!sceneChoices[playerId];
    const playersWhoChose = Object.keys(sceneChoices).length;
    const totalPlayers = gameState.players.length;

    return (
      <div className="min-h-screen bg-black p-6 mystery-spotlight">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#b91c1c]">{CASE_001.title}</h1>
              <div className="text-[#d4d4d4] text-sm mt-1 font-sans">
                {currentPlayer.roleName} — {currentPlayer.name}
              </div>
            </div>
            <div className="text-right text-[#d4d4d4] text-sm font-sans">
              <div>플레이어 {totalPlayers}명</div>
              {gameState.status === "finished" && (
                <div className="text-[#b91c1c] font-display">게임 종료</div>
              )}
            </div>
          </div>

          {gameState.currentSceneId === "scene_001" && currentRole && (
            <div className="mystery-card rounded-sm p-6 mb-6 relative">
              <div className="mystery-card-accent rounded-l-sm" aria-hidden />
              <div className="pl-4">
                <h3 className="font-display text-xl font-bold text-[#b91c1c] mb-3">당신의 역할</h3>
                <p className="text-[#f5f5dc] leading-relaxed font-sans">{currentRole.privateIntro}</p>
              </div>
            </div>
          )}

          <div className="mystery-card rounded-sm p-6 mb-6">
            <div className="mb-4">
              <div className="text-[#737373] text-xs uppercase tracking-wider mb-2 font-sans">공개 정보</div>
              <p className="text-[#f5f5dc] text-lg leading-relaxed font-display">
                {currentScene.public.text}
              </p>
            </div>
            {privateText && (
              <div className="pt-4 border-t border-[#404040]">
                <div className="text-[#b91c1c] text-xs uppercase tracking-wider mb-2 font-sans">
                  비공개 정보 (당신만 볼 수 있습니다)
                </div>
                <p className="text-[#f5f5dc] leading-relaxed italic font-sans">{privateText}</p>
              </div>
            )}
          </div>

          {currentScene.type === "choice" && currentScene.choices && (
            <div className="mystery-card rounded-sm p-6 mb-6 relative">
              <div className="mystery-card-accent rounded-l-sm" aria-hidden />
              <div className="pl-4">
                <h3 className="font-display text-xl font-bold text-[#b91c1c] mb-4">선택하세요</h3>
                {hasChosenInCurrentScene ? (
                  <div>
                    <div className="bg-[#262626] border border-[#404040] rounded-sm p-4 text-center text-[#f5f5dc] mb-4 font-sans">
                      선택을 완료했습니다. 다른 플레이어를 기다리는 중...
                    </div>
                    <div className="text-[#737373] text-sm text-center font-sans">
                      {playersWhoChose} / {totalPlayers} 플레이어가 선택했습니다
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentScene.choices.map((choice) => (
                      <Button
                        key={choice.id}
                        onClick={() => makeChoice(choice.id)}
                        className="w-full bg-[#262626] hover:bg-[#404040] border border-[#404040] text-[#f5f5dc] text-left justify-start py-6 px-6 h-auto font-sans text-base rounded-sm"
                        disabled={selectedChoice !== null}
                      >
                        {choice.label}
                      </Button>
                    ))}
                    <div className="text-[#737373] text-sm text-center mt-4 font-sans">
                      {playersWhoChose} / {totalPlayers} 플레이어가 선택했습니다
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentScene.type === "narration" &&
            currentScene.next &&
            currentScene.next !== "scene_end" && (
              <div className="mystery-card rounded-sm p-6 relative">
                <div className="mystery-card-accent rounded-l-sm" aria-hidden />
                <div className="pl-4">
                  <Button
                    onClick={() => advanceScene(currentScene.next!)}
                    className="w-full bg-[#b91c1c] hover:bg-[#7f1d1d] text-[#f5f5dc] py-6 text-lg font-display rounded-sm"
                  >
                    계속하기
                  </Button>
                </div>
              </div>
            )}

          {currentScene.id === "scene_end" && (
            <div className="mystery-card rounded-sm p-8 text-center relative">
              <div className="mystery-card-accent rounded-l-sm" aria-hidden />
              <div className="pl-4">
                <h2 className="font-display text-3xl font-bold text-[#b91c1c] mb-4">게임 종료</h2>
                <p className="text-[#f5f5dc] mb-6 font-sans">함께 플레이해주셔서 감사합니다!</p>
                <Button
                  onClick={() => {
                    setScreen("home");
                    setGameState(null);
                    setPlayerId("");
                    setRoomId("");
                    setPlayerName("");
                  }}
                  className="bg-[#b91c1c] hover:bg-[#7f1d1d] text-[#f5f5dc] font-display rounded-sm"
                >
                  메인 화면으로
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-[#b91c1c]/20 border border-[#b91c1c] rounded-sm p-3 text-[#f87171] text-sm font-sans">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
