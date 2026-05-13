# 🎉 PartyMode — Mobile Party Game App

A real-time mobile party game app built with **Next.js 14 + Supabase**.
Dark neon UI, designed for the club. 🕺

---

## 🎮 Games

| Game | Status |
|------|--------|
| 🔥 Truth or Dare | ✅ Ready |
| ⚡ Letter Blitz | ✅ Ready |
| 🍸 Never Have I Ever | 🔜 Coming Soon |
| 🌶️ Hot Takes | 🔜 Coming Soon |

---

## 🗂 Project Structure

```
src/
├── app/
│   ├── page.tsx                  ← Home (enter code / host)
│   ├── host/
│   │   ├── page.tsx              ← Party name + game selection
│   │   └── lobby/page.tsx        ← QR code, player list, rules, start
│   ├── join/
│   │   └── [code]/page.tsx       ← Invite → Rules → Name → T&D submissions → Waiting
│   └── game/
│       ├── truth_or_dare/page.tsx ← Bottle spin game screen
│       └── letter_blitz/page.tsx  ← Letter blitz game screen
├── lib/
│   └── supabase.ts               ← Supabase client + generateCode()
└── types/
    └── index.ts                  ← All TypeScript types + GAME_MODES
```

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd party-game-app
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the **SQL Editor**, run the entire contents of `supabase-schema.sql`
3. In **Database → Replication**, enable realtime for these tables:
   - `sessions`
   - `players`
   - `submissions`
   - `spins`

### 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000   # or your Vercel URL
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on mobile (or use ngrok for real device testing).

---

## 🚀 Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add these environment variables in your Vercel project dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` → your Vercel URL (e.g. `https://partymode.vercel.app`)

---

## 🎯 Game Flow

### Truth or Dare

```
Host creates game
    ↓
Gets 6-char code + QR code
    ↓
Players scan / enter code
    ↓
Each player: sees invite → reads rules → enters name → fills truths & dares per mode
    ↓
Host starts game
    ↓
Host taps bottle → it spins → picks someone
    ↓
Truth or Dare card revealed (based on rules)
    ↓
Host taps Done → next spin
    ↓
Host advances stages (🌱 → 🔥 → 💥 → 😬 → 😈)
    ↓
Host ends game → everything auto-deletes from DB
```

### Letter Blitz

```
Host sets timer + category (or random)
    ↓
Everyone watches letters spin fast on screen
    ↓
Letter stops → countdown begins
    ↓
Players race to say something starting with that letter
    ↓
Host resets for next round
```

---

## 🗃 Database Schema

| Table | Purpose |
|-------|---------|
| `sessions` | Game sessions (code, party name, status, rules) |
| `players` | Everyone in the session |
| `submissions` | Truths & dares per player per mode |
| `spins` | History of bottle spins |
| `blitz_rounds` | Letter Blitz round log |

**Auto-cleanup:** When host ends game, the session row is deleted and everything cascades (FK with `ON DELETE CASCADE`).

---

## 🎨 Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** with custom neon dark theme
- **Supabase** — DB + real-time subscriptions
- **qrcode.react** — QR code generation
- **Fonts:** Exo 2 (display) + Share Tech Mono (body)

---

## 🛠 Customization

### Add a new game

1. Add it to `src/types/index.ts` in the `GAME_TYPES` array with `available: true`
2. Create `src/app/game/your_game/page.tsx`
3. The join flow and session system work automatically

### Change default rules

Edit the `rules` default in `supabase-schema.sql` or update in `src/app/host/lobby/page.tsx`.

---

## 📱 Mobile First

All screens are designed for `max-w-sm` (375px) screens.
Test with Chrome DevTools → iPhone 12 Pro mode or use ngrok to test on a real device.

```bash
npx ngrok http 3000
```
