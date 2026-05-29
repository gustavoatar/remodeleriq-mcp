CREATE TABLE IF NOT EXISTS stripe_event_ids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_stripe_event_ids_event_id ON stripe_event_ids(event_id);
