-- MCP server usage log — measures adoption (tool-call counts over time) and
-- backs a light per-IP rate guard on the public, unauthenticated /mcp endpoint.
CREATE TABLE IF NOT EXISTS mcp_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool TEXT NOT NULL,
  ip TEXT,
  ua TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mcp_usage_created ON mcp_usage (created_at);
CREATE INDEX IF NOT EXISTS idx_mcp_usage_ip_created ON mcp_usage (ip, created_at);
