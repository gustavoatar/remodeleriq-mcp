-- Initial schema migrated from Mocha production export (d1_dump.sql)
-- Mocha-internal tables (_mocha_migrations) are excluded.

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  timeline TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  is_premium BOOLEAN DEFAULT 0,
  premium_purchased_at DATETIME,
  premium_ends_at DATETIME,
  stripe_session_id TEXT,
  stripe_subscription_id TEXT,
  subscription_tier TEXT,
  subscription_status TEXT,
  current_period_end DATETIME,
  google_id TEXT,
  google_picture TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usage_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action_type TEXT NOT NULL,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  is_used BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ppi_material_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id TEXT NOT NULL,
  material_key TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  value REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(series_id, year, month)
);

CREATE TABLE IF NOT EXISTS ppi_refresh_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  last_refresh_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bid_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_type TEXT NOT NULL,
  state_code TEXT,
  total_amount REAL,
  square_footage REAL,
  price_per_sqft REAL,
  trade_breakdown TEXT,
  issues_detected TEXT,
  confidence_score INTEGER,
  consent_given_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  is_deleted BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bid_benchmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_type TEXT NOT NULL,
  state_code TEXT,
  sample_count INTEGER DEFAULT 0,
  avg_total_amount REAL,
  median_total_amount REAL,
  min_total_amount REAL,
  max_total_amount REAL,
  avg_price_per_sqft REAL,
  common_issues TEXT,
  trade_averages TEXT,
  last_calculated_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_type, state_code)
);

CREATE TABLE IF NOT EXISTS bls_occupational_wages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  soc_code TEXT NOT NULL,
  occupation_title TEXT NOT NULL,
  area_type TEXT NOT NULL,
  area_code TEXT NOT NULL,
  area_name TEXT NOT NULL,
  hourly_10 REAL,
  hourly_25 REAL,
  hourly_median REAL,
  hourly_75 REAL,
  hourly_90 REAL,
  annual_median REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zip_to_msa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zip_code TEXT NOT NULL UNIQUE,
  msa_code TEXT,
  msa_name TEXT,
  state_code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trade_occupation_map (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_keyword TEXT NOT NULL,
  soc_code TEXT NOT NULL,
  occupation_title TEXT NOT NULL,
  weight REAL DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bls_rate_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  msa_code TEXT NOT NULL,
  soc_code TEXT NOT NULL,
  hourly_rate REAL NOT NULL,
  annual_rate REAL NOT NULL,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(msa_code, soc_code)
);

CREATE TABLE IF NOT EXISTS trusted_contractors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id TEXT UNIQUE,
  business_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state_code TEXT,
  zip_code TEXT,
  lat REAL,
  lng REAL,
  google_rating REAL,
  google_review_count INTEGER,
  bbb_grade TEXT,
  license_status TEXT,
  license_number TEXT,
  trade_categories TEXT,
  cached_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contractor_place_id TEXT,
  business_name TEXT,
  email TEXT,
  website TEXT,
  phone TEXT,
  state_code TEXT,
  requested_by_ip TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fred_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id TEXT NOT NULL,
  observation_date TEXT NOT NULL,
  value REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fred_refresh_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id TEXT NOT NULL,
  last_refresh_at DATETIME,
  status TEXT,
  message TEXT,
  observation_count INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  url TEXT,
  user_agent TEXT,
  user_id TEXT,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_action_type ON usage_tracking(action_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON usage_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_ppi_material_series ON ppi_material_cache(series_id);
CREATE INDEX IF NOT EXISTS idx_ppi_material_key ON ppi_material_cache(material_key);
CREATE INDEX IF NOT EXISTS idx_bid_analytics_expires ON bid_analytics(expires_at);
CREATE INDEX IF NOT EXISTS idx_bid_analytics_project ON bid_analytics(project_type, state_code);
CREATE INDEX IF NOT EXISTS idx_bid_benchmarks_lookup ON bid_benchmarks(project_type, state_code);
CREATE INDEX IF NOT EXISTS idx_bls_wages_soc_area ON bls_occupational_wages(soc_code, area_code);
CREATE INDEX IF NOT EXISTS idx_bls_wages_area_type ON bls_occupational_wages(area_type, area_code);
CREATE INDEX IF NOT EXISTS idx_zip_msa_zip ON zip_to_msa(zip_code);
CREATE INDEX IF NOT EXISTS idx_zip_msa_state ON zip_to_msa(state_code);
CREATE INDEX IF NOT EXISTS idx_trade_keyword ON trade_occupation_map(trade_keyword);
CREATE INDEX IF NOT EXISTS idx_trade_soc ON trade_occupation_map(soc_code);
CREATE INDEX IF NOT EXISTS idx_bls_rate_cache_lookup ON bls_rate_cache(msa_code, soc_code);
CREATE INDEX IF NOT EXISTS idx_bls_rate_cache_fetched ON bls_rate_cache(fetched_at);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_place_id ON trusted_contractors(place_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_state_zip ON trusted_contractors(state_code, zip_code);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_cached ON trusted_contractors(cached_at);
CREATE INDEX IF NOT EXISTS idx_verification_requests_place_id ON verification_requests(contractor_place_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_fred_cache_series ON fred_cache(series_id);
CREATE INDEX IF NOT EXISTS idx_fred_cache_date ON fred_cache(observation_date);
CREATE INDEX IF NOT EXISTS idx_fred_refresh_series ON fred_refresh_log(series_id);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON magic_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
