-- Content drafts: editor-in-chief kanban for swarm-produced Reddit/Nextdoor replies
-- Each row = one homeowner question + the swarm's answer in multiple formats
CREATE TABLE IF NOT EXISTS content_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id TEXT NOT NULL,
  platform TEXT NOT NULL,                -- 'reddit' | 'nextdoor'
  source_url TEXT NOT NULL,
  source_excerpt TEXT NOT NULL,
  source_author TEXT,
  source_subreddit_or_hood TEXT,
  pillar_tags TEXT,                      -- csv: 'contract_risk,price_check,scope'
  draft_reddit TEXT,
  draft_nextdoor TEXT,
  blog_brief TEXT,
  feature_ticket TEXT,
  status TEXT NOT NULL DEFAULT 'queued', -- queued|drafted|in_review|approved|killed|published
  gustavo_notes TEXT,
  killed_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  approved_at TEXT,
  published_at TEXT,
  published_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_content_drafts_status ON content_drafts(status);
CREATE INDEX IF NOT EXISTS idx_content_drafts_cycle ON content_drafts(cycle_id);
CREATE INDEX IF NOT EXISTS idx_content_drafts_created ON content_drafts(created_at DESC);

-- Voice guardrails table: learning loop from killed/edited drafts
CREATE TABLE IF NOT EXISTS content_voice_guardrails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule TEXT NOT NULL,
  source_kill_id INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
