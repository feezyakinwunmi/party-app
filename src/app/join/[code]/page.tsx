"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session, Player, GameMode, SubmissionDraft } from "@/types";
import { GAME_MODES } from "@/types";

type Step = "invite" | "rules" | "name" | "submissions" | "waiting";

const MIN_PER_MODE = 1;

export default function JoinPage() {
  const router = useRouter();
  const { code } = useParams<{ code: string }>();

  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState<Step>("invite");
  const [name, setName] = useState("");
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);

  // Submissions state
  const [drafts, setDrafts] = useState<Record<GameMode, SubmissionDraft>>(
    Object.fromEntries(
      GAME_MODES.map((m) => [m.key, { mode: m.key, truths: [""], dares: [""] }])
    ) as Record<GameMode, SubmissionDraft>
  );
  const [activeMode, setActiveMode] = useState<GameMode>("starting");
  const [submitting, setSubmitting] = useState(false);

  // ── Load session ──────────────────────────────────────────
  useEffect(() => {
    if (!code) return;
    supabase
      .from("sessions")
      .select("*")
      .eq("code", code.toUpperCase())
      .single()
      .then(({ data }) => {
        if (data) setSession(data);
        else setError("Game not found. Check the code!");
      });
  }, [code]);

  // ── Watch session & players ───────────────────────────────
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`session-status:${session.id}`)
      .on("postgres_changes", { 
        event: "UPDATE", 
        schema: "public", 
        table: "sessions", 
        filter: `id=eq.${session.id}` 
      }, ({ new: updated }) => {
        if (updated.status === "playing") {
          router.push(`/game/${updated.game_type}?code=${code}`);
        }
      })
      .subscribe();

    const pChannel = supabase
      .channel(`join-players:${session.id}`)
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "players", 
        filter: `session_id=eq.${session.id}` 
      }, () => {
        supabase.from("players").select("*").eq("session_id", session.id).then(({ data }) => {
          if (data) setPlayers(data);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(pChannel);
    };
  }, [session, code, router]);

  // ── Join as player (Only save name temporarily) ───────────
  function proceedToSubmissions() {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setError("");
    setStep("submissions");
  }

  // ── Submit Everything & Create Player ─────────────────────
  async function submitAll() {
    if (!session || !name.trim() || !allModesValid) return;
    setSubmitting(true);

    try {
      // 1. Create player ONLY after submissions are ready
      const { data: player, error: pErr } = await supabase
        .from("players")
        .insert({ 
          session_id: session.id, 
          name: name.trim(), 
          is_host: false 
        })
        .select()
        .single();

      if (pErr || !player) throw new Error("Failed to join game");

      // Save to sessionStorage
      sessionStorage.setItem("pm_player_id", player.id);
      sessionStorage.setItem("pm_player_name", player.name);
      setMyPlayer(player);

      // 2. Insert submissions
      const rows = activeModes.flatMap((m) => {
        const mode = m as GameMode;
        const d = drafts[mode];
        const truths = d.truths.filter((t) => t.trim()).map((content) => ({
          session_id: session.id,
          player_id: player.id,
          type: "truth",
          mode,
          content,
        }));
        const dares = d.dares.filter((t) => t.trim()).map((content) => ({
          session_id: session.id,
          player_id: player.id,
          type: "dare",
          mode,
          content,
        }));
        return [...truths, ...dares];
      });

      const { error: subErr } = await supabase.from("submissions").insert(rows);
      if (subErr) throw subErr;

      setStep("waiting");
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Submission Helpers (unchanged) ────────────────────────
  function updateEntry(mode: GameMode, type: "truths" | "dares", idx: number, value: string) {
    setDrafts((prev) => {
      const updated = [...prev[mode][type]];
      updated[idx] = value;
      return { ...prev, [mode]: { ...prev[mode], [type]: updated } };
    });
  }

  function addEntry(mode: GameMode, type: "truths" | "dares") {
    setDrafts((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], [type]: [...prev[mode][type], ""] },
    }));
  }

  function removeEntry(mode: GameMode, type: "truths" | "dares", idx: number) {
    setDrafts((prev) => {
      const updated = prev[mode][type].filter((_, i) => i !== idx);
      return { ...prev, [mode]: { ...prev[mode], [type]: updated.length ? updated : [""] } };
    });
  }

  function isDraftValid(mode: GameMode) {
    const d = drafts[mode];
    const validTruths = d.truths.filter((t) => t.trim().length > 0);
    const validDares = d.dares.filter((t) => t.trim().length > 0);
    return validTruths.length >= MIN_PER_MODE && validDares.length >= MIN_PER_MODE;
  }

  const activeModes = session?.rules?.modes ?? GAME_MODES.map((m) => m.key);
  const allModesValid = activeModes.every((m) => isDraftValid(m as GameMode));

  // ── RENDER ────────────────────────────────────────────────
  if (error && step === "invite") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-neon-pink text-lg">{error}</p>
          <button className="btn-neon btn-ghost mt-6" onClick={() => router.push("/")}>← Go Home</button>
        </div>
      </main>
    );
  }

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Invite Screen
  if (step === "invite") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-xs tracking-widest opacity-50 uppercase mb-2">You're invited to</p>
          <h1 className="text-4xl font-black mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--neon-pink)" }}>
            {session.party_name}
          </h1>
          <button className="btn-neon btn-pink w-full text-lg py-5 mt-8" onClick={() => setStep("rules")}>
            Lets Get the Party Started →
          </button>
        </div>
      </main>
    );
  }

  // Rules Screen
  if (step === "rules") {
    return (
      <main className="min-h-screen flex flex-col px-4 py-12 max-w-sm mx-auto">
        <h2 className="text-2xl font-black mb-6" style={{ fontFamily: "var(--font-display)", color: "var(--neon-cyan)" }}>
          THE RULES
        </h2>
        <div className="neon-card p-5 text-sm leading-relaxed opacity-80 mb-8">
          <p>🔥 The bottle spins — whoever it lands on picks Truth or Dare.</p>
          <p>✍️ Everyone must submit truths & dares before the game starts.</p>
          <p>😈 Be creative. Be spicy.</p>
        </div>
        <button className="btn-neon btn-pink w-full text-lg py-5" onClick={() => setStep("name")}>
          I Accept — Let's Go 🔥
        </button>
      </main>
    );
  }

  // Name Screen
  if (step === "name") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✍️</div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--neon-purple)" }}>
            WHAT'S YOUR NAME?
          </h2>
        </div>
        <input
          className="neon-input text-center text-xl mb-4 w-full"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && proceedToSubmissions()}
          maxLength={20}
        />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button 
          className="btn-neon btn-purple w-full" 
          disabled={!name.trim()} 
          onClick={proceedToSubmissions}
        >
          Continue →
        </button>
      </main>
    );
  }

  // Submissions Screen
  if (step === "submissions") {
    const activeModeObjects = GAME_MODES.filter((m) => activeModes.includes(m.key));

    return (
      <main className="min-h-screen flex flex-col px-4 py-8 max-w-sm mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-yellow-400">ADD YOUR TRUTHS & DARES</h2>
          <p className="text-xs opacity-40">At least 1 truth and 1 dare per level</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {activeModeObjects.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMode(m.key)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                activeMode === m.key ? "border-2" : "opacity-50"
              }`}
              style={{ 
                color: m.color, 
                borderColor: activeMode === m.key ? m.color : "transparent",
                background: activeMode === m.key ? `${m.color}15` : undefined 
              }}
            >
              {m.emoji} {m.label} {isDraftValid(m.key) && "✓"}
            </button>
          ))}
        </div>

        {/* Current Mode Editor */}
        {(() => {
          const m = GAME_MODES.find((x) => x.key === activeMode)!;
          const d = drafts[activeMode];
          return (
            <div className="space-y-8">
              <div>
                <label className="block text-sm mb-3" style={{ color: m.color }}>💭 TRUTHS</label>
                {d.truths.map((val, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      className="neon-input flex-1"
                      placeholder={`Truth ${idx + 1}`}
                      value={val}
                      onChange={(e) => updateEntry(activeMode, "truths", idx, e.target.value)}
                    />
                    {d.truths.length > 1 && (
                      <button onClick={() => removeEntry(activeMode, "truths", idx)} className="text-red-400">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addEntry(activeMode, "truths")} className="text-xs text-cyan-400">+ Add truth</button>
              </div>

              <div>
                <label className="block text-sm mb-3" style={{ color: m.color }}>⚡ DARES</label>
                {d.dares.map((val, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      className="neon-input flex-1"
                      placeholder={`Dare ${idx + 1}`}
                      value={val}
                      onChange={(e) => updateEntry(activeMode, "dares", idx, e.target.value)}
                    />
                    {d.dares.length > 1 && (
                      <button onClick={() => removeEntry(activeMode, "dares", idx)} className="text-red-400">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addEntry(activeMode, "dares")} className="text-xs text-cyan-400">+ Add dare</button>
              </div>
            </div>
          );
        })()}

        <div className="mt-10">
          <button
            className="btn-neon btn-pink w-full py-5 text-lg"
            disabled={!allModesValid || submitting}
            onClick={submitAll}
          >
            {submitting ? "Submitting..." : "Submit & Join Game"}
          </button>
        </div>
      </main>
    );
  }

  // Waiting Screen
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-3xl font-black text-green-400 mb-2">YOU'RE IN!</h2>
        <p className="opacity-60">Waiting for host to start the game...</p>
      </div>
    </main>
  );
}