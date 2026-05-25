"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  SCENARIO_REGISTRY,
  ALL_SCENARIOS,
} from "@/data/scenarios";
import type { Scenario, ScenarioMeta, HintCard } from "@/data/scenario.type";
import {
  Users,
  Play,
  Loader2,
  Copy,
  Check,
  Clock,
  UserCircle,
  ChevronLeft,
  Lock,
  Send,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MurderMysteryLogo } from "@/components/MurderMysteryLogo";

const API_URL = "/api/game";
type Screen = "home" | "create" | "join" | "lobby" | "game";

/* ── Shared Types ── */

interface Player {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
  connected: boolean;
}

interface GameState {
  roomId: string;
  scenario: string;
  testMode?: boolean;
  players: Player[];
  status: string;
  currentRound: number;
  currentTurnIndex: number;
  cardsPickedThisRound: number;
  availableCards: number[];
  playerHands: Record<string, number[]>;
  chat: { playerId: string; roleName: string; playerName: string; text: string; time: number }[];
  discussionEndsAt: number | null;
  currentEvent: { title: string; text: string } | null;
  finalVotes: Record<string, Record<string, string>>;
  readyPlayers: Record<string, string[]>;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  초급: "text-green-400 border-green-400/30",
  중급: "text-yellow-400 border-yellow-400/30",
  고급: "text-red-400 border-red-400/30",
};

/* ── Scenario Card ── */

function ScenarioCard({ scenario, onSelect }: { scenario: ScenarioMeta; onSelect: (id: string) => void }) {
  const disabled = !scenario.available;
  return (
    <button
      onClick={() => !disabled && onSelect(scenario.id)}
      disabled={disabled}
      className={`w-full text-left rounded-sm border transition-all duration-200 group ${disabled ? "border-[#2a2a2a] opacity-50 cursor-not-allowed" : "border-[#404040] hover:border-[#b91c1c]/60 cursor-pointer"} bg-[#1a1a1a] overflow-hidden`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`font-sans text-lg sm:text-xl font-bold ${disabled ? "text-[#737373]" : "text-[#f5f5dc] group-hover:text-[#b91c1c]"} transition-colors`}>
            {scenario.title}
          </h3>
          {disabled && <Lock className="w-4 h-4 text-[#737373] shrink-0 mt-1" />}
        </div>
        <p className={`text-sm mb-3 font-display ${disabled ? "text-[#525252]" : "text-[#a3a3a3]"}`}>{scenario.subtitle}</p>
        <p className={`text-sm mb-4 leading-relaxed font-sans ${disabled ? "text-[#525252]" : "text-[#d4d4d4]"}`}>{scenario.description}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${disabled ? "border-[#2a2a2a] text-[#525252]" : "border-[#404040] text-[#a3a3a3]"}`}>
            <UserCircle className="w-3 h-3" />{scenario.playerCount}명
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${disabled ? "border-[#2a2a2a] text-[#525252]" : "border-[#404040] text-[#a3a3a3]"}`}>
            <Clock className="w-3 h-3" />{scenario.duration}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded border ${disabled ? "border-[#2a2a2a] text-[#525252]" : DIFFICULTY_COLOR[scenario.difficulty]}`}>
            {scenario.difficulty}
          </span>
        </div>
      </div>
      <div className={`px-4 sm:px-5 py-3 border-t ${disabled ? "border-[#2a2a2a] bg-[#111]" : "border-[#404040]/50 bg-[#141414]"} flex items-center justify-between`}>
        <span className={`text-xs font-sans ${disabled ? "text-[#525252]" : "text-[#737373]"}`}>{disabled ? "준비 중" : "플레이 가능"}</span>
        {!disabled && <span className="text-xs text-[#b91c1c] font-sans font-medium group-hover:translate-x-1 transition-transform">선택하기 →</span>}
      </div>
    </button>
  );
}

/* ── Timer Hook ── */

function useCountdown(targetTime: number | null) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!targetTime) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, Math.ceil((targetTime - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTime]);
  return remaining;
}

/* ── Recent Games (localStorage) ── */

interface RecentGame {
  roomId: string;
  playerId: string;
  playerName: string;
  scenarioId: string;
  scenarioTitle: string;
  createdAt: number;
}

const STORAGE_KEY = "murder_mystery_recent";

function getRecentGames(): RecentGame[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveRecentGame(g: RecentGame) {
  const list = getRecentGames().filter(x => x.roomId !== g.roomId);
  list.unshift(g);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 10)));
}

function removeRecentGame(roomId: string) {
  const list = getRecentGames().filter(x => x.roomId !== roomId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ── Main Component ── */

export default function GameApp({ initialRoomId }: { initialRoomId?: string } = {}) {
  const router = useRouter();
  const [splash, setSplash] = useState(!initialRoomId);
  const [splashReady, setSplashReady] = useState(false);
  const [screen, setScreen] = useState<Screen>(initialRoomId ? "join" : "home");
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState(initialRoomId ?? "");
  const [playerId, setPlayerId] = useState("");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [restoring, setRestoring] = useState(!!initialRoomId);
  const [testModeUnlocked, setTestModeUnlocked] = useState(false);
  const [blankCreateClickTimes, setBlankCreateClickTimes] = useState<number[]>([]);
  const [testJumpRound, setTestJumpRound] = useState(2);
  const [testBotCount, setTestBotCount] = useState(1);
  const [selectedMapPointId, setSelectedMapPointId] = useState("all");
  const [showGameInfo, setShowGameInfo] = useState(false);

  // game sub-state
  const [showCards, setShowCards] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [widePanel, setWidePanel] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [voteNotes, setVoteNotes] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const [pastEvents, setPastEvents] = useState<{ title: string; text: string }[]>([]);
  const [justUnlocked, setJustUnlocked] = useState<Set<number>>(new Set());
  const prevAvailableRef = useRef<Set<number>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef("");
  const toastShownRef = useRef("");

  useEffect(() => { setRecentGames(getRecentGames()); }, []);

  // Splash animation (home only)
  useEffect(() => {
    if (initialRoomId) return;
    document.body.style.overflow = "hidden";
    document.fonts.ready.then(() => setSplashReady(true));
    return () => { document.body.style.overflow = ""; };
  }, [initialRoomId]);
  useEffect(() => {
    if (!splashReady || initialRoomId) return;
    const t = setTimeout(() => { setSplash(false); document.body.style.overflow = ""; }, 2500);
    return () => { clearTimeout(t); document.body.style.overflow = ""; };
  }, [splashReady, initialRoomId]);

  // Auto-restore session when visiting /room/[roomId]
  useEffect(() => {
    if (!initialRoomId) return;
    const recent = getRecentGames().find(g => g.roomId === initialRoomId);
    if (recent) {
      (async () => {
        try {
          const res = await fetch(`${API_URL}/room/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId: recent.roomId, playerName: recent.playerName }),
          });
          const data = await res.json();
          if (data.success) {
            setRoomId(recent.roomId);
            setPlayerId(data.playerId);
            setPlayerName(recent.playerName);
            syncGameState(data.gameState);
            setSelectedScenarioId(data.gameState.scenario);
            setScreen(data.gameState.status === "waiting" ? "lobby" : "game");
          } else {
            removeRecentGame(recent.roomId);
            setRecentGames(getRecentGames());
          }
        } catch {}
        setRestoring(false);
      })();
    } else {
      setRestoring(false);
    }
  }, [initialRoomId]);

  const scenario: Scenario | null = selectedScenarioId ? SCENARIO_REGISTRY[selectedScenarioId] ?? null : null;
  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const currentRole = scenario?.roles.find(r => r.id === currentPlayer?.roleId);

  const copyRoomId = () => {
    const url = `${window.location.origin}/room/${gameState?.roomId ?? ""}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sync gameState + lastStateRef together to prevent poll revert
  const lastStateRef = useRef("");
  const syncGameState = (gs: GameState) => {
    lastStateRef.current = JSON.stringify(gs);
    setGameState(gs);
  };
  useEffect(() => {
    if (!gameState?.roomId || gameState.status === "result") return;
    const ac = new AbortController();
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/room/${gameState.roomId}`, { signal: ac.signal });
        const data = await res.json();
        if (data.success) {
          const json = JSON.stringify(data.gameState);
          if (json !== lastStateRef.current) {
            syncGameState(data.gameState);
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }, gameState.status === "discussion" || gameState.status === "card_pick" ? 2000 : 5000);
    return () => {
      clearInterval(interval);
      ac.abort();
    };
  }, [gameState?.roomId, gameState?.status]);

  // Auto scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [gameState?.chat?.length]);

  // Detect newly unlocked cards and trigger glow animation
  useEffect(() => {
    if (!gameState || gameState.status !== "card_pick") {
      prevAvailableRef.current = new Set();
      return;
    }
    const current = new Set(gameState.availableCards);
    const prev = prevAvailableRef.current;
    if (prev.size > 0) {
      const added = gameState.availableCards.filter(id => !prev.has(id));
      if (added.length > 0) {
        setJustUnlocked(new Set(added));
        const t = setTimeout(() => setJustUnlocked(new Set()), 2500);
        prevAvailableRef.current = current;
        return () => clearTimeout(t);
      }
    }
    prevAvailableRef.current = current;
  }, [gameState]);

  // Auto-save event info when event phase is detected
  useEffect(() => {
    if (gameState?.status === "event" && gameState.currentEvent) {
      setPastEvents(prev => {
        if (prev.some(e => e.title === gameState.currentEvent!.title)) return prev;
        return [...prev, { title: gameState.currentEvent!.title, text: gameState.currentEvent!.text }];
      });
    }
  }, [gameState?.currentEvent?.title]);

  // Auto navigate to game + phase transition toasts
  useEffect(() => {
    if (gameState && gameState.status !== "waiting" && screen === "lobby") setScreen("game");
    const status = gameState?.status ?? "";
    const round = gameState?.currentRound ?? 0;
    const toastKey = `${status}_${round}`;
    if (status && status !== prevStatusRef.current && toastKey !== toastShownRef.current) {
      toastShownRef.current = toastKey;
      if (status === "discussion" && gameState?.discussionEndsAt) {
        const durationMins = scenario ? Math.floor(scenario.discussionSeconds / 60) : 3;
        setToast(`라운드 ${round} 토론을 시작해주세요. (${durationMins}분)`);
        setTimeout(() => setToast(""), 4000);
      } else if (status === "card_pick" && prevStatusRef.current) {
        setToast(`라운드 ${round} — 카드 선택이 시작되었습니다`);
        setTimeout(() => setToast(""), 3000);
      } else if (status === "final_vote") {
        setToast("최종 추리 시간입니다. 범인, 동기, 방법을 선택하세요.");
        setTimeout(() => setToast(""), 4000);
      }
      prevStatusRef.current = status;
    }
  }, [gameState?.status, gameState?.currentRound, scenario]);

  /* ── API Calls ── */

  const api = async (path: string, body?: object, method?: string) => {
    const m = method ?? (body ? "POST" : "GET");
    const res = await fetch(`${API_URL}${path}`, {
      method: m,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  };

  const createRoom = async () => {
    let finalName = playerName.trim();
    if (!finalName) {
      if (!testModeUnlocked) {
        const now = Date.now();
        const windowMs = 3000;
        const nextTimes = [...blankCreateClickTimes.filter((t) => now - t <= windowMs), now];
        setBlankCreateClickTimes(nextTimes);
        const remain = 5 - nextTimes.length;
        if (nextTimes.length >= 5) {
          setTestModeUnlocked(true);
          setBlankCreateClickTimes([]);
          setError("");
          setToast("테스트 모드 잠금 해제");
          setTimeout(() => setToast(""), 1500);
        } else {
          setError(`이름을 입력해주세요`);
          setToast(`숨겨진 모드까지 ${remain}회 (3초 내)`);
          setTimeout(() => setToast(""), 1200);
        }
        return;
      }
      finalName = `테스터_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      setPlayerName(finalName);
    }
    setLoading(true); setError("");
    try {
      const data = await api("/room", { playerName: finalName, scenarioId: selectedScenarioId, testMode: testModeUnlocked });
      if (data.success) {
        setRoomId(data.roomId); setPlayerId(data.playerId); syncGameState(data.gameState); setScreen("lobby");
        const meta = ALL_SCENARIOS.find(s => s.id === selectedScenarioId);
        saveRecentGame({ roomId: data.roomId, playerId: data.playerId, playerName: finalName, scenarioId: selectedScenarioId, scenarioTitle: meta?.title ?? "알 수 없음", createdAt: Date.now() });
        setRecentGames(getRecentGames());
        router.push(`/room/${data.roomId}`);
      } else setError(data.error);
    } catch { setError("서버 연결에 실패했습니다"); } finally { setLoading(false); }
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomId.trim()) return setError("이름과 방 코드를 입력해주세요");
    setLoading(true); setError("");
    try {
      const data = await api("/room/join", { roomId: roomId.trim(), playerName: playerName.trim() });
      if (data.success) {
        setPlayerId(data.playerId); syncGameState(data.gameState); setSelectedScenarioId(data.gameState.scenario);
        setScreen(data.gameState.status === "waiting" ? "lobby" : "game");
        const meta = ALL_SCENARIOS.find(s => s.id === data.gameState.scenario);
        saveRecentGame({ roomId: roomId.trim(), playerId: data.playerId, playerName: playerName.trim(), scenarioId: data.gameState.scenario, scenarioTitle: meta?.title ?? "알 수 없음", createdAt: Date.now() });
        setRecentGames(getRecentGames());
        router.push(`/room/${roomId.trim()}`);
      } else setError(data.error);
    } catch { setError("서버 연결에 실패했습니다"); } finally { setLoading(false); }
  };

  const startGame = async () => {
    if (!gameState) return;
    setLoading(true); setError("");
    try {
      const data = await api(`/room/${gameState.roomId}/start`, {});
      if (data.success) { syncGameState(data.gameState); setScreen("game"); } else setError(data.error);
    } catch { setError("서버 연결에 실패했습니다"); } finally { setLoading(false); }
  };

  const sendReady = async () => {
    if (!gameState) return;
    if (gameState.status === "event" && gameState.currentEvent) {
      setPastEvents(prev => {
        if (prev.some(e => e.title === gameState.currentEvent!.title)) return prev;
        return [...prev, { title: gameState.currentEvent!.title, text: gameState.currentEvent!.text }];
      });
    }
    try {
      const data = await api(`/room/${gameState.roomId}/ready`, { playerId });
      if (data.success) syncGameState(data.gameState);
    } catch {}
  };

  const selectRole = async (roleId: string) => {
    if (!gameState) return;
    try {
      const data = await api(`/room/${gameState.roomId}/select-role`, { playerId, roleId });
      if (data.success) syncGameState(data.gameState);
      else {
        setError(data.error);
        if (typeof window !== "undefined" && data.error) window.alert(data.error);
      }
    } catch {
      setError("서버 연결에 실패했습니다");
    }
  };

  const confirmRoleSelection = async () => {
    if (!gameState) return;
    try {
      const data = await api(`/room/${gameState.roomId}/confirm-role-select`, { playerId });
      if (data.success) syncGameState(data.gameState);
      else {
        setError(data.error);
        if (typeof window !== "undefined" && data.error) window.alert(data.error);
      }
    } catch {
      setError("서버 연결에 실패했습니다");
    }
  };

  const selectRandomRole = async () => {
    if (!gameState || gameState.status !== "role_select" || !scenario) return;
    const myRoleId = currentPlayer?.roleId ?? "";
    const selectedMap = new Map(gameState.players.filter((p) => p.roleId).map((p) => [p.roleId, p.name]));
    const available = scenario.roles.filter((role) => {
      const pickedBy = selectedMap.get(role.id);
      return !pickedBy || myRoleId === role.id;
    });
    if (available.length === 0) {
      if (typeof window !== "undefined") window.alert("선택 가능한 역할이 없습니다.");
      return;
    }
    const exceptMine = available.filter((r) => r.id !== myRoleId);
    const pool = exceptMine.length > 0 ? exceptMine : available;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    await selectRole(chosen.id);
  };

  const pickCard = async (cardId: number) => {
    if (!gameState) return;
    try {
      const data = await api(`/room/${gameState.roomId}/pick-card`, { playerId, cardId });
      if (data.success) syncGameState(data.gameState); else setError(data.error);
    } catch {}
  };

  const sendChat = async () => {
    const input = chatInputRef.current;
    if (!gameState || !input || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = "";
    try {
      const data = await api(`/room/${gameState.roomId}/chat`, { playerId, text });
      if (data.success) syncGameState(data.gameState);
    } catch {}
  };

  const sendVote = async () => {
    if (!gameState) return;
    setLoading(true); setError("");
    try {
      const data = await api(`/room/${gameState.roomId}/vote`, { playerId, notes: voteNotes });
      if (data.success) syncGameState(data.gameState); else setError(data.error);
    } catch { setError("서버 연결에 실패했습니다"); } finally { setLoading(false); }
  };

  const resetGame = () => {
    if (gameState?.status === "result" && gameState?.roomId) removeRecentGame(gameState.roomId);
    setScreen("home"); setGameState(null); setPlayerId(""); setRoomId(""); setPlayerName(""); setSelectedScenarioId("");
    setVoteNotes({}); setShowCards(true); setPastEvents([]);
    setTestModeUnlocked(false); setBlankCreateClickTimes([]); setTestJumpRound(2); setTestBotCount(1);
    setSelectedMapPointId("all");
    prevStatusRef.current = ""; toastShownRef.current = ""; lastStateRef.current = "";
    setRecentGames(getRecentGames());
    router.push("/");
  };

  const rejoinGame = async (recent: RecentGame) => {
    setLoading(true); setError("");
    try {
      const data = await api("/room/join", { roomId: recent.roomId, playerName: recent.playerName });
      if (data.success) {
        setRoomId(recent.roomId); setPlayerId(data.playerId); setPlayerName(recent.playerName);
        syncGameState(data.gameState); setSelectedScenarioId(data.gameState.scenario);
        setScreen(data.gameState.status === "waiting" ? "lobby" : "game");
        router.push(`/room/${recent.roomId}`);
      } else {
        removeRecentGame(recent.roomId);
        setRecentGames(getRecentGames());
        setError("게임이 만료되었거나 찾을 수 없습니다");
      }
    } catch { setError("서버 연결에 실패했습니다"); } finally { setLoading(false); }
  };

  const deleteGame = async (roomId: string) => {
    try {
      await api(`/room/${roomId}`, undefined, "DELETE");
    } catch {}
    removeRecentGame(roomId);
    setRecentGames(getRecentGames());
  };

  const testAddBots = async () => {
    if (!gameState?.testMode) return;
    const data = await api(`/room/${gameState.roomId}/test-add-bots`, { count: testBotCount });
    if (data.success) syncGameState(data.gameState);
    else setError(data.error);
  };

  const testJumpToRound = async () => {
    if (!gameState?.testMode) return;
    const data = await api(`/room/${gameState.roomId}/test-jump-round`, { targetRound: testJumpRound });
    if (data.success) syncGameState(data.gameState);
    else setError(data.error);
  };

  /* ── Helper: Get card content by ID ── */
  const getCard = (id: number): HintCard | undefined => scenario?.hintCards.find(c => c.id === id);
  const getCardTitle = (card: HintCard) => card.title ?? `증거 #${card.id}`;
  const myCards = gameState?.playerHands[playerId] ?? [];

  const countdown = useCountdown(gameState?.discussionEndsAt ?? null);

  /* ════════════════ RENDER ════════════════ */

  /* ── HOME ── */
  if (screen === "home") {
    return (
      <>
        {splash && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div className={`absolute inset-0 ${splashReady ? "splash-bg" : "bg-[#0d0d0d]"}`} />
            <div className={`absolute top-0 left-1/2 ${splashReady ? "splash-logo-journey" : "opacity-0"}`}>
              <MurderMysteryLogo />
            </div>
          </div>
        )}
        <div className="min-h-screen bg-[#0d0d0d] px-4 py-6 sm:p-6 relative">
          <div className={`absolute inset-0 mystery-spotlight ${splashReady && splash ? "splash-spotlight-flicker" : ""}`} />
          <div className="max-w-2xl mx-auto relative">
            <div className="flex flex-col items-center mb-6 sm:mb-8 pt-4 sm:pt-8">
              <MurderMysteryLogo />
              <div className="mt-4 flex items-center justify-center gap-1.5">
                <p className="text-[#a3a3a3] font-sans text-sm">시나리오를 선택해 새 게임을 시작하세요</p>
                <button
                  type="button"
                  onClick={() => setShowGameInfo(true)}
                  className="inline-flex items-center justify-center text-[#737373] hover:text-[#f5f5dc] transition-colors leading-none self-center shrink-0"
                  aria-label="게임 규칙"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
          {/* Recent Games */}
          {recentGames.length > 0 && (
            <div className="mb-6 pb-6 border-b border-[#333]">
              <p className="text-[#a3a3a3] text-xs uppercase tracking-wider font-sans mb-3">진행 중인 게임</p>
              <div className="space-y-2">
                {recentGames.map(g => {
                  const age = Date.now() - g.createdAt;
                  const mins = Math.floor(age / 60000);
                  const timeStr = mins < 60 ? `${mins}분 전` : mins < 1440 ? `${Math.floor(mins / 60)}시간 전` : `${Math.floor(mins / 1440)}일 전`;
                  const expired = age > 4 * 60 * 60 * 1000;
                  return (
                    <div key={g.roomId} className={`flex items-center gap-3 rounded-[5px] border p-3 ${expired ? "border-[#333] bg-[#111] opacity-50" : "border-[#404040] bg-[#1a1a1a]"}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#f5f5dc] text-sm font-sans truncate">{g.scenarioTitle}</p>
                        <p className="text-[#737373] text-xs font-sans">{g.playerName} · {timeStr}</p>
                      </div>
                      {!expired && (
                        <button onClick={() => rejoinGame(g)} disabled={loading}
                          className="shrink-0 text-xs font-sans text-[#f5c542] hover:text-[#f5f5dc] border border-[#f5c542]/30 hover:border-[#f5c542] rounded-[5px] px-3 py-1.5 transition-colors">
                          이어하기
                        </button>
                      )}
                      <button onClick={() => deleteGame(g.roomId)}
                        className="shrink-0 text-xs font-sans text-[#737373] hover:text-[#b91c1c] transition-colors px-1">
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {error && <div className="bg-[#b91c1c]/20 border border-[#b91c1c] rounded-sm p-3 text-[#f87171] text-sm font-sans mb-4">{error}</div>}
          <p className="text-[#a3a3a3] text-xs uppercase tracking-wider font-sans mb-3">새 게임 시작</p>
          <div className="space-y-4 mb-8">
            {ALL_SCENARIOS.map(s => <ScenarioCard key={s.id} scenario={s} onSelect={id => { setSelectedScenarioId(id); setError(""); setScreen("create"); }} />)}
          </div>
          <div className="border-t border-[#333] pt-6 pb-4">
            <p className="text-[#737373] text-xs text-center font-sans mb-3">초대 코드를 받으셨나요?</p>
            <Button onClick={() => { setError(""); setScreen("join"); }} className="w-full bg-[#1a1a1a] hover:bg-[#262626] text-[#f5f5dc] font-sans text-base py-4 rounded-sm border border-[#404040]">코드로 참가하기</Button>
          </div>
          </div>
          </div>
        </div>
        {showGameInfo && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] backdrop-brightness-50 flex items-center justify-center px-4 py-8"
            onClick={() => setShowGameInfo(false)}
          >
            <div
              className="w-full max-w-2xl rounded-sm border border-[#5a5a5a] bg-[#1b1b1b] p-5 sm:p-6 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans text-xl font-bold text-[#f5f5dc]">게임 기본 규칙</h2>
                <button
                  type="button"
                  onClick={() => setShowGameInfo(false)}
                  className="text-sm text-[#a3a3a3] hover:text-[#f5f5dc] border border-[#404040] rounded-sm px-2 py-1"
                >
                  닫기
                </button>
              </div>
              <p className="text-[#e5e5e5] leading-relaxed font-sans text-sm whitespace-pre-line">
{`이 게임은 진행자 없이 즐기는 실시간 머더미스터리 추리 게임입니다.

플레이어는 각자의 역할을 맡고,
공개된 사건 배경과 등장인물 정보를 확인한 뒤,
자신만의 비밀과 목표를 가지고 사건에 참여합니다.

게임은 장면 단위로 진행됩니다.
무대 설정, 대본 읽기, 사건 발생, 현장 조사, 토론, 통찰, 최종 추리, 진상 공개 순서로 이어집니다.

조사 단계에서는 장소와 물건, 인물의 소지품 등을 선택해 증거 카드를 획득합니다.
카드의 장소와 이름은 거짓말할 수 없지만, 카드 내용은 공개 의무가 없는 한 숨기거나 왜곡할 수 있습니다.

일부 카드는 새로운 단서를 해금하거나, 모든 플레이어의 강제 토론을 발생시킵니다.

마지막에는 범인, 동기, 수법을 추리하고,
다른 사람의 비밀을 밝혀낼 수 있습니다.

범인은 과반수에게 지목되지 않으면 승리합니다.
비밀은 단 한 명에게라도 정확히 들키면 부분패배가 될 수 있습니다.`}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ── CREATE ── */
  if (screen === "create" && scenario) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4 py-8 sm:p-6 mystery-spotlight">
        <div className="max-w-md w-full">
          <button onClick={() => setScreen("home")} className="inline-flex items-center gap-1 text-[#a3a3a3] hover:text-[#f5f5dc] text-sm font-sans mb-4 transition-colors"><ChevronLeft className="w-4 h-4" />시나리오 선택</button>
          <div className="mystery-card rounded-sm p-5 sm:p-6 mb-4 border-l-2 border-l-[#b91c1c]">
            <h3 className="font-sans text-lg font-bold text-[#f5f5dc] mb-1">{scenario.title}</h3>
            <p className="text-[#a3a3a3] text-sm font-sans">{scenario.subtitle}</p>
            <div className="flex items-center gap-2 mt-2 text-xs font-sans text-[#737373]">
              <span>{scenario.playerCount}명</span><span>·</span><span>{scenario.duration}</span><span>·</span><span>{scenario.difficulty}</span>
            </div>
          </div>
          <div className="mystery-card rounded-sm p-5 sm:p-8 relative">
            <div className="mystery-card-accent rounded-l-sm" aria-hidden />
              <div className="pl-3 sm:pl-4 space-y-5">
              <div>
                <label className="block text-[#f5f5dc] font-sans mb-2">당신의 이름</label>
                <Input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="이름을 입력하세요" className="bg-[#0a0a0a] border-[#404040] text-[#f5f5dc] placeholder:text-[#737373] rounded-sm" onKeyDown={e => e.key === "Enter" && createRoom()} autoFocus />
              </div>
              {error && <div className="bg-[#b91c1c]/20 border border-[#b91c1c] rounded-sm p-3 text-[#f87171] text-sm font-sans">{error}</div>}
              <Button onClick={createRoom} className="w-full bg-[#1a1a1a] hover:bg-[#262626] text-[#f5f5dc] py-5 text-base font-sans rounded-sm border border-[#404040]" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />생성 중...</> : "방 만들기"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Restoring session ── */
  if (restoring) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center mystery-spotlight">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#b91c1c] animate-spin mx-auto mb-3" />
          <p className="text-[#a3a3a3] text-sm font-sans">게임에 다시 접속하는 중...</p>
        </div>
      </div>
    );
  }

  /* ── JOIN ── */
  if (screen === "join") {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4 py-8 sm:p-6 mystery-spotlight">
        <div className="max-w-md w-full">
          <button onClick={() => router.push("/")} className="inline-flex items-center gap-1 text-[#a3a3a3] hover:text-[#f5f5dc] text-sm font-sans mb-4 transition-colors"><ChevronLeft className="w-4 h-4" />돌아가기</button>
          <h2 className="font-sans text-2xl sm:text-3xl font-bold text-[#b91c1c] mb-6 text-center">게임 참가하기</h2>
          <div className="mystery-card rounded-sm p-5 sm:p-8 relative">
            <div className="mystery-card-accent rounded-l-sm" aria-hidden />
            <div className="pl-3 sm:pl-4 space-y-5">
              <div><label className="block text-[#f5f5dc] font-sans mb-2">방 코드</label><Input value={roomId} onChange={e => setRoomId(e.target.value)} placeholder="ABC123" className="bg-[#0a0a0a] border-[#404040] text-[#f5f5dc] placeholder:text-[#737373] rounded-sm" readOnly={!!initialRoomId} autoFocus={!initialRoomId} /></div>
              <div><label className="block text-[#f5f5dc] font-sans mb-2">당신의 이름</label><Input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="이름을 입력하세요" className="bg-[#0a0a0a] border-[#404040] text-[#f5f5dc] placeholder:text-[#737373] rounded-sm" onKeyDown={e => e.key === "Enter" && joinRoom()} /></div>
              {error && <div className="bg-[#b91c1c]/20 border border-[#b91c1c] rounded-sm p-3 text-[#f87171] text-sm font-sans">{error}</div>}
              <Button onClick={joinRoom} className="w-full bg-[#1a1a1a] hover:bg-[#262626] text-[#f5f5dc] py-5 text-base font-sans rounded-sm border border-[#404040]" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />참가 중...</> : "참가하기"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── LOBBY ── */
  if (screen === "lobby" && gameState) {
    const isHost = gameState.players[0]?.id === playerId;
    const scenarioMeta = ALL_SCENARIOS.find(s => s.id === gameState.scenario);
    const needed = scenarioMeta?.playerCount ?? 4;
    const canStart = gameState.players.length === needed;
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4 py-8 sm:p-6 mystery-spotlight">
        <div className="max-w-2xl w-full">
          <h2 className="font-sans text-2xl sm:text-3xl font-bold text-[#b91c1c] mb-2 text-center">{scenarioMeta?.title ?? "대기실"}</h2>
          <p className="text-[#a3a3a3] text-sm text-center font-sans mb-6">{scenarioMeta?.subtitle}</p>
          <div className="mystery-card rounded-sm p-5 sm:p-8 relative">
            <div className="mystery-card-accent rounded-l-sm" aria-hidden />
            <div className="pl-3 sm:pl-4">
              <div className="mb-6 pb-6 border-b border-[#404040]">
                <div className="text-[#a3a3a3] text-xs uppercase tracking-wider mb-2 font-sans">초대 링크</div>
                <div className="relative">
                  <code className="block bg-[#0d0d0d] px-4 py-3 pr-12 rounded-sm border border-[#404040] text-[#b91c1c] font-mono text-sm truncate">/room/{gameState.roomId}</code>
                  <button onClick={copyRoomId} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-[#262626] transition-colors" aria-label="링크 복사">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#a3a3a3]" />}
                  </button>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2 text-[#f5f5dc] font-sans mb-4"><Users className="w-5 h-5 text-[#b91c1c]" /><span>플레이어 ({gameState.players.length}/{needed})</span></div>
                <div className="space-y-2">
                  {gameState.players.map((p, i) => (
                    <div key={p.id} className="bg-[#0d0d0d] border border-[#404040] rounded-sm px-4 py-3 flex items-center justify-between">
                      <span className="text-[#f5f5dc] font-sans">{p.name}{p.id === playerId && " (나)"}{i === 0 && " 👑"}</span>
                    </div>
                  ))}
                  {Array.from({ length: needed - gameState.players.length }).map((_, i) => (
                    <div key={`e-${i}`} className="border border-dashed border-[#333] rounded-sm px-4 py-3 text-[#525252] text-sm font-sans">대기 중...</div>
                  ))}
                </div>
              </div>
              {isHost && (
                <div className="space-y-3">
                  {gameState.testMode && (
                    <div className="mystery-card rounded-sm p-3 border border-[#404040]">
                      <p className="text-[#f5c542] text-xs mb-2 font-sans">테스트 모드</p>
                      <div className="flex items-center gap-2">
                        <Input type="number" min={1} max={5} value={testBotCount} onChange={(e) => setTestBotCount(Math.max(1, Number(e.target.value || 1)))} className="bg-[#0a0a0a] border-[#404040] text-[#f5f5dc] w-24" />
                        <Button onClick={testAddBots} className="bg-[#1a1a1a] hover:bg-[#262626] border border-[#404040] text-[#f5f5dc]">봇 추가</Button>
                      </div>
                      <div className="mt-3 space-y-1">
                        {gameState.players.map((p) => (
                          <p key={p.id} className="text-xs text-[#a3a3a3] font-sans">
                            {p.name} → {p.roleName || "역할 미배정"}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {!canStart && <div className="bg-[#262626] border border-[#404040] rounded-sm p-3 text-[#a3a3a3] text-sm text-center font-sans">{needed}명의 플레이어가 모여야 시작할 수 있습니다</div>}
                  {error && <div className="bg-[#b91c1c]/20 border border-[#b91c1c] rounded-sm p-3 text-[#f87171] text-sm font-sans">{error}</div>}
                  <Button onClick={startGame} disabled={!canStart || loading} className="w-full bg-[#1a1a1a] hover:bg-[#262626] text-[#f5f5dc] py-5 text-base font-sans rounded-sm border border-[#404040] disabled:opacity-40">
                    {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />시작 중...</> : <><Play className="mr-2 h-5 w-5" />게임 시작</>}
                  </Button>
                </div>
              )}
              {!isHost && <div className="bg-[#262626] border border-[#404040] rounded-sm p-4 text-center text-[#d4d4d4] font-sans text-sm">방장이 게임을 시작하기를 기다리는 중...</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════ GAME ══════════════════ */
  if (screen === "game" && gameState && scenario) {
    const status = gameState.status;
    const readyList = gameState.readyPlayers[status] ?? [];
    const iAmReady = readyList.includes(playerId);
    const readyCount = readyList.length;
    const total = gameState.players.length;

    /* ── My Info + Cards side panel ── */
    const myCardsSorted = myCards.map(id => getCard(id)).filter(Boolean).sort((a, b) => a!.id - b!.id);

    const sidePanelJsx = (
      <div className={`
        fixed inset-y-0 right-0 z-40 bg-[#0a0a0a] border-l border-[#404040] flex flex-col transition-all duration-300
        w-[85vw] max-w-[20rem]
        sm:static sm:inset-auto sm:z-auto sm:shrink-0
        ${widePanel ? "sm:w-[40vw] sm:max-w-none" : "sm:w-80"}
      `}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#404040] shrink-0">
          <h3 className="font-sans text-sm text-[#f5f5dc] truncate">
            {currentRole?.name ? (
              <>
                <span className="font-bold">{currentRole.name}</span>
                {currentPlayer?.name && <span className="font-normal text-[#a3a3a3]"> {currentPlayer.name}</span>}
              </>
            ) : (
              "내 정보"
            )}
          </h3>
          <div className="flex items-center gap-1">
            <button onClick={() => setWidePanel(!widePanel)} className="hidden sm:block text-[#a3a3a3] hover:text-[#f5f5dc] p-0.5" aria-label={widePanel ? "좁게" : "넓게"}>
              {widePanel
                ? <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
                : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => { setShowCards(false); setWidePanel(false); }} className="text-[#a3a3a3] hover:text-[#f5f5dc] p-0.5" aria-label="패널 닫기"><EyeOff className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <div className="overflow-y-auto scrollbar-hide flex-1">
          {currentRole && (
            <div className="border-b border-[#404040]">
              <button onClick={() => setInfoOpen(!infoOpen)} className="w-full px-3 py-2 flex items-center justify-between text-xs text-[#a3a3a3] hover:text-[#f5f5dc] font-sans">
                <span>내 역할 정보</span>
                <ChevronLeft className={`w-3 h-3 transition-transform ${infoOpen ? "rotate-90" : "-rotate-90"}`} />
              </button>
              {infoOpen && (
                <div className="px-3 pb-3 space-y-2 text-[11px] font-sans">
                  <div className="rounded-[5px] bg-[#111] border border-[#333] p-2">
                    <p className="text-[9px] text-[#737373] uppercase tracking-wider mb-1">사건 개요</p>
                    <p className="text-[#d4d4d4] leading-relaxed whitespace-pre-line">{scenario.introText}</p>
                  </div>
                  <div className="rounded-[5px] bg-[#111] border border-[#333] p-2">
                    <p className="text-[9px] text-[#737373] uppercase tracking-wider mb-1">배경</p>
                    <p className="text-[#d4d4d4] leading-relaxed">{currentRole.background}</p>
                  </div>
                  <div className="rounded-[5px] bg-[#1a0a0a] border border-[#b91c1c]/30 p-2">
                    <p className="text-[9px] text-[#b91c1c] uppercase tracking-wider mb-1">비밀 (절대 공개 금지)</p>
                    <p className="text-[#f5a3a3] leading-relaxed italic">{currentRole.secret}</p>
                  </div>
                  <div className="rounded-[5px] bg-[#111] border border-[#333] p-2">
                    <p className="text-[9px] text-green-400 uppercase tracking-wider mb-1">승리 조건</p>
                    <p className="text-[#d4d4d4] leading-relaxed">{currentRole.winCondition}</p>
                  </div>
                  {currentRole.knownInfo.length > 0 && (
                    <div className="rounded-[5px] bg-[#111] border border-[#333] p-2">
                      <p className="text-[9px] text-[#a3a3a3] uppercase tracking-wider mb-1">알고 있는 정보</p>
                      <ul className="space-y-0.5">
                        {currentRole.knownInfo.map((info, i) => <li key={i} className="text-[#d4d4d4] leading-relaxed">· {info}</li>)}
                      </ul>
                    </div>
                  )}
                  {currentRole.timeline && currentRole.timeline.length > 0 && (
                    <div className="rounded-[5px] bg-[#0d1a0d] border border-[#2a4a2a] p-2">
                      <p className="text-[9px] text-[#6aaa6a] uppercase tracking-wider mb-1">나의 타임라인</p>
                      <ul className="space-y-1">
                        {currentRole.timeline.map((entry, i) => (
                          <li key={i} className="text-[#d4d4d4] leading-relaxed">
                            <span className="text-[#6aaa6a] font-mono mr-1">{entry.time}</span>{entry.activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {scenario.publicTimeline && scenario.publicTimeline.length > 0 && (
            <div className="border-b border-[#404040] p-2 space-y-1">
              <p className="text-[10px] text-[#a3a3a3] uppercase tracking-wider px-1 py-1 font-sans">사건 타임라인</p>
              {scenario.publicTimeline.map((entry, i) => (
                <div key={i} className="flex gap-2 px-1 text-[11px] font-sans">
                  <span className="text-[#737373] font-mono shrink-0">{entry.time}</span>
                  <span className="text-[#d4d4d4]">{entry.activity}</span>
                </div>
              ))}
            </div>
          )}

          {pastEvents.length > 0 && (
            <div className="border-b border-[#404040] p-2 space-y-1.5">
              <p className="text-[10px] text-[#f5c542] uppercase tracking-wider px-1 py-1 font-sans">중간 이벤트 ({pastEvents.length})</p>
              {pastEvents.map((evt, i) => (
                <div key={i} className="rounded-[5px] bg-[#1a1a0a] border border-[#f5c542]/20 p-2 text-xs font-sans">
                  <p className="text-[#f5c542] font-bold text-[11px] mb-0.5">{evt.title}</p>
                  <p className="text-[#d4d4d4] leading-relaxed">{evt.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="p-2 space-y-1.5">
            <p className="text-[10px] text-[#737373] uppercase tracking-wider px-1 py-1 font-sans">수집한 증거 ({myCards.length}장)</p>
            {myCardsSorted.length === 0 && (
              <p className="text-[11px] text-[#525252] italic px-1 font-sans">아직 카드가 없습니다</p>
            )}
            {myCardsSorted.map(card => {
              if (!card) return null;
              return (
                <div key={card.id} className={`rounded-[5px] p-2 text-xs font-sans ${card.type === "action" ? "bg-[#2a1a0a] border border-[#8b5e2a]/40 text-[#f5c542]" : "bg-[#1a1a1a] border border-[#404040] text-[#d4d4d4]"}`}>
                  <div className="flex items-start gap-1.5">
                    <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${card.type === "action" ? "bg-[#8b5e2a]/30 text-[#f5c542]" : "bg-[#404040]/50 text-[#a3a3a3]"}`}>
                      {card.id}
                    </span>
                    <span className="flex-1 leading-relaxed">
                      <strong className="block text-[#f5f5dc] mb-1">{getCardTitle(card)}</strong>
                      {card.content}
                    </span>
                  </div>
                  {card.unlocks && card.unlocks.length > 0 && (
                    <p className="text-[9px] text-[#737373] mt-1 pl-6">→ {card.unlocks.map(n => `${n}번`).join(", ")} 해금</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

    const sideToggleJsx = (
      <button
        onClick={() => setShowCards(true)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-[#1a1a1a] border border-r-0 border-[#404040] rounded-l-md px-1.5 py-3 flex flex-col items-center gap-1 text-[#a3a3a3] hover:text-[#f5f5dc] transition-all ${showCards ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        aria-label="내 정보 열기"
      >
        <Eye className="w-3.5 h-3.5" />
        <span className="text-[9px] font-sans writing-vertical">정보</span>
      </button>
    );

    const toastJsx = toast ? (
      <div key={toast} className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#b91c1c] text-[#f5f5dc] px-5 py-3 rounded-[5px] shadow-xl text-sm font-sans text-center animate-bounce-once max-w-[80%]">
        {toast}
      </div>
    ) : null;

    const gameLayout = (content: React.ReactNode) => (
      <div className="flex h-screen overflow-hidden relative">
        <div className="flex-1 min-w-0 overflow-y-auto transition-all duration-300">
          {content}
        </div>
        {showCards && (
          <>
            <div className="fixed inset-0 z-30 bg-black/60 sm:hidden" onClick={() => { setShowCards(false); setWidePanel(false); }} />
            {sidePanelJsx}
          </>
        )}
        {!showCards && sideToggleJsx}
        {toastJsx}
      </div>
    );

    const sharedReadyPanel = (label: string) => (
      <div className="mystery-card rounded-sm p-4 sm:p-6">
        {iAmReady ? (
          <div className="text-center"><p className="text-[#f5f5dc] font-sans mb-2">{label} 완료! 다른 플레이어를 기다리는 중...</p><p className="text-[#737373] text-sm font-sans">{readyCount} / {total} 준비 완료</p></div>
        ) : (
          <div><Button onClick={sendReady} className="w-full bg-[#1a1a1a] hover:bg-[#262626] text-[#f5f5dc] py-5 text-base font-sans rounded-sm border border-[#404040]"><Check className="mr-2 h-5 w-5" />{label} 완료</Button>
            {readyCount > 0 && <p className="text-[#737373] text-sm text-center mt-3 font-sans">{readyCount} / {total} 준비 완료</p>}
          </div>
        )}
      </div>
    );

    /* ── Stage setup / cast / role / script / incident ── */
    if (status === "stage_setup") {
      return (
        <div className="min-h-screen bg-[#0d0d0d] px-4 py-6 sm:p-6 mystery-spotlight pb-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#b91c1c] mb-6 text-center">{scenario.title} · 공개 무대 설정</h1>
            <div className="mystery-card rounded-sm p-4 sm:p-6 mb-4">
              <div className="text-[#737373] text-xs uppercase tracking-wider mb-3 font-sans">공통 배경</div>
              {scenario.stageSetting ? (
                <div className="space-y-2 text-sm font-sans text-[#d4d4d4]">
                  <p><span className="text-[#a3a3a3]">시대</span> {scenario.stageSetting.era}</p>
                  <p><span className="text-[#a3a3a3]">장소</span> {scenario.stageSetting.place}</p>
                  <p><span className="text-[#a3a3a3]">피해자</span> {scenario.stageSetting.victim}</p>
                  {scenario.stageSetting.context.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              ) : (
                <p className="text-[#f5f5dc] leading-relaxed font-display whitespace-pre-line">{scenario.introText}</p>
              )}
            </div>
            {sharedReadyPanel("무대 설정 확인")}
          </div>
        </div>
      );
    }

    if (status === "role_select") {
      const myRoleId = currentPlayer?.roleId ?? "";
      const selectedMap = new Map(gameState.players.filter((p) => p.roleId).map((p) => [p.roleId, p.name]));
      const selectedCount = gameState.players.filter((p) => p.roleId).length;
      const totalCount = gameState.players.length;

      return (
        <div className="min-h-screen bg-[#0d0d0d] px-4 py-6 sm:p-6 mystery-spotlight pb-20">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#b91c1c] mb-3 text-center">역할 선택</h1>
            <p className="text-[#a3a3a3] text-sm text-center font-sans mb-6">
              아래 목록을 보고 역할을 선택해주세요. 비밀 정보는 선택 후 공개됩니다.
            </p>
            <div className={`grid ${scenario.roles.length >= 5 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"} gap-3 mb-4`}>
              {scenario.roles.map((role) => {
                const pickedBy = selectedMap.get(role.id);
                const mine = myRoleId === role.id;
                const locked = Boolean(pickedBy && !mine);
                const avatar = role.portraitUrl ?? `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(role.id)}`;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      if (locked) {
                        if (typeof window !== "undefined") window.alert(`${pickedBy}님이 이미 선택한 역할입니다.`);
                        return;
                      }
                      selectRole(role.id);
                    }}
                    className={`mystery-card rounded-sm p-4 text-left border transition-all ${
                      mine
                        ? "border-[#b91c1c] bg-[#2a1212]"
                        : locked
                          ? "border-[#333] bg-[#111] opacity-60 cursor-not-allowed"
                          : "border-[#404040] hover:border-[#b91c1c]/60 hover:bg-[#1f1515]"
                    }`}
                  >
                    <div className="w-full aspect-[3/4] rounded-sm border border-[#333] mb-3 bg-[#0d0d0d] overflow-hidden">
                      <img
                        src={avatar}
                        alt={`${role.name} 이미지`}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <p className="text-[#f5f5dc] font-sans font-semibold">{role.name}({role.age ? `${role.age}세` : "나이 비공개"})</p>
                    {pickedBy && <p className="text-xs mt-2 text-[#f5c542] font-sans">선택자: {mine ? "나" : pickedBy}</p>}
                  </button>
                );
              })}
            </div>
            <div className="mystery-card rounded-sm p-4 text-center">
              <p className="text-[#d4d4d4] text-sm font-sans">선택 완료: {selectedCount} / {totalCount}</p>
              {myRoleId ? (
                <p className="text-[#f5c542] text-sm mt-2 font-sans">선택 완료. 다른 플레이어를 기다리는 중...</p>
              ) : (
                <p className="text-[#737373] text-sm mt-2 font-sans">원하는 역할을 선택해주세요.</p>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Button onClick={selectRandomRole} className="bg-[#1a1a1a] hover:bg-[#262626] border border-[#404040] text-[#f5f5dc]">
                  랜덤 선택
                </Button>
                <Button
                  onClick={confirmRoleSelection}
                  disabled={selectedCount !== totalCount}
                  className="bg-[#1a1a1a] hover:bg-[#262626] border border-[#404040] text-[#f5f5dc] disabled:opacity-40"
                >
                  다음 단계로
                </Button>
              </div>
            </div>
            <div className="mystery-card rounded-sm p-4 mt-3">
              <p className="text-[#a3a3a3] text-xs uppercase tracking-wider mb-2 font-sans">선택 현황</p>
              <div className="space-y-1">
                {scenario.roles.map((role) => {
                  const pickedBy = selectedMap.get(role.id);
                  return (
                    <p key={`pick-${role.id}`} className="text-sm font-sans text-[#d4d4d4]">
                      {role.name}: {pickedBy ?? "미선택"}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (status === "cast_intro" && currentRole) {
      return (
        <div className="min-h-screen bg-[#0d0d0d] px-4 py-6 sm:p-6 mystery-spotlight pb-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#b91c1c] mb-6 text-center">공개 등장인물 소개</h1>
            <div className="mystery-card rounded-sm p-4 sm:p-6 mb-4">
              <p className="text-[#f5c542] text-sm font-sans mb-3">
                지금은 각자 자신의 공개 정보만 보고, 직접 말로 30~60초 소개해 주세요.
              </p>
              <div className="border border-[#404040] rounded-sm p-4">
                <h3 className="font-sans text-lg text-[#f5f5dc] mb-2">{currentRole.name}</h3>
                <p className="text-[#a3a3a3] text-sm">{[currentRole.age ? `${currentRole.age}세` : "", currentRole.occupation ?? ""].filter(Boolean).join(" · ")}</p>
                {currentRole.profile && currentRole.profile.split("\n").map((p, i) => <p key={i} className="text-[#d4d4d4] text-sm mt-2">{p}</p>)}
                <p className="text-[#f5c542] text-sm mt-2">의심 요소: {currentRole.publicSuspicion ?? "-"}</p>
                {currentRole.signatureLine && <p className="text-[#f5f5dc] text-sm italic mt-2">"{currentRole.signatureLine}"</p>}
              </div>
            </div>
            {sharedReadyPanel("자기 소개")}
          </div>
        </div>
      );
    }

    if (status === "role_brief" && currentRole) {
      return (
        <div className="min-h-screen bg-[#0d0d0d] px-4 py-6 sm:p-6 mystery-spotlight pb-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#b91c1c] mb-6 text-center">개인 설정 숙지</h1>
            <div className="mystery-card rounded-sm p-4 sm:p-6 mb-4 relative border-l-2 border-l-[#b91c1c]">
              <h3 className="font-sans text-lg font-bold text-[#b91c1c] mb-3">당신의 역할: {currentRole.name}</h3>
              <div className="space-y-3 text-sm font-sans">
                <div><span className="text-[#a3a3a3] text-xs uppercase tracking-wider">배경</span><p className="text-[#f5f5dc] mt-1">{currentRole.background}</p></div>
                <div className="pt-3 border-t border-[#404040]"><span className="text-[#b91c1c] text-xs uppercase tracking-wider">비밀 (절대 공개 금지)</span><p className="text-[#f5f5dc] mt-1 italic">{currentRole.secret}</p></div>
                <div className="pt-3 border-t border-[#404040]"><span className="text-green-400 text-xs uppercase tracking-wider">승리 조건</span><p className="text-[#f5f5dc] mt-1">{currentRole.winCondition}</p></div>
                {currentRole.knownInfo.length > 0 && (
                  <div className="pt-3 border-t border-[#404040]">
                    <span className="text-[#a3a3a3] text-xs uppercase tracking-wider">당신이 아는 정보</span>
                    <ul className="mt-1 space-y-1">{currentRole.knownInfo.map((info, i) => <li key={i} className="text-[#d4d4d4]">· {info}</li>)}</ul>
                  </div>
                )}
                {currentRole.timeline && currentRole.timeline.length > 0 && (
                  <div className="pt-3 border-t border-[#404040]">
                    <span className="text-[#6aaa6a] text-xs uppercase tracking-wider">나의 타임라인</span>
                    <ul className="mt-2 space-y-1.5">
                      {currentRole.timeline.map((entry, i) => (
                        <li key={i} className="text-sm">
                          <span className="text-[#6aaa6a] font-mono mr-2">{entry.time}</span>
                          <span className="text-[#d4d4d4]">{entry.activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            {sharedReadyPanel("개인 설정 숙지")}
          </div>
        </div>
      );
    }

    if (status === "incident") {
      return (
        <div className="min-h-screen bg-[#0d0d0d] px-4 py-6 sm:p-6 mystery-spotlight pb-20 overflow-x-hidden">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#b91c1c] mb-6 text-center">사건 발생 장면</h1>
            <div className="mystery-card rounded-sm p-4 sm:p-6 mb-4">
              {scenario.incidentImageUrl && (
                <img
                  src={scenario.incidentImageUrl}
                  alt={`${scenario.title} 사건 장면`}
                  className="block w-full h-auto rounded-sm border border-[#404040] bg-[#0d0d0d] mb-4"
                />
              )}
              <p className="text-[#f5f5dc] leading-relaxed whitespace-pre-line">{scenario.incidentScene ?? scenario.introText}</p>
            </div>
            {scenario.investigationTargets && scenario.investigationTargets.length > 0 && (
              <div className="mystery-card rounded-sm p-4 sm:p-6 mb-4">
                <div className="text-[#a3a3a3] text-xs uppercase tracking-wider mb-2 font-sans">조사 대상</div>
                <div className="space-y-2">
                  {scenario.investigationTargets.map((t) => (
                    <div key={`${t.name}-${t.location ?? ""}`} className="border border-[#404040] rounded-sm p-3">
                      <p className="text-[#f5f5dc] font-sans">{t.name}{t.location ? ` · ${t.location}` : ""}</p>
                      <p className="text-[#a3a3a3] text-sm">{t.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sharedReadyPanel("사건 장면 확인")}
          </div>
        </div>
      );
    }

    /* ── INVESTIGATION ── */
    if (status === "card_pick") {
      const turnPlayer = gameState.players[gameState.currentTurnIndex % total];
      const isMyTurn = turnPlayer?.id === playerId;
      const availableSet = new Set(gameState.availableCards);
      const inHandSet = new Set(Object.values(gameState.playerHands).flat());
      const allCardsSorted = [...(scenario.hintCards ?? [])].sort((a, b) => a.id - b.id);
      const pickableCount = gameState.availableCards.length;
      const locations = scenario.locations ?? [];
      const cardsByLocation = locations.length > 0
        ? locations.map(loc => ({ location: loc, cards: allCardsSorted.filter(c => c.location === loc) }))
        : [{ location: "" as const, cards: allCardsSorted }];
      const totalRounds = Math.max(1, Math.ceil((scenario.hintCards?.length ?? 0) / Math.max(1, total)));
      const mapPoints = scenario.mapPoints ?? [];
      const hasMapPoints = mapPoints.length > 0;
      const safeSelectedMapPointId = hasMapPoints && mapPoints.some((p) => p.id === selectedMapPointId) ? selectedMapPointId : "all";
      const mapFilteredCards = hasMapPoints
        ? allCardsSorted.filter((c) => (safeSelectedMapPointId === "all" ? true : c.mapPointId === safeSelectedMapPointId))
        : allCardsSorted;

      const renderCard = (card: HintCard) => {
        const isAvailable = availableSet.has(card.id);
        const isTaken = inHandSet.has(card.id);
        const isLocked = !isAvailable && !isTaken;
        const canPick = isMyTurn && isAvailable;
        const isNewlyUnlocked = justUnlocked.has(card.id);
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => canPick && pickCard(card.id)}
            disabled={!canPick}
            className={`aspect-[3/4] rounded-[5px] border-2 flex flex-col items-center justify-center gap-1 font-sans transition-all ${isNewlyUnlocked ? "animate-card-unlock" : ""} ${
              isTaken
                ? "border-[#333] bg-[#0a0a0a] opacity-50 cursor-default"
                : isLocked
                  ? "border-[#2a2a2a] bg-[#0d0d0d] cursor-not-allowed opacity-40"
                  : canPick
                    ? "border-[#b91c1c]/50 bg-[#1a1a1a] hover:bg-[#2a1a1a] hover:border-[#b91c1c] cursor-pointer hover:scale-105"
                    : "border-[#333] bg-[#111] cursor-not-allowed opacity-60"
            }`}
          >
            <span className={`font-mono text-xl sm:text-2xl font-bold ${isLocked ? "text-[#525252]" : isTaken ? "text-[#404040]" : "text-[#b91c1c]"}`}>
              {card.id}
            </span>
            <span className={`text-[10px] px-1 text-center leading-tight ${isLocked ? "text-[#525252]" : "text-[#d4d4d4]"}`}>
              {getCardTitle(card)}
            </span>
            {isLocked && <Lock className="w-3 h-3 text-[#525252]" />}
            {isTaken && <span className="text-[9px] text-[#404040] font-sans">선택됨</span>}
          </button>
        );
      };

      return gameLayout(
          <div className="min-h-screen bg-[#0d0d0d] px-4 py-6 sm:p-6 mystery-spotlight">
            <div className="max-w-3xl mx-auto">
              {gameState.testMode && (
                <div className="mystery-card rounded-sm p-3 mb-3 border border-[#404040]">
                  <p className="text-[#f5c542] text-xs mb-2 font-sans">테스트 컨트롤</p>
                  <div className="flex items-center gap-2">
                    <Input type="number" min={1} value={testJumpRound} onChange={(e) => setTestJumpRound(Math.max(1, Number(e.target.value || 1)))} className="bg-[#0a0a0a] border-[#404040] text-[#f5f5dc] w-24" />
                    <span className="text-sm text-[#a3a3a3] font-sans">/{totalRounds}</span>
                    <Button onClick={testJumpToRound} className="bg-[#1a1a1a] hover:bg-[#262626] border border-[#404040] text-[#f5f5dc]">라운드 점프</Button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#b91c1c]">라운드 {gameState.currentRound} — 조사 장면</h2>
                <span className="text-[#a3a3a3] text-sm font-sans">조사 가능: {pickableCount}개</span>
              </div>
              <div className="mystery-card rounded-sm p-4 sm:p-6 mb-4 text-center">
                <p className={`font-sans text-lg ${isMyTurn ? "text-[#f5c542]" : "text-[#a3a3a3]"}`}>
                  {isMyTurn ? "당신의 턴입니다. 조사할 대상을 선택하세요." : `${turnPlayer?.roleName || turnPlayer?.name}님이 조사 중...`}
                </p>
                <p className="text-[#737373] text-sm font-sans mt-2">1인당 1회 조사 · {gameState.cardsPickedThisRound}/{total} 완료</p>
              </div>
              {hasMapPoints && (
                <div className="mystery-card rounded-sm p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[#a3a3a3] text-xs uppercase tracking-wider font-sans">조사 약식도</p>
                    <button
                      type="button"
                      onClick={() => setSelectedMapPointId("all")}
                      className={`text-xs px-2 py-1 rounded border font-sans ${
                        safeSelectedMapPointId === "all"
                          ? "text-[#f5c542] border-[#f5c542]/60 bg-[#2a230f]"
                          : "text-[#a3a3a3] border-[#404040] hover:text-[#f5f5dc]"
                      }`}
                    >
                      전체 보기
                    </button>
                  </div>
                  <div className={`relative w-full rounded-sm border border-[#404040] bg-[#131313] overflow-hidden ${scenario.mapImageUrl ? "aspect-[3/2]" : "aspect-video"}`}>
                    {scenario.mapImageUrl ? (
                      <>
                        <img
                          src={scenario.mapImageUrl}
                          alt={`${scenario.title} 조사 지도`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/25" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(185,28,28,0.18),transparent_35%),radial-gradient(circle_at_70%_65%,rgba(245,197,66,0.12),transparent_40%)]" />
                    )}
                    {mapPoints.map((point) => {
                      const totalByPoint = allCardsSorted.filter((c) => c.mapPointId === point.id).length;
                      const availableByPoint = allCardsSorted.filter((c) => c.mapPointId === point.id && availableSet.has(c.id)).length;
                      return (
                        <button
                          key={point.id}
                          type="button"
                          onClick={() => setSelectedMapPointId(point.id)}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-sm border text-[11px] font-sans whitespace-nowrap transition-all shadow-lg ${
                            safeSelectedMapPointId === point.id
                              ? "border-[#f5c542] bg-[#2a230f]/95 text-[#f5c542]"
                              : "border-[#404040] bg-[#1a1a1a]/90 text-[#f5f5dc] hover:border-[#b91c1c]/60"
                          }`}
                          style={{ left: `${point.x}%`, top: `${point.y}%` }}
                        >
                          {point.name} ({availableByPoint}/{totalByPoint})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {hasMapPoints ? (
                  <div>
                    <h3 className="font-sans text-sm font-bold text-[#a3a3a3] uppercase tracking-wider mb-2">
                      {safeSelectedMapPointId === "all" ? "전체 단서" : mapPoints.find((p) => p.id === safeSelectedMapPointId)?.name ?? "선택 위치"}
                    </h3>
                    {mapFilteredCards.length === 0 ? (
                      <p className="text-[#737373] text-sm font-sans">해당 위치에 매핑된 단서가 없습니다.</p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
                        {mapFilteredCards.map((card) => renderCard(card))}
                      </div>
                    )}
                  </div>
                ) : (
                  cardsByLocation.map(({ location, cards }) => (
                    <div key={location || "all"}>
                      {location && (
                        <h3 className="font-sans text-sm font-bold text-[#a3a3a3] uppercase tracking-wider mb-2">{location}</h3>
                      )}
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
                        {cards.map(card => renderCard(card))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Activity log — newest on top, scrollable */}
              {(() => {
                const sysMessages = gameState.chat.filter(m => m.playerId === "__system__");
                if (sysMessages.length === 0) return null;
                return (
                  <div className="mt-4 mystery-card rounded-sm p-3 flex flex-col max-h-80 min-h-0">
                    <p className="text-[9px] text-[#737373] uppercase tracking-wider mb-2 font-sans shrink-0 bg-[#141414]">활동 로그 ({sysMessages.length})</p>
                    <div className="space-y-1 overflow-y-auto min-h-0 flex-1 pr-1">
                      {[...sysMessages].reverse().map((msg, i) => (
                        <p key={i} className={`text-xs font-sans ${msg.text.includes("새로 등장") ? "text-[#f5c542]" : "text-[#a3a3a3]"}`}>
                          {msg.text}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
      );
    }

    /* ── DISCUSSION ── */
    if (status === "discussion") {
      const mm = Math.floor(countdown / 60);
      const ss = countdown % 60;
      return gameLayout(
          <div className="h-screen bg-[#0d0d0d] flex flex-col mystery-spotlight">
            <div className="px-4 py-3 border-b border-[#404040] flex items-center justify-between bg-[#111] shrink-0">
              <h2 className="font-sans text-lg font-bold text-[#ffffff]">라운드 {gameState.currentRound} — 토론</h2>
              <div className={`font-mono text-lg ${countdown <= 30 ? "text-[#b91c1c] animate-pulse" : "text-[#f5f5dc]"}`}>
                {mm}:{ss.toString().padStart(2, "0")}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 space-y-2 pb-20">
              {gameState.chat.map((msg, i) => {
                if (msg.playerId === "__system__") {
                  return (
                    <div key={i} className="flex justify-center">
                      <p className={`text-[11px] font-sans px-3 py-1 rounded-full ${msg.text.includes("새로 등장") ? "text-[#f5c542] bg-[#f5c542]/10" : "text-[#737373] bg-[#1a1a1a]"}`}>{msg.text}</p>
                    </div>
                  );
                }
                const isMe = msg.playerId === playerId;
                const displayName = msg.playerName ?? gameState.players.find(p => p.id === msg.playerId)?.name;
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-sm px-3 py-2 ${isMe ? "bg-[#b91c1c]/20 border border-[#b91c1c]/30" : "bg-[#1a1a1a] border border-[#404040]"}`}>
                      <p className="text-xs mb-1 font-sans">
                        <span className="font-bold text-[#f5f5dc]">{msg.roleName}</span>
                        {displayName && <span className="font-normal text-[#a3a3a3]"> {displayName}</span>}
                      </p>
                      <p className="text-[#f5f5dc] text-sm font-sans">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div className="shrink-0 bg-[#111] border-t border-[#404040] px-4 py-3 flex gap-2">
              <input ref={chatInputRef} placeholder="메시지를 입력하세요..." className="bg-[#0a0a0a] border border-[#404040] text-[#f5f5dc] placeholder:text-[#737373] rounded-sm flex-1 px-3 py-2 text-sm font-sans outline-none focus:border-[#b91c1c] transition-colors" onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) sendChat(); }} />
              <Button onClick={sendChat} className="bg-[#1a1a1a] hover:bg-[#262626] text-[#f5f5dc] rounded-sm px-3 border border-[#404040]"><Send className="w-4 h-4" /></Button>
            </div>
          </div>
      );
    }

    /* ── EVENT ── */
    if (status === "event" && gameState.currentEvent) {
      return gameLayout(
          <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4 py-8 sm:p-6 mystery-spotlight">
            <div className="max-w-2xl w-full">
              <div className="mystery-card rounded-sm p-5 sm:p-8 relative border-l-2 border-l-[#f5c542]">
                <div className="text-[#f5c542] text-xs uppercase tracking-wider mb-2 font-sans">중간 이벤트</div>
                <h3 className="font-sans text-xl sm:text-2xl font-bold text-[#f5f5dc] mb-4">{gameState.currentEvent.title}</h3>
                <p className="text-[#d4d4d4] leading-relaxed font-sans">{gameState.currentEvent.text}</p>
              </div>
              <div className="mystery-card rounded-sm p-4 sm:p-6 mt-4">
                {iAmReady ? (
                  <div className="text-center"><p className="text-[#f5f5dc] font-sans mb-2">확인 완료!</p><p className="text-[#737373] text-sm font-sans">{readyCount} / {total} 확인 완료</p></div>
                ) : (
                  <div><Button onClick={sendReady} className="w-full bg-[#1a1a1a] hover:bg-[#262626] text-[#f5f5dc] py-5 text-base font-sans rounded-sm border border-[#404040]"><Check className="mr-2 h-5 w-5" />확인</Button>
                    {readyCount > 0 && <p className="text-[#737373] text-sm text-center mt-3 font-sans">{readyCount} / {total} 확인 완료</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
      );
    }

    if (status === "insight") {
      const ownedByPlayer = gameState.players.map((p) => ({
        player: p,
        cards: (gameState.playerHands[p.id] ?? [])
          .map((id) => getCard(id))
          .filter(Boolean) as HintCard[],
      }));
      const unresolvedCount = scenario.hintCards.length - Object.values(gameState.playerHands).flat().length;

      return gameLayout(
        <div className="min-h-screen bg-[#0d0d0d] px-4 py-6 sm:p-6 mystery-spotlight">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-[#f5f5dc] mb-2 text-center">통찰 장면</h2>
            <p className="text-[#a3a3a3] text-sm text-center font-sans mb-6">카드 제목/장소를 정리하고 최종 추리 전 마지막 토론을 진행하세요.</p>
            <div className="space-y-3 mb-4">
              {ownedByPlayer.map(({ player, cards }) => (
                <div key={player.id} className="mystery-card rounded-sm p-4">
                  <p className="text-[#f5f5dc] font-sans mb-2">{player.roleName || player.name} · {cards.length}장</p>
                  <div className="flex flex-wrap gap-2">
                    {cards.map((card) => (
                      <span key={card.id} className="text-xs px-2 py-1 rounded border border-[#404040] text-[#d4d4d4]">
                        {card.location ? `[${card.location}] ` : ""}{getCardTitle(card)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mystery-card rounded-sm p-4 mb-4 text-sm text-[#a3a3a3]">
              <p>미조사 카드 수: {Math.max(0, unresolvedCount)}장</p>
              <p>발생 이벤트 수: {pastEvents.length}개</p>
            </div>
            {sharedReadyPanel("통찰 정리")}
          </div>
        </div>
      );
    }

    /* ── FINAL VOTE ── */
    if (status === "final_vote") {
      const hasVoted = !!gameState.finalVotes[playerId];
      const votedCount = Object.keys(gameState.finalVotes).length;

      return gameLayout(
          <div className="min-h-screen bg-[#0d0d0d] px-4 py-6 sm:p-6 mystery-spotlight">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-sans text-2xl sm:text-3xl font-bold text-[#b91c1c] mb-2 text-center">최종 추리</h2>
              <p className="text-[#a3a3a3] text-sm text-center font-sans mb-6">각 인물에 대해 알아낸 것을 자유롭게 적어보세요</p>
              {hasVoted ? (
                <div className="mystery-card rounded-sm p-6 text-center">
                  <p className="text-[#f5f5dc] font-sans mb-2">추리 제출 완료! 다른 플레이어를 기다리는 중...</p>
                  <p className="text-[#737373] text-sm font-sans">{votedCount} / {total} 제출 완료</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mystery-card rounded-sm p-4 sm:p-5 space-y-3">
                    <div>
                      <label className="block font-sans text-sm text-[#f5f5dc] mb-2">범인</label>
                      <Input value={voteNotes.accused ?? ""} onChange={e => setVoteNotes(prev => ({ ...prev, accused: e.target.value }))} placeholder="누가 범인이라고 생각하나요?" className="bg-[#1a1a1a] border-[#404040] text-[#f5f5dc]" />
                    </div>
                    <div>
                      <label className="block font-sans text-sm text-[#f5f5dc] mb-2">범행 동기</label>
                      <textarea value={voteNotes.motive ?? ""} onChange={e => setVoteNotes(prev => ({ ...prev, motive: e.target.value }))} rows={2} className="w-full bg-[#1a1a1a] border border-[#404040] rounded-sm px-3 py-2 text-[#d4d4d4] text-sm" />
                    </div>
                    <div>
                      <label className="block font-sans text-sm text-[#f5f5dc] mb-2">범행 수법</label>
                      <textarea value={voteNotes.method ?? ""} onChange={e => setVoteNotes(prev => ({ ...prev, method: e.target.value }))} rows={2} className="w-full bg-[#1a1a1a] border border-[#404040] rounded-sm px-3 py-2 text-[#d4d4d4] text-sm" />
                    </div>
                    <div>
                      <label className="block font-sans text-sm text-[#f5f5dc] mb-2">핵심 시간대</label>
                      <Input value={voteNotes.timeline ?? ""} onChange={e => setVoteNotes(prev => ({ ...prev, timeline: e.target.value }))} placeholder="예: 22:00~22:20" className="bg-[#1a1a1a] border-[#404040] text-[#f5f5dc]" />
                    </div>
                  </div>
                  {gameState.players.filter((p) => p.id !== playerId).map(p => (
                    <div key={p.id} className="mystery-card rounded-sm p-4 sm:p-5">
                      <label className="block font-sans text-sm text-[#f5f5dc] mb-2">{p.roleName}의 비밀 지목</label>
                      <textarea
                        value={voteNotes[`secret_${p.roleId}`] ?? ""}
                        onChange={e => setVoteNotes(prev => ({ ...prev, [`secret_${p.roleId}`]: e.target.value }))}
                        placeholder="알아낸 비밀이 있다면 적어주세요"
                        rows={2}
                        className="w-full bg-[#1a1a1a] border border-[#404040] rounded-sm px-3 py-2 text-[#d4d4d4] font-sans text-sm resize-none focus:outline-none focus:border-[#b91c1c] placeholder:text-[#525252]"
                      />
                    </div>
                  ))}
                  <div className="mystery-card rounded-sm p-4 sm:p-5">
                    <label className="block font-sans text-sm text-[#f5f5dc] mb-2">내 개인 목표 달성 여부</label>
                    <textarea value={voteNotes.personalGoal ?? ""} onChange={e => setVoteNotes(prev => ({ ...prev, personalGoal: e.target.value }))} rows={2} className="w-full bg-[#1a1a1a] border border-[#404040] rounded-sm px-3 py-2 text-[#d4d4d4] text-sm" />
                  </div>
                  {error && <div className="bg-[#b91c1c]/20 border border-[#b91c1c] rounded-sm p-3 text-[#f87171] text-sm font-sans">{error}</div>}
                  <Button onClick={sendVote} disabled={loading} className="w-full bg-[#1a1a1a] hover:bg-[#262626] text-[#f5f5dc] py-5 text-base font-sans rounded-sm border border-[#404040]">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />제출 중...</> : "최종 추리 제출"}
                  </Button>
                </div>
              )}
            </div>
          </div>
      );
    }

    /* ── RESULT ── */
    if (status === "result") {
      const truth = scenario.truth;
      const murderer = gameState.players.find(p => p.roleId === truth.killerId);
      const nonKillerVotes = Object.values(gameState.finalVotes).filter(Boolean);
      const accusedCount = nonKillerVotes.reduce((acc, note) => {
        const key = (note.accused ?? "").trim();
        if (!key) return acc;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return (
        <div className="min-h-screen bg-[#0d0d0d] px-4 py-6 sm:p-6 mystery-spotlight">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-[#f5f5dc] mb-6 text-center">진상 공개</h2>
            <div className="mystery-card rounded-sm p-5 sm:p-6 mb-4">
              <h3 className="font-sans text-[#f5f5dc] mb-2">1. 최종 지목 집계</h3>
              {Object.entries(accusedCount).length === 0 ? (
                <p className="text-[#737373] text-sm">지목 데이터 없음</p>
              ) : (
                <div className="space-y-1">
                  {Object.entries(accusedCount).map(([name, count]) => (
                    <p key={name} className="text-sm text-[#d4d4d4]">{name}: {count}표</p>
                  ))}
                </div>
              )}
            </div>
            <div className="mystery-card rounded-sm p-5 sm:p-6 mb-4 border-l-2 border-l-[#404040]">
              {truth.narrativeStory ? (
                <div className="mb-4">
                  <div className="text-[#f5f5dc] leading-relaxed font-display text-sm sm:text-base space-y-4">
                    {truth.narrativeStory.split(/\n\n+/).map((para, i) => (
                      <p key={i} className="mb-0">{para.trim()}</p>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#404040] space-y-2 text-sm font-sans text-[#a3a3a3]">
                    <p><span className="text-[#f5f5dc] font-medium">범인</span> {murderer?.roleName}</p>
                    <p><span className="text-[#f5f5dc] font-medium">동기</span> {truth.motive}</p>
                    <p><span className="text-[#f5f5dc] font-medium">방법</span> {truth.method}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm font-sans">
                  <div><span className="text-[#f5f5dc] text-xs uppercase tracking-wider">범인</span><p className="text-[#f5f5dc] text-lg font-sans mt-1">{murderer?.roleName}</p></div>
                  <div className="pt-3 border-t border-[#404040]"><span className="text-[#f5f5dc] text-xs uppercase tracking-wider">동기</span><p className="text-[#f5f5dc] mt-1">{truth.motive}</p></div>
                  <div className="pt-3 border-t border-[#404040]"><span className="text-[#f5f5dc] text-xs uppercase tracking-wider">방법</span><p className="text-[#f5f5dc] mt-1">{truth.method}</p></div>
                </div>
              )}
            </div>
            <h3 className="font-sans text-lg text-[#f5f5dc] mb-3">추리 공개</h3>
            <div className="space-y-3 mb-6">
              {gameState.players.map(p => {
                const notes = gameState.finalVotes[p.id];
                const isMe = p.id === playerId;
                return (
                  <div key={p.id} className={`rounded-sm p-4 border ${isMe ? "border-[#b91c1c]/50" : "border-[#404040]"} bg-[#141414]`}>
                    <p className="text-[#f5f5dc] font-sans text-sm mb-2">{p.roleName}{isMe && " (나)"}</p>
                    {notes && Object.keys(notes).length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-sm text-[#a3a3a3]">범인: {notes.accused || "-"}</p>
                        <p className="text-sm text-[#a3a3a3]">동기: {notes.motive || "-"}</p>
                        <p className="text-sm text-[#a3a3a3]">수법: {notes.method || "-"}</p>
                        <p className="text-sm text-[#a3a3a3]">시간대: {notes.timeline || "-"}</p>
                        <p className="text-sm text-[#a3a3a3]">개인 목표: {notes.personalGoal || "-"}</p>
                        {Object.entries(notes)
                          .filter(([k, v]) => k.startsWith("secret_") && Boolean(v))
                          .map(([k, v]) => (
                            <p key={k} className="text-sm text-[#a3a3a3]">비밀 지목: {String(v)}</p>
                          ))}
                      </div>
                    ) : (
                      <p className="text-[#525252] text-sm font-sans">추리 미제출</p>
                    )}
                  </div>
                );
              })}
            </div>
            <Button onClick={resetGame} className="w-full bg-[#1a1a1a] hover:bg-[#262626] text-[#f5f5dc] py-5 text-base font-sans rounded-sm border border-[#404040]">메인 화면으로</Button>
          </div>
        </div>
      );
    }

    // fallback: waiting for state
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center mystery-spotlight">
        <Loader2 className="w-8 h-8 text-[#b91c1c] animate-spin" />
      </div>
    );
  }

  return null;
}
