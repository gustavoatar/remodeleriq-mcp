-- Phase 7-Persona: Two-voice content architecture
-- Bella (75%): journalistic, data-first content writer voice
-- Gustavo (25%): founder voice, first-person, personal experience
--
-- Adds persona column to content_drafts so each draft is attributed to one voice.
-- Defaults to 'gustavo' for backward compatibility on existing rows (they were
-- all drafted under what is now the Gustavo voice spec).

ALTER TABLE content_drafts ADD COLUMN persona TEXT DEFAULT 'gustavo';

CREATE INDEX IF NOT EXISTS idx_content_drafts_persona ON content_drafts(persona);

-- View for monitoring persona distribution over time (weekly Sunday digest reads this)
CREATE VIEW IF NOT EXISTS persona_distribution AS
SELECT
  date(created_at) as draft_date,
  persona,
  COUNT(*) as draft_count
FROM content_drafts
WHERE persona IS NOT NULL
GROUP BY date(created_at), persona
ORDER BY draft_date DESC, persona;
