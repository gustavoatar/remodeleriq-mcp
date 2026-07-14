-- Concierge assistant: conversation state, message log, and email-gate leads.
-- The concierge is anonymous-friendly but gated: after FREE_LIMIT assistant
-- replies per session, the homeowner must drop an email to continue (lead
-- capture + Gemini cost control). No PII beyond the optional email they give.

CREATE TABLE IF NOT EXISTS concierge_conversations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL UNIQUE,      -- client-generated per browser session
  ip          TEXT,
  email       TEXT,                       -- set once they unlock past the gate
  unlocked    INTEGER NOT NULL DEFAULT 0, -- 1 after email captured
  msg_count   INTEGER NOT NULL DEFAULT 0, -- assistant replies served this session
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS concierge_messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      TEXT NOT NULL,
  role            TEXT NOT NULL,          -- 'user' | 'assistant'
  content         TEXT NOT NULL,
  tool_calls      TEXT,                   -- JSON of tools invoked this turn (nullable)
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS concierge_leads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL,
  session_id  TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_concierge_msgs_session ON concierge_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_concierge_leads_email ON concierge_leads (email);
