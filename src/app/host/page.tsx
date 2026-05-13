"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, generateCode } from "@/lib/supabase";
import { GAME_TYPES } from "@/types";
import { Crown, PartyPopper, ArrowLeft, Check } from "lucide-react";

export default function HostPage() {
  const router = useRouter();
  const [partyName, setPartyName] = useState("");
  const [hostName, setHostName] = useState("");
  const [selectedGame, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createGame() {
    if (!partyName.trim() || !selectedGame || !hostName.trim()) return;
    setLoading(true);
    setError("");

    try {
      const code = generateCode();
      const placeholderId = "00000000-0000-0000-0000-000000000000";

      const { data: session, error: sErr } = await supabase
        .from("sessions")
        .insert({
          code,
          party_name: partyName.trim(),
          game_type: selectedGame,
          status: "lobby",
          host_id: placeholderId,
          rules: {
            truth_count: 2,
            dare_count: 3,
            modes: ["starting", "warmup", "spicy", "wild", "extreme"],
          }
        })
        .select()
        .single();

      if (sErr || !session) throw new Error("Failed to create session");

      const { data: hostPlayer, error: pErr } = await supabase
        .from("players")
        .insert({
          session_id: session.id,
          name: hostName.trim(),
          is_host: true,
          spin_count: 0,
        })
        .select()
        .single();

      if (pErr || !hostPlayer) throw new Error("Failed to create host player");

      await supabase
        .from("sessions")
        .update({ host_id: hostPlayer.id })
        .eq("id", session.id);

      // Save to sessionStorage
      sessionStorage.setItem("pm_session_id", session.id);
      sessionStorage.setItem("pm_session_code", code);
      sessionStorage.setItem("pm_is_host", "true");
      sessionStorage.setItem("pm_party_name", partyName.trim());
      sessionStorage.setItem("pm_host_name", hostName.trim());
      sessionStorage.setItem("pm_player_id", hostPlayer.id);

      if (selectedGame === "letter_blitz") {
        router.push(`/game/letter_blitz`);
      } else {
        router.push(`/host/lobby?code=${code}`);
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col px-4 py-12 max-w-md mx-auto bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]">
      
      <button
        className="flex items-center gap-2 text-xs opacity-40 hover:opacity-80 mb-8 transition-all"
        onClick={() => router.back()}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-neon-cyan/20 to-neon-pink/20 mb-4">
          <Crown size={36} className="text-neon-pink" />
        </div>
        <h1 className="text-4xl font-black mb-2 text-white" style={{ fontFamily: "var(--font-display)" }}>
          Host a Vibes
        </h1>
        <p className="text-sm opacity-60">Mature • Fun • Unfiltered</p>
      </div>

      {/* Party Name */}
      <div className="mb-6">
        <label className="text-xs tracking-widest opacity-60 uppercase block mb-2">Party Name</label>
        <input
          className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-neon-cyan outline-none text-white"
          placeholder="e.g., Late Night Vibes 🔥"
          value={partyName}
          onChange={(e) => setPartyName(e.target.value)}
          maxLength={40}
        />
      </div>

      {/* Host Name */}
      <div className="mb-8">
        <label className="text-xs tracking-widest opacity-60 uppercase block mb-2">Your Name (Host)</label>
        <input
          className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-neon-cyan outline-none text-white"
          placeholder="e.g., Tunde"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          maxLength={20}
        />
      </div>

      {/* Game Selection */}
      <div className="mb-8">
        <label className="text-xs tracking-widest opacity-60 uppercase block mb-3">Choose Game</label>
        <div className="flex flex-col gap-3">
          {GAME_TYPES.map((game) => (
            <button
              key={game.id}
              disabled={!game.available}
              onClick={() => game.available && setSelected(game.id)}
              className={`relative p-5 rounded-2xl text-left transition-all duration-200 ${
                !game.available
                  ? "opacity-40 cursor-not-allowed bg-white/5"
                  : selectedGame === game.id
                  ? "bg-gradient-to-r from-neon-cyan/20 to-neon-pink/20 border-2 border-neon-pink"
                  : "bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl mt-1">{game.emoji}</div>
                <div className="flex-1">
                  <div className="font-black text-xl text-white">{game.name}</div>
                  <div className="text-sm opacity-70 mt-1 leading-snug">{game.description}</div>

                  {game.id === "letter_blitz" && (
                    <div className="text-xs text-neon-cyan mt-2 font-medium">
                      ⚡ Fast-paced • Great icebreaker • Host controls everything
                    </div>
                  )}
                </div>

                {selectedGame === game.id && (
                  <div className="w-7 h-7 rounded-full bg-neon-pink flex items-center justify-center mt-1">
                    <Check size={16} className="text-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        className="btn-neon btn-pink w-full text-lg py-5 flex items-center justify-center gap-3 disabled:opacity-50"
        disabled={!partyName.trim() || !selectedGame || !hostName.trim() || loading}
        onClick={createGame}
      >
        {loading ? (
          <>Creating Party...</>
        ) : (
          <>
            <PartyPopper size={24} />
            CREATE GAME →
          </>
        )}
      </button>

      <div className="mt-10 text-center text-xs opacity-40">
        Letter Blitz works best for small groups.<br />
        Other games support many players joining via code.
      </div>
    </main>
  );
}