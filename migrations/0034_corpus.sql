-- Corpus: durable structured records of analyzed bids.
-- No raw bid text is retained for MCP callers (raw_text_retained = 0 always
-- for source = 'mcp'). Line items are populated in Phase 1 when extraction
-- is added to the analysis engine. Flag definitions are seeded separately.

CREATE TABLE IF NOT EXISTS bid_submissions (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  document_fingerprint TEXT NOT NULL UNIQUE,   -- SHA-256 of normalized bid text
  source               TEXT NOT NULL DEFAULT 'mcp',  -- 'mcp','web'
  client_name          TEXT,
  submitted_at         TEXT NOT NULL DEFAULT (datetime('now')),
  state_code           TEXT,
  city_key             TEXT,
  project_type         TEXT,
  bid_total            REAL,
  square_footage       INTEGER,
  finish_tier          TEXT,
  scope_depth          TEXT,
  includes_appliances  INTEGER,         -- 0/1/null
  includes_permits     INTEGER,
  structural_work      INTEGER,
  extraction_coverage  REAL,            -- 0.0–1.0 (populated in Phase 1)
  confidence_score     INTEGER,
  rule_version         TEXT,
  scrub_version        TEXT NOT NULL DEFAULT 'v1',
  raw_text_retained    INTEGER NOT NULL DEFAULT 0,
  response_gated       INTEGER NOT NULL DEFAULT 0   -- analysis stored, report withheld
);

CREATE INDEX IF NOT EXISTS idx_bs_fingerprint ON bid_submissions(document_fingerprint);
CREATE INDEX IF NOT EXISTS idx_bs_geo         ON bid_submissions(state_code, project_type, submitted_at);
CREATE INDEX IF NOT EXISTS idx_bs_submitted   ON bid_submissions(submitted_at);

-- Normalized line items per bid (populated in Phase 1)
CREATE TABLE IF NOT EXISTS bid_line_items (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id          INTEGER NOT NULL REFERENCES bid_submissions(id) ON DELETE CASCADE,
  trade                  TEXT NOT NULL,
  description_normalized TEXT,
  quantity               REAL,
  unit                   TEXT,
  unit_price             REAL,
  extended_price         REAL,
  price_type             TEXT NOT NULL DEFAULT 'fixed',  -- 'fixed','allowance','unit_rate','tbd','not_priced'
  extraction_confidence  REAL
);

CREATE INDEX IF NOT EXISTS idx_bli_sub   ON bid_line_items(submission_id);
CREATE INDEX IF NOT EXISTS idx_bli_trade ON bid_line_items(trade);

-- Flag taxonomy — one row per flag type, seeded once
CREATE TABLE IF NOT EXISTS flag_definitions (
  flag_id       TEXT PRIMARY KEY,
  severity      TEXT NOT NULL,    -- 'critical','high','medium','low'
  category      TEXT NOT NULL,    -- 'licensing','payment_terms','scope','insurance','permits','safety'
  title         TEXT NOT NULL,
  introduced_in TEXT NOT NULL,
  retired_in    TEXT
);

-- Per-bid flags fired (populated alongside bid_submissions)
CREATE TABLE IF NOT EXISTS bid_flags (
  submission_id INTEGER NOT NULL REFERENCES bid_submissions(id) ON DELETE CASCADE,
  flag_id       TEXT NOT NULL,
  rule_version  TEXT NOT NULL,
  PRIMARY KEY (submission_id, flag_id)
);

CREATE INDEX IF NOT EXISTS idx_bf_flag ON bid_flags(flag_id);
CREATE INDEX IF NOT EXISTS idx_bf_sub  ON bid_flags(submission_id);

-- Attribution: join MCP tool calls to site visits via signed rid parameter
CREATE TABLE IF NOT EXISTS mcp_attributions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  call_id         TEXT NOT NULL,
  rid_token       TEXT NOT NULL UNIQUE,  -- call_id + HMAC suffix
  landing_path    TEXT NOT NULL,
  tool_name       TEXT,
  landed_at       TEXT,                  -- set on first click
  web_session_id  TEXT,
  referrer        TEXT,
  converted       INTEGER NOT NULL DEFAULT 0,
  conversion_type TEXT,                  -- 'join_signup','email_sent','payment'
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ma_call ON mcp_attributions(call_id);
CREATE INDEX IF NOT EXISTS idx_ma_rid  ON mcp_attributions(rid_token);

-- Seed the flag taxonomy
INSERT OR IGNORE INTO flag_definitions (flag_id, severity, category, title, introduced_in) VALUES
  ('LIC_MISSING_STATE',          'critical', 'licensing',      'State contractor license number not present',           '2026.08.1'),
  ('LIC_UNVERIFIED',             'high',     'licensing',      'License number provided but not verified with state',   '2026.08.1'),
  ('PAY_DEPOSIT_EXCESSIVE',      'high',     'payment_terms',  'Deposit percentage above industry norm',                '2026.08.1'),
  ('PAY_NO_MILESTONES',          'high',     'payment_terms',  'No payment milestones tied to project progress',        '2026.08.1'),
  ('PAY_CASH_ONLY',              'critical', 'payment_terms',  'Cash-only payment demanded',                            '2026.08.1'),
  ('SCOPE_ALLOWANCE_UNBOUNDED',  'high',     'scope',          'Unbounded allowance with no cap or reconciliation',     '2026.08.1'),
  ('SCOPE_MISSING_TRADE',        'medium',   'scope',          'Expected trade work absent from scope',                 '2026.08.1'),
  ('SCOPE_NO_MEASUREMENTS',      'medium',   'scope',          'No dimensions or quantities specified',                 '2026.08.1'),
  ('SCOPE_NO_BRANDS',            'low',      'scope',          'No material brands or grades specified',                '2026.08.1'),
  ('INS_NO_LIABILITY',           'critical', 'insurance',      'General liability insurance not confirmed',             '2026.08.1'),
  ('INS_NO_WORKERS_COMP',        'critical', 'insurance',      'Workers compensation not confirmed',                    '2026.08.1'),
  ('PERMIT_RESPONSIBILITY_UNCLEAR','high',   'permits',        'Who pulls permits is not stated',                       '2026.08.1'),
  ('WARR_NONE_STATED',           'medium',   'scope',          'No warranty terms stated',                              '2026.08.1'),
  ('SCHED_NO_DATES',             'medium',   'scope',          'No start or completion dates provided',                 '2026.08.1'),
  ('CO_MARKUP_HIGH',             'high',     'payment_terms',  'Change order markup rate above norm',                   '2026.08.1'),
  ('SAFE_GFCI_UNCONFIRMED',      'medium',   'safety',         'GFCI protection not confirmed for wet areas',           '2026.08.1');
