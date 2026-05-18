"use client";

import { Suspense } from 'react';
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
  Star,
  ChevronLeft,
  ChevronRight
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

// Inner component that uses useSearchParams
function TruthOrDareContent() {
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
  const [currentPage, setCurrentPage] = useState(0);
  const playersPerPage = 12;

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

  // Pagination for large player lists
  const totalPages = Math.ceil(players.length / playersPerPage);
  const paginatedPlayers = players.slice(
    currentPage * playersPerPage,
    (currentPage + 1) * playersPerPage
  );

  function pickPlayer(exclude?: string): Player {
    if (players.length === 0) throw new Error("No players available");
    
    let pool = exclude ? players.filter((p) => p.id !== exclude) : [...players];
    
    // Avoid picking the same person twice in a row if possible
    if (lastSpunPlayerRef.current && pool.length > 1) {
      pool = pool.filter((p) => p.id !== lastSpunPlayerRef.current);
    }
    
    // If pool is empty after filtering, use all players except excluded
    if (pool.length === 0) {
      pool = exclude ? players.filter((p) => p.id !== exclude) : [...players];
    }
    
    // Random selection with optional weighting (players with fewer spins get higher chance)
    const minSpins = Math.min(...pool.map(p => p.spin_count || 0));
    const weightedPool = pool.filter(p => (p.spin_count || 0) <= minSpins + 2);
    const finalPool = weightedPool.length > 0 ? weightedPool : pool;
    
    const picked = finalPool[Math.floor(Math.random() * finalPool.length)];
    lastSpunPlayerRef.current = picked.id;
    return picked;
  }

  async function getQuestion(stage: string, type: "truth" | "dare", currentPlayerId: string): Promise<Submission | null> {
    try {
      const recent = recentQuestionsRef.current;

      // First try: get unused questions from current stage, not by current player
      const { data: unusedQuestions, error: unusedError } = await supabase
        .from("submissions")
        .select("*")
        .eq("session_id", session!.id)
        .eq("type", type)
        .eq("mode", stage)
        .eq("used", false);

      if (unusedError) {
        console.error("Error fetching unused questions:", unusedError);
      }

      if (unusedQuestions && unusedQuestions.length > 0) {
        // Filter out recently used questions
        const fresh = unusedQuestions.filter(q => !recent.has(q.id));
        const chosen = fresh.length > 0 
          ? fresh[Math.floor(Math.random() * fresh.length)]
          : unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)];

        if (chosen) {
          recent.add(chosen.id);
          // Keep recent set manageable (last 20 questions)
          if (recent.size > 20) {
            const firstKey = Array.from(recent)[0];
            recent.delete(firstKey);
          }
          return chosen;
        }
      }

      // Second try: get any questions from current stage (allow repeats)
      const { data: stageQuestions, error: stageError } = await supabase
        .from("submissions")
        .select("*")
        .eq("session_id", session!.id)
        .eq("type", type)
        .eq("mode", stage);

      if (stageError) {
        console.error("Error fetching stage questions:", stageError);
      }

      if (stageQuestions && stageQuestions.length > 0) {
        const chosen = stageQuestions[Math.floor(Math.random() * stageQuestions.length)];
        setWarning(`⚠️ No more unused ${type} questions for ${stage}! Reusing questions.`);
        setTimeout(() => setWarning(null), 3000);
        return chosen;
      }

      // Final fallback: any question of this type from any stage
      const { data: anyQuestions, error: anyError } = await supabase
        .from("submissions")
        .select("*")
        .eq("session_id", session!.id)
        .eq("type", type);

      if (anyError) {
        console.error("Error fetching any questions:", anyError);
      }

      if (anyQuestions && anyQuestions.length > 0) {
        const chosen = anyQuestions[Math.floor(Math.random() * anyQuestions.length)];
        setWarning(`⚠️ No ${type} questions left for ${stage}! Using general questions.`);
        setTimeout(() => setWarning(null), 3000);
        return chosen;
      }

      return null;
    } catch (error) {
      console.error("Error in getQuestion:", error);
      return null;
    }
  }

  async function doSpin(excludeId?: string) {
    if (spinning || !session || players.length < 2) {
      if (players.length < 2) {
        setWarning("Need at least 2 players to spin!");
        setTimeout(() => setWarning(null), 2000);
      }
      return;
    }
    
    setSpinning(true);
    setPhase("spin");
    setTurn(null);
    setModalOpen(false);
    setWarning(null);

    try {
      const picked = pickPlayer(excludeId);

      // Calculate rotation angle
      const playerIndex = players.findIndex(p => p.id === picked.id);
      const angleStep = 360 / players.length;
      const targetAngle = (playerIndex * angleStep) + 90; // +90 to point at player
      const extraSpins = 5 + Math.floor(Math.random() * 5);
      const totalDeg = bottleDeg + (extraSpins * 360) + targetAngle;
      
      setBottleDeg(totalDeg);

      setTimeout(async () => {
        try {
          setSpinning(false);

          const stage = activeModes[stageIdx] as GameMode ?? "starting";
          const usedTruths = truthsUsed[picked.id] ?? 0;
          const allowed = session.rules.truth_count ?? 2;
          const forceType: "truth" | "dare" = usedTruths < allowed ? "truth" : "dare";

          const sub = await getQuestion(stage, forceType, picked.id);
          
          if (!sub) {
            setWarning("❌ Not enough questions available. Please add more questions in the admin panel.");
            setPhase("spin");
            return;
          }

          setTurn({ player: picked, submission: sub, type: sub.type as "truth" | "dare" });
          setPhase("reveal");
          setModalOpen(true);

          // Update spin count asynchronously (don't await to avoid blocking)
          supabase.from("players").update({ spin_count: (picked.spin_count ?? 0) + 1 }).eq("id", picked.id).then(() => {
            setPlayers((prev) => prev.map((p) => p.id === picked.id ? { ...p, spin_count: (p.spin_count ?? 0) + 1 } : p));
          });
          
          if (sub.type === "truth") {
            setTruthsUsed((prev) => ({ ...prev, [picked.id]: (prev[picked.id] ?? 0) + 1 }));
          }
        } catch (error) {
          console.error("Error in spin timeout:", error);
          setSpinning(false);
          setPhase("spin");
          setWarning("An error occurred. Please try again.");
        }
      }, 3200);
    } catch (error) {
      console.error("Error in doSpin:", error);
      setSpinning(false);
      setWarning("Failed to spin. Please try again.");
      setTimeout(() => setWarning(null), 2000);
    }
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0a0f] to-[#13131f]">
      <div className="animate-spin">
        <RefreshCw size={48} className="text-neon-pink" />
      </div>
    </main>
  );

  const currentStageObj = GAME_MODES.find((m) => m.key === activeModes[stageIdx]) ?? GAME_MODES[0];

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 max-w-md mx-auto relative overflow-hidden bg-gradient-to-b from-[#0a0a0f] to-[#13131f]">
      {warning && (
        <div className="fixed top-20 left-4 right-4 z-40 animate-slide-down">
          <div className="bg-yellow-500/90 backdrop-blur-sm text-black px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{warning}</p>
          </div>
        </div>
      )}

      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <p className="text-xs opacity-40 uppercase tracking-widest">{session.party_name}</p>
          <div className="flex items-center gap-2 mt-1">
            <StageIcon stageKey={currentStageObj.key} />
            <p className="text-sm font-bold" style={{ color: currentStageObj.color }}>
              {currentStageObj.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
            <Users size={12} className="inline mr-1" />
            {players.length}
          </span>
          {isHost && (
            <>
              {stageIdx < activeModes.length - 1 && (
                <button 
                  className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-white/5 hover:bg-white/10 transition-all"
                  onClick={nextStage}
                >
                  <TrendingUp size={14} />
                  Next
                </button>
              )}
              <button className="text-xs opacity-30 hover:opacity-60 px-2 py-1" onClick={endGame}>
                End
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stage Progress */}
      <div className="flex gap-1 mb-6 w-full">
        {activeModes.map((m, i) => {
          const mo = GAME_MODES.find((x) => x.key === m)!;
          return (
            <div 
              key={m} 
              className="h-1 rounded-full transition-all flex-1"
              style={{
                background: i <= stageIdx ? mo.color : "rgba(255,255,255,0.1)",
              }} 
            />
          );
        })}
      </div>

      {/* Player Circle - Shows only first 12 players with pagination */}
      <div className="relative w-80 h-80 mb-4">
        {paginatedPlayers.map((p, idx) => {
          const globalIndex = players.findIndex(player => player.id === p.id);
          const angle = (globalIndex / players.length) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const radius = 44;
          const x = 50 + radius * Math.cos(rad);
          const y = 50 + radius * Math.sin(rad);
          const active = currentTurn?.player.id === p.id && modalOpen;

          return (
            <div 
              key={p.id} 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-500"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all text-sm ${
                active ? "scale-125 border-neon-pink shadow-lg shadow-neon-pink/50" : "border-white/10"
              }`} style={{ background: active ? "rgba(255,45,120,0.3)" : "rgba(255,255,255,0.05)" }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <p className={`text-xs mt-1 truncate max-w-[60px] transition-all ${active ? "font-bold" : "opacity-40"}`}
                style={{ color: active ? "var(--neon-pink)" : undefined }}>
                {p.name.length > 8 ? p.name.slice(0, 6) + '..' : p.name}
              </p>
            </div>
          );
        })}
        
        {/* Bottle */}
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

      {/* Pagination Controls for large player lists */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="p-1 rounded-lg bg-white/5 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs opacity-60">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-1 rounded-lg bg-white/5 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {phase === "spin" && !spinning && (
        <div className="text-center animate-fade-in">
          {isHost ? (
            <>
              <p className="text-lg font-black mb-2 animate-pulse-glow" style={{ fontFamily: "var(--font-display)", color: "var(--neon-pink)" }}>
                TAP THE BOTTLE TO SPIN
              </p>
              <p className="text-xs opacity-40">{players.length} players in the circle</p>
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

// Main export with Suspense boundary
export default function TruthOrDarePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0a0f] to-[#13131f]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-pink mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading game...</p>
        </div>
      </div>
    }>
      <TruthOrDareContent />
    </Suspense>
  );
}