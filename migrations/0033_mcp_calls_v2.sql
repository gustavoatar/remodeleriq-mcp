-- Extended MCP telemetry: richer per-call records for analytics.
-- The existing mcp_usage table stays untouched (rate limiter reads it).
-- mcp_sessions stores clientInfo from the MCP initialize handshake so it can
-- be joined onto subsequent tools/call records via the session_id.

CREATE TABLE IF NOT EXISTS mcp_sessions (
  session_id       TEXT PRIMARY KEY,
  client_name      TEXT,
  client_version   TEXT,
  protocol_version TEXT,
  first_seen       TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mcp_calls_v2 (
  call_id          TEXT PRIMARY KEY,
  ts               TEXT NOT NULL DEFAULT (datetime('now')),
  tool_name        TEXT NOT NULL,
  session_id       TEXT,
  client_name      TEXT,
  client_version   TEXT,
  protocol_version TEXT,
  params_hash      TEXT,              -- SHA-256 prefix of normalized params (no raw bid text)
  project_type     TEXT,
  state_code       TEXT,
  bid_total_bucket TEXT,              -- '<10k','10-25k','25-50k','50-100k','100k+'
  latency_ms       INTEGER,
  status           TEXT NOT NULL DEFAULT 'ok',
  ip_country       TEXT,
  ip_region        TEXT,
  origin_class     TEXT NOT NULL DEFAULT 'unknown',  -- 'hosted','direct','unknown'
  quota_state      TEXT               -- null,'ok','warned','quota_reached'
);

CREATE INDEX IF NOT EXISTS idx_mcv2_ts     ON mcp_calls_v2(ts);
CREATE INDEX IF NOT EXISTS idx_mcv2_tool   ON mcp_calls_v2(tool_name, ts);
CREATE INDEX IF NOT EXISTS idx_mcv2_sess   ON mcp_calls_v2(session_id, ts);
CREATE INDEX IF NOT EXISTS idx_mcv2_origin ON mcp_calls_v2(origin_class, ts);
