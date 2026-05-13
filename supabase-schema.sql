-- ============================================================
-- PARTY GAME APP - SUPABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- SESSIONS
-- One row per game session created by a host
-- ------------------------------------------------------------
CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          TEXT UNIQUE NOT NULL,          -- 6-char join code e.g. "FIRE42"
  party_name    TEXT NOT NULL,
  game_type     TEXT NOT NULL,                 -- 'truth_or_dare' | 'letter_blitz'
  host_id       UUID NOT NULL,                 -- references players(id) after host joins
  status        TEXT NOT NULL DEFAULT 'lobby', -- lobby | playing | ended
  rules         JSONB NOT NULL DEFAULT '{
    "truth_count": 2,
    "dare_count": 3,
    "modes": ["starting", "rate2", "rate3", "tense", "naughty"]
  }',
  current_stage TEXT NOT NULL DEFAULT 'starting',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- PLAYERS
-- Everyone who joins a session (including host)
-- ------------------------------------------------------------
CREATE TABLE players (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_host     BOOLEAN DEFAULT FALSE,
  spin_count  INTEGER DEFAULT 0,               -- track how many times picked
  joined_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- SUBMISSIONS
-- Truth and dare entries per player per mode
-- ------------------------------------------------------------
CREATE TABLE submissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                   -- 'truth' | 'dare'
  mode        TEXT NOT NULL,                   -- 'starting' | 'rate2' | 'rate3' | 'tense' | 'naughty'
  content     TEXT NOT NULL,
  used        BOOLEAN DEFAULT FALSE,           -- mark when it's been played
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- SPINS
-- Log of bottle spins so we can track pick frequency
-- ------------------------------------------------------------
CREATE TABLE spins (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,  -- who was picked
  submission_id UUID REFERENCES submissions(id),                        -- what they got
  type        TEXT,                            -- 'truth' | 'dare'
  completed   BOOLEAN DEFAULT FALSE,
  spun_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- LETTER BLITZ ROUNDS (for the second game)
-- ------------------------------------------------------------
CREATE TABLE blitz_rounds (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  letter      TEXT NOT NULL,
  category    TEXT NOT NULL,                   -- e.g. "a sentence", "a song", "a food"
  duration_s  INTEGER DEFAULT 30,
  started_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------
CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_players_session ON players(session_id);
CREATE INDEX idx_submissions_session ON submissions(session_id);
CREATE INDEX idx_submissions_player ON submissions(player_id);
CREATE INDEX idx_spins_session ON spins(session_id);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY (enable but keep open for session-based access)
-- Players access by session code — no auth needed
-- ------------------------------------------------------------
ALTER TABLE sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE players     ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins       ENABLE ROW LEVEL SECURITY;
ALTER TABLE blitz_rounds ENABLE ROW LEVEL SECURITY;

-- Open policies (session-code-based trust model, no user accounts)
CREATE POLICY "open_sessions"     ON sessions     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_players"      ON players      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_submissions"  ON submissions  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_spins"        ON spins        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_blitz"        ON blitz_rounds FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- REALTIME: enable for live game syncing
-- Run in Supabase Dashboard → Database → Replication
-- Or run these:
-- ------------------------------------------------------------
-- ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE players;
-- ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE spins;
