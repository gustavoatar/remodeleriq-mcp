-- Reddit warmup drafts — outbound comment drafts the admin pastes manually
-- (Reddit closed its API; this is the human paste workflow surfaced in the admin UI).
CREATE TABLE IF NOT EXISTS reddit_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario TEXT NOT NULL,
  comment TEXT NOT NULL,
  keywords TEXT,
  target_subs TEXT,
  search_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | posted | skipped
  posted_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  posted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_reddit_drafts_status ON reddit_drafts (status, id);
