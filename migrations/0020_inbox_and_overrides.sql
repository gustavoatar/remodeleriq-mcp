-- Phase 7A: Unified inbox + 90-minute STOP override approval system
-- The foundation for hands-off content engine.
--
-- unified_inbox: every actionable thing in one place — pending drafts, inbound
-- emails to gustavo@/help@, Reddit replies on published drafts, Nextdoor comments
-- on published replies. Gustavo opens one URL to handle everything.
--
-- cycle_overrides: tracks "STOP" or "KILL #N" replies to the morning digest.
-- 8:30am ET cron reads this table; if no override row in last 90 min for today's
-- digest cycle, drafts auto-flip from 'in_review' to 'approved'.

CREATE TABLE IF NOT EXISTS unified_inbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,                  -- 'reddit_reply' | 'nextdoor_comment' | 'email_gustavo' | 'email_help' | 'draft_pending' | 'facebook_page_comment' | 'facebook_messenger'
  external_id TEXT,                       -- platform's id for dedupe (reddit comment id, email message-id, etc.)
  from_handle TEXT,                       -- u/username | neighbor name | email address
  subject TEXT,                           -- email subject or post title; null for comments
  body TEXT,                              -- full text content
  related_draft_id INTEGER,               -- FK to content_drafts (nullable, for replies on published drafts)
  tag TEXT,                               -- 'lead' | 'question' | 'spam' | 'internal' | 'approval' | 'engagement'
  status TEXT NOT NULL DEFAULT 'new',     -- 'new' | 'actioned' | 'archived'
  proposed_reply TEXT,                    -- Gemini-drafted suggested response (for engagement / email auto-reply)
  proposed_persona TEXT,                  -- 'bella' | 'gustavo' chosen for the proposed_reply
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  actioned_at TEXT,
  FOREIGN KEY (related_draft_id) REFERENCES content_drafts(id)
);

CREATE INDEX IF NOT EXISTS idx_unified_inbox_status ON unified_inbox(status);
CREATE INDEX IF NOT EXISTS idx_unified_inbox_source ON unified_inbox(source);
CREATE INDEX IF NOT EXISTS idx_unified_inbox_received ON unified_inbox(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_inbox_external_id ON unified_inbox(external_id);

CREATE TABLE IF NOT EXISTS cycle_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  digest_cycle_id TEXT NOT NULL,          -- matches the cycle_id stamped on today's digest send
  action TEXT NOT NULL,                   -- 'stop' (hold all) | 'kill' (kill specific drafts)
  draft_ids TEXT,                         -- csv of draft IDs (when action='kill')
  source TEXT NOT NULL,                   -- 'email_reply' | 'ui_click' | 'sms' (future)
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cycle_overrides_cycle ON cycle_overrides(digest_cycle_id);
CREATE INDEX IF NOT EXISTS idx_cycle_overrides_received ON cycle_overrides(received_at DESC);
