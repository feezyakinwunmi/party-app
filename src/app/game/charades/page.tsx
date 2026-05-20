"use client";

import { Suspense } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Check,
  X,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  HelpCircle,
  Play,
} from "lucide-react";

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
  { id: "places", name: "Places", emoji: "🗺️", color: "#00ff88" },
];

// Words for each category
const WORDS_BY_CATEGORY: Record<string, string[]> = {
  movies: [
    "Titanic",
    "Avatar",
    "Inception",
    "The Matrix",
    "Frozen",
    "Jaws",
    "Rocky",
    "Gladiator",
    "Interstellar",
    "The Godfather",
    "Jurassic Park",
    "Star Wars",
    "Harry Potter",
    "The Lion King",
    "Toy Story",
  ],

  animals: [
    "Elephant",
    "Giraffe",
    "Penguin",
    "Kangaroo",
    "Dolphin",
    "Octopus",
    "Butterfly",
    "Peacock",
    "Panda",
    "Flamingo",
    "Zebra",
    "Lion",
    "Tiger",
    "Monkey",
    "Gorilla",
  ],

  professions: [
    "Doctor",
    "Teacher",
    "Lawyer",
    "Chef",
    "Pilot",
    "Firefighter",
    "Artist",
    "Musician",
    "Scientist",
    "Engineer",
    "Nurse",
    "Police",
    "Farmer",
    "Dancer",
    "Writer",
  ],

  actions: [
    "Running",
    "Swimming",
    "Dancing",
    "Cooking",
    "Singing",
    "Reading",
    "Sleeping",
    "Laughing",
    "Crying",
    "Jumping",
    "Eating",
    "Driving",
    "Flying",
    "Fighting",
    "Hugging",
  ],

  objects: [
    "Toothbrush",
    "Refrigerator",
    "Television",
    "Laptop",
    "Umbrella",
    "Sunglasses",
    "Microwave",
    "Backpack",
    "Clock",
    "Lamp",
    "Telephone",
    "Scissors",
    "Bicycle",
    "Guitar",
    "Camera",
  ],

  celebrities: [
    "Elvis Presley",
    "Marilyn Monroe",
    "Michael Jackson",
    "Beyoncé",
    "Elon Musk",
    "Taylor Swift",
    "The Rock",
    "Oprah",
    "Drake",
    "Rihanna",
    "Einstein",
    "Shakespeare",
    "Madonna",
    "Prince",
    "Adele",
  ],

  sports: [
    "Soccer",
    "Basketball",
    "Tennis",
    "Baseball",
    "Golf",
    "Boxing",
    "Swimming",
    "Cycling",
    "Volleyball",
    "Hockey",
    "Cricket",
    "Rugby",
    "Skiing",
    "Surfing",
    "Bowling",
  ],

  music: [
    "Piano",
    "Guitar",
    "Drums",
    "Violin",
    "Flute",
    "Saxophone",
    "Trumpet",
    "Harp",
    "Accordion",
    "Xylophone",
    "DJ",
    "Microphone",
    "Headphones",
    "Concert",
    "Festival",
  ],

  food: [
    "Pizza",
    "Burger",
    "Sushi",
    "Pasta",
    "Ice Cream",
    "Chocolate",
    "Salad",
    "Steak",
    "Curry",
    "Taco",
    "Donut",
    "Cake",
    "Pancake",
    "Bacon",
    "Popcorn",
  ],

  places: [
    "Eiffel Tower",
    "Great Wall",
    "Pyramids",
    "Colosseum",
    "Taj Mahal",
    "Statue of Liberty",
    "Sydney Opera",
    "Grand Canyon",
    "Niagara Falls",
    "Mount Everest",
    "Beach",
    "Forest",
    "Desert",
    "Jungle",
    "Castle",
  ],
};

type GamePhase = "select" | "countdown" | "reveal" | "active" | "done";

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

  // TRACK USED WORDS
  const usedWordsRef = useRef<Set<string>>(new Set());

  // CREATE ONE BIG WORD POOL
  const allWords = Object.entries(WORDS_BY_CATEGORY).flatMap(
    ([category, words]) =>
      words.map((word) => ({
        word,
        category,
      }))
  );

  // SHUFFLE ARRAY
  const shuffleArray = <T,>(array: T[]) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  // GET RANDOM UNUSED WORD
  const getRandomWord = useCallback(() => {
    const unusedWords = allWords.filter(
      (item) =>
        !usedWordsRef.current.has(`${item.category}-${item.word}`)
    );

    // RESET WHEN ALL WORDS ARE USED
    if (unusedWords.length === 0) {
      usedWordsRef.current.clear();
    }

    const refreshedPool =
      unusedWords.length === 0
        ? shuffleArray(allWords)
        : shuffleArray(unusedWords);

    const selected = refreshedPool[0];

    usedWordsRef.current.add(
      `${selected.category}-${selected.word}`
    );

    return selected;
  }, []);

  // PLAY SOUND
  const playSound = useCallback(
    (type: "tick" | "done" | "correct" | "skip") => {
      if (!soundEnabled) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext ||
          (window as any).webkitAudioContext
        )();
      }

      const ctx = audioContextRef.current;

      const oscillator = ctx.createOscillator();

      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);

      gainNode.connect(ctx.destination);

      switch (type) {
        case "tick":
          oscillator.frequency.value = 880;
          gainNode.gain.value = 0.1;
          oscillator.type = "sine";
          break;

        case "done":
          oscillator.frequency.value = 440;
          gainNode.gain.value = 0.15;
          oscillator.type = "square";
          break;

        case "correct":
          oscillator.frequency.value = 1046.5;
          gainNode.gain.value = 0.12;
          oscillator.type = "sine";

          setTimeout(() => {
            const osc2 = ctx.createOscillator();

            osc2.frequency.value = 1318.52;

            osc2.connect(gainNode);

            osc2.start();

            osc2.stop(ctx.currentTime + 0.2);
          }, 100);

          break;

        case "skip":
          oscillator.frequency.value = 220;
          gainNode.gain.value = 0.1;
          oscillator.type = "sawtooth";
          break;
      }

      oscillator.start();

      gainNode.gain.exponentialRampToValueAtTime(
        0.00001,
        ctx.currentTime + 0.3
      );

      oscillator.stop(ctx.currentTime + 0.3);
    },
    [soundEnabled]
  );

  // START COUNTDOWN
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

        playSound("tick");

        return prev - 1;
      });
    }, 1000);
  };

  // REVEAL WORD
  const revealWord = () => {
    setPhase("reveal");

    setPaperUnrolling(true);

    setTimeout(() => {
      setShowWord(true);

      setPhase("active");

      startTimer();
    }, 800);
  };

  // START TIMER
  const startTimer = () => {
    setTimeLeft(roundTime);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);

          playSound("done");

          endRound();

          return 0;
        }

        if (prev <= 6 && prev > 1) {
          playSound("tick");
        }

        return prev - 1;
      });
    }, 1000);
  };

  // END ROUND
  const endRound = () => {
    clearInterval(timerRef.current!);

    setPhase("done");
  };

  // LOAD NEXT WORD
  const loadNextWord = () => {
    const randomItem = getRandomWord();

    setCurrentWord(randomItem.word);

    setSelectedCategory(randomItem.category);

    setShowWord(false);

    setPaperUnrolling(false);

    setTimeout(() => {
      setPaperUnrolling(true);

      setTimeout(() => {
        setShowWord(true);
      }, 800);
    }, 100);
  };

  // HANDLE CORRECT
  const handleCorrect = () => {
    if (phase === "active") {
      playSound("correct");

      setTeamScore((prev) => prev + 1);

      loadNextWord();
    }
  };

  // HANDLE SKIP
  const handleSkip = () => {
    if (phase === "active") {
      playSound("skip");

      loadNextWord();
    }
  };

  // START GAME
  const startGame = () => {
    const randomItem = getRandomWord();

    setSelectedCategory(randomItem.category);

    setCurrentWord(randomItem.word);

    setTeamScore(0);

    setRoundsPlayed(0);

    startCountdown();
  };

  // START NEW ROUND
  const startNewRound = () => {
    setRoundsPlayed((prev) => prev + 1);

    setShowWord(false);

    setPaperUnrolling(false);

    const randomItem = getRandomWord();

    setCurrentWord(randomItem.word);

    setSelectedCategory(randomItem.category);

    setTimeLeft(roundTime);

    startCountdown();
  };

  // RESET GAME
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

    usedWordsRef.current.clear();
  };

  // CHANGE ROUND TIME
  const changeRoundTime = (seconds: number) => {
    setRoundTime(seconds);
  };

  // CLEANUP
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);

      if (countdownRef.current)
        clearInterval(countdownRef.current);
    };
  }, []);

  const circumference = 2 * Math.PI * 54;

  const progress = timeLeft / roundTime;

  const getCategoryColor = () => {
    const cat = CATEGORIES.find(
      (c) => c.id === selectedCategory
    );

    return cat?.color || "#ff2d78";
  };

  return (
    <main className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center">
          <h1
            className="text-xl font-black"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--neon-cyan)",
            }}
          >
            Charades
          </h1>

          <p className="text-xs opacity-40">
            Act it out!
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              setSoundEnabled(!soundEnabled)
            }
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
          >
            {soundEnabled ? (
              <Volume2 size={18} />
            ) : (
              <VolumeX size={18} />
            )}
          </button>

          <button
            onClick={() =>
              setShowInstructions(!showInstructions)
            }
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* SELECT SCREEN */}
      {phase === "select" && (
        <div className="animate-fade-in">
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">🎭</div>

            <h2 className="text-2xl font-bold mb-2">
              Random Charades
            </h2>

            <p className="text-sm opacity-60">
              Words will be selected from ALL categories
            </p>

            {/* TIME SELECTOR */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <Clock size={14} className="opacity-60" />

              <span className="text-xs opacity-60">
                Time limit:
              </span>

              {[30, 45, 60, 90].map((sec) => (
                <button
                  key={sec}
                  onClick={() =>
                    changeRoundTime(sec)
                  }
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

            <button
              onClick={startGame}
              className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-neon-pink to-purple-600 font-bold text-lg hover:scale-105 transition-all"
            >
              Start Random Game
            </button>
          </div>

          {/* CATEGORY PREVIEW */}
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl text-center bg-white/5 border border-white/10"
              >
                <div className="text-3xl mb-2">
                  {cat.emoji}
                </div>

                <div className="font-bold text-sm">
                  {cat.name}
                </div>

                <div className="text-xs opacity-40 mt-1">
                  {
                    WORDS_BY_CATEGORY[cat.id]
                      .length
                  }{" "}
                  words
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COUNTDOWN */}
      {phase === "countdown" && (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div
            className="text-8xl font-black animate-bounce"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--neon-yellow)",
            }}
          >
            {countdown}
          </div>

          <p className="text-sm opacity-60 mt-4">
            Get ready to act!
          </p>
        </div>
      )}

      {(phase === "reveal" ||
        phase === "active" ||
        phase === "done") && (
        <>
          {/* SCORE + TIMER */}
          <div className="flex justify-between items-center mb-6">
            <div className="bg-white/5 px-4 py-2 rounded-full">
              <span className="text-sm opacity-60">
                Score:
              </span>

              <span className="text-2xl font-bold text-neon-pink ml-2">
                {teamScore}
              </span>
            </div>

            {phase === "active" && (
              <div className="relative">
                <svg width="60" height="60">
                  <circle
                    cx="30"
                    cy="30"
                    r="25"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                  />

                  <circle
                    cx="30"
                    cy="30"
                    r="25"
                    fill="none"
                    stroke={
                      progress > 0.5
                        ? "#00ff88"
                        : progress > 0.25
                        ? "#ffaa00"
                        : "#ff2d78"
                    }
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={
                      circumference *
                      (1 - progress)
                    }
                    strokeLinecap="round"
                    style={{
                      transform:
                        "rotate(-90deg)",
                      transformOrigin:
                        "50% 50%",
                      transition:
                        "stroke-dashoffset 1s linear",
                    }}
                  />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {timeLeft}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* CATEGORY BADGE */}
          {selectedCategory && (
            <div className="text-center mb-4">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10"
                style={{
                  borderLeft: `3px solid ${getCategoryColor()}`,
                }}
              >
                <span className="text-sm">
                  Category:
                </span>

                <span
                  className="text-sm font-bold"
                  style={{
                    color: getCategoryColor(),
                  }}
                >
                  {
                    CATEGORIES.find(
                      (c) =>
                        c.id === selectedCategory
                    )?.name
                  }
                </span>
              </div>
            </div>
          )}

          {/* WORD CARD */}
          <div className="flex-1 flex items-center justify-center my-8">
            <div
              className={`relative w-full max-w-sm transition-all duration-700 ${
                paperUnrolling
                  ? "scale-100 opacity-100"
                  : "scale-50 opacity-0"
              }`}
              style={{
                minHeight: "340px",
              }}
            >
              <div className="absolute inset-0 bg-[#f5f0e1] rounded-lg shadow-2xl" />

              <div className="relative z-10 p-8 text-center min-h-[340px] flex flex-col items-center justify-center">
                {!showWord &&
                  phase === "reveal" && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-3 border-amber-800/30 border-t-amber-800 rounded-full animate-spin" />

                      <p className="text-amber-800 mt-4 text-sm">
                        Revealing...
                      </p>
                    </div>
                  )}

                {showWord && (
                  <div className="animate-fade-in">
                    <div className="text-5xl mb-4">
                      {
                        CATEGORIES.find(
                          (c) =>
                            c.id ===
                            selectedCategory
                        )?.emoji
                      }
                    </div>

                    <h2
                      className="text-3xl font-black text-amber-900 mb-4"
                      style={{
                        fontFamily:
                          "var(--font-display)",
                      }}
                    >
                      {currentWord}
                    </h2>

                    <p className="text-amber-800/70 text-sm">
                      Act it out!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE BUTTONS */}
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

          {/* DONE */}
          {phase === "done" && (
            <div className="text-center mt-6">
              <div className="text-6xl mb-3">⏰</div>

              <p className="text-lg mb-2">
                Time's up!
              </p>

              <p className="text-2xl font-bold text-neon-pink mb-2">
                {teamScore} points!
              </p>

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
                Reset Game
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

// MAIN EXPORT
export default function CharadesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-pink mx-auto"></div>

            <p className="mt-4 text-gray-400">
              Loading game...
            </p>
          </div>
        </div>
      }
    >
      <CharadesContent />
    </Suspense>
  );
}