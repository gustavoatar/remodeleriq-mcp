-- Reddit scout — store ACTUAL found posts (RSS) with a tailored ready-to-paste reply.
-- All ALTER TABLE statements were applied in a prior partial run and are skipped here.
-- Fresh databases: run these manually:
--   ALTER TABLE reddit_drafts ADD COLUMN post_url TEXT;
--   ALTER TABLE reddit_drafts ADD COLUMN post_title TEXT;
--   ALTER TABLE reddit_drafts ADD COLUMN post_excerpt TEXT;
--   ALTER TABLE reddit_drafts ADD COLUMN source TEXT DEFAULT 'manual';
--   ALTER TABLE reddit_drafts ADD COLUMN found_at TEXT;
CREATE INDEX IF NOT EXISTS idx_reddit_drafts_posturl ON reddit_drafts (post_url);
