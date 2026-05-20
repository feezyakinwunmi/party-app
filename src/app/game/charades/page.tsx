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

// ======================
// CATEGORIES
// ======================

const CATEGORIES = [
  {
    id: "animals",
    name: "Animals",
    emoji: "🐘",
    color: "#00f5ff",
  },

  {
    id: "professions",
    name: "Professions",
    emoji: "💼",
    color: "#ffaa00",
  },

  {
    id: "actions",
    name: "Actions",
    emoji: "🏃",
    color: "#bf00ff",
  },

  {
    id: "objects",
    name: "Objects",
    emoji: "📦",
    color: "#00ff88",
  },

  {
    id: "sports",
    name: "Sports",
    emoji: "⚽",
    color: "#00f5ff",
  },

  {
    id: "emotions",
    name: "Emotions",
    emoji: "😂",
    color: "#ff2d78",
  },

  {
    id: "superheroes",
    name: "Superheroes",
    emoji: "🦸",
    color: "#ff6600",
  },

  {
    id: "daily-life",
    name: "Daily Life",
    emoji: "🏠",
    color: "#ffaa00",
  },
];

// ======================
// WORDS
// ======================

const WORDS_BY_CATEGORY: Record<string, string[]> = {
  animals: [
    "Elephant",
    "Monkey",
    "Snake",
    "Kangaroo",
    "Penguin",
    "Dog",
    "Cat",
    "Lion",
    "Tiger",
    "Chicken",
    "Rabbit",
    "Gorilla",
    "Fish",
    "Bird",
    "Horse",
  ],

  professions: [
    "Doctor",
    "Teacher",
    "Police",
    "Chef",
    "Pilot",
    "Firefighter",
    "Footballer",
    "Farmer",
    "Boxer",
    "Photographer",
    "Barber",
    "Dancer",
    "Singer",
    "Driver",
    "Mechanic",
  ],

  actions: [
    "Running",
    "Swimming",
    "Sleeping",
    "Eating",
    "Jumping",
    "Laughing",
    "Crying",
    "Dancing",
    "Flying",
    "Driving",
    "Typing",
    "Cleaning",
    "Brushing Teeth",
    "Taking Selfie",
    "Working Out",
  ],

  objects: [
    "Phone",
    "Laptop",
    "Umbrella",
    "Toothbrush",
    "Television",
    "Camera",
    "Guitar",
    "Bottle",
    "Fan",
    "Pillow",
    "Microwave",
    "Backpack",
    "Chair",
    "Clock",
    "Scissors",
  ],

  sports: [
    "Football",
    "Basketball",
    "Tennis",
    "Boxing",
    "Swimming",
    "Cycling",
    "Volleyball",
    "Bowling",
    "Golf",
    "Rugby",
    "Surfing",
    "Weightlifting",
    "Skipping Rope",
    "Baseball",
    "Hockey",
  ],

  emotions: [
    "Happy",
    "Sad",
    "Angry",
    "Excited",
    "Scared",
    "Confused",
    "Shy",
    "Proud",
    "Tired",
    "Surprised",
    "Embarrassed",
    "Bored",
    "Nervous",
    "Jealous",
    "Crying Laughing",
  ],

  superheroes: [
    "Spider-Man",
    "Batman",
    "Superman",
    "Iron Man",
    "Hulk",
    "Thor",
    "Wonder Woman",
    "Flash",
    "Black Panther",
    "Captain America",
    "Doctor Strange",
    "Deadpool",
    "Wolverine",
    "Aquaman",
    "Loki",
  ],

  "daily-life": [
    "Cooking",
    "Washing Clothes",
    "Sleeping Late",
    "Going to School",
    "Taking a Shower",
    "Shopping",
    "Watching TV",
    "Playing Video Games",
    "Texting",
    "Eating Breakfast",
    "Driving to Work",
    "Cleaning Room",
    "Walking the Dog",
    "Making Coffee",
    "Gym Workout",
  ],
};

type GamePhase =
  | "select"
  | "countdown"
  | "reveal"
  | "active"
  | "done";

function CharadesContent() {
  const router = useRouter();

  const [phase, setPhase] =
    useState<GamePhase>("select");

  const [selectedCategories, setSelectedCategories] =
    useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);

  const [currentWord, setCurrentWord] =
    useState("");

  const [roundTime, setRoundTime] =
    useState(60);

  const [timeLeft, setTimeLeft] =
    useState(60);

  const [showWord, setShowWord] =
    useState(false);

  const [paperUnrolling, setPaperUnrolling] =
    useState(false);

  const [countdown, setCountdown] =
    useState(3);

  const [teamScore, setTeamScore] =
    useState(0);

  const [soundEnabled, setSoundEnabled] =
    useState(true);

  const [showInstructions, setShowInstructions] =
    useState(false);

  const timerRef =
    useRef<NodeJS.Timeout | null>(null);

  const countdownRef =
    useRef<NodeJS.Timeout | null>(null);

  const audioContextRef =
    useRef<AudioContext | null>(null);

  // ======================
  // USED WORDS TRACKER
  // ======================

  const usedWordsRef = useRef<Set<string>>(
    new Set()
  );

  // ======================
  // TOGGLE CATEGORY
  // ======================

  const toggleCategory = (
    categoryId: string
  ) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter(
          (id) => id !== categoryId
        );
      }

      return [...prev, categoryId];
    });
  };

  // ======================
  // WORD POOL
  // ======================

  const allWords =
    selectedCategories.flatMap((category) =>
      (WORDS_BY_CATEGORY[category] || []).map(
        (word) => ({
          word,
          category,
        })
      )
    );

  // ======================
  // SHUFFLE
  // ======================

  const shuffleArray = <T,>(array: T[]) => {
    return [...array].sort(
      () => Math.random() - 0.5
    );
  };

  // ======================
  // GET RANDOM WORD
  // ======================

  const getRandomWord = useCallback(() => {
    const unusedWords = allWords.filter(
      (item) =>
        !usedWordsRef.current.has(
          `${item.category}-${item.word}`
        )
    );

    // RESET IF ALL USED

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
  }, [allWords]);

  // ======================
  // SOUND
  // ======================

  const playSound = useCallback(
    (
      type:
        | "tick"
        | "done"
        | "correct"
        | "skip"
    ) => {
      if (!soundEnabled) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext ||
          (window as any).webkitAudioContext
        )();
      }

      const ctx = audioContextRef.current;

      const oscillator =
        ctx.createOscillator();

      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);

      gainNode.connect(ctx.destination);

      switch (type) {
        case "tick":
          oscillator.frequency.value = 880;
          oscillator.type = "sine";
          gainNode.gain.value = 0.1;
          break;

        case "done":
          oscillator.frequency.value = 440;
          oscillator.type = "square";
          gainNode.gain.value = 0.15;
          break;

        case "correct":
          oscillator.frequency.value = 1046;
          oscillator.type = "sine";
          gainNode.gain.value = 0.12;
          break;

        case "skip":
          oscillator.frequency.value = 220;
          oscillator.type = "sawtooth";
          gainNode.gain.value = 0.1;
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

  // ======================
  // START COUNTDOWN
  // ======================

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

  // ======================
  // REVEAL WORD
  // ======================

  const revealWord = () => {
    setPhase("reveal");

    setPaperUnrolling(true);

    setTimeout(() => {
      setShowWord(true);

      setPhase("active");

      startTimer();
    }, 800);
  };

  // ======================
  // START TIMER
  // ======================

  const startTimer = () => {
    setTimeLeft(roundTime);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);

          playSound("done");

          setPhase("done");

          return 0;
        }

        if (prev <= 6 && prev > 1) {
          playSound("tick");
        }

        return prev - 1;
      });
    }, 1000);
  };

  // ======================
  // LOAD NEXT WORD
  // ======================

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
      }, 500);
    }, 100);
  };

  // ======================
  // CORRECT
  // ======================

  const handleCorrect = () => {
    playSound("correct");

    setTeamScore((prev) => prev + 1);

    loadNextWord();
  };

  // ======================
  // SKIP
  // ======================

  const handleSkip = () => {
    playSound("skip");

    loadNextWord();
  };

  // ======================
  // START GAME
  // ======================

  const startGame = () => {
    if (selectedCategories.length === 0)
      return;

    const randomItem = getRandomWord();

    setCurrentWord(randomItem.word);

    setSelectedCategory(randomItem.category);

    setTeamScore(0);

    startCountdown();
  };

  // ======================
  // RESET GAME
  // ======================

  const resetGame = () => {
    if (timerRef.current)
      clearInterval(timerRef.current);

    if (countdownRef.current)
      clearInterval(countdownRef.current);

    usedWordsRef.current.clear();

    setPhase("select");

    setCurrentWord("");

    setSelectedCategory(null);

    setTeamScore(0);

    setShowWord(false);

    setPaperUnrolling(false);

    setTimeLeft(roundTime);
  };

  // ======================
  // CLEANUP
  // ======================

  useEffect(() => {
    return () => {
      if (timerRef.current)
        clearInterval(timerRef.current);

      if (countdownRef.current)
        clearInterval(countdownRef.current);
    };
  }, []);

  // ======================
  // TIMER UI
  // ======================

  const circumference =
    2 * Math.PI * 25;

  const progress = timeLeft / roundTime;

  const getCategoryColor = () => {
    const cat = CATEGORIES.find(
      (c) => c.id === selectedCategory
    );

    return cat?.color || "#ff2d78";
  };

  return (
    <main className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e] text-white">
      {/* ====================== */}
      {/* HEADER */}
      {/* ====================== */}

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center">
          <h1 className="text-xl font-black text-cyan-400">
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
            className="p-2 rounded-xl bg-white/5"
          >
            {soundEnabled ? (
              <Volume2 size={18} />
            ) : (
              <VolumeX size={18} />
            )}
          </button>

          <button
            onClick={() =>
              setShowInstructions(
                !showInstructions
              )
            }
            className="p-2 rounded-xl bg-white/5"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* ====================== */}
      {/* INSTRUCTIONS */}
      {/* ====================== */}

      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm mx-4 p-6 rounded-2xl bg-[#181825] border border-white/10">
            <button
              onClick={() =>
                setShowInstructions(false)
              }
              className="absolute top-4 right-4"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-4 text-cyan-400">
              How To Play
            </h3>

            <div className="space-y-3 text-sm">
              <p>
                1. Select one or more categories
              </p>

              <p>
                2. Start the game
              </p>

              <p>
                3. Act the word without talking
              </p>

              <p>
                4. Team guesses the word
              </p>

              <p>
                5. Correct = +1 point
              </p>

              <p>
                6. Skip if too hard
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================== */}
      {/* SELECT SCREEN */}
      {/* ====================== */}

      {phase === "select" && (
        <div>
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">
              🎭
            </div>

            <h2 className="text-2xl font-bold mb-2">
              Select Categories
            </h2>

            <p className="text-sm opacity-60">
              Choose multiple categories
            </p>

            {/* TIME */}

            <div className="mt-5 flex items-center justify-center gap-2">
              <Clock size={14} />

              {[30, 45, 60, 90].map((sec) => (
                <button
                  key={sec}
                  onClick={() =>
                    setRoundTime(sec)
                  }
                  className={`px-3 py-1 rounded-full text-xs ${
                    roundTime === sec
                      ? "bg-pink-500"
                      : "bg-white/10"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* CATEGORY GRID */}

          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const active =
                selectedCategories.includes(
                  cat.id
                );

              return (
                <button
                  key={cat.id}
                  onClick={() =>
                    toggleCategory(cat.id)
                  }
                  className={`p-4 rounded-2xl border transition-all ${
                    active
                      ? "bg-white/20 border-white scale-105"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="text-3xl mb-2">
                    {cat.emoji}
                  </div>

                  <div className="font-bold text-sm">
                    {cat.name}
                  </div>

                  <div className="text-xs opacity-40 mt-1">
                    {
                      WORDS_BY_CATEGORY[
                        cat.id
                      ].length
                    }{" "}
                    words
                  </div>
                </button>
              );
            })}
          </div>

          {/* START */}

          <button
            onClick={startGame}
            disabled={
              selectedCategories.length === 0
            }
            className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-lg disabled:opacity-40"
          >
            Start Game (
            {selectedCategories.length})
          </button>
        </div>
      )}

      {/* ====================== */}
      {/* COUNTDOWN */}
      {/* ====================== */}

      {phase === "countdown" && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-8xl font-black animate-bounce text-yellow-400">
            {countdown}
          </div>

          <p className="mt-4 opacity-60">
            Get Ready!
          </p>
        </div>
      )}

      {/* ====================== */}
      {/* GAME */}
      {/* ====================== */}

      {(phase === "reveal" ||
        phase === "active" ||
        phase === "done") && (
        <>
          {/* SCORE */}

          <div className="flex justify-between items-center mb-6">
            <div className="bg-white/5 px-4 py-2 rounded-full">
              <span className="opacity-60">
                Score:
              </span>

              <span className="ml-2 text-pink-400 font-bold text-xl">
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
                    stroke="#00ff88"
                    strokeWidth="4"
                    strokeDasharray={
                      circumference
                    }
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

          {/* CATEGORY */}

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
                    color:
                      getCategoryColor(),
                  }}
                >
                  {
                    CATEGORIES.find(
                      (c) =>
                        c.id ===
                        selectedCategory
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
            >
              <div className="bg-[#f5f0e1] rounded-2xl shadow-2xl p-8 min-h-[320px] flex flex-col justify-center items-center text-center">
                {!showWord &&
                  phase === "reveal" && (
                    <>
                      <div className="w-12 h-12 border-4 border-amber-700/30 border-t-amber-700 rounded-full animate-spin" />

                      <p className="mt-4 text-amber-900">
                        Revealing...
                      </p>
                    </>
                  )}

                {showWord && (
                  <>
                    <div className="text-5xl mb-4">
                      {
                        CATEGORIES.find(
                          (c) =>
                            c.id ===
                            selectedCategory
                        )?.emoji
                      }
                    </div>

                    <h2 className="text-4xl font-black text-amber-900">
                      {currentWord}
                    </h2>

                    <p className="mt-4 text-sm text-amber-800/70">
                      Act it out!
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}

          {phase === "active" && (
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 font-bold flex items-center justify-center gap-2"
              >
                <X size={18} />
                Skip
              </button>

              <button
                onClick={handleCorrect}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-bold flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Correct
              </button>
            </div>
          )}

          {/* DONE */}

          {phase === "done" && (
            <div className="text-center mt-6">
              <div className="text-6xl mb-3">
                ⏰
              </div>

              <p className="text-xl mb-2">
                Time's up!
              </p>

              <p className="text-3xl font-black text-pink-400 mb-4">
                {teamScore} points
              </p>

              <button
                onClick={startGame}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold flex items-center justify-center gap-2"
              >
                <Play size={18} />
                Play Again
              </button>

              <button
                onClick={resetGame}
                className="w-full mt-3 py-3 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Change Categories
              </button>
            </div>
          )}
        </>
      )}

      {/* FOOTER */}

      {phase === "active" && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs opacity-40">
            <Sparkles size={12} />

            <span>
              Guess as many as possible!
            </span>

            <Sparkles size={12} />
          </div>
        </div>
      )}
    </main>
  );
}

// ======================
// PAGE
// ======================

export default function CharadesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          Loading...
        </div>
      }
    >
      <CharadesContent />
    </Suspense>
  );
}