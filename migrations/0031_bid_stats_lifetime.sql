-- Cumulative, never-expiring aggregate of anonymized bid analyses.
--
-- Why this exists: bid_analytics rows are purged after 24h (privacy promise) and
-- bid_benchmarks only reflects the rolling 24h window (it recomputes sample_count
-- from non-expired rows on every insert). Neither retains a lifetime record of how
-- many bids we've analyzed or the long-run averages. This table accumulates those
-- running totals incrementally on each consented analysis, storing ONLY aggregates
-- (sums/counts/min/max, plus JSON tallies) — never a raw per-bid row, never any PII.
-- It is the durable source for periodic "State of Contractor Bids" reporting.
CREATE TABLE IF NOT EXISTS bid_stats_lifetime (
  project_type            TEXT    NOT NULL,
  state_code              TEXT,                 -- NULL = national roll-up
  lifetime_count          INTEGER NOT NULL DEFAULT 0,   -- cumulative, never decremented

  -- Running sums so any average is derivable without retaining raw rows.
  sum_total_amount        REAL    NOT NULL DEFAULT 0,
  count_total_amount      INTEGER NOT NULL DEFAULT 0,   -- rows that had a total_amount
  sum_price_per_sqft      REAL    NOT NULL DEFAULT 0,
  count_price_per_sqft    INTEGER NOT NULL DEFAULT 0,
  sum_confidence_score    REAL    NOT NULL DEFAULT 0,
  count_confidence_score  INTEGER NOT NULL DEFAULT 0,

  min_total_amount        REAL,
  max_total_amount        REAL,

  issue_counts            TEXT,   -- JSON {issueCode: cumulativeCount}
  trade_sums              TEXT,   -- JSON {trade: {sumAmount, sumPct, count}}

  first_seen_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (project_type, state_code)
);

CREATE INDEX IF NOT EXISTS idx_bid_stats_lifetime_count
  ON bid_stats_lifetime (lifetime_count DESC);
