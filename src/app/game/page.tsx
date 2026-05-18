"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Play, Users, Clock, Star, X } from "lucide-react";

// Game data structure
interface Game {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: "party" | "solo" | "multiplayer";
  players: string;
  duration: string;
  difficulty: "easy" | "medium" | "hard";
  available: boolean;
  route: string;
}

const ALL_GAMES: Game[] = [
  {
    id: "truth_or_dare",
    name: "Truth or Dare",
    description: "Classic party game. Spin the bottle and reveal spicy truths or wild dares!",
    emoji: "🍾",
    category: "party",
    players: "2-20",
    duration: "30-60 min",
    difficulty: "easy",
    available: true,
    route: "/host"
  },
  {
    id: "letter_blitz",
    name: "Letter Blitz",
    description: "Fast-paced word game. Name things in a category starting with a random letter!",
    emoji: "⚡",
    category: "party",
    players: "1-20",
    duration: "15-30 min",
    difficulty: "easy",
    available: true,
    route: "/host"
  },
  {
    id: "charades",
    name: "Charades",
    description: "Act it out without speaking! Get your team to guess the word or phrase.",
    emoji: "🎭",
    category: "party",
    players: "4-20",
    duration: "20-40 min",
    difficulty: "medium",
    available: true,
    route: "/game/charades"
  },
  {
    id: "tic_tac_toe",
    name: "Tic Tac Toe",
    description: "Classic 3x3 battle. Challenge a friend online with a shareable code!",
    emoji: "❌⭕",
    category: "multiplayer",
    players: "2",
    duration: "5-10 min",
    difficulty: "easy",
    available: false,
    route: "/game/tic-tac-toe"
  },
  {
    id: "never_have_i_ever",
    name: "Never Have I Ever",
    description: "Reveal secrets and discover who's been naughty or nice!",
    emoji: "🙈",
    category: "party",
    players: "3-20",
    duration: "20-30 min",
    difficulty: "easy",
    available: false,
    route: "/host"
  },
  {
    id: "would_you_rather",
    name: "Would You Rather",
    description: "Tough choices and hilarious debates. Pick your poison!",
    emoji: "🤔",
    category: "party",
    players: "2-20",
    duration: "15-25 min",
    difficulty: "easy",
    available: false,
    route: "/host"
  }
];

function GameModal({ game, onClose, onPlay }: { game: Game; onClose: () => void; onPlay: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md mx-4">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="neon-card p-6 text-center">
          <div className="text-6xl mb-4">{game.emoji}</div>
          <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--neon-cyan)" }}>
            {game.name}
          </h2>
          <p className="text-sm opacity-70 mb-6">{game.description}</p>
          
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-white/5">
            <div>
              <Users size={16} className="mx-auto mb-1 opacity-60" />
              <p className="text-xs opacity-60">Players</p>
              <p className="text-sm font-bold">{game.players}</p>
            </div>
            <div>
              <Clock size={16} className="mx-auto mb-1 opacity-60" />
              <p className="text-xs opacity-60">Duration</p>
              <p className="text-sm font-bold">{game.duration}</p>
            </div>
            <div>
              <Star size={16} className="mx-auto mb-1 opacity-60" />
              <p className="text-xs opacity-60">Difficulty</p>
              <p className="text-sm font-bold capitalize">{game.difficulty}</p>
            </div>
          </div>
          
          <button
            onClick={onPlay}
            disabled={!game.available}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              game.available
                ? "btn-neon btn-pink"
                : "bg-white/5 text-white/30 cursor-not-allowed"
            }`}
          >
            <Play size={18} />
            {game.available ? "Play Now" : "Coming Soon"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GamesPage() {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [filter, setFilter] = useState<"all" | "party" | "multiplayer" | "solo">("all");

  const filteredGames = ALL_GAMES.filter(game => {
    if (filter === "all") return true;
    return game.category === filter;
  });

  const handlePlay = (game: Game) => {
    setSelectedGame(null);
    if (game.route === "/host") {
      router.push(game.route);
    } else {
      router.push(game.route);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--neon-cyan)" }}>
            All Games
          </h1>
          <p className="text-xs opacity-40">Choose your adventure</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["all", "party", "multiplayer", "solo"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f
                ? "bg-neon-pink text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Games Grid - 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        {filteredGames.map((game) => (
          <button
            key={game.id}
            onClick={() => game.available && setSelectedGame(game)}
            className={`relative p-4 rounded-2xl text-left transition-all duration-200 ${
              game.available
                ? "bg-white/5 border border-white/10 hover:border-neon-cyan hover:scale-105 hover:bg-white/10"
                : "bg-white/5 border border-white/5 opacity-40 cursor-not-allowed"
            }`}
          >
            <div className="text-4xl mb-2">{game.emoji}</div>
            <h3 className="font-bold text-sm mb-1">{game.name}</h3>
            <p className="text-xs opacity-40 line-clamp-2">{game.description}</p>
            
            {!game.available && (
              <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-white/10">
                Soon
              </div>
            )}
            
            {game.category === "party" && (
              <div className="absolute bottom-2 right-2">
                <div className="w-2 h-2 rounded-full bg-neon-cyan" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Coming Soon Note */}
      <div className="mt-8 p-4 rounded-xl bg-white/5 text-center">
        <p className="text-xs opacity-40">
          More games coming soon! Party games require hosting,<br/>
          multiplayer games can be played instantly with a friend code.
        </p>
      </div>

      {/* Game Modal */}
      {selectedGame && (
        <GameModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onPlay={() => handlePlay(selectedGame)}
        />
      )}
    </main>
  );
}