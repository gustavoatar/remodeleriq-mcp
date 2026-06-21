-- Nextdoor drafts — standalone neighborhood posts (Nextdoor has no posting API, so
-- these are copy-and-post-manually from the business page). Surfaced in /admin (Nextdoor tab).
CREATE TABLE IF NOT EXISTS nextdoor_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_type TEXT,
  text TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | posted | skipped
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  posted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_nextdoor_status ON nextdoor_drafts (status, id);
