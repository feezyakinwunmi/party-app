// ─── Game modes in order of intensity ───────────────────────
export type GameMode = "starting" | "rate2" | "rate3" | "tense" | "naughty";

export const GAME_MODES: { key: GameMode; label: string; emoji: string; color: string }[] = [
  { key: "starting", label: "Starting Level", emoji: "🌱", color: "#39FF14" },
  { key: "rate2",    label: "Rate 2",         emoji: "🔥", color: "#FFE600" },
  { key: "rate3",    label: "Rate 3",         emoji: "💥", color: "#FF8C00" },
  { key: "tense",    label: "Tense Mode",     emoji: "😬", color: "#FF2D78" },
  { key: "naughty",  label: "Naughty Mode",   emoji: "😈", color: "#BF00FF" },
];

// ─── DB row types ────────────────────────────────────────────
export interface Session {
  id:            string;
  code:          string;
  party_name:    string;
  game_type:     "truth_or_dare" | "letter_blitz";
  host_id:       string;
  status:        "lobby" | "playing" | "ended";
  rules:         SessionRules;
  current_stage: GameMode;
  created_at:    string;
}

export interface SessionRules {
  truth_count: number;   // truths each player gets per spin
  dare_count:  number;   // dares each player gets per spin
  modes:       GameMode[];
}

export interface Player {
  id:         string;
  session_id: string;
  name:       string;
  is_host:    boolean;
  spin_count: number;
  joined_at:  string;
}

export interface Submission {
  id:         string;
  session_id: string;
  player_id:  string;
  type:       "truth" | "dare";
  mode:       GameMode;
  content:    string;
  used:       boolean;
  created_at: string;
}

export interface Spin {
  id:            string;
  session_id:    string;
  player_id:     string;
  submission_id: string | null;
  type:          "truth" | "dare" | null;
  completed:     boolean;
  spun_at:       string;
}

// ─── Frontend-only ───────────────────────────────────────────
export interface SubmissionDraft {
  mode:    GameMode;
  truths:  string[];
  dares:   string[];
}

export const GAME_TYPES = [
  {
    id:          "truth_or_dare" as const,
    name:        "Truth or Dare",
    emoji:       "🔥",
    description: "Spin the bottle, spill secrets or take dares",
    available:   true,
  },
  {
    id:          "letter_blitz" as const,
    name:        "Letter Blitz",
    emoji:       "⚡",
    description: "Race to name something starting with the letter!",
    available:   true,
  },
  {
    id:          "never_have_i" as const,
    name:        "Never Have I Ever",
    emoji:       "🍸",
    description: "Classic party confessions game",
    available:   false,
  },
  {
    id:          "hot_takes" as const,
    name:        "Hot Takes",
    emoji:       "🌶️",
    description: "Controversial opinions, who agrees?",
    available:   false,
  },
];
