-- Phase 7E — Engagement-driven reply guardrail
-- When a published comment earns a reply (Reddit / Facebook / Nextdoor), the
-- follow-up is a CONVERSATION, not a new pitch. Leading with a CTA mid-thread
-- reads as a bot and kills engagement. This guardrail is read by runCycle() and
-- threaded into every reply draft.

INSERT INTO content_voice_guardrails (rule, source_kill_id, active)
SELECT
  'ENGAGEMENT REPLIES (someone replied to one of our comments): never lead with or pivot to a CTA, and never include a RemodelerIQ link or pitch — not even a soft one at the end. The conversation already started; the only job of a follow-up is to be additionally helpful. High-upvote threads are converting on their own — stay purely useful and let the value earn the click later.',
  NULL,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM content_voice_guardrails WHERE rule LIKE 'ENGAGEMENT REPLIES%'
);
