-- Phase 7C: Visual blog auto-publish via WordPress REST API
--
-- Tracks the WordPress post ID against the originating content_drafts row so
-- the blog publisher can flip status from draft → publish on approval.

ALTER TABLE content_drafts ADD COLUMN wp_post_id INTEGER;
ALTER TABLE content_drafts ADD COLUMN wp_pillar TEXT;
ALTER TABLE content_drafts ADD COLUMN blog_drafted_at TEXT;

CREATE INDEX IF NOT EXISTS idx_content_drafts_wp_post_id
  ON content_drafts(wp_post_id)
  WHERE wp_post_id IS NOT NULL;
