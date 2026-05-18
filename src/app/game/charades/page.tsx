"use client"
import { Suspense } from 'react';
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Check, X, Clock, Sparkles, Volume2, VolumeX, HelpCircle, Play } from "lucide-react";

// Categories for Charades
const CATEGORIES = [
  { id: "movies", name: "Movies", emoji: "🎬", color: "#ff2d78" },
  { id: "animals", name: "Animals", emoji: "🐘", color: "#00f5ff" },
  { id: "professions", name: "Professions", emoji: "💼", color: "#ffaa00" },
  { id: "actions", name: "Actions", emoji: "🏃", color: "#bf00ff" },
  { id: "objects", name: "Objects", emoji: "📦", color: "#00ff88" },
  { id: "celebrities", name: "Celebrities", emoji: "⭐", color: "#ff6600" },
  { id: "sports", name: "Sports", emoji: "⚽", color: "#00f5ff" },
  { id: "music", name: "Music", emoji: "🎵", color: "#ff2d78" },
  { id: "food", name: "Food", emoji: "🍕", color: "#ffaa00" },
  { id: "places", name: "Places", emoji: "🗺️", color: "#00ff88" }
];

// Words for each category
const WORDS_BY_CATEGORY: Record<string, string[]> = {
  movies: ["Titanic", "Avatar", "Inception", "The Matrix", "Frozen", "Jaws", "Rocky", "Gladiator", "Interstellar", "The Godfather", "Jurassic Park", "Star Wars", "Harry Potter", "The Lion King", "Toy Story"],
  animals: ["Elephant", "Giraffe", "Penguin", "Kangaroo", "Dolphin", "Octopus", "Butterfly", "Peacock", "Panda", "Flamingo", "Zebra", "Lion", "Tiger", "Monkey", "Gorilla"],
  professions: ["Doctor", "Teacher", "Lawyer", "Chef", "Pilot", "Firefighter", "Artist", "Musician", "Scientist", "Engineer", "Nurse", "Police", "Farmer", "Dancer", "Writer"],
  actions: ["Running", "Swimming", "Dancing", "Cooking", "Singing", "Reading", "Sleeping", "Laughing", "Crying", "Jumping", "Eating", "Driving", "Flying", "Fighting", "Hugging"],
  objects: ["Toothbrush", "Refrigerator", "Television", "Laptop", "Umbrella", "Sunglasses", "Microwave", "Backpack", "Clock", "Lamp", "Telephone", "Scissors", "Bicycle", "Guitar", "Camera"],
  celebrities: ["Elvis Presley", "Marilyn Monroe", "Michael Jackson", "Beyoncé", "Elon Musk", "Taylor Swift", "The Rock", "Oprah", "Drake", "Rihanna", "Einstein", "Shakespeare", "Madonna", "Prince", "Adele"],
  sports: ["Soccer", "Basketball", "Tennis", "Baseball", "Golf", "Boxing", "Swimming", "Cycling", "Volleyball", "Hockey", "Cricket", "Rugby", "Skiing", "Surfing", "Bowling"],
  music: ["Piano", "Guitar", "Drums", "Violin", "Flute", "Saxophone", "Trumpet", "Harp", "Accordion", "Xylophone", "DJ", "Microphone", "Headphones", "Concert", "Festival"],
  food: ["Pizza", "Burger", "Sushi", "Pasta", "Ice Cream", "Chocolate", "Salad", "Steak", "Curry", "Taco", "Donut", "Cake", "Pancake", "Bacon", "Popcorn"],
  places: ["Eiffel Tower", "Great Wall", "Pyramids", "Colosseum", "Taj Mahal", "Statue of Liberty", "Sydney Opera", "Grand Canyon", "Niagara Falls", "Mount Everest", "Beach", "Forest", "Desert", "Jungle", "Castle"]
};

type GamePhase = "select" | "countdown" | "reveal" | "active" | "done";

// Client component that uses all hooks
function CharadesContent() {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>("select");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState("");
  const [roundTime, setRoundTime] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showWord, setShowWord] = useState(false);
  const [paperUnrolling, setPaperUnrolling] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [teamScore, setTeamScore] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play sound effect
  const playSound = useCallback((type: 'tick' | 'done' | 'correct' | 'skip') => {
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
      case 'tick':
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.1;
        oscillator.type = 'sine';
        break;
      case 'done':
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.15;
        oscillator.type = 'square';
        break;
      case 'correct':
        oscillator.frequency.value = 1046.50;
        gainNode.gain.value = 0.12;
        oscillator.type = 'sine';
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          osc2.frequency.value = 1318.52;
          osc2.connect(gainNode);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.2);
        }, 100);
        break;
      case 'skip':
        oscillator.frequency.value = 220;
        gainNode.gain.value = 0.1;
        oscillator.type = 'sawtooth';
        break;
    }
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
    oscillator.stop(ctx.currentTime + 0.3);
  }, [soundEnabled]);

  // Get random word from category
  const getRandomWord = useCallback((categoryId: string) => {
    const words = WORDS_BY_CATEGORY[categoryId] || WORDS_BY_CATEGORY.movies;
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
  }, []);

  // Start countdown before revealing word
  const startCountdown = () => {
    setPhase("countdown");
    setCountdown(3);
    setPaperUnrolling(false);
    setShowWord(false);
    
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          revealWord();
          return 0;
        }
        playSound('tick');
        return prev - 1;
      });
    }, 1000);
  };

  // Reveal word with paper animation
  const revealWord = () => {
    setPhase("reveal");
    setPaperUnrolling(true);
    setTimeout(() => {
      setShowWord(true);
      setPhase("active");
      startTimer();
    }, 800);
  };

  // Start timer for the round
  const startTimer = () => {
    setTimeLeft(roundTime);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          playSound('done');
          endRound();
          return 0;
        }
        if (prev <= 6 && prev > 1) {
          playSound('tick');
        }
        return prev - 1;
      });
    }, 1000);
  };

  // End current round - automatically go to next word
  const endRound = () => {
    clearInterval(timerRef.current!);
    setPhase("done");
  };

  // Handle correct guess
  const handleCorrect = () => {
    if (phase === "active") {
      playSound('correct');
      setTeamScore(prev => prev + 1);
      // Automatically load next word
      loadNextWord();
    }
  };

  // Handle skip
  const handleSkip = () => {
    if (phase === "active") {
      playSound('skip');
      loadNextWord();
    }
  };

  // Load next word without ending the round
  const loadNextWord = () => {
    const newWord = getRandomWord(selectedCategory!);
    setCurrentWord(newWord);
    // Reset paper animation for new word
    setShowWord(false);
    setPaperUnrolling(false);
    setTimeout(() => {
      setPaperUnrolling(true);
      setTimeout(() => {
        setShowWord(true);
      }, 800);
    }, 100);
  };

  // Start new round (after timer expires)
  const startNewRound = () => {
    setRoundsPlayed(prev => prev + 1);
    setShowWord(false);
    setPaperUnrolling(false);
    
    // Get new word
    if (selectedCategory) {
      const newWord = getRandomWord(selectedCategory);
      setCurrentWord(newWord);
    }
    
    // Reset timer and start countdown again
    setTimeLeft(roundTime);
    startCountdown();
  };

  // Start game with selected category
  const startGame = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const word = getRandomWord(categoryId);
    setCurrentWord(word);
    setTeamScore(0);
    setRoundsPlayed(0);
    startCountdown();
  };

  // Reset game completely
  const resetGame = () => {
    clearInterval(timerRef.current!);
    clearInterval(countdownRef.current!);
    setPhase("select");
    setSelectedCategory(null);
    setCurrentWord("");
    setTeamScore(0);
    setRoundsPlayed(0);
    setTimeLeft(roundTime);
    setShowWord(false);
    setPaperUnrolling(false);
  };

  // Change round time
  const changeRoundTime = (seconds: number) => {
    setRoundTime(seconds);
  };

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Timer circle calculation
  const circumference = 2 * Math.PI * 54;
  const progress = timeLeft / roundTime;

  // Get category color
  const getCategoryColor = () => {
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    return cat?.color || "#ff2d78";
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
            Charades
          </h1>
          <p className="text-xs opacity-40">Act it out!</p>
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
              <p>1. 🎭 Pick a category</p>
              <p>2. ⏱️ Choose time limit</p>
              <p>3. 📜 Word appears on the paper</p>
              <p>4. 🎬 Act it out without speaking</p>
              <p>5. ✅ Click CORRECT when guessed → +1 point</p>
              <p>6. ⏩ Click SKIP to get a new word</p>
              <p>7. 🏆 Try to get as many points as possible before time runs out!</p>
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

      {/* Game Content */}
      {phase === "select" && (
        <div className="animate-fade-in">
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">🎭</div>
            <h2 className="text-2xl font-bold mb-2">Choose a Category</h2>
            <p className="text-sm opacity-60">Pick a theme for your charades</p>
            
            {/* Time selector */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <Clock size={14} className="opacity-60" />
              <span className="text-xs opacity-60">Time limit:</span>
              {[30, 45, 60, 90].map((sec) => (
                <button
                  key={sec}
                  onClick={() => changeRoundTime(sec)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    roundTime === sec 
                      ? "bg-neon-pink text-white" 
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
            <p className="text-xs opacity-40 mt-3">⚡ Guess as many words as possible before time runs out!</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => startGame(cat.id)}
                className="p-4 rounded-2xl text-center transition-all bg-white/5 border border-white/10 hover:scale-105 hover:border-neon-cyan group"
              >
                <div className="text-3xl mb-2">{cat.emoji}</div>
                <div className="font-bold text-sm group-hover:text-neon-cyan transition-colors">
                  {cat.name}
                </div>
                <div className="text-xs opacity-40 mt-1">{WORDS_BY_CATEGORY[cat.id].length} words</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "countdown" && (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div 
            className="text-8xl font-black animate-bounce" 
            style={{ fontFamily: "var(--font-display)", color: "var(--neon-yellow)" }}
          >
            {countdown}
          </div>
          <p className="text-sm opacity-60 mt-4">Get ready to act!</p>
          <p className="text-xs opacity-40 mt-2">Category: {CATEGORIES.find(c => c.id === selectedCategory)?.name}</p>
        </div>
      )}

      {(phase === "reveal" || phase === "active" || phase === "done") && (
        <>
          {/* Score and Timer */}
          <div className="flex justify-between items-center mb-6">
            <div className="bg-white/5 px-4 py-2 rounded-full">
              <span className="text-sm opacity-60">Score: </span>
              <span className="text-2xl font-bold text-neon-pink">{teamScore}</span>
            </div>
            <div className="bg-white/5 px-3 py-2 rounded-full">
              <span className="text-xs opacity-60">Words/sec: </span>
              <span className="text-sm font-bold">{(teamScore / (roundTime - timeLeft || 1)).toFixed(1)}</span>
            </div>
            {phase === "active" && (
              <div className="relative">
                <svg width="60" height="60">
                  <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                  <circle
                    cx="30" cy="30" r="25"
                    fill="none"
                    stroke={progress > 0.5 ? "#00ff88" : progress > 0.25 ? "#ffaa00" : "#ff2d78"}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    strokeLinecap="round"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{timeLeft}</span>
                </div>
              </div>
            )}
          </div>

          {/* Category Badge */}
          {selectedCategory && (
            <div className="text-center mb-4">
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10"
                style={{ borderLeft: `3px solid ${getCategoryColor()}` }}
              >
                <span className="text-sm">Category:</span>
                <span className="text-sm font-bold" style={{ color: getCategoryColor() }}>
                  {CATEGORIES.find(c => c.id === selectedCategory)?.name}
                </span>
              </div>
            </div>
          )}

          {/* Torn Paper Reveal Card */}
          <div className="flex-1 flex items-center justify-center my-8">
            <div 
              className={`relative w-full max-w-sm transition-all duration-700 ${
                paperUnrolling ? "scale-100 opacity-100" : "scale-50 opacity-0"
              }`}
              style={{
                minHeight: "340px",
                transformOrigin: "top center",
              }}
            >
              {/* Torn Paper Background */}
              <div className="absolute inset-0 bg-[#f5f0e1] rounded-lg shadow-2xl overflow-hidden">
                {/* Torn edges */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-[#f5f0e1]">
                  <div className="absolute -top-2 left-0 right-0 h-4 bg-[#f5f0e1]" 
                    style={{ clipPath: "polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%)" }} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#f5f0e1]"
                  style={{ clipPath: "polygon(0% 100%, 100% 100%, 95% 0%, 5% 0%)" }} />
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-[#f5f0e1]"
                  style={{ clipPath: "polygon(0% 0%, 100% 5%, 100% 95%, 0% 100%)" }} />
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-[#f5f0e1]"
                  style={{ clipPath: "polygon(100% 0%, 0% 5%, 0% 95%, 100% 100%)" }} />
                
                {/* Paper texture */}
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-repeat" 
                  style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                
                {/* Fold lines */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#d4c9a8] opacity-40" />
                <div className="absolute left-0 right-0 top-1/2 h-px bg-[#d4c9a8] opacity-40" />
                
                {/* Coffee stain effect */}
                <div className="absolute bottom-8 right-4 w-16 h-16 rounded-full bg-[#8b7355] opacity-10 blur-sm" />
                <div className="absolute top-12 left-4 w-12 h-12 rounded-full bg-[#8b7355] opacity-5 blur-sm" />
              </div>
              
              {/* Content */}
              <div className="relative z-10 p-8 text-center min-h-[340px] flex flex-col items-center justify-center">
                {!showWord && phase === "reveal" && (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-3 border-amber-800/30 border-t-amber-800 rounded-full animate-spin" />
                    <p className="text-amber-800 mt-4 text-sm">Revealing...</p>
                  </div>
                )}
                
                {showWord && (
                  <div className="animate-fade-in">
                    <div className="text-5xl mb-4">{CATEGORIES.find(c => c.id === selectedCategory)?.emoji}</div>
                    <h2 className="text-3xl font-black text-amber-900 mb-4" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                      {currentWord}
                    </h2>
                    <div className="w-24 h-px bg-amber-800/30 mx-auto my-4" />
                    <p className="text-amber-800/70 text-sm">
                      Act it out! No talking, no sounds!
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-700">
                      <span>🎭</span>
                      <span>Use gestures only</span>
                      <span>🎭</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {phase === "active" && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSkip}
                className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
              >
                <X size={18} />
                Skip
              </button>
              <button
                onClick={handleCorrect}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-neon-green to-emerald-600 font-bold flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <Check size={18} />
                Correct! +1
              </button>
            </div>
          )}

          {phase === "done" && (
            <div className="text-center mt-6">
              <div className="text-6xl mb-3">⏰</div>
              <p className="text-lg mb-2">Time's up!</p>
              <p className="text-2xl font-bold text-neon-pink mb-2">{teamScore} points!</p>
              <p className="text-sm opacity-60 mb-4">You guessed {teamScore} word{teamScore !== 1 ? "s" : ""} in {roundTime} seconds</p>
              
              <button
                onClick={startNewRound}
                className="btn-neon btn-pink w-full py-4 flex items-center justify-center gap-2"
              >
                <Play size={18} />
                Play Again
              </button>
              
              <button
                onClick={resetGame}
                className="w-full mt-3 py-3 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
              >
                <RefreshCw size={18} />
                Change Category
              </button>
            </div>
          )}
        </>
      )}

      {/* Game Stats during active play */}
      {phase === "active" && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs opacity-40">
            <Sparkles size={12} />
            <span>Click CORRECT when guessed → +1 point & new word!</span>
            <Sparkles size={12} />
          </div>
        </div>
      )}
    </main>
  );
}

// Add CSS animations (runs on client only)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-20px);
      }
    }
    
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out;
    }
    
    .animate-bounce {
      animation: bounce 1s ease-in-out infinite;
    }
  `;
  
  if (!document.querySelector('#charades-styles')) {
    style.id = 'charades-styles';
    document.head.appendChild(style);
  }
}

// Main export with Suspense boundary - NO "use client" here
export default function CharadesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-pink mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading game...</p>
        </div>
      </div>
    }>
      <CharadesContent />
    </Suspense>
  );
}