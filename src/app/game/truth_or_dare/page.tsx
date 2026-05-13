"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session, Player, Submission, GameMode } from "@/types";
import { GAME_MODES } from "@/types";
import { 
  Crown, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  RotateCcw, 
  X, 
  TrendingUp, 
  Flame,
  RefreshCw,
  MessageCircle,
  Zap,
  Hash,
  Users,
  Star
} from "lucide-react";

type Phase = "spin" | "reveal";

interface CurrentTurn {
  player:     Player;
  submission: Submission;
  type:       "truth" | "dare";
}

// Bottle Icon
function BottleIcon({ spinning, isClickable }: { spinning: boolean; isClickable: boolean }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className="w-20 h-20 select-none"
      style={{
        filter: spinning ? "drop-shadow(0 0 16px #ff2d78)" : isClickable ? "drop-shadow(0 0 6px rgba(255,45,120,0.5))" : "none"
      }}
    >
      <rect x="35" y="40" width="30" height="45" rx="4" fill="#2a2a3e" stroke="#ff2d78" strokeWidth="1.5"/>
      <rect x="42" y="20" width="16" height="20" rx="2" fill="#2a2a3e" stroke="#ff2d78" strokeWidth="1.5"/>
      <rect x="40" y="15" width="20" height="6" rx="2" fill="#ff2d78"/>
      <rect x="37" y="55" width="26" height="28" rx="3" fill="#ff2d78" opacity="0.3"/>
      <rect x="40" y="58" width="20" height="12" rx="1" fill="#ff2d78" opacity="0.8"/>
      <text x="50" y="66" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">🍾</text>
    </svg>
  );
}

function StageIcon({ stageKey }: { stageKey: string }) {
  const icons: Record<string, React.ReactNode> = {
    starting: <Sparkles size={16} />,
    warmup: <Users size={16} />,
    spicy: <Flame size={16} />,
    wild: <Star size={16} />,
    extreme: <AlertCircle size={16} />
  };
  return icons[stageKey] || <Hash size={16} />;
}

function CardRevealModal({ turn, onDone, onRespin, isHost, onClose, currentStage }: {
  turn: CurrentTurn;
  onDone: () => void;
  onRespin: () => void;
  isHost: boolean;
  onClose: () => void;
  currentStage?: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const isTruth = turn.type === "truth";
  const color   = isTruth ? "#00f5ff" : "#ff2d78";
  const bgColor  = isTruth ? "rgba(0,245,255,0.05)" : "rgba(255,45,120,0.05)";

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md mx-4">
        {!isHost && (
          <button 
            onClick={onClose}
            className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        )}
        
        <div className="w-full flex flex-col items-center gap-5">
          {currentStage && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm">
              <StageIcon stageKey={currentStage} />
              <span className="text-xs uppercase tracking-wider">{currentStage}</span>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs opacity-40 uppercase tracking-widest mb-2">Selected Player</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color }}>
                {turn.player.name}
              </p>
              {turn.player.is_host && <Crown size={20} className="text-yellow-500" />}
            </div>
          </div>

          <div className="w-full cursor-pointer" style={{ perspective: "1000px" }} onClick={() => !flipped && setFlipped(true)}>
            <div style={{
              position: "relative",
              width: "100%",
              height: "320px",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}>
              {/* Card back */}
              <div style={{
                position: "absolute", inset: 0,
                backfaceVisibility: "hidden",
                borderRadius: "24px",
                background: "linear-gradient(135deg, #13131F, #1A1A2E)",
                border: `2px solid ${color}`,
                boxShadow: `0 0 30px ${color}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
              }}>
                <div className="animate-pulse">
                  <Sparkles size={48} color={color} />
                </div>
                <p style={{ color, fontFamily: "var(--font-display)", fontWeight: 900, letterSpacing: "0.1em", fontSize: "14px" }}>
                  TAP TO REVEAL
                </p>
              </div>

              {/* Card front */}
              <div style={{
                position: "absolute", inset: 0,
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                borderRadius: "24px",
                background: `linear-gradient(135deg, ${bgColor}, rgba(0,0,0,0.95))`,
                border: `2px solid ${color}`,
                boxShadow: `0 0 30px ${color}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "28px",
                gap: "16px",
                textAlign: "center",
              }}>
                <div className="flex items-center gap-2">
                  {isTruth ? <MessageCircle size={28} color={color} /> : <Zap size={28} color={color} />}
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "24px", color, letterSpacing: "0.08em" }}>
                    {isTruth ? "TRUTH" : "DARE"}
                  </p>
                </div>
                <div style={{ width: "50px", height: "2px", background: color, opacity: 0.4, borderRadius: "1px" }} />
                <p style={{ fontSize: "18px", lineHeight: 1.6, color: "#e0e0ff", fontWeight: 500 }}>
                  {turn.submission.content}
                </p>
              </div>
            </div>
          </div>

          {flipped && (
            <div className="w-full flex flex-col gap-3 animate-slide-up">
              {isHost ? (
                <>
                  <button 
                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    style={{ background: "linear-gradient(135deg, #00f5ff, #0099ff)", color: "#000" }}
                    onClick={onDone}
                  >
                    <CheckCircle size={18} />
                    Done — Next Spin
                  </button>
                  <button 
                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    onClick={onRespin}
                  >
                    <RotateCcw size={18} />
                    Respin (skip this person)
                  </button>
                </>
              ) : (
                <button 
                  className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  onClick={onClose}
                >
                  <X size={18} />
                  Close
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TruthOrDarePage() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code") || "";

  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<Phase>("spin");
  const [spinning, setSpinning] = useState(false);
  const [currentTurn, setTurn] = useState<CurrentTurn | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [bottleDeg, setBottleDeg] = useState(0);
  const [truthsUsed, setTruthsUsed] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const spinRef = useRef<HTMLDivElement>(null);
  const lastSpunPlayerRef = useRef<string | null>(null);
  const recentQuestionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setIsHost(sessionStorage.getItem("pm_is_host") === "true");
  }, []);

  useEffect(() => {
    if (!code) return;
    supabase.from("sessions").select("*").eq("code", code).single().then(({ data }) => data && setSession(data));
  }, [code]);

  useEffect(() => {
    if (!session) return;
    supabase.from("players").select("*").eq("session_id", session.id).then(({ data }) => data && setPlayers(data));
  }, [session]);

  const activeModes = session?.rules?.modes?.length ? session.rules.modes : GAME_MODES.map((m) => m.key);

  function pickPlayer(exclude?: string): Player {
    let pool = exclude ? players.filter((p) => p.id !== exclude) : players;
    if (lastSpunPlayerRef.current && pool.length > 1) {
      pool = pool.filter((p) => p.id !== lastSpunPlayerRef.current);
    }
    if (pool.length === 0) {
      pool = exclude ? players.filter((p) => p.id !== exclude) : players;
    }
    const picked = pool[Math.floor(Math.random() * pool.length)];
    lastSpunPlayerRef.current = picked.id;
    return picked;
  }

  // Main Fix: Player does NOT get their own question
  async function getQuestion(stage: string, type: "truth" | "dare", currentPlayerId: string): Promise<Submission | null> {
    const recent = recentQuestionsRef.current;

    // Try to get questions that are NOT from the current player
    const { data: questions } = await supabase
      .from("submissions")
      .select("*")
      .eq("session_id", session!.id)
      .eq("type", type)
      .eq("mode", stage)
      .neq("player_id", currentPlayerId);

    if (questions && questions.length > 0) {
      const fresh = questions.filter(q => !recent.has(q.id));
      const chosen = fresh.length > 0 
        ? fresh[Math.floor(Math.random() * fresh.length)]
        : questions[Math.floor(Math.random() * questions.length)];

      recent.add(chosen.id);
      if (recent.size > 10) recent.delete([...recent][0]);
      return chosen;
    }

    // Fallback - try any question except their own
    const { data: fallback } = await supabase
      .from("submissions")
      .select("*")
      .eq("session_id", session!.id)
      .eq("type", type)
      .neq("player_id", currentPlayerId);

    if (fallback && fallback.length > 0) {
      const chosen = fallback[Math.floor(Math.random() * fallback.length)];
      setWarning(`⚠️ Using question from another level`);
      setTimeout(() => setWarning(null), 2500);
      return chosen;
    }

    return null;
  }

  async function doSpin(excludeId?: string) {
    if (spinning || !session || players.length < 2) return;
    
    setSpinning(true);
    setPhase("spin");
    setTurn(null);
    setModalOpen(false);
    setWarning(null);

    const picked = pickPlayer(excludeId);

    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const playerIndex = players.findIndex(p => p.id === picked.id);
    const playerAngle = (playerIndex / players.length) * 360;
    const totalDeg = bottleDeg + extraSpins * 360 + playerAngle;
    setBottleDeg(totalDeg);

    setTimeout(async () => {
      setSpinning(false);

      const stage = activeModes[stageIdx] as GameMode ?? "starting";
      const usedTruths = truthsUsed[picked.id] ?? 0;
      const allowed = session.rules.truth_count ?? 2;
      const forceType: "truth" | "dare" = usedTruths < allowed ? "truth" : "dare";

      const sub = await getQuestion(stage, forceType, picked.id);
      
      if (!sub) {
        setWarning("❌ Not enough questions available. Ask everyone to add more.");
        setPhase("spin");
        setSpinning(false);
        return;
      }

      setTurn({ player: picked, submission: sub, type: sub.type as "truth" | "dare" });
      setPhase("reveal");
      setModalOpen(true);

      await supabase.from("players").update({ spin_count: (picked.spin_count ?? 0) + 1 }).eq("id", picked.id);
      setPlayers((prev) => prev.map((p) => p.id === picked.id ? { ...p, spin_count: (p.spin_count ?? 0) + 1 } : p));
      
      if (sub.type === "truth") {
        setTruthsUsed((prev) => ({ ...prev, [picked.id]: (prev[picked.id] ?? 0) + 1 }));
      }
    }, 3200);
  }

  async function spinBottle() { 
    if (!spinning && isHost && players.length >= 2) {
      await doSpin(); 
    }
  }

  async function respin() {
    const skipId = currentTurn?.player.id;
    setTurn(null);
    setModalOpen(false);
    await doSpin(skipId);
  }

  async function markDone() {
    if (!currentTurn) return;
    setPhase("spin");
    setTurn(null);
    setModalOpen(false);
  }

  function closeModal() {
    setModalOpen(false);
    setPhase("spin");
  }

  async function nextStage() {
    if (!session) return;
    const next = Math.min(stageIdx + 1, activeModes.length - 1);
    setStageIdx(next);
    await supabase.from("sessions").update({ current_stage: activeModes[next] }).eq("id", session.id);
    setWarning(`🎉 Moving to ${activeModes[next]} level!`);
    setTimeout(() => setWarning(null), 2000);
  }

  async function endGame() {
    if (!session) return;
    await supabase.from("sessions").delete().eq("id", session.id);
    router.push("/");
  }

  if (!session) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="animate-spin">
        <RefreshCw size={48} className="text-neon-pink" />
      </div>
    </main>
  );

  const currentStageObj = GAME_MODES.find((m) => m.key === activeModes[stageIdx]) ?? GAME_MODES[0];

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 max-w-sm mx-auto relative overflow-hidden bg-gradient-to-b from-[#0a0a0f] to-[#13131f]">
      {warning && (
        <div className="fixed top-20 left-4 right-4 z-40 animate-slide-down">
          <div className="bg-yellow-500/90 backdrop-blur-sm text-black px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{warning}</p>
          </div>
        </div>
      )}

      <div className="w-full flex items-center justify-between mb-6">
        <div>
          <p className="text-xs opacity-40 uppercase tracking-widest">{session.party_name}</p>
          <div className="flex items-center gap-2 mt-1">
            <StageIcon stageKey={currentStageObj.key} />
            <p className="text-sm font-bold" style={{ color: currentStageObj.color }}>
              {currentStageObj.label}
            </p>
          </div>
        </div>
        {isHost && (
          <div className="flex gap-2 items-center">
            {stageIdx < activeModes.length - 1 && (
              <button 
                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-white/5 hover:bg-white/10 transition-all"
                onClick={nextStage}
              >
                <TrendingUp size={14} />
                Next Level
              </button>
            )}
            <button className="text-xs opacity-30 hover:opacity-60 px-2 py-1" onClick={endGame}>
              End Game
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-8">
        {activeModes.map((m, i) => {
          const mo = GAME_MODES.find((x) => x.key === m)!;
          return (
            <div 
              key={m} 
              className="h-1 rounded-full transition-all flex-1"
              style={{
                background: i <= stageIdx ? mo.color : "rgba(255,255,255,0.1)",
                boxShadow: i === stageIdx ? `0 0 8px ${mo.color}` : "none",
              }} 
            />
          );
        })}
      </div>

      <div className="relative w-80 h-80 mb-8">
        {players.map((p, i) => {
          const angle = (i / players.length) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = 50 + 44 * Math.cos(rad);
          const y = 50 + 44 * Math.sin(rad);
          const active = currentTurn?.player.id === p.id && modalOpen;

          return (
            <div 
              key={p.id} 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-500"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                active ? "scale-125 border-neon-pink shadow-lg shadow-neon-pink/50" : "border-white/10"
              }`} style={{ background: active ? "rgba(255,45,120,0.3)" : "rgba(255,255,255,0.05)" }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <p className={`text-xs mt-1.5 transition-all ${active ? "font-bold" : "opacity-40"}`}
                style={{ color: active ? "var(--neon-pink)" : undefined }}>
                {p.name.split(" ")[0]}
              </p>
            </div>
          );
        })}

        <div 
          className="absolute inset-0 flex items-center justify-center"
          onClick={phase === "spin" && !spinning && isHost ? spinBottle : undefined}
          style={{ cursor: phase === "spin" && !spinning && isHost ? "pointer" : "default" }}
        >
          <div 
            ref={spinRef} 
            style={{
              transform: `rotate(${bottleDeg}deg)`,
              transition: spinning ? "transform 3.2s cubic-bezier(0.17, 0.67, 0.12, 1)" : "none",
            }}
          >
            <BottleIcon spinning={spinning} isClickable={phase === "spin" && !spinning && isHost} />
          </div>
        </div>
      </div>

      {phase === "spin" && !spinning && (
        <div className="text-center animate-fade-in">
          {isHost ? (
            <>
              <p className="text-lg font-black mb-2 animate-pulse-glow" style={{ fontFamily: "var(--font-display)", color: "var(--neon-pink)" }}>
                TAP THE BOTTLE TO SPIN
              </p>
              <p className="text-xs opacity-40">{players.length} players ready</p>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Users size={16} className="opacity-40" />
              <p className="text-sm opacity-40">Waiting for host to spin...</p>
            </div>
          )}
        </div>
      )}

      {spinning && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw size={20} className="animate-spin text-neon-pink" />
            <p className="text-xl font-black animate-pulse" style={{ fontFamily: "var(--font-display)", color: "var(--neon-yellow)" }}>
              SPINNING...
            </p>
          </div>
        </div>
      )}

      {modalOpen && currentTurn && (
        <CardRevealModal
          turn={currentTurn}
          onDone={markDone}
          onRespin={respin}
          isHost={isHost}
          onClose={closeModal}
          currentStage={currentStageObj.label}
        />
      )}
    </main>
  );
}