-- Reddit scout — store ACTUAL found posts (RSS) with a tailored ready-to-paste reply.
ALTER TABLE reddit_drafts ADD COLUMN post_url TEXT;       -- direct permalink to the real post
ALTER TABLE reddit_drafts ADD COLUMN post_title TEXT;     -- the post's title
ALTER TABLE reddit_drafts ADD COLUMN post_excerpt TEXT;   -- the post body (context)
ALTER TABLE reddit_drafts ADD COLUMN source TEXT DEFAULT 'manual';  -- 'manual' | 'scout'
ALTER TABLE reddit_drafts ADD COLUMN found_at TEXT;
CREATE INDEX IF NOT EXISTS idx_reddit_drafts_posturl ON reddit_drafts (post_url);
