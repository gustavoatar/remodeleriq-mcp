-- Owned-channel email newsletter (Aug 2026).
-- Two new tables; the kill switch reuses cycle_overrides (0020), scoping its
-- digest_cycle_id to the newsletter issue's cycle id (e.g. 'newsletter-2026-08')
-- so a content-pipeline STOP and a newsletter STOP never cross-hold each other.

-- Opted-in subscribers. Double opt-in: rows start 'pending' and become 'active'
-- only after the confirm link is clicked.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  source TEXT,                              -- 'labor_cost_index' | 'quote_fairness' | 'home' | 'footer' | ...
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'active' | 'unsubscribed' | 'bounced'
  unsubscribe_token TEXT NOT NULL,          -- random; one-click unsubscribe
  confirm_token TEXT,                       -- random; double opt-in confirm (nulled after confirm)
  confirmed_at TEXT,
  unsubscribed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Case-insensitive uniqueness on email (mirrors 0017's approach for user_profiles).
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscribers_email
  ON newsletter_subscribers(lower(email));
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status
  ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_unsub
  ON newsletter_subscribers(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_confirm
  ON newsletter_subscribers(confirm_token);

-- One row per newsletter issue. Status mirrors content_drafts so the mental
-- model and the STOP-override gate transfer 1:1.
CREATE TABLE IF NOT EXISTS newsletter_issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issue_cycle_id TEXT NOT NULL,             -- e.g. 'newsletter-2026-08' (one issue per month)
  subject TEXT,
  preview_text TEXT,
  html_body TEXT,
  text_body TEXT,
  persona TEXT,                             -- 'bella' | 'gustavo'
  source_summary TEXT,                      -- JSON: which posts/data fed this issue
  status TEXT NOT NULL DEFAULT 'queued',    -- queued|drafted|in_review|approved|sending|sent|killed
  recipient_count INTEGER,
  sent_count INTEGER DEFAULT 0,
  killed_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  approved_at TEXT,
  sent_at TEXT
);

-- One issue per cycle id; the generator is a no-op if the row already exists.
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_issues_cycle
  ON newsletter_issues(issue_cycle_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_issues_status
  ON newsletter_issues(status);
