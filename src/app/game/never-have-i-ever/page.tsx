"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  RefreshCw, 
  Check, 
  X, 
  Users, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  HelpCircle,
  Hand,
  Beer,
  Heart,
  Skull,
  Star,
  Trophy
} from "lucide-react";

// Categories and questions
const QUESTION_CATEGORIES = [
  { id: "classic", name: "Classic", emoji: "🍺", color: "#00f5ff" },
  { id: "spicy", name: "Spicy", emoji: "🌶️", color: "#ff2d78" },
  { id: "wild", name: "Wild", emoji: "🤪", color: "#ffaa00" },
  { id: "deep", name: "Deep", emoji: "💭", color: "#bf00ff" }
];

const QUESTIONS_BY_CATEGORY: Record<string, { text: string; intensity: number }[]> = {
  classic: [
    { text: "Never have I ever gotten a tattoo", intensity: 1 },
    { text: "Never have I ever broken a bone", intensity: 1 },
    { text: "Never have I ever been to a concert", intensity: 1 },
    { text: "Never have I ever ridden a roller coaster", intensity: 1 },
    { text: "Never have I ever been to the beach", intensity: 1 },
    { text: "Never have I ever eaten sushi", intensity: 1 },
    { text: "Never have I ever fallen asleep in class", intensity: 1 },
    { text: "Never have I ever gotten a speeding ticket", intensity: 2 },
    { text: "Never have I ever been to a wedding", intensity: 1 },
    { text: "Never have I ever celebrated New Year's Eve", intensity: 1 }
  ],
  spicy: [
    { text: "Never have I ever ghosted someone", intensity: 2 },
    { text: "Never have I ever had a crush on a friend's ex", intensity: 2 },
    { text: "Never have I ever sent a text to the wrong person", intensity: 2 },
    { text: "Never have I ever pretended to be sick to avoid plans", intensity: 2 },
    { text: "Never have I ever lied on a resume", intensity: 2 },
    { text: "Never have I ever gossiped about a friend", intensity: 2 },
    { text: "Never have I ever been rejected", intensity: 2 },
    { text: "Never have I ever had a one-night stand", intensity: 3 },
    { text: "Never have I ever been in a situationship", intensity: 2 },
    { text: "Never have I ever cried over a movie", intensity: 1 }
  ],
  wild: [
    { text: "Never have I ever been kicked out of a bar", intensity: 3 },
    { text: "Never have I ever sung karaoke in public", intensity: 2 },
    { text: "Never have I ever done something illegal", intensity: 3 },
    { text: "Never have I ever been skinny dipping", intensity: 3 },
    { text: "Never have I ever gotten into a physical fight", intensity: 3 },
    { text: "Never have I ever lied to get out of trouble", intensity: 2 },
    { text: "Never have I ever been to a strip club", intensity: 3 },
    { text: "Never have I ever cheated on a test", intensity: 2 },
    { text: "Never have I ever pulled an all-nighter", intensity: 1 },
    { text: "Never have I ever lost my phone", intensity: 1 }
  ],
  deep: [
    { text: "Never have I ever had my heart broken", intensity: 2 },
    { text: "Never have I ever doubted myself", intensity: 1 },
    { text: "Never have I ever been truly scared", intensity: 2 },
    { text: "Never have I ever felt lost in life", intensity: 1 },
    { text: "Never have I ever cried in public", intensity: 2 },
    { text: "Never have I ever regretted a decision", intensity: 1 },
    { text: "Never have I ever felt truly alone", intensity: 2 },
    { text: "Never have I ever been in love", intensity: 2 },
    { text: "Never have I ever had a major life change", intensity: 2 },
    { text: "Never have I ever betrayed someone's trust", intensity: 3 }
  ]
};

type GamePhase = "select" | "active" | "reveal";

interface Player {
  id: string;
  name: string;
  Hand: number;
  isActive: boolean;
}

export default function NeverHaveIEverPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>("select");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<{ text: string; intensity: number } | null>(null);
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "Player 1", Hand: 10, isActive: true },
    { id: "2", name: "Player 2", Hand: 10, isActive: true },
    { id: "3", name: "Player 3", Hand: 10, isActive: true },
    { id: "4", name: "Player 4", Hand: 10, isActive: true }
  ]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [gameWinner, setGameWinner] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Play sound effect
  const playSound = useCallback((type: 'finger' | 'done' | 'reveal' | 'winner') => {
    if (!soundEnabled) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    switch(type) {
      case 'finger':
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.08;
        oscillator.type = 'sine';
        break;
      case 'reveal':
        oscillator.frequency.value = 523.25;
        gainNode.gain.value = 0.1;
        oscillator.type = 'sine';
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          osc2.frequency.value = 659.25;
          osc2.connect(gainNode);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.3);
        }, 150);
        break;
      case 'done':
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.12;
        oscillator.type = 'square';
        break;
      case 'winner':
        oscillator.frequency.value = 523.25;
        gainNode.gain.value = 0.15;
        oscillator.type = 'sine';
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          osc2.frequency.value = 659.25;
          osc2.connect(gainNode);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.2);
        }, 100);
        setTimeout(() => {
          const osc3 = ctx.createOscillator();
          osc3.frequency.value = 783.99;
          osc3.connect(gainNode);
          osc3.start();
          osc3.stop(ctx.currentTime + 0.3);
        }, 200);
        break;
    }
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
    oscillator.stop(ctx.currentTime + 0.3);
  }, [soundEnabled]);

  // Get random question
  const getRandomQuestion = useCallback((categoryId: string) => {
    const questions = QUESTIONS_BY_CATEGORY[categoryId] || QUESTIONS_BY_CATEGORY.classic;
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }, []);

  // Start game with selected category
  const startGame = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const question = getRandomQuestion(categoryId);
    setCurrentQuestion(question);
    setPlayers(players.map(p => ({ ...p, Hand: 10, isActive: true })));
    setCurrentPlayerIndex(0);
    setRevealed(false);
    setGameWinner(null);
    setPhase("active");
  };

  // Player puts a finger down
  const putFingerDown = (playerId: string) => {
    if (phase !== "active" || revealed) return;
    
    playSound('finger');
    setPlayers(prev => prev.map(p => 
      p.id === playerId && p.Hand > 0 
        ? { ...p, Hand: p.Hand - 1, isActive: p.Hand - 1 > 0 }
        : p
    ));
  };

  // Reveal who put a finger down
  const revealHand = () => {
    if (revealed) return;
    playSound('reveal');
    setRevealed(true);
    
    // Check for winner after reveal
    setTimeout(() => {
      const remainingPlayers = players.filter(p => p.Hand > 0);
      if (remainingPlayers.length === 1) {
        setGameWinner(remainingPlayers[0].name);
        playSound('winner');
      }
    }, 500);
  };

  // Next question
  const nextQuestion = () => {
    if (!selectedCategory) return;
    
    const newQuestion = getRandomQuestion(selectedCategory);
    setCurrentQuestion(newQuestion);
    setRevealed(false);
    playSound('done');
  };

  // Reset game
  const resetGame = () => {
    setPhase("select");
    setSelectedCategory(null);
    setCurrentQuestion(null);
    setRevealed(false);
    setGameWinner(null);
    setCurrentPlayerIndex(0);
  };

  // Edit player names
  const updatePlayerName = (playerId: string, newName: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, name: newName } : p
    ));
  };

  // Add player
  const addPlayer = () => {
    if (players.length >= 12) return;
    const newId = (players.length + 1).toString();
    setPlayers(prev => [...prev, {
      id: newId,
      name: `Player ${players.length + 1}`,
      Hand: 10,
      isActive: true
    }]);
  };

  // Remove player
  const removePlayer = (playerId: string) => {
    if (players.length <= 2) return;
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  // Get color for Hand
  const getFingerColor = (Hand: number) => {
    if (Hand >= 8) return "#00ff88";
    if (Hand >= 5) return "#ffaa00";
    if (Hand >= 3) return "#ff6600";
    return "#ff2d78";
  };

  return (
    <main className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="text-center">
          <h1 className="text-xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--neon-cyan)" }}>
            Never Have I Ever
          </h1>
          <p className="text-xs opacity-40">Put a finger down if you have!</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm mx-4 p-6 rounded-2xl bg-gradient-to-br from-[#13131f] to-[#1a1a2e] border border-white/10">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4 text-neon-cyan">How to Play</h3>
            <div className="space-y-3 text-sm">
              <p>1. 🎮 Each player starts with 10 Hand up</p>
              <p>2. 📖 Read the statement aloud</p>
              <p>3. ✋ If you HAVE done it, put one finger down</p>
              <p>4. 👀 If you HAVEN'T done it, keep your Hand up</p>
              <p>5. 🔄 Click "Next Question" to continue</p>
              <p>6. 🏆 Last player with Hand up wins!</p>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-6 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Category Selection */}
      {phase === "select" && (
        <div className="animate-fade-in">
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">🙈</div>
            <h2 className="text-2xl font-bold mb-2">Choose a Category</h2>
            <p className="text-sm opacity-60">Pick your vibe</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {QUESTION_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => startGame(cat.id)}
                className="p-5 rounded-2xl text-center transition-all bg-white/5 border border-white/10 hover:scale-105 hover:border-neon-cyan group"
              >
                <div className="text-4xl mb-2">{cat.emoji}</div>
                <div className="font-bold text-lg group-hover:text-neon-cyan transition-colors">
                  {cat.name}
                </div>
                <div className="text-xs opacity-40 mt-2">{QUESTIONS_BY_CATEGORY[cat.id].length} questions</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game Active */}
      {phase === "active" && currentQuestion && (
        <>
          {/* Game Stats */}
          <div className="flex justify-between items-center mb-4">
            <div className="bg-white/5 px-3 py-1 rounded-full">
              <span className="text-xs opacity-60">Category: </span>
              <span className="text-xs font-bold" style={{ color: QUESTION_CATEGORIES.find(c => c.id === selectedCategory)?.color }}>
                {QUESTION_CATEGORIES.find(c => c.id === selectedCategory)?.name}
              </span>
            </div>
            <div className="bg-white/5 px-3 py-1 rounded-full">
              <span className="text-xs opacity-60">Intensity: </span>
              <span className="text-xs">
                {currentQuestion.intensity === 1 && "😊 Mild"}
                {currentQuestion.intensity === 2 && "🔥 Spicy"}
                {currentQuestion.intensity === 3 && "💀 Wild"}
              </span>
            </div>
          </div>

          {/* Question Card */}
          <div className="neon-card p-6 mb-6 text-center">
            <p className="text-xs opacity-40 uppercase tracking-widest mb-3">Never have I ever...</p>
            <h2 className="text-xl font-bold leading-relaxed" style={{ fontFamily: "var(--font-display)", color: "var(--neon-yellow)" }}>
              {currentQuestion.text}
            </h2>
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {players.filter(p => p.isActive).map((player) => (
              <button
                key={player.id}
                onClick={() => putFingerDown(player.id)}
                disabled={revealed}
                className={`p-4 rounded-2xl text-center transition-all ${
                  revealed 
                    ? "bg-white/5 opacity-50 cursor-default"
                    : "bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95"
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users size={16} className="opacity-60" />
                  <span className="font-bold">{player.name}</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  {[...Array(player.Hand)].map((_, i) => (
                    <Hand 
                      key={i} 
                      size={16} 
                      className="inline"
                      style={{ color: getFingerColor(player.Hand) }}
                    />
                  ))}
                  <span className="ml-2 text-sm font-bold" style={{ color: getFingerColor(player.Hand) }}>
                    {player.Hand}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Reveal Button */}
          {!revealed ? (
            <button
              onClick={revealHand}
              className="btn-neon btn-pink w-full py-4 flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              Reveal Who Put a Finger Down
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-neon-pink/10 border border-neon-pink/30 text-center">
                <p className="text-sm">
                  Players who put a finger down:
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {players.filter(p => p.Hand < 10).map(p => (
                    <span key={p.id} className="px-2 py-1 rounded-full bg-neon-pink/20 text-neon-pink text-sm">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <button
                onClick={nextQuestion}
                className="btn-neon btn-cyan w-full py-4 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Next Question
              </button>
            </div>
          )}

          {/* Winner Announcement */}
          {gameWinner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
              <div className="text-center p-8">
                <div className="text-8xl mb-4">🏆</div>
                <h2 className="text-3xl font-black mb-2 text-neon-yellow">{gameWinner} Wins!</h2>
                <p className="text-sm opacity-60 mb-6">Last player with Hand up!</p>
                <button
                  onClick={resetGame}
                  className="btn-neon btn-pink px-8 py-3"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Players Section */}
      {phase === "select" && (
        <div className="mt-8 p-4 rounded-xl bg-white/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Users size={14} />
              Players
            </h3>
            <button
              onClick={addPlayer}
              className="text-xs px-2 py-1 rounded bg-neon-cyan/20 text-neon-cyan"
            >
              + Add Player
            </button>
          </div>
          
          <div className="space-y-2">
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updatePlayerName(player.id, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-neon-cyan outline-none text-sm"
                  maxLength={20}
                />
                {players.length > 2 && (
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <p className="text-xs opacity-40 mt-3 text-center">
            Each player starts with 10 Hand. Last one standing wins!
          </p>
        </div>
      )}
    </main>
  );
}