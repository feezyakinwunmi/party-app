import { Suspense } from 'react';
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import type { Session, Player, SessionRules, GameMode } from "@/types";
import { GAME_MODES } from "@/types";
import { 
  Crown, 
  Users, 
  Copy, 
  Check, 
  Settings, 
  Play, 
  UserPlus,
  Share2,
  Sparkles,
  Gamepad2,
  Trash2,
} from "lucide-react";

// Inner component that uses useSearchParams
function HostLobbyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code") || "";

  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [rules, setRules] = useState<SessionRules>({
    truth_count: 2,
    dare_count: 3,
    modes: ["starting", "rate2", "rate3", "tense", "naughty"],
  });

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [playerToKick, setPlayerToKick] = useState<Player | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const joinUrl = `${appUrl}/join/${code}`;

  // Load session and host
  useEffect(() => {
    if (!code) return;
    
    supabase
      .from("sessions")
      .select("*")
      .eq("code", code)
      .single()
      .then(({ data }) => data && setSession(data));

    const hostPlayerId = sessionStorage.getItem("pm_player_id");
    if (hostPlayerId) {
      supabase
        .from("players")
        .select("*")
        .eq("id", hostPlayerId)
        .single()
        .then(({ data }) => data && setMyPlayer(data));
    }
  }, [code]);

  // Subscribe to players
  useEffect(() => {
    if (!session) return;

    const fetchPlayers = () =>
      supabase
        .from("players")
        .select("*")
        .eq("session_id", session.id)
        .order("joined_at")
        .then(({ data }) => data && setPlayers(data));

    fetchPlayers();

    const channel = supabase
      .channel(`lobby:${session.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `session_id=eq.${session.id}` },
        fetchPlayers
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  // Kick Player
  async function confirmKick() {
    if (!playerToKick || !session) return;

    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerToKick.id);

    if (error) {
      alert("Failed to remove player. Please try again.");
    } else {
      setPlayerToKick(null);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${session?.party_name}`,
          text: `Join my game with code: ${code}`,
          url: joinUrl,
        });
      } catch {}
    } else {
      copyLink();
    }
  }

  const saveRules = useCallback(async (newRules: SessionRules) => {
    if (!session) return;
    setRules(newRules);
    await supabase.from("sessions").update({ rules: newRules }).eq("id", session.id);
  }, [session]);

  async function startGame() {
    if (!session || players.length < 2) return;
    setLoading(true);
    await supabase.from("sessions").update({ status: "playing" }).eq("id", session.id);
    
    const gameType = session.game_type;
    if (gameType === "letter_blitz") {
      router.push(`/game/letter-blitz?code=${code}`);
    } else {
      router.push(`/game/${gameType}?code=${code}`);
    }
  }

  return (
    <main className="min-h-screen flex flex-col px-4 py-8 max-w-md mx-auto bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-neon-cyan/20 to-neon-pink/20 mb-4">
          <Crown size={32} className="text-neon-pink" />
        </div>
        <p className="text-xs tracking-widest opacity-50 uppercase mb-1">
          {session?.party_name}
        </p>
        <h1 className="text-5xl font-black tracking-widest mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--neon-cyan)" }}>
          {code}
        </h1>
        <p className="text-xs opacity-40">Your game code — share with players</p>
      </div>

      {/* QR & Share Card */}
      <div className="neon-card p-6 flex flex-col items-center gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-xl">
          <QRCodeSVG value={joinUrl} size={180} fgColor="#050508" bgColor="#ffffff" />
        </div>
        
        <div className="flex gap-2 w-full">
          <button className="flex-1 btn-neon btn-ghost text-sm flex items-center justify-center gap-2" onClick={shareLink}>
            <Share2 size={16} />
            Share
          </button>
          <button className="flex-1 btn-neon btn-ghost text-sm flex items-center justify-center gap-2" onClick={copyLink}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      {/* Players List with Kick Option */}
      <div className="neon-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="opacity-60" />
            <span className="text-xs tracking-widest opacity-60 uppercase">Players</span>
          </div>
          <span className="text-sm font-bold text-neon-green">{players.length} joined</span>
        </div>
        
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {players.length === 0 && (
            <div className="text-center py-8">
              <UserPlus size={32} className="mx-auto opacity-20 mb-2" />
              <p className="text-xs opacity-30">Waiting for players to join…</p>
            </div>
          )}
          
          {players.map((p) => (
            <div 
              key={p.id} 
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                p.id === myPlayer?.id ? "bg-neon-pink/10 border border-neon-pink/20" : "bg-white/5"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-neon-cyan/20 to-neon-pink/20 flex items-center justify-center">
                {p.is_host ? <Crown size={18} className="text-yellow-500" /> : <Gamepad2 size={18} className="opacity-60" />}
              </div>
              
              <span className="flex-1 text-sm font-medium">{p.name}</span>
              
              {p.is_host && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500">Host</span>}
              {p.id === myPlayer?.id && !p.is_host && <span className="text-xs opacity-40">(you)</span>}

              {/* Kick Button */}
              {!p.is_host && (
                <button
                  onClick={() => setPlayerToKick(p)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Remove player"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rules Section - Fully Restored */}
      <div className={`neon-card p-4 mb-6 transition-all ${showRules ? 'border-neon-cyan' : ''}`}>
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Settings size={16} className="opacity-60" />
            <span className="text-xs tracking-widest opacity-60 uppercase">Game Rules</span>
          </div>
          <span className={`transform transition-transform ${showRules ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        {showRules && (
          <div className="mt-4 flex flex-col gap-4 animate-slide-down">
            {/* Truth count */}
            <div>
              <label className="text-xs opacity-50 block mb-2">
                Truths per player: <strong className="text-neon-cyan">{rules.truth_count}</strong>
              </label>
              <input
                type="range" 
                min={1} 
                max={5} 
                value={rules.truth_count}
                onChange={(e) => saveRules({ ...rules, truth_count: +e.target.value })}
                className="w-full accent-[#00F5FF]"
              />
              <div className="flex justify-between text-xs opacity-40 mt-1">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              </div>
            </div>

            {/* Dare count */}
            <div>
              <label className="text-xs opacity-50 block mb-2">
                Dares per player: <strong className="text-neon-cyan">{rules.dare_count}</strong>
              </label>
              <input
                type="range" 
                min={1} 
                max={5} 
                value={rules.dare_count}
                onChange={(e) => saveRules({ ...rules, dare_count: +e.target.value })}
                className="w-full accent-[#00F5FF]"
              />
              <div className="flex justify-between text-xs opacity-40 mt-1">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              </div>
            </div>

            {/* Active modes */}
            <div>
              <label className="text-xs opacity-50 block mb-2">Active Game Modes</label>
              <div className="grid grid-cols-2 gap-2">
                {GAME_MODES.map((m) => (
                  <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      checked={rules.modes.includes(m.key)}
                      onChange={(e) => {
                        const modes = e.target.checked
                          ? [...rules.modes, m.key]
                          : rules.modes.filter((x) => x !== m.key);
                        saveRules({ ...rules, modes: modes as GameMode[] });
                      }}
                      className="accent-[#BF00FF]"
                    />
                    <span>{m.emoji}</span>
                    <span style={{ color: m.color }} className="text-xs">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Start Game Button */}
      <button
        className={`btn-neon w-full text-lg py-5 flex items-center justify-center gap-2 transition-all ${
          players.length >= 2 ? 'btn-pink' : 'btn-ghost opacity-50 cursor-not-allowed'
        }`}
        disabled={players.length < 2 || loading}
        onClick={startGame}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Starting...
          </>
        ) : (
          <>
            <Play size={20} />
            {players.length < 2 
              ? `Need ${2 - players.length} more player${players.length === 1 ? '' : 's'} to start` 
              : `Start Game (${players.length} players)`}
          </>
        )}
      </button>

      {/* Kick Confirmation Modal */}
      {playerToKick && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-3xl p-6 max-w-xs w-full text-center border border-red-500/30">
            <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Remove Player?</h3>
            <p className="mb-6 text-gray-300">
              Are you sure you want to remove <strong>{playerToKick.name}</strong> from the game?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setPlayerToKick(null)}
                className="flex-1 py-3 rounded-2xl border border-white/20 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={confirmKick}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 font-semibold"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Main export with Suspense boundary
export default function HostLobbyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading lobby...</p>
        </div>
      </div>
    }>
      <HostLobbyContent />
    </Suspense>
  );
}