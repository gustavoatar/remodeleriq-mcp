-- OAuth tokens for third-party publishers (Nextdoor Publish API, Reddit API)
-- One row per (provider, account_handle). Refresh tokens stored verbatim;
-- access tokens get rotated by the callback + refresh flow.
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,                -- 'nextdoor' | 'reddit'
  account_handle TEXT,                   -- nextdoor user/business id or reddit username
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT,                       -- usually 'bearer'
  scope TEXT,
  expires_at TEXT,                       -- ISO timestamp; null = non-expiring
  raw_response TEXT,                     -- full JSON for debugging
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, account_handle)
);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider ON oauth_tokens(provider);

-- OAuth state nonces — short-lived CSRF protection for the redirect dance.
CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  return_to TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
