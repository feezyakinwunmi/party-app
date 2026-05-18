"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Gamepad2, PartyPopper, Sparkles } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]">
      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full bg-neon-purple opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 rounded-full bg-neon-pink opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-64 h-64 rounded-full bg-neon-cyan opacity-5 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="text-6xl mb-4">🎮</div>
        <h1 className="text-5xl font-black mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--neon-cyan)" }}>
          PARTY MODE
        </h1>
        <p className="text-sm tracking-widest opacity-50 uppercase">
          Let's get the party started
        </p>
      </div>

      {/* Main Options */}
      <div className="w-full max-w-sm flex flex-col gap-4 animate-slide-up">
        {/* Host a Party */}
        <Link href="/host" className="btn-neon btn-pink w-full text-lg py-5 flex items-center justify-center gap-2">
          <PartyPopper size={24} />
          Host a Party
        </Link>

        {/* Browse All Games */}
        <Link href="/game" className="btn-neon btn-cyan w-full text-lg py-5 flex items-center justify-center gap-2">
          <Gamepad2 size={24} />
          Browse All Games
        </Link>

        {/* Join a game */}
        <div className="neon-card p-5 flex flex-col gap-3 mt-4">
          <p className="text-xs tracking-widest opacity-60 uppercase text-center flex items-center justify-center gap-2">
            <Sparkles size={14} />
            Got a party code?
          </p>
          <input
            className="neon-input text-center text-xl tracking-[0.3em] uppercase"
            placeholder="ENTER CODE"
            value={joinCode}
            maxLength={6}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter" && joinCode.length === 6)
                router.push(`/join/${joinCode}`);
            }}
          />
          <button
            className="btn-neon btn-ghost w-full"
            disabled={joinCode.length < 6}
            onClick={() => router.push(`/join/${joinCode}`)}
          >
            Join Party →
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs opacity-20 tracking-widest">
        PARTY MODE v2.0
      </p>
    </main>
  );
}