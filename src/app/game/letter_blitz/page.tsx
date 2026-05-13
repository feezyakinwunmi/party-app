"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session } from "@/types";
import {
  Zap, RotateCcw, Home, Timer, Dice5, AlertCircle,
  Volume2, VolumeX, Settings, Clock, Crown
} from "lucide-react";

const CATEGORIES = [
  "Start a sentence", "Name a song", "Name a food", "Name a country",
  "Name a movie", "Name a celebrity", "Name a brand", "Name an animal",
  "Name a city", "Name a sport", "Name a TV show", "Name a car brand",
  "Name a drink", "Name a hobby", "Name a profession",
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type BlitzPhase = "idle" | "countdown" | "spinning" | "active" | "done";

export default function LetterBlitzPage() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code") || "";

  const [session, setSession] = useState<Session | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [phase, setPhase] = useState<BlitzPhase>("idle");
  const [letter, setLetter] = useState("?");
  const [category, setCategory] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [duration, setDuration] = useState(30);
  const [customCat, setCustomCat] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Host Check
  useEffect(() => {
    const isUserHost = sessionStorage.getItem("pm_is_host") === "true";
    setIsHost(isUserHost);
    if (!isUserHost) router.push("/");
  }, [router]);

  // Load Session
  useEffect(() => {
    if (!code) return;
    supabase.from("sessions").select("*").eq("code", code).single().then(({ data }) => {
      if (data) setSession(data);
    });
  }, [code]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
      if (countIntervalRef.current) clearInterval(countIntervalRef.current);
    };
  }, []);

  const playSound = useCallback((type: 'tick' | 'done' | 'spin') => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'tick') oscillator.frequency.value = 880;
    if (type === 'done') oscillator.frequency.value = 440;
    if (type === 'spin') oscillator.frequency.value = 720;

    oscillator.type = type === 'done' ? 'square' : 'sine';
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    oscillator.stop(ctx.currentTime + 0.3);
  }, [soundEnabled]);

  // Start Game (2 seconds countdown)
  function startGame() {
    if (phase !== "idle") return;

    setPhase("countdown");
    setLetter("?");

    let count = 2;
    const cd = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(cd);
        startSpin();
      }
    }, 1000);
  }

  // Fast Spinning
  function startSpin() {
    setPhase("spinning");
    playSound('spin');

    const finalLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    const cat = useCustom && customCat.trim() 
      ? customCat.trim() 
      : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

    setCategory(cat);

    let spins = 0;
    const totalSpins = 28; // Fast & exciting

    spinIntervalRef.current = setInterval(() => {
      spins++;
      const randomLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      setLetter(randomLetter);

      if (spins >= totalSpins) {
        clearInterval(spinIntervalRef.current!);
        setLetter(finalLetter);
        startTimer();
      }
    }, 40); // ← Very fast spinning (40ms)
  }

  // Start Timer
  function startTimer() {
    setPhase("active");
    setCountdown(duration);

    countIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countIntervalRef.current!);
          playSound('done');
          setPhase("done");
          return 0;
        }
        if (prev <= 5) playSound('tick');
        return prev - 1;
      });
    }, 1000);
  }

  function resetRound() {
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    if (countIntervalRef.current) clearInterval(countIntervalRef.current);

    setPhase("idle");
    setLetter("?");
    setCategory("");
  }

  function endGame() {
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    if (countIntervalRef.current) clearInterval(countIntervalRef.current);
    router.push("/");
  }

  const circumference = 2 * Math.PI * 64;
  const pct = countdown / duration;

  if (!isHost) return <div>Host Only</div>;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-6 max-w-lg mx-auto bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Zap size={24} className="text-neon-cyan" />
          <h1 className="text-2xl font-black text-[#00F5FF]">LETTER BLITZ</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10">
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10">
            <Settings size={20} />
          </button>
          <button onClick={endGame} className="p-3 rounded-xl bg-white/5 hover:bg-white/10">
            <Home size={20} />
          </button>
        </div>
      </div>

      {/* Settings */}
      {showSettings && phase === "idle" && (
        <div className="w-full mb-6 p-5 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Clock size={18} /> Settings
          </h3>
          <div>
            <label className="text-sm opacity-70 block mb-2">
              Round Duration: <strong>{duration} seconds</strong>
            </label>
            <input
              type="range"
              min={2}
              max={60}
              step={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-xs opacity-50 mt-1">
              <span>2s</span> <span>10s</span> <span>30s</span> <span>60s</span>
            </div>
          </div>

          <label className="flex items-center gap-2 mt-6 text-sm cursor-pointer">
            <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} />
            Custom Category
          </label>
          {useCustom && (
            <input
              className="w-full mt-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400"
              placeholder="Enter your own category"
              value={customCat}
              onChange={(e) => setCustomCat(e.target.value)}
            />
          )}
        </div>
      )}

      {/* Category */}
      {category && (
        <div className="w-full text-center mb-8">
          <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Category</p>
          <p className="text-xl font-bold text-yellow-400">{category}</p>
        </div>
      )}

      {/* Big Letter */}
      <div className="relative flex items-center justify-center my-10">
        {(phase === "active" || phase === "done") && (
          <svg width="200" height="200" className="absolute" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
            <circle 
              cx="100" cy="100" r="78" 
              fill="none"
              stroke={pct > 0.5 ? "#22ff88" : pct > 0.25 ? "#ffdd00" : "#ff3366"}
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct)}
              strokeLinecap="round"
            />
          </svg>
        )}

        <span 
          className={`text-[140px] font-black transition-all ${phase === "spinning" ? "animate-spin-slow" : ""}`}
          style={{
            color: phase === "spinning" ? "#c026d3" : phase === "active" ? "#22ff88" : "#00f5ff",
            textShadow: "0 0 50px currentColor",
          }}
        >
          {letter}
        </span>
      </div>

      {/* Timer */}
      {phase === "active" && (
        <div className="text-center mb-8">
          <div className="text-6xl font-black text-white tracking-tighter">{countdown}</div>
          <p className="text-sm opacity-60 mt-1">seconds remaining</p>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center mb-8">
          <AlertCircle size={50} className="text-pink-500 mx-auto mb-3" />
          <p className="text-4xl font-black text-pink-500">TIME'S UP!</p>
        </div>
      )}

      {/* Controls */}
      <div className="w-full mt-auto">
        {phase === "idle" && (
          <button 
            onClick={startGame}
            className="w-full py-6 rounded-3xl bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold text-2xl flex items-center justify-center gap-3 hover:scale-105 transition"
          >
            <Dice5 size={36} /> START GAME
          </button>
        )}

        {(phase === "active" || phase === "done") && (
          <button 
            onClick={resetRound}
            className="w-full py-5 rounded-3xl border border-white/30 hover:bg-white/10 font-semibold flex items-center justify-center gap-2 text-lg"
          >
            <RotateCcw size={24} /> Next Round
          </button>
        )}
      </div>
    </main>
  );
}