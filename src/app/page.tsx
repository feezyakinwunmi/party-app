"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full bg-neon-purple opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%]  w-80 h-80 rounded-full bg-neon-pink   opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute top-[40%]  left-[60%]      w-64 h-64 rounded-full bg-neon-cyan   opacity-5  blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="text-center mb-12 animate-fade-in">
        <Image
          src="/logo.png"
          alt="OXA Logo"
          width={200}
          height={80}
          className="mx-auto mb-4"
        />
      
        <p className="text-sm tracking-widest opacity-50 uppercase">
          Lets get the party started
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-sm flex flex-col gap-4 animate-slide-up">
        {/* Host a game */}
        <Link href="/host" className="btn-neon btn-pink w-full text-lg py-5">
          🎮 Host a Game
        </Link>

        {/* Join a game */}
        <div className="neon-card p-5 flex flex-col gap-3">
          <p className="text-xs tracking-widest opacity-60 uppercase text-center">
            Got a code?
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

        {/* Scan QR hint */}
        <p className="text-center text-xs opacity-30 mt-2">
          Or scan the QR code from the host's screen
        </p>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs opacity-20 tracking-widest">
        PARTYMODE v1.0
      </p>
    </main>
  );
}
